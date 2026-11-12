import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Date, Float, Text, ForeignKey, Enum as SAEnum, Index
from sqlalchemy.orm import relationship
from app.database import Base


class ReservationStatus(str, enum.Enum):
    """Estados del ciclo de vida de una reserva."""
    pending = "pending"
    confirmed = "confirmed"
    checked_in = "checked_in"
    checked_out = "checked_out"
    cancelled = "cancelled"


class Reservation(Base):
    """Modelo ORM para reservas de habitaciones."""
    __tablename__ = "reservations"
    __table_args__ = (
        Index("idx_reservation_room_dates", "room_id", "check_in_date", "check_out_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False, index=True)
    check_in_date = Column(Date, nullable=False)
    check_out_date = Column(Date, nullable=False)
    num_guests = Column(Integer, nullable=False, default=1)
    status = Column(SAEnum(ReservationStatus), default=ReservationStatus.pending, nullable=False)
    base_total = Column(Float, nullable=False)
    tax_amount = Column(Float, nullable=False, default=0.0)
    discount_amount = Column(Float, nullable=False, default=0.0)
    final_total = Column(Float, nullable=False)
    special_requests = Column(Text, nullable=True)
    checked_in_at = Column(DateTime, nullable=True)
    checked_out_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="reservations")
    room = relationship("Room", back_populates="reservations")
    payments = relationship("Payment", back_populates="reservation", lazy="selectin")
    notifications = relationship("Notification", back_populates="reservation", lazy="selectin")
    extras = relationship("ReservationExtra", back_populates="reservation", lazy="selectin")

    @property
    def is_paid(self) -> bool:
        from app.models.payment import PaymentStatus
        total_paid = 0.0
        for p in self.payments:
            if p.status == PaymentStatus.completed:
                rate = getattr(p, "exchange_rate", 1.0)
                total_paid += (p.amount / rate)
        # Allow small floating point margin
        return total_paid >= (self.final_total - 0.01)

    def __repr__(self) -> str:
        return f"<Reservation(id={self.id}, user={self.user_id}, room={self.room_id}, status='{self.status}')>"
