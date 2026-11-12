"""Esquemas Pydantic para reservas."""
from __future__ import annotations

from pydantic import BaseModel, Field, model_validator
from typing import Optional
from datetime import datetime, date
from enum import Enum
from app.schemas.extra_service import ReservationExtraResponse


class ReservationStatus(str, Enum):
    """Estados de reserva."""
    pending = "pending"
    confirmed = "confirmed"
    checked_in = "checked_in"
    checked_out = "checked_out"
    cancelled = "cancelled"


# ── Request Schemas ──────────────────────────────────────────────

class ReservationCreate(BaseModel):
    """Esquema para crear una reserva."""
    room_id: int = Field(..., gt=0)
    check_in_date: date
    check_out_date: date
    num_guests: int = Field(..., ge=1, le=10)
    special_requests: Optional[str] = Field(None, max_length=500)
    discount_rate: float = Field(default=0.0, ge=0.0, le=1.0, description="Tasa de descuento (0.0 a 1.0)")

    @model_validator(mode="after")
    def validate_dates(self) -> "ReservationCreate":
        """Valida que check_out sea posterior a check_in."""
        if self.check_out_date <= self.check_in_date:
            raise ValueError("check_out_date debe ser posterior a check_in_date")
        return self


class ReservationUpdate(BaseModel):
    """Esquema para modificar una reserva (solo si está pending/confirmed)."""
    check_in_date: Optional[date] = None
    check_out_date: Optional[date] = None
    num_guests: Optional[int] = Field(None, ge=1, le=10)
    special_requests: Optional[str] = Field(None, max_length=500)
    discount_rate: Optional[float] = Field(None, ge=0.0, le=1.0)


# ── Response Schemas ─────────────────────────────────────────────

class ReservationResponse(BaseModel):
    """Esquema de respuesta para datos de reserva."""
    id: int
    user_id: int
    room_id: int
    check_in_date: date
    check_out_date: date
    num_guests: int
    status: ReservationStatus
    base_total: float
    tax_amount: float
    discount_amount: float
    final_total: float
    special_requests: Optional[str] = None
    checked_in_at: Optional[datetime] = None
    checked_out_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    is_paid: bool = False
    payments: list["PaymentResponse"] = []
    extras: list[ReservationExtraResponse] = []
    extras_total: float = 0.0
    grand_total: float = 0.0
    confirmation_deadline: Optional[str] = None
    needs_confirmation: bool = False

    model_config = {"from_attributes": True}

    @model_validator(mode="after")
    def compute_extras_fields(self) -> "ReservationResponse":
        """Computes extras_total and grand_total from extras list."""
        total = 0.0
        for e in (self.extras or []):
            if isinstance(e, dict):
                total += float(e.get("subtotal", 0.0) or 0.0)
            else:
                total += float(getattr(e, "subtotal", 0.0) or 0.0)
        self.extras_total = total
        self.grand_total = float(self.final_total or 0.0) + total
        return self


from app.schemas.extra_service import ReservationExtraResponse
from app.schemas.payment import PaymentResponse
ReservationResponse.model_rebuild()
