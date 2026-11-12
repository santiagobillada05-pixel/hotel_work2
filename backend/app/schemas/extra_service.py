"""Esquemas Pydantic para servicios extra."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class ExtraServiceCategory(str, Enum):
    """Categorías de servicios extra."""
    included = "included"
    premium = "premium"


# ── Request Schemas ──────────────────────────────────────────────

class ExtraServiceCreate(BaseModel):
    """Esquema para crear un servicio extra."""
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    price: float = Field(..., ge=0)
    currency: str = Field("COP", max_length=3)
    category: ExtraServiceCategory = ExtraServiceCategory.premium
    icon: Optional[str] = Field(None, max_length=50)
    is_active: bool = True


class AddReservationExtraRequest(BaseModel):
    """Esquema para agregar un servicio extra a una reserva."""
    extra_service_id: int = Field(..., gt=0)
    quantity: int = Field(1, ge=1, le=99)


# ── Response Schemas ─────────────────────────────────────────────

class ExtraServiceResponse(BaseModel):
    """Esquema de respuesta para un servicio extra."""
    id: int
    name: str
    description: Optional[str] = None
    price: float
    currency: str
    category: ExtraServiceCategory
    icon: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ReservationExtraResponse(BaseModel):
    """Esquema de respuesta para un servicio extra vinculado a una reserva."""
    id: int
    reservation_id: int
    extra_service_id: int
    quantity: int
    unit_price: float
    subtotal: float
    created_at: datetime
    extra_service: Optional[ExtraServiceResponse] = None

    model_config = {"from_attributes": True}
