import os
import uuid
import base64
import hmac
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import jwt
import bcrypt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# Constants
STAFF_SESSION_COOKIE = "nenez_staff_session"
STAFF_CSRF_COOKIE = "nenez_staff_csrf"

def get_env_secret(name: str, fallback: str) -> str:
    val = os.getenv(name)
    if val:
        return val.strip()
    if os.getenv("ENV_MODE") == "production":
        raise ValueError(f"Falta variable de entorno: {name}")
    return fallback

def get_hash_secret() -> str:
    return get_env_secret("QR_HASH_SECRET", "qr-hash-secret")

def get_jwt_secret() -> str:
    return get_env_secret("JWT_SECRET", "staff-jwt-secret-min-32-bytes")

def get_encryption_key() -> bytes:
    raw = os.getenv("DATA_ENCRYPTION_KEY")
    if raw:
        try:
            decoded = base64.b64decode(raw.strip())
            if len(decoded) in [16, 24, 32]:
                return decoded
        except Exception:
            pass
        raise ValueError("DATA_ENCRYPTION_KEY debe ser base64 de 16, 24 o 32 bytes.")
    
    if os.getenv("ENV_MODE") == "production":
        raise ValueError("Falta variable de entorno: DATA_ENCRYPTION_KEY")
    
    # Dev-only fallback
    return hashlib.sha256("dev-only-nenez-encryption-key".encode("utf-8")).digest()

# AES-256-GCM Interoperable Encryption
def encrypt_sensitive(value: str) -> str:
    key = get_encryption_key()
    aesgcm = AESGCM(key)
    iv = os.urandom(12)
    # AEAD encrypt returns ciphertext + tag (16 bytes)
    encrypted_with_tag = aesgcm.encrypt(iv, value.encode("utf-8"), None)
    
    actual_ciphertext = encrypted_with_tag[:-16]
    tag = encrypted_with_tag[-16:]
    
    iv_b64 = base64.b64encode(iv).decode("utf-8")
    tag_b64 = base64.b64encode(tag).decode("utf-8")
    cipher_b64 = base64.b64encode(actual_ciphertext).decode("utf-8")
    
    return f"v1:{iv_b64}:{tag_b64}:{cipher_b64}"

def decrypt_sensitive(value: str) -> str:
    try:
        parts = value.split(":")
        if len(parts) != 4 or parts[0] != "v1":
            raise ValueError("Dato cifrado invalido.")
        
        iv = base64.b64decode(parts[1])
        tag = base64.b64decode(parts[2])
        ciphertext = base64.b64decode(parts[3])
        
        key = get_encryption_key()
        aesgcm = AESGCM(key)
        
        # Reconstruct the cryptography expected format (ciphertext + tag)
        combined = ciphertext + tag
        decrypted = aesgcm.decrypt(iv, combined, None)
        return decrypted.decode("utf-8")
    except Exception as e:
        raise ValueError(f"Error al descifrar dato: {str(e)}")

# Lookup & Token Hashing
def hash_token(value: str) -> str:
    secret = get_hash_secret()
    return hmac.new(key=secret.encode("utf-8"), msg=value.encode("utf-8"), digestmod=hashlib.sha256).hexdigest()

def hash_lookup(value: str) -> str:
    secret = get_hash_secret()
    normalized = value.strip().lower()
    return hmac.new(key=secret.encode("utf-8"), msg=normalized.encode("utf-8"), digestmod=hashlib.sha256).hexdigest()

# Bcrypt & Role Authentication
def load_bcrypt_hash(role: str) -> Optional[str]:
    b64_env = "ADMIN_PASSWORD_HASH_B64" if role == "admin" else "STAFF_PASSWORD_HASH_B64"
    plain_env = "ADMIN_PASSWORD_HASH" if role == "admin" else "STAFF_PASSWORD_HASH"
    
    encoded = os.getenv(b64_env)
    if encoded:
        try:
            decoded = base64.b64decode(encoded.strip()).decode("utf-8").strip()
            if decoded.startswith("$2") and len(decoded) >= 59:
                return decoded
        except Exception:
            pass
            
    raw = os.getenv(plain_env)
    if raw:
        cleaned = raw.strip().strip('"').strip("'")
        if cleaned.startswith("$2") and len(cleaned) >= 59:
            return cleaned
            
    return None

def verify_role_password(password: str, role: str) -> bool:
    hashed = load_bcrypt_hash(role)
    if hashed:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
        
    # Fallback to plain passwords
    plain = os.getenv("ADMIN_PASSWORD") if role == "admin" else os.getenv("STAFF_PASSWORD")
    if plain:
        return hmac.compare_digest(password, plain)
        
    raise ValueError(f"Falta configurar {role.upper()}_PASSWORD_HASH.")

# JWT session keys
def create_staff_session_jwt(session_id: str, csrf_token: str, role: str = "staff") -> str:
    payload = {
        "role": role,
        "sessionId": session_id,
        "csrfToken": csrf_token,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=12)
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm="HS256")

def decode_staff_session_jwt(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, get_jwt_secret(), algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise ValueError("Token expirado.")
    except jwt.InvalidTokenError:
        raise ValueError("Token invalido.")
