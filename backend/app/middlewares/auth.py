"""
Middleware de autenticación: dependencias inyectables de FastAPI
para proteger endpoints con JWT de sesión y validación CSRF.
"""
from fastapi import Request
from fastapi.responses import JSONResponse

from app.security import decode_staff_session_jwt, STAFF_SESSION_COOKIE, STAFF_CSRF_COOKIE


def _get_session_token(request: Request) -> str | None:
    token = request.cookies.get(STAFF_SESSION_COOKIE)
    if token:
        return token
    auth_header = request.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        return auth_header[7:]
    return None


def require_any_role(request: Request) -> dict:
    """
    Dependencia FastAPI: requiere sesión activa (staff o admin).
    Devuelve el payload del JWT.
    """
    token = _get_session_token(request)
    if not token:
        raise _unauthorized()

    try:
        payload = decode_staff_session_jwt(token)
    except ValueError:
        raise _unauthorized()

    role = payload.get("role")
    if role not in ("staff", "admin"):
        raise _unauthorized()

    return payload


def require_admin(request: Request) -> dict:
    """
    Dependencia FastAPI: requiere sesión con rol admin.
    También valida el token CSRF en la cabecera X-CSRF-Token.
    """
    payload = require_any_role(request)
    if payload.get("role") != "admin":
        raise _forbidden()

    _validate_csrf(request, payload)
    return payload


def require_staff_or_admin(request: Request) -> dict:
    """
    Dependencia FastAPI: requiere sesión staff o admin + CSRF válido.
    """
    payload = require_any_role(request)
    _validate_csrf(request, payload)
    return payload


def _validate_csrf(request: Request, payload: dict):
    """Valida el token CSRF comparando cabecera, cookie y payload JWT."""
    # GET requests no requieren CSRF
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return

    csrf_header = request.headers.get("x-csrf-token", "")
    csrf_cookie = request.cookies.get(STAFF_CSRF_COOKIE, "")
    csrf_payload = payload.get("csrfToken", "")

    if not csrf_header or not csrf_cookie:
        raise _csrf_failed()

    if csrf_header != csrf_cookie or csrf_header != csrf_payload:
        raise _csrf_failed()


class AuthError(Exception):
    def __init__(self, status_code: int, message: str, code: str):
        self.status_code = status_code
        self.message = message
        self.code = code
        super().__init__(message)


def _unauthorized() -> AuthError:
    return AuthError(401, "Sesion requerida.", "UNAUTHORIZED")


def _forbidden() -> AuthError:
    return AuthError(403, "Permisos insuficientes. Se requiere rol admin.", "FORBIDDEN")


def _csrf_failed() -> AuthError:
    return AuthError(403, "Token CSRF invalido.", "CSRF_FAILED")
