import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Date, Float, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.database import Base


class CountingStatus(str, enum.Enum):
    """Estado del conteo para el cierre de caja."""
    pending = "pending"
    kept = "kept"
    removed = "removed"


class CheckoutRecord(Base):
    """Modelo ORM para el registro histórico de check-outs (lista de pagados)."""
    __tablename__ = "checkout_records"

    id = Column(Integer, primary_key=True, index=True)
    reservation_id = Column(Integer, ForeignKey("reservations.id"), nullable=False, index=True)
    guest_name = Column(String(200), nullable=False)
    room_number = Column(String(50), nullable=False)
    check_in_date = Column(Date, nullable=False)
    check_out_date = Column(Date, nullable=False)
    total_amount = Column(Float, nullable=False)
    payment_method = Column(String(50), nullable=False)
    checked_out_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    cashier_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    counting_status = Column(SAEnum(CountingStatus), default=CountingStatus.pending, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relaciones para acceder fácilmente si se requiere
    reservation = relationship("Reservation")
    cashier = relationship("User")

    def __repr__(self) -> str:
        return f"<CheckoutRecord(id={self.id}, reservation={self.reservation_id}, status='{self.counting_status}')>"
