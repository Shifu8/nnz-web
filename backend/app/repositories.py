"""
Repositorios base y concretos para acceso a base de datos MySQL mediante SQLModel.
Repository Pattern: toda consulta pasa por esta capa.
"""
from __future__ import annotations
import uuid
from abc import ABC, abstractmethod
from typing import Generic, List, Optional, TypeVar
from sqlmodel import Session, select

from app.models import Event, Receipt, Ticket, PartyPass, AdminLog, RecoveryOtp

T = TypeVar("T")


class BaseRepository(ABC, Generic[T]):
    def __init__(self, session: Session):
        self.session = session

    @abstractmethod
    def find_by_id(self, id: uuid.UUID) -> Optional[T]:
        ...

    @abstractmethod
    def save(self, entity: T) -> T:
        ...

    @abstractmethod
    def delete(self, id: uuid.UUID) -> bool:
        ...


class EventRepository(BaseRepository[Event]):
    def find_by_id(self, id: uuid.UUID) -> Optional[Event]:
        return self.session.get(Event, id)

    def find_by_slug(self, slug: str) -> Optional[Event]:
        return self.session.exec(select(Event).where(Event.slug == slug)).first()

    def find_all_active(self) -> List[Event]:
        return list(self.session.exec(
            select(Event).where(Event.status == "active").order_by(Event.position)
        ).all())

    def find_all(self) -> List[Event]:
        return list(self.session.exec(select(Event).order_by(Event.position)).all())

    def save(self, event: Event) -> Event:
        self.session.add(event)
        self.session.commit()
        self.session.refresh(event)
        return event

    def delete(self, id: uuid.UUID) -> bool:
        event = self.find_by_id(id)
        if not event:
            return False
        self.session.delete(event)
        self.session.commit()
        return True


class ReceiptRepository(BaseRepository[Receipt]):
    def find_by_id(self, id: uuid.UUID) -> Optional[Receipt]:
        return self.session.get(Receipt, id)

    def find_all(self, status: Optional[str] = None, limit: int = 100, offset: int = 0) -> List[Receipt]:
        q = select(Receipt).order_by(Receipt.created_at.desc()).offset(offset).limit(limit)
        if status:
            q = q.where(Receipt.status == status)
        return list(self.session.exec(q).all())

    def count(self, status: Optional[str] = None) -> int:
        from sqlmodel import func, select as sql_select
        q = sql_select(func.count(Receipt.id))  # type: ignore[arg-type]
        if status:
            q = q.where(Receipt.status == status)
        return self.session.exec(q).one()

    def save(self, receipt: Receipt) -> Receipt:
        self.session.add(receipt)
        self.session.commit()
        self.session.refresh(receipt)
        return receipt

    def delete(self, id: uuid.UUID) -> bool:
        receipt = self.find_by_id(id)
        if not receipt:
            return False
        self.session.delete(receipt)
        self.session.commit()
        return True


class TicketRepository(BaseRepository[Ticket]):
    def find_by_id(self, id: uuid.UUID) -> Optional[Ticket]:
        return self.session.get(Ticket, id)

    def find_by_serial_number(self, serial_number: str) -> Optional[Ticket]:
        return self.session.exec(select(Ticket).where(Ticket.serial_number == serial_number)).first()

    def find_by_phone_hash_and_event(self, phone_hash: str, event_id: str) -> Optional[Ticket]:
        return self.session.exec(
            select(Ticket).where(Ticket.phone_hash == phone_hash, Ticket.event_id == event_id)
        ).first()

    def save(self, ticket: Ticket) -> Ticket:
        self.session.add(ticket)
        self.session.commit()
        self.session.refresh(ticket)
        return ticket

    def delete(self, id: uuid.UUID) -> bool:
        ticket = self.find_by_id(id)
        if not ticket:
            return False
        self.session.delete(ticket)
        self.session.commit()
        return True


class PartyPassRepository(BaseRepository[PartyPass]):
    def find_by_id(self, id: uuid.UUID) -> Optional[PartyPass]:
        return self.session.get(PartyPass, str(id))

    def find_by_serial_number(self, serial_number: str) -> Optional[PartyPass]:
        return self.session.exec(select(PartyPass).where(PartyPass.serial_number == serial_number)).first()

    def find_by_code_hash(self, code_hash: str) -> Optional[PartyPass]:
        return self.session.exec(select(PartyPass).where(PartyPass.code_hash == code_hash)).first()

    def save(self, party_pass: PartyPass) -> PartyPass:
        self.session.add(party_pass)
        self.session.commit()
        self.session.refresh(party_pass)
        return party_pass

    def delete(self, id: uuid.UUID) -> bool:
        party_pass = self.session.exec(
            select(PartyPass).where(PartyPass.serial_number == str(id))
        ).first()
        if not party_pass:
            return False
        self.session.delete(party_pass)
        self.session.commit()
        return True
