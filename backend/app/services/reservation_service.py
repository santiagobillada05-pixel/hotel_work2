"""Business logic service for reservations and tariff calculation."""

from datetime import date, datetime, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.room import Room, RoomStatus
from app.models.reservation import Reservation, ReservationStatus
from app.config import get_settings
from app.utils.exceptions import BadRequestException, NotFoundException, ConflictException

settings = get_settings()

def calculate_tariffs(
    room_price: float,
    check_in: date,
    check_out: date,
    discount_rate: float = 0.0,
    custom_tax_rate: Optional[float] = None,
) -> Tuple[int, float, float, float, float]:
    """
    Calculates hotel stay tariffs.
    Returns: (nights, base_total, discount_amount, tax_amount, final_total)
    """
    if check_out <= check_in:
        raise BadRequestException("check_out_date debe ser posterior a check_in_date")

    nights = (check_out - check_in).days
    if nights <= 0:
        raise BadRequestException("La estadía debe ser de al menos 1 noche")

    base_total = round(nights * room_price, 2)
    discount_rate = max(0.0, min(1.0, discount_rate))
    discount_amount = round(base_total * discount_rate, 2)
    
    subtotal = base_total - discount_amount
    tax_rate = custom_tax_rate if custom_tax_rate is not None else settings.TAX_RATE
    tax_amount = round(subtotal * tax_rate, 2)
    final_total = round(subtotal + tax_amount, 2)

    return nights, base_total, discount_amount, tax_amount, final_total


def check_room_availability(
    db: Session,
    room_id: int,
    check_in: date,
    check_out: date,
    exclude_reservation_id: Optional[int] = None,
) -> bool:
    """
    Checks if a room is available for reservation.
    Una habitación solo no está disponible si actualmente se encuentra ocupada
    (el huésped confirmó entrada con check-in y aún no ha confirmado salida).
    """
    room = db.query(Room).filter(Room.id == room_id, Room.is_active == True).first()
    if not room:
        raise NotFoundException(f"Habitación con ID {room_id} no encontrada o inactiva")

    if room.status == RoomStatus.occupied:
        return False

    query = db.query(Reservation).filter(
        Reservation.room_id == room_id,
        Reservation.status == ReservationStatus.checked_in,
    )

    if exclude_reservation_id:
        query = query.filter(Reservation.id != exclude_reservation_id)

    overlapping = query.first()
    return overlapping is None
