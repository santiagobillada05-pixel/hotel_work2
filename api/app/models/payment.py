import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.database import Base


class PaymentMethod(str, enum.Enum):
    """Métodos de pago aceptados."""
    cash = "cash"
    credit_card = "credit_card"
    debit_card = "debit_card"
    transfer = "transfer"


class PaymentStatus(str, enum.Enum):
    """Estados posibles de un pago."""
    pending = "pending"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"


class Payment(Base):
    """Modelo ORM para pagos asociados a reservas."""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    reservation_id = Column(Integer, ForeignKey("reservations.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), nullable=False, default="COP")
    exchange_rate = Column(Float, nullable=False, default=1.0)
    base_currency = Column(String(3), nullable=False, default="COP")
    payment_method = Column(SAEnum(PaymentMethod), nullable=False)
    status = Column(SAEnum(PaymentStatus), default=PaymentStatus.pending, nullable=False)
    transaction_ref = Column(String(100), nullable=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    reservation = relationship("Reservation", back_populates="payments")

    def __repr__(self) -> str:
        return f"<Payment(id={self.id}, reservation={self.reservation_id}, amount={self.amount}, status='{self.status}')>"
