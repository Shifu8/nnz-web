"""
Router administrativo: CRUD de Receipts (comprobantes de pago).
Requiere rol admin.
"""
from __future__ import annotations
import uuid
import json
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Request
from sqlmodel import Session

from app.database import get_session
from app.middlewares.auth import require_admin
from app.repositories import ReceiptRepository, TicketRepository, PartyPassRepository
from app.schemas import (
    ReceiptListResponse,
    ReceiptResponse,
    ReceiptReviewRequest,
    ReceiptReviewResponse,
)
from app.security import decrypt_sensitive
from app.services.ticket_service import TicketGenerationService

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


def _receipt_to_response(receipt, include_sensitive: bool = False) -> ReceiptResponse:
    phone = None
    email = None
    if include_sensitive:
        try:
            phone = decrypt_sensitive(receipt.phone_encrypted)
        except Exception:
            phone = "[CIFRADO]"
        try:
            email = decrypt_sensitive(receipt.email_encrypted) if receipt.email_encrypted else None
        except Exception:
            email = "[CIFRADO]"

    return ReceiptResponse(
        id=str(receipt.id),
        event_id=str(receipt.event_id),
        first_name=receipt.first_name,
        last_name=receipt.last_name,
        quantity=receipt.quantity,
        payment_method=receipt.payment_method,
        reference_number=receipt.reference_number,
        file_path=receipt.file_path,
        original_file_name=receipt.original_file_name,
        file_size=receipt.file_size,
        mime_type=receipt.mime_type,
        status=receipt.status,
        rejection_reason=receipt.rejection_reason,
        ticket_design=receipt.ticket_design,
        reviewed_by=receipt.reviewed_by,
        reviewed_at=receipt.reviewed_at,
        created_at=receipt.created_at,
        updated_at=receipt.updated_at,
        phone=phone,
        email=email,
    )


@router.get("/receipts", response_model=ReceiptListResponse)
async def list_receipts(
    request: Request,
    status: Optional[str] = None,
    page: int = 1,
    per_page: int = 50,
    session: Session = Depends(get_session),
    _: dict = Depends(require_admin),
):
    """Lista todos los comprobantes. Filtra por estado: pendiente, aprobado, rechazado."""
    repo = ReceiptRepository(session)
    offset = (page - 1) * per_page
    receipts = repo.find_all(status=status, limit=per_page, offset=offset)
    total = repo.count(status=status)

    return ReceiptListResponse(
        receipts=[_receipt_to_response(r) for r in receipts],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/receipts/{receipt_id}", response_model=ReceiptResponse)
async def get_receipt(
    receipt_id: str,
    session: Session = Depends(get_session),
    _: dict = Depends(require_admin),
):
    """Detalle de un comprobante incluyendo datos descifrados y URL de imagen."""
    repo = ReceiptRepository(session)
    receipt = repo.find_by_id(uuid.UUID(receipt_id))
    if not receipt:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Comprobante no encontrado.")

    return _receipt_to_response(receipt, include_sensitive=True)


@router.post("/receipts/{receipt_id}/review", response_model=ReceiptReviewResponse)
async def review_receipt(
    receipt_id: str,
    body: ReceiptReviewRequest,
    request: Request,
    session: Session = Depends(get_session),
    admin: dict = Depends(require_admin),
):
    """
    Aprobación o rechazo de un comprobante.
    Si se aprueba: crea Ticket + PartyPass en una sola transacción ACID.
    Si se rechaza: actualiza el estado y guarda el motivo de rechazo.
    """
    repo = ReceiptRepository(session)
    receipt = repo.find_by_id(uuid.UUID(receipt_id))
    if not receipt:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Comprobante no encontrado.")

    if receipt.status != "pendiente":
        from fastapi import HTTPException
        raise HTTPException(status_code=409, detail=f"El comprobante ya fue procesado: {receipt.status}")

    reviewed_by = admin.get("session_id", "admin")

    if body.action == "reject":
        receipt.status = "rechazado"
        receipt.rejection_reason = body.rejection_reason or "Pago no verificado."
        receipt.reviewed_by = reviewed_by
        receipt.reviewed_at = datetime.utcnow()
        receipt.updated_at = datetime.utcnow()
        repo.save(receipt)
        return ReceiptReviewResponse(
            ok=True,
            receipt_id=receipt_id,
            status="rechazado",
            message="Comprobante rechazado.",
        )

    # Aprobación: generar Ticket + PartyPass en transacción
    svc = TicketGenerationService(session)
    result = await svc.approve_receipt(receipt, reviewed_by=reviewed_by)

    return ReceiptReviewResponse(
        ok=True,
        receipt_id=receipt_id,
        status="aprobado",
        serial_number=result.serial_number,
        message="Comprobante aprobado. Ticket y pase generados.",
    )
