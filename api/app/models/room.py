import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.database import Base


class RoomType(str, enum.Enum):
    """Tipos de habitacion disponibles."""
    single = "single"
    double = "double"
    suite = "suite"
    deluxe = "deluxe"


class RoomStatus(str, enum.Enum):
    """Estados posibles de una habitacion."""
    available = "available"
    occupied = "occupied"
    maintenance = "maintenance"
    cleaning = "cleaning"


class Room(Base):
    """Modelo ORM para habitaciones del hotel."""
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(10), unique=True, index=True, nullable=False)
    room_type = Column(SAEnum(RoomType), nullable=False)
    price_per_night = Column(Float, nullable=False)
    currency = Column(String(3), nullable=False, default="COP")
    capacity = Column(Integer, nullable=False, default=1)
    description = Column(Text, nullable=True)
    amenities = Column(Text, nullable=True)  # JSON string: ["wifi", "minibar", ...]
    status = Column(SAEnum(RoomStatus), default=RoomStatus.available, nullable=False)
    floor = Column(String(10), nullable=True)
    image_url = Column(Text, nullable=True)              # Legacy compat field (supports URLs and Base64)
    image_urls_json = Column(Text, nullable=True)        # JSON array of ordered URLs
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    reservations = relationship("Reservation", back_populates="room", lazy="selectin")

    @property
    def image_urls(self) -> list:
        """Returns ordered list of photo URLs. Falls back to [image_url] for legacy rooms."""
        import json
        if self.image_urls_json:
            try:
                urls = json.loads(self.image_urls_json)
                if isinstance(urls, list) and urls:
                    return urls
            except (ValueError, TypeError):
                pass
        if self.image_url:
            return [self.image_url]
        return []

    def __repr__(self) -> str:
        return f"<Room(id={self.id}, number='{self.room_number}', type='{self.room_type}')>"
