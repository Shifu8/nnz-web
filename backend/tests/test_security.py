"""
Pruebas unitarias del módulo de seguridad backend (security.py).
Verifica encriptación AES-256-GCM, hashing HMAC y verificación de contraseñas.
"""
import os
import pytest

# Set dev environment variables before importing security
os.environ.setdefault("QR_HASH_SECRET", "test-hash-secret-only")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-minimum-32-bytes-long")

from app.security import (
    encrypt_sensitive,
    decrypt_sensitive,
    hash_lookup,
    hash_token,
    create_staff_session_jwt,
    decode_staff_session_jwt,
)


class TestEncryption:
    def test_encrypt_decrypt_roundtrip(self):
        original = "0999999999"
        encrypted = encrypt_sensitive(original)
        assert encrypted != original
        assert encrypted.startswith("v1:")
        decrypted = decrypt_sensitive(encrypted)
        assert decrypted == original

    def test_encrypt_produces_different_ciphertext_each_time(self):
        original = "test@email.com"
        enc1 = encrypt_sensitive(original)
        enc2 = encrypt_sensitive(original)
        # IVs son aleatorios: cada cifrado debe ser diferente
        assert enc1 != enc2

    def test_decrypt_tampered_data_raises(self):
        encrypted = encrypt_sensitive("sensitive data")
        # Tamper with the ciphertext
        tampered = encrypted + "XXX"
        with pytest.raises(ValueError):
            decrypt_sensitive(tampered)

    def test_decrypt_invalid_format_raises(self):
        with pytest.raises(ValueError):
            decrypt_sensitive("not-a-valid-encrypted-value")


class TestHashing:
    def test_hash_lookup_normalizes(self):
        # Mismo valor en diferentes formatos debe producir el mismo hash
        h1 = hash_lookup("Juan")
        h2 = hash_lookup("juan")
        h3 = hash_lookup("  JUAN  ")
        assert h1 == h2 == h3

    def test_hash_lookup_different_values(self):
        h1 = hash_lookup("0999999999")
        h2 = hash_lookup("0988888888")
        assert h1 != h2

    def test_hash_token_consistent(self):
        token = "some-random-uuid-token"
        h1 = hash_token(token)
        h2 = hash_token(token)
        assert h1 == h2

    def test_hash_token_different_inputs(self):
        h1 = hash_token("token-a")
        h2 = hash_token("token-b")
        assert h1 != h2


class TestJwt:
    def test_create_and_decode_jwt(self):
        session_id = "test-session-id"
        csrf_token = "test-csrf-token"
        role = "admin"

        token = create_staff_session_jwt(session_id, csrf_token, role)
        payload = decode_staff_session_jwt(token)

        assert payload["sessionId"] == session_id
        assert payload["csrfToken"] == csrf_token
        assert payload["role"] == role

    def test_decode_invalid_jwt_raises(self):
        with pytest.raises(ValueError):
            decode_staff_session_jwt("invalid.token.here")

    def test_decode_tampered_jwt_raises(self):
        token = create_staff_session_jwt("s1", "csrf1", "staff")
        tampered = token[:-10] + "XXXXXXXXXX"
        with pytest.raises(ValueError):
            decode_staff_session_jwt(tampered)
