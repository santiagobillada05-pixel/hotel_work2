"""Esquemas Pydantic para habitaciones."""

import json
import re
from pydantic import BaseModel, Field, model_validator
from typing import Optional, List
from datetime import datetime, date
from enum import Enum


class RoomType(str, Enum):
    """Tipos de habitacion."""
    single = "single"
    double = "double"
    suite = "suite"
    deluxe = "deluxe"


class RoomStatus(str, Enum):
    """Estados de habitacion."""
    available = "available"
    occupied = "occupied"
    maintenance = "maintenance"
    cleaning = "cleaning"


_URL_PATTERN = re.compile(r'^(https?://|data:image/)', re.IGNORECASE)

def _validate_image_urls(urls: list) -> list:
    """Validates a list of image URLs. Returns cleaned list or raises ValueError."""
    if not urls:
        raise ValueError("Se requiere al menos 1 URL de imagen.")
    if len(urls) > 10:
        raise ValueError("Se permiten como maximo 10 URLs de imagen.")
    seen = set()
    for url in urls:
        url = url.strip()
        if not url:
            raise ValueError("Las URLs de imagen no pueden estar vacias.")
        if not _URL_PATTERN.match(url):
            raise ValueError(f"URL invalida (debe iniciar con http://, https:// o data:image/): {url[:50]}...")
        if url in seen:
            raise ValueError(f"URL duplicada: {url[:50]}...")
        seen.add(url)
    return [u.strip() for u in urls]


# ── Request Schemas ──────────────────────────────────────────────

class RoomCreate(BaseModel):
    """Esquema para crear una habitacion."""
    room_number: str = Field(..., min_length=1, max_length=10, description="Numero de habitacion, ej: 101")
    room_type: RoomType
    price_per_night: float = Field(..., gt=0, description="Tarifa por noche")
    currency: str = Field(default="COP", max_length=3, description="Moneda (COP, USD, EUR)")
    capacity: int = Field(..., ge=1, le=10, description="Capacidad maxima de huespedes")
    description: Optional[str] = Field(None, max_length=1000)
    amenities: Optional[str] = Field(None, description="JSON string de amenidades")
    floor: Optional[str] = Field(None, max_length=10)
    # New gallery field — replaces single image_url
    image_urls: List[str] = Field(default=[], description="URLs de fotos de la habitacion (minimo 1, maximo 10)")
    # Legacy field kept for backward compat; if provided and image_urls is empty, wraps it
    image_url: Optional[str] = Field(None, max_length=500, description="[Deprecated] Usar image_urls")

    @model_validator(mode="after")
    def validate_urls(self):
        # If only legacy image_url provided, promote it
        if not self.image_urls and self.image_url:
            self.image_urls = [self.image_url]
        self.image_urls = _validate_image_urls(self.image_urls)
        # Ensure legacy field reflects first URL
        self.image_url = self.image_urls[0] if self.image_urls else None
        return self


class RoomUpdate(BaseModel):
    """Esquema para actualizar una habitacion."""
    room_number: Optional[str] = Field(None, min_length=1, max_length=10)
    room_type: Optional[RoomType] = None
    price_per_night: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = Field(None, max_length=3)
    capacity: Optional[int] = Field(None, ge=1, le=10)
    description: Optional[str] = Field(None, max_length=1000)
    amenities: Optional[str] = None
    floor: Optional[str] = Field(None, max_length=10)
    image_urls: Optional[List[str]] = Field(None, description="URLs de fotos; null = no cambiar")
    image_url: Optional[str] = Field(None, max_length=500, description="[Deprecated] Usar image_urls")

    @model_validator(mode="after")
    def validate_urls(self):
        # If legacy image_url provided but image_urls is None, promote it
        if self.image_urls is None and self.image_url is not None:
            self.image_urls = [self.image_url]
        if self.image_urls is not None:
            self.image_urls = _validate_image_urls(self.image_urls)
            self.image_url = self.image_urls[0]
        return self


class RoomStatusUpdate(BaseModel):
    """Esquema para cambiar el estado de una habitacion."""
    status: RoomStatus


class RoomSearchParams(BaseModel):
    """Parametros de busqueda de habitaciones disponibles."""
    check_in: Optional[date] = Field(None, description="Fecha de entrada")
    check_out: Optional[date] = Field(None, description="Fecha de salida")
    room_type: Optional[RoomType] = None
    min_price: Optional[float] = Field(None, ge=0)
    max_price: Optional[float] = Field(None, ge=0)
    capacity: Optional[int] = Field(None, ge=1)


# ── Response Schemas ─────────────────────────────────────────────

class RoomResponse(BaseModel):
    """Esquema de respuesta para datos de habitacion."""
    id: int
    room_number: str
    room_type: RoomType
    price_per_night: float
    currency: str = "COP"
    capacity: int
    description: Optional[str] = None
    amenities: Optional[str] = None
    status: RoomStatus
    floor: Optional[str] = None
    image_url: Optional[str] = None        # Legacy compat: always = image_urls[0]
    image_urls: List[str] = Field(default_factory=list)  # Full ordered gallery
    is_active: bool
    is_room_bookable: bool = True
    guest_status_label: str = "Disponible"
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @model_validator(mode="after")
    def populate_image_urls(self):
        """Derives image_urls from the ORM property and ensures image_url compat."""
        # image_urls is populated from the ORM @property (from_attributes=True)
        if not self.image_urls and self.image_url:
            self.image_urls = [self.image_url]
        if self.image_urls and not self.image_url:
            self.image_url = self.image_urls[0]
            
        if self.status == RoomStatus.occupied:
            self.is_room_bookable = False
            self.guest_status_label = "Ocupada"
        else:
            self.status = RoomStatus.available
            self.is_room_bookable = True
            self.guest_status_label = "Disponible"
            
        return self
