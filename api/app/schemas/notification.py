"""Esquemas Pydantic para notificaciones."""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class NotificationType(str, Enum):
    """Tipos de notificación."""
    confirmation = "confirmation"
    reminder = "reminder"
    cancellation = "cancellation"
    payment = "payment"
    general = "general"


# ── Response Schemas ─────────────────────────────────────────────

class NotificationResponse(BaseModel):
    """Esquema de respuesta para notificaciones."""
    id: int
    user_id: int
    reservation_id: Optional[int] = None
    title: str
    message: str
    type: NotificationType
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
