import uuid
from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class Event(SQLModel, table=True):
    __tablename__ = "events"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    slug: Optional[str] = Field(default=None, index=True, unique=True)
    title: str
    subtitle: Optional[str] = ""
    location: Optional[str] = ""
    date: str
    time: str
    countdown_date: Optional[str] = ""
    price: float = Field(default=0.0)
    image_url: Optional[str] = ""
    description: Optional[str] = ""
    status: str = Field(default="active")  # active, inactive
    is_featured: bool = Field(default=False)
    position: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Receipt(SQLModel, table=True):
    __tablename__ = "receipts"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    event_id: uuid.UUID = Field(index=True)
    first_name: str
    last_name: str
    phone_hash: str = Field(index=True)
    phone_encrypted: str
    email_hash: Optional[str] = Field(default=None, index=True)
    email_encrypted: Optional[str] = None
    document_hash: Optional[str] = None
    document_encrypted: Optional[str] = None
    quantity: int = Field(default=1)
    payment_method: str  # banco-loja, banco-pichincha, otros
    reference_number: Optional[str] = ""
    file_path: str
    original_file_name: str
    file_size: int
    mime_type: str
    status: str = Field(default="pendiente")  # pendiente, aprobado, rechazado
    ocr_result_json: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    ticket_design: Optional[str] = "0"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Ticket(SQLModel, table=True):
    __tablename__ = "tickets"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    event_id: str = Field(index=True)
    receipt_id: Optional[uuid.UUID] = Field(default=None, index=True)
    first_name: str
    last_name: str
    phone_hash: str = Field(index=True)
    phone_encrypted: str
    email_hash: str = Field(index=True)
    email_encrypted: str
    document_hash: str = Field(index=True)
    document_encrypted: str
    amount: float = Field(default=0.0)
    status: str = Field(default="pending")  # pending, approved, declined, cancelled
    processor: str = Field(default="payphone")
    payment_token_hash: Optional[str] = None
    processor_ticket_number: Optional[str] = None
    processor_response_json: Optional[str] = None
    decline_reason: Optional[str] = None
    serial_number: Optional[str] = Field(default=None, index=True, unique=True)
    qr_payload_encrypted: Optional[str] = None
    ip_hash: Optional[str] = None
    user_agent_hash: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    activated_at: Optional[datetime] = None

class PartyPass(SQLModel, table=True):
    __tablename__ = "party_passes"
    
    serial_number: str = Field(primary_key=True)
    code_hash: str = Field(index=True)
    event_id: str = Field(index=True)
    participant_id: uuid.UUID = Field(index=True)
    used: bool = Field(default=False)
    expires_at: datetime
    qr_payload_encrypted: str
    pass_type: str = Field(default="FOUNDING_DAWG")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    scanned_at: Optional[datetime] = None
    scanned_by: Optional[str] = None
    scan_ip_hash: Optional[str] = None
    scan_user_agent_hash: Optional[str] = None

class AdminLog(SQLModel, table=True):
    __tablename__ = "admin_logs"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    action: str
    metadata_json: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class RecoveryOtp(SQLModel, table=True):
    __tablename__ = "ticket_recovery_otps"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email_hash: str = Field(index=True)
    event_id: str = Field(index=True)
    ticket_id: str = Field(index=True)
    ticket_source: str  # supabase, firestore, receipt
    code_hash: str
    expires_at: datetime
    attempts: int = Field(default=0)
    used: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class RecoveryLog(SQLModel, table=True):
    __tablename__ = "ticket_recovery_logs"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email_hash: str = Field(index=True)
    event_id: str = Field(index=True)
    action: str
    ip_hash: Optional[str] = None
    user_agent_hash: Optional[str] = None
    metadata_json: Optional[str] = "{}"
    created_at: datetime = Field(default_factory=datetime.utcnow)
