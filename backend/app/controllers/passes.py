"""
Router de passes (pases QR): validación y confirmación de ingreso en puerta.
Requiere rol staff o admin.
"""
from __future__ import annotations
import json
from datetime import datetime

from fastapi import APIRouter, Depends, Request
from fastapi.exceptions import HTTPException
from sqlmodel import Session

from app.database import get_session
from app.middlewares.auth import require_staff_or_admin
from app.repositories import PartyPassRepository, TicketRepository
from app.schemas import (
    PassValidateRequest,
    PassValidateResponse,
    PassConfirmRequest,
    PassConfirmResponse,
)
from app.security import decrypt_sensitive, hash_lookup

router = APIRouter(prefix="/api/v1/passes", tags=["passes"])


@router.post("/validate", response_model=PassValidateResponse)
async def validate_pass(
    body: PassValidateRequest,
    request: Request,
    session: Session = Depends(get_session),
    _: dict = Depends(require_staff_or_admin),
):
    """
    Valida el payload QR de un pase.
    Descifra el payload, busca el pase en base de datos y retorna el estado.
    """
    qr_payload_str = body.qr_payload.strip()

    if len(qr_payload_str) > 2048:
        raise HTTPException(status_code=400, detail="QR demasiado grande.")

    # Intentar parsear el payload QR directamente o descifrado
    try:
        payload = json.loads(qr_payload_str)
    except json.JSONDecodeError:
        # Podría ser un payload cifrado
        try:
            decrypted = decrypt_sensitive(qr_payload_str)
            payload = json.loads(decrypted)
        except Exception:
            raise HTTPException(status_code=400, detail="QR inválido o corrupto.")

    qr_type = payload.get("type")
    if qr_type != "NENEZ_PASS":
        raise HTTPException(status_code=400, detail="QR no reconocido.")

    serial_number = payload.get("serialNumber") or payload.get("passId")
    token = payload.get("token")
    event_id = payload.get("eventId")

    if not serial_number or not token or not event_id:
        raise HTTPException(status_code=400, detail="QR con datos incompletos.")

    pass_repo = PartyPassRepository(session)
    party_pass = pass_repo.find_by_serial_number(serial_number)

    if not party_pass:
        raise HTTPException(status_code=404, detail="Pase no encontrado.")

    # Verificar token
    expected_hash = hash_lookup(token)
    if party_pass.code_hash != expected_hash:
        raise HTTPException(status_code=400, detail="Token de pase inválido.")

    # Verificar expiración
    now = datetime.utcnow()
    if party_pass.expires_at < now:
        raise HTTPException(status_code=410, detail="Pase expirado.")

    # Intentar obtener datos del ticket asociado
    ticket_repo = TicketRepository(session)
    ticket = ticket_repo.find_by_serial_number(serial_number)
    first_name = last_name = None
    if ticket:
        try:
            first_name = ticket.first_name
            last_name = ticket.last_name
        except Exception:
            pass

    return PassValidateResponse(
        valid=True,
        serial_number=serial_number,
        event_id=event_id,
        used=party_pass.used,
        first_name=first_name,
        last_name=last_name,
        pass_type=party_pass.pass_type,
        scanned_at=party_pass.scanned_at,
    )


@router.post("/confirm", response_model=PassConfirmResponse)
async def confirm_pass(
    body: PassConfirmRequest,
    request: Request,
    session: Session = Depends(get_session),
    auth: dict = Depends(require_staff_or_admin),
):
    """
    Marca el pase como usado. Solo se puede usar una vez.
    """
    pass_repo = PartyPassRepository(session)
    party_pass = pass_repo.find_by_serial_number(body.serial_number)

    if not party_pass:
        raise HTTPException(status_code=404, detail="Pase no encontrado.")

    if party_pass.used:
        raise HTTPException(
            status_code=409,
            detail=f"Pase ya fue usado el {party_pass.scanned_at}."
        )

    # Marcar como usado
    party_pass.used = True
    party_pass.scanned_at = datetime.utcnow()
    party_pass.scanned_by = body.scanned_by or auth.get("role", "staff")

    # Hash de IP para auditoría (no guardamos IP raw)
    ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown")
    party_pass.scan_ip_hash = hash_lookup(ip.split(",")[0].strip())
    user_agent = request.headers.get("user-agent", "unknown")
    party_pass.scan_user_agent_hash = hash_lookup(user_agent)

    pass_repo.save(party_pass)

    return PassConfirmResponse(
        ok=True,
        serial_number=body.serial_number,
        message="Ingreso confirmado. Bienvenido.",
    )
