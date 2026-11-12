"""Modelo ORM para servicios extra del hotel."""

import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, Enum as SAEnum
from app.database import Base


class ExtraServiceCategory(str, enum.Enum):
    """Categorías de servicios extra."""
    included = "included"
    premium = "premium"


class ExtraService(Base):
    """Modelo ORM para servicios complementarios del hotel."""
    __tablename__ = "extra_services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False, default=0.0)
    currency = Column(String(3), default="COP")
    category = Column(SAEnum(ExtraServiceCategory), default=ExtraServiceCategory.premium)
    icon = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self) -> str:
        return f"<ExtraService(id={self.id}, name='{self.name}', price={self.price})>"
