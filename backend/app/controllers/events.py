"""
Router de eventos: CRUD admin + lectura pública.
"""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Request
from fastapi.exceptions import HTTPException
from sqlmodel import Session

from app.database import get_session
from app.middlewares.auth import require_admin
from app.models import Event
from app.repositories import EventRepository
from app.schemas import EventCreate, EventUpdate, EventResponse

router = APIRouter(tags=["events"])


# ─── Públicos ─────────────────────────────────────────────────────────────────

@router.get("/api/v1/events", response_model=List[EventResponse])
async def get_events(session: Session = Depends(get_session)):
    """Cartelera pública de eventos activos."""
    repo = EventRepository(session)
    events = repo.find_all_active()
    return [_to_response(e) for e in events]


@router.get("/api/v1/events/{slug_or_id}", response_model=EventResponse)
async def get_event(slug_or_id: str, session: Session = Depends(get_session)):
    """Detalle público de un evento por slug o ID."""
    repo = EventRepository(session)
    # Intentar por slug primero
    event = repo.find_by_slug(slug_or_id)
    if not event:
        try:
            event = repo.find_by_id(uuid.UUID(slug_or_id))
        except ValueError:
            pass
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado.")
    return _to_response(event)


# ─── Admin ────────────────────────────────────────────────────────────────────

@router.get("/api/v1/admin/events", response_model=List[EventResponse])
async def admin_list_events(
    session: Session = Depends(get_session),
    _: dict = Depends(require_admin),
):
    """Listado completo de eventos (admin: incluye inactivos)."""
    repo = EventRepository(session)
    events = repo.find_all()
    return [_to_response(e) for e in events]


@router.post("/api/v1/admin/events", response_model=EventResponse, status_code=201)
async def create_event(
    body: EventCreate,
    session: Session = Depends(get_session),
    _: dict = Depends(require_admin),
):
    """Creación de un nuevo evento."""
    repo = EventRepository(session)
    event = Event(**body.model_dump())
    event.id = uuid.uuid4()
    saved = repo.save(event)
    return _to_response(saved)


@router.put("/api/v1/admin/events/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    body: EventUpdate,
    session: Session = Depends(get_session),
    _: dict = Depends(require_admin),
):
    """Actualización parcial de un evento."""
    repo = EventRepository(session)
    event = repo.find_by_id(uuid.UUID(event_id))
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado.")

    update_data = body.model_dump(exclude_none=True)
    for key, value in update_data.items():
        setattr(event, key, value)
    event.updated_at = datetime.utcnow()

    saved = repo.save(event)
    return _to_response(saved)


@router.delete("/api/v1/admin/events/{event_id}", status_code=204)
async def delete_event(
    event_id: str,
    session: Session = Depends(get_session),
    _: dict = Depends(require_admin),
):
    """Eliminación de un evento."""
    repo = EventRepository(session)
    deleted = repo.delete(uuid.UUID(event_id))
    if not deleted:
        raise HTTPException(status_code=404, detail="Evento no encontrado.")


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _to_response(event: Event) -> EventResponse:
    return EventResponse(
        id=str(event.id),
        slug=event.slug,
        title=event.title,
        subtitle=event.subtitle,
        location=event.location,
        date=event.date,
        time=event.time,
        countdown_date=event.countdown_date,
        price=event.price,
        image_url=event.image_url,
        description=event.description,
        status=event.status,
        is_featured=event.is_featured,
        position=event.position,
        created_at=event.created_at,
        updated_at=event.updated_at,
    )
