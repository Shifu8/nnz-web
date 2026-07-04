"""
Router de autenticación: login y logout de Admin/Staff.
Genera cookie HTTP-Only con JWT y token CSRF.
"""
import uuid
import secrets
from fastapi import APIRouter, Response, Request, Depends
from fastapi.responses import JSONResponse
from sqlmodel import Session

from app.database import get_session
from app.security import (
    verify_role_password,
    create_staff_session_jwt,
    decode_staff_session_jwt,
    STAFF_SESSION_COOKIE,
    STAFF_CSRF_COOKIE,
)
from app.schemas import LoginRequest, LoginResponse
from app.middlewares.auth import require_any_role

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

SESSION_MAX_AGE = 12 * 60 * 60  # 12 horas en segundos
IS_PRODUCTION = False  # Cambiar a True en producción (requiere HTTPS)


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, response: Response):
    """
    Autenticación para Staff/Admin.
    Genera cookie HTTP-Only JWT + token CSRF.
    """
    valid = verify_role_password(body.password, body.role)
    if not valid:
        return JSONResponse(
            status_code=401,
            content={"error": "Credenciales incorrectas.", "code": "UNAUTHORIZED"}
        )

    session_id = str(uuid.uuid4())
    csrf_token = secrets.token_hex(32)
    token = create_staff_session_jwt(session_id, csrf_token, body.role)

    # Cookie HTTP-Only con JWT
    response.set_cookie(
        key=STAFF_SESSION_COOKIE,
        value=token,
        max_age=SESSION_MAX_AGE,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="strict",
        path="/",
    )

    # Cookie CSRF legible por JS (no httponly para que el cliente la pueda leer)
    response.set_cookie(
        key=STAFF_CSRF_COOKIE,
        value=csrf_token,
        max_age=SESSION_MAX_AGE,
        httponly=False,
        secure=IS_PRODUCTION,
        samesite="strict",
        path="/",
    )

    return LoginResponse(ok=True, role=body.role, csrf_token=csrf_token)


@router.post("/logout")
async def logout(response: Response):
    """Limpieza de cookies de sesión."""
    response.delete_cookie(key=STAFF_SESSION_COOKIE, path="/")
    response.delete_cookie(key=STAFF_CSRF_COOKIE, path="/")
    return {"ok": True, "message": "Sesión cerrada."}


@router.get("/me")
async def me(request: Request, session: Session = Depends(get_session)):
    """Devuelve el rol actual de la sesión activa."""
    payload = require_any_role(request)
    return {
        "ok": True,
        "role": payload["role"],
        "session_id": payload["session_id"]
    }
