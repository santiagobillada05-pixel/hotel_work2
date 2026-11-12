import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.database import Base


class NotificationType(str, enum.Enum):
    """Tipos de notificación del sistema."""
    confirmation = "confirmation"
    reminder = "reminder"
    cancellation = "cancellation"
    payment = "payment"
    general = "general"


class Notification(Base):
    """Modelo ORM para notificaciones a usuarios."""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    reservation_id = Column(Integer, ForeignKey("reservations.id"), nullable=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(SAEnum(NotificationType), default=NotificationType.general, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="notifications")
    reservation = relationship("Reservation", back_populates="notifications")

    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, user={self.user_id}, type='{self.type}', read={self.is_read})>"
