"""
Servicio de generación de tickets y aprobación de comprobantes.
Centraliza la lógica de negocio transaccional (ACID):
  - Cuando se aprueba un comprobante → crear Ticket + PartyPass en una transacción.
  - Si algo falla, toda la transacción hace Rollback.
"""
from __future__ import annotations
import uuid
import json
from datetime import datetime, timedelta

from sqlmodel import Session

from app.models import Ticket, PartyPass, Receipt
from app.repositories import TicketRepository, PartyPassRepository, ReceiptRepository
from app.security import encrypt_sensitive, hash_lookup, hash_token


class TicketGenerationService:
    def __init__(self, session: Session):
        self.session = session

    async def approve_receipt(self, receipt: Receipt, reviewed_by: str = "admin") -> Ticket:
        """
        Aprueba un comprobante y genera Ticket + PartyPass en una transacción ACID.
        Si falla la creación del Ticket o PartyPass, se hace Rollback de la aprobación.
        """
        # Desencriptar datos para construir el Ticket
        from app.security import decrypt_sensitive
        phone = decrypt_sensitive(receipt.phone_encrypted)
        email = decrypt_sensitive(receipt.email_encrypted) if receipt.email_encrypted else ""
        document = decrypt_sensitive(receipt.document_encrypted) if receipt.document_encrypted else ""

        # Generar serial number único
        serial_number = self._generate_serial(receipt.id)

        # Generar token QR
        qr_token = str(uuid.uuid4())
        qr_payload = json.dumps({
            "type": "NENEZ_PASS",
            "serialNumber": serial_number,
            "token": qr_token,
            "eventId": str(receipt.event_id),
            "issuedAt": datetime.utcnow().isoformat(),
            "v": 1
        })

        # Expiración del pase: 7 días desde la aprobación
        expires_at = datetime.utcnow() + timedelta(days=7)

        try:
            # Iniciar transacción
            receipt_repo = ReceiptRepository(self.session)
            ticket_repo = TicketRepository(self.session)
            pass_repo = PartyPassRepository(self.session)

            # 1. Actualizar estado del comprobante
            receipt.status = "aprobado"
            receipt.serial_number = serial_number  # type: ignore[attr-defined]
            receipt.reviewed_by = reviewed_by
            receipt.reviewed_at = datetime.utcnow()
            receipt.updated_at = datetime.utcnow()

            self.session.add(receipt)

            # 2. Crear Ticket
            ticket = Ticket(
                id=uuid.uuid4(),
                event_id=str(receipt.event_id),
                receipt_id=receipt.id,
                first_name=receipt.first_name,
                last_name=receipt.last_name,
                phone_hash=hash_lookup(phone),
                phone_encrypted=encrypt_sensitive(phone),
                email_hash=hash_lookup(email) if email else hash_lookup("no-email"),
                email_encrypted=encrypt_sensitive(email) if email else encrypt_sensitive(""),
                document_hash=hash_lookup(document) if document else hash_lookup("no-doc"),
                document_encrypted=encrypt_sensitive(document) if document else encrypt_sensitive(""),
                amount=0.0,
                status="approved",
                processor="bank_transfer",
                serial_number=serial_number,
                qr_payload_encrypted=encrypt_sensitive(qr_payload),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                activated_at=datetime.utcnow(),
            )
            self.session.add(ticket)

            # 3. Crear PartyPass
            party_pass = PartyPass(
                serial_number=serial_number,
                code_hash=hash_token(qr_token),
                event_id=str(receipt.event_id),
                participant_id=ticket.id,
                used=False,
                expires_at=expires_at,
                qr_payload_encrypted=encrypt_sensitive(qr_payload),
                pass_type=receipt.ticket_design or "BLOCK_CARD",
                created_at=datetime.utcnow(),
            )
            self.session.add(party_pass)

            # Commit atómico de los 3 registros
            self.session.commit()
            self.session.refresh(ticket)

            return ticket

        except Exception as e:
            self.session.rollback()
            raise RuntimeError(f"Error al aprobar comprobante: {str(e)}") from e

    def _generate_serial(self, receipt_id: uuid.UUID) -> str:
        """Genera un número de serie único estilo NENEZ-XXXX-YYYYYYYY."""
        short_id = str(receipt_id).split("-")[0].upper()
        random_part = str(uuid.uuid4()).split("-")[1].upper()
        return f"NENEZ-{short_id}-{random_part}"
