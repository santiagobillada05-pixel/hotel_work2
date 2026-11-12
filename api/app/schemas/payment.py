"""Esquemas Pydantic para pagos."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class PaymentMethod(str, Enum):
    """Métodos de pago."""
    cash = "cash"
    credit_card = "credit_card"
    debit_card = "debit_card"
    transfer = "transfer"


class PaymentStatus(str, Enum):
    """Estados de pago."""
    pending = "pending"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"


# ── Request Schemas ──────────────────────────────────────────────

class PaymentCreate(BaseModel):
    """Esquema para registrar un pago."""
    reservation_id: int = Field(..., gt=0)
    amount: float = Field(..., gt=0, description="Monto del pago")
    currency: str = Field("COP", max_length=3, description="Moneda (ej. COP, USD, EUR)")
    exchange_rate: float = Field(1.0, gt=0, description="Tasa de cambio hacia moneda base")
    payment_method: PaymentMethod
    transaction_ref: Optional[str] = Field(None, max_length=100, description="Referencia de transacción")


class PaymentStatusUpdate(BaseModel):
    """Esquema para cambiar el estado de un pago."""
    status: PaymentStatus


# ── Response Schemas ─────────────────────────────────────────────

class PaymentConfirmRequest(BaseModel):
    amount: float
    currency: str = "COP"
    exchange_rate: float = 1.0
    payment_method: PaymentMethod
    transaction_ref: Optional[str] = None


class PaymentResponse(BaseModel):
    """Esquema de respuesta para datos de pago."""
    id: int
    reservation_id: int
    amount: float
    currency: str
    exchange_rate: float
    base_currency: str
    payment_method: PaymentMethod
    status: PaymentStatus
    transaction_ref: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}
