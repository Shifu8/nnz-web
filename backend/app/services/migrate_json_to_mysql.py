"""
Script de migración de datos: convierte los registros existentes de data/receipts.json
a la base de datos MySQL mediante SQLModel.

Ejecutar desde la carpeta backend/:
    python -m app.services.migrate_json_to_mysql

Requiere que la base de datos MySQL esté levantada y las tablas creadas (alembic upgrade head).
"""
from __future__ import annotations
import json
import os
import uuid
from datetime import datetime
from pathlib import Path

from sqlmodel import Session

from app.database import engine
from app.models import Receipt
from app.security import encrypt_sensitive, hash_lookup


def run_migration():
    receipts_path = Path(__file__).parents[4] / "data" / "receipts.json"

    if not receipts_path.exists():
        print(f"[MIGRATION] No se encontró el archivo: {receipts_path}")
        return

    with open(receipts_path, "r", encoding="utf-8") as f:
        raw_receipts: list = json.load(f)

    print(f"[MIGRATION] Encontrados {len(raw_receipts)} registros en receipts.json")

    migrated = 0
    skipped = 0
    errors = 0

    with Session(engine) as session:
        for raw in raw_receipts:
            try:
                receipt_id_str = raw.get("id", str(uuid.uuid4()))
                try:
                    receipt_id = uuid.UUID(receipt_id_str)
                except ValueError:
                    receipt_id = uuid.uuid5(uuid.NAMESPACE_DNS, receipt_id_str)

                # Verificar si ya existe
                existing = session.get(Receipt, receipt_id)
                if existing:
                    skipped += 1
                    continue

                phone_raw = raw.get("phone", "")
                email_raw = raw.get("email", "")
                doc_raw = raw.get("documentNumber", "")
                event_id_raw = raw.get("eventId", "trap-loud")

                # Intentar parsear el event_id como UUID o generar uno determinístico
                try:
                    event_id = uuid.UUID(event_id_raw)
                except ValueError:
                    event_id = uuid.uuid5(uuid.NAMESPACE_DNS, event_id_raw)

                receipt = Receipt(
                    id=receipt_id,
                    event_id=event_id,
                    first_name=raw.get("firstName", ""),
                    last_name=raw.get("lastName", ""),
                    phone_hash=hash_lookup(phone_raw),
                    phone_encrypted=encrypt_sensitive(phone_raw),
                    email_hash=hash_lookup(email_raw) if email_raw else None,
                    email_encrypted=encrypt_sensitive(email_raw) if email_raw else None,
                    document_hash=hash_lookup(doc_raw) if doc_raw else None,
                    document_encrypted=encrypt_sensitive(doc_raw) if doc_raw else None,
                    quantity=int(raw.get("quantity", 1)),
                    payment_method=raw.get("paymentMethod", "otros"),
                    reference_number=raw.get("referenceNumber", ""),
                    file_path=raw.get("filePath", ""),
                    original_file_name=raw.get("originalFileName", ""),
                    file_size=int(raw.get("fileSize", 0)),
                    mime_type=raw.get("mimeType", "image/jpeg"),
                    status=raw.get("status", "pendiente"),
                    rejection_reason=raw.get("rejectionReason"),
                    ticket_design=raw.get("ticketDesign", "0"),
                    reviewed_by=raw.get("reviewedBy"),
                    reviewed_at=_parse_dt(raw.get("reviewedAt")),
                    created_at=_parse_dt(raw.get("createdAt")) or datetime.utcnow(),
                    updated_at=_parse_dt(raw.get("reviewedAt")) or datetime.utcnow(),
                )

                session.add(receipt)
                session.commit()
                migrated += 1

                print(f"[MIGRATION] ✓ {receipt.first_name} {receipt.last_name} ({receipt.status})")

            except Exception as e:
                session.rollback()
                errors += 1
                print(f"[MIGRATION] ✗ Error en registro {raw.get('id', '?')}: {e}")

    print(f"\n[MIGRATION] Completado: {migrated} migrados, {skipped} omitidos, {errors} errores.")


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None


if __name__ == "__main__":
    run_migration()
