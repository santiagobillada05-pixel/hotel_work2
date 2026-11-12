"""Esquemas Pydantic para registros de check-out y conteo."""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from app.models.checkout_record import CountingStatus


class CheckoutRecordResponse(BaseModel):
    """Esquema de respuesta para un registro de check-out."""
    id: int
    reservation_id: int
    guest_name: str
    room_number: str
    check_in_date: date
    check_out_date: date
    total_amount: float
    payment_method: str
    checked_out_at: datetime
    cashier_id: int
    counting_status: CountingStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class CheckoutRecordStatusUpdate(BaseModel):
    """Esquema para actualizar el estado del conteo (solo admin)."""
    status: CountingStatus
