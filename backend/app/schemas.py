"""
Schemas Pydantic (DTOs) para validación y serialización de entrada y salida de API.
Ninguna entidad de base de datos se expone directamente; siempre pasa por estos schemas.
"""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
import re


# ─── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    password: str = Field(..., min_length=1, max_length=100)
    role: str = Field(default="admin", pattern="^(admin|staff)$")


class LoginResponse(BaseModel):
    ok: bool
    role: str
    csrf_token: str


# ─── Events ────────────────────────────────────────────────────────────────────

class EventCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=120)
    subtitle: Optional[str] = Field(default="", max_length=200)
    slug: Optional[str] = Field(default=None, max_length=60)
    location: Optional[str] = Field(default="", max_length=200)
    date: str = Field(..., max_length=30)
    time: str = Field(..., max_length=20)
    countdown_date: Optional[str] = Field(default="", max_length=50)
    price: float = Field(default=0.0, ge=0)
    image_url: Optional[str] = Field(default="", max_length=500)
    description: Optional[str] = Field(default="", max_length=5000)
    status: str = Field(default="active", pattern="^(active|inactive)$")
    is_featured: bool = Field(default=False)
    position: int = Field(default=0)


class EventUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=120)
    subtitle: Optional[str] = Field(default=None, max_length=200)
    slug: Optional[str] = Field(default=None, max_length=60)
    location: Optional[str] = Field(default=None, max_length=200)
    date: Optional[str] = Field(default=None, max_length=30)
    time: Optional[str] = Field(default=None, max_length=20)
    countdown_date: Optional[str] = Field(default=None, max_length=50)
    price: Optional[float] = Field(default=None, ge=0)
    image_url: Optional[str] = Field(default=None, max_length=500)
    description: Optional[str] = Field(default=None, max_length=5000)
    status: Optional[str] = Field(default=None, pattern="^(active|inactive)$")
    is_featured: Optional[bool] = None
    position: Optional[int] = None


class EventResponse(BaseModel):
    id: str
    slug: Optional[str]
    title: str
    subtitle: Optional[str]
    location: Optional[str]
    date: str
    time: str
    countdown_date: Optional[str]
    price: float
    image_url: Optional[str]
    description: Optional[str]
    status: str
    is_featured: bool
    position: int
    created_at: datetime
    updated_at: datetime


# ─── Receipts ──────────────────────────────────────────────────────────────────

class ReceiptResponse(BaseModel):
    id: str
    event_id: str
    first_name: str
    last_name: str
    quantity: int
    payment_method: str
    reference_number: Optional[str]
    file_path: str
    original_file_name: str
    file_size: int
    mime_type: str
    status: str
    rejection_reason: Optional[str]
    ticket_design: Optional[str]
    reviewed_by: Optional[str]
    reviewed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    # Decrypted fields only for admin
    phone: Optional[str] = None
    email: Optional[str] = None


class ReceiptListResponse(BaseModel):
    receipts: List[ReceiptResponse]
    total: int
    page: int
    per_page: int


class ReceiptReviewRequest(BaseModel):
    action: str = Field(..., pattern="^(approve|reject)$")
    rejection_reason: Optional[str] = Field(default=None, max_length=500)
    ticket_design: Optional[str] = Field(default=None, max_length=10)


class ReceiptReviewResponse(BaseModel):
    ok: bool
    receipt_id: str
    status: str
    serial_number: Optional[str] = None
    message: str


# ─── Passes ───────────────────────────────────────────────────────────────────

class PassValidateRequest(BaseModel):
    qr_payload: str = Field(..., max_length=2048)


class PassValidateResponse(BaseModel):
    valid: bool
    serial_number: str
    event_id: str
    used: bool
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    pass_type: Optional[str] = None
    scanned_at: Optional[datetime] = None


class PassConfirmRequest(BaseModel):
    serial_number: str = Field(..., max_length=80)
    scanned_by: str = Field(default="staff", max_length=80)


class PassConfirmResponse(BaseModel):
    ok: bool
    serial_number: str
    message: str


# ─── Ticket Generation (Admin) ────────────────────────────────────────────────

class GenerateTicketRequest(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=40)
    last_name: str = Field(..., min_length=2, max_length=40)
    phone: str = Field(..., min_length=10, max_length=15)
    email: str = Field(..., max_length=120)
    event_id: str = Field(..., max_length=60)
    quantity: int = Field(default=1, ge=1, le=5)
    ticket_design: str = Field(default="0", max_length=10)
    send_whatsapp: bool = Field(default=False)
    send_email: bool = Field(default=True)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = re.sub(r"\D", "", v)
        if not re.match(r"^09\d{8}$", cleaned):
            raise ValueError("Numero invalido. Ecuador: 09XXXXXXXX")
        return cleaned

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$", v):
            raise ValueError("Email invalido.")
        return v


class GenerateTicketResponse(BaseModel):
    ok: bool
    serial_number: str
    ticket_id: str
    message: str
