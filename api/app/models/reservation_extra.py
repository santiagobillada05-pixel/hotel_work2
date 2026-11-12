"""Modelo ORM para la relación entre reservas y servicios extra."""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class ReservationExtra(Base):
    """Tabla de unión entre reservas y servicios extra contratados."""
    __tablename__ = "reservation_extras"

    id = Column(Integer, primary_key=True, index=True)
    reservation_id = Column(Integer, ForeignKey("reservations.id"), nullable=False, index=True)
    extra_service_id = Column(Integer, ForeignKey("extra_services.id"), nullable=False, index=True)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    reservation = relationship("Reservation", back_populates="extras")
    extra_service = relationship("ExtraService")

    def __repr__(self) -> str:
        return f"<ReservationExtra(id={self.id}, reservation={self.reservation_id}, service={self.extra_service_id})>"
