"""Rooms router for searching, listing and CRUD management."""

import json
from datetime import date
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.dependencies.database import get_db
from app.dependencies.auth import require_role
from app.models.user import User, UserRole
from app.models.room import Room, RoomType, RoomStatus
from app.models.reservation import Reservation, ReservationStatus
from app.schemas.room import (
    RoomCreate,
    RoomUpdate,
    RoomStatusUpdate,
    RoomResponse,
)
from app.utils.exceptions import NotFoundException, ConflictException, BadRequestException
from app.utils.responses import success_response, paginated_response

router = APIRouter(prefix="/rooms", tags=["Habitaciones"])


@router.get("/available", response_model=dict)
def search_available_rooms(
    check_in: date = Query(..., description="Fecha de check-in (YYYY-MM-DD)"),
    check_out: date = Query(..., description="Fecha de check-out (YYYY-MM-DD)"),
    room_type: Optional[RoomType] = Query(None, description="Tipo de habitacion"),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    capacity: Optional[int] = Query(None, ge=1),
    db: Session = Depends(get_db),
):
    """
    Búsqueda de habitaciones disponibles por rango de fechas, tipo, precio y capacidad.
    Excluye únicamente habitaciones donde el huésped ya confirmó entrada (check-in)
    y aún no ha confirmado salida (check-out), o cuyo estado operativo sea 'occupied'.
    """
    if check_out <= check_in:
        raise BadRequestException("La fecha de check-out debe ser posterior a check-in")

    # Subquery de habitaciones que tienen huéspedes con check-in activo (entrada confirmada y no salida)
    checked_in_subquery = (
        db.query(Reservation.room_id)
        .filter(
            Reservation.status == ReservationStatus.checked_in,
        )
        .subquery()
    )

    query = db.query(Room).filter(
        Room.is_active == True,
        Room.status != RoomStatus.occupied,
        ~Room.id.in_(checked_in_subquery.select()),
    )

    if room_type:
        query = query.filter(Room.room_type == room_type)
    if min_price is not None:
        query = query.filter(Room.price_per_night >= min_price)
    if max_price is not None:
        query = query.filter(Room.price_per_night <= max_price)
    if capacity is not None:
        query = query.filter(Room.capacity >= capacity)

    rooms = query.order_by(Room.price_per_night.asc()).all()
    data = [RoomResponse.model_validate(r).model_dump() for r in rooms]
    return success_response(
        data=data,
        message=f"Se encontraron {len(data)} habitaciones disponibles para las fechas seleccionadas",
    )


@router.get("/", response_model=dict)
def list_rooms(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    room_type: Optional[RoomType] = None,
    status_filter: Optional[RoomStatus] = Query(None, alias="status"),
    capacity: Optional[int] = Query(None, ge=1),
    include_inactive: bool = Query(False),
    db: Session = Depends(get_db),
):
    """Lista de todas las habitaciones con filtros opcionales y paginacion."""
    query = db.query(Room)
    if not include_inactive:
        query = query.filter(Room.is_active == True)
    if room_type:
        query = query.filter(Room.room_type == room_type)
    if status_filter:
        query = query.filter(Room.status == status_filter)
    if capacity:
        query = query.filter(Room.capacity >= capacity)

    total = query.count()
    rooms = query.order_by(Room.room_number.asc()).offset((page - 1) * per_page).limit(per_page).all()
    data = [RoomResponse.model_validate(r).model_dump() for r in rooms]
    return paginated_response(data=data, total=total, page=page, per_page=per_page)


@router.get("/{id}", response_model=dict)
def get_room_by_id(id: int, db: Session = Depends(get_db)):
    """Obtiene el detalle de una habitacion por ID."""
    room = db.query(Room).filter(Room.id == id).first()
    if not room:
        raise NotFoundException(f"Habitacion con ID {id} no encontrada")
    data = RoomResponse.model_validate(room).model_dump()
    return success_response(data=data)


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_room(
    room_in: RoomCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(UserRole.admin)),
):
    """Crear una nueva habitacion (solo administrador)."""
    existing = db.query(Room).filter(Room.room_number == room_in.room_number.strip()).first()
    if existing:
        raise ConflictException(f"Ya existe una habitacion con el numero {room_in.room_number}")

    new_room = Room(
        room_number=room_in.room_number.strip(),
        room_type=room_in.room_type,
        price_per_night=room_in.price_per_night,
        currency=room_in.currency,
        capacity=room_in.capacity,
        description=room_in.description,
        amenities=room_in.amenities,
        floor=room_in.floor,
        image_url=room_in.image_urls[0] if room_in.image_urls else None,
        image_urls_json=json.dumps(room_in.image_urls) if room_in.image_urls else None,
        status=RoomStatus.available,
        is_active=True,
    )
    db.add(new_room)
    db.commit()
    db.refresh(new_room)

    data = RoomResponse.model_validate(new_room).model_dump()
    return success_response(data=data, message="Habitacion creada exitosamente")


@router.put("/{id}", response_model=dict)
def update_room(
    id: int,
    room_in: RoomUpdate,
    db: Session = Depends(get_db),
    staff_or_admin: User = Depends(require_role(UserRole.admin, UserRole.staff)),
):
    """Actualizar datos de una habitacion (admin y staff)."""
    room = db.query(Room).filter(Room.id == id).first()
    if not room:
        raise NotFoundException(f"Habitacion con ID {id} no encontrada")

    if room_in.room_number and room_in.room_number != room.room_number:
        existing = db.query(Room).filter(Room.room_number == room_in.room_number.strip(), Room.id != id).first()
        if existing:
            raise ConflictException(f"El numero de habitacion {room_in.room_number} ya esta en uso")
        room.room_number = room_in.room_number.strip()

    if room_in.room_type is not None:
        room.room_type = room_in.room_type
    if room_in.price_per_night is not None:
        room.price_per_night = room_in.price_per_night
    if room_in.currency is not None:
        room.currency = room_in.currency
    if room_in.capacity is not None:
        room.capacity = room_in.capacity
    if room_in.description is not None:
        room.description = room_in.description
    if room_in.amenities is not None:
        room.amenities = room_in.amenities
    if room_in.floor is not None:
        room.floor = room_in.floor
    if room_in.image_urls is not None:
        room.image_urls_json = json.dumps(room_in.image_urls)
        room.image_url = room_in.image_urls[0]

    db.commit()
    db.refresh(room)
    data = RoomResponse.model_validate(room).model_dump()
    return success_response(data=data, message="Habitacion actualizada exitosamente")


@router.patch("/{id}/status", response_model=dict)
def update_room_status(
    id: int,
    status_in: RoomStatusUpdate,
    db: Session = Depends(get_db),
    staff_or_admin: User = Depends(require_role(UserRole.admin, UserRole.staff)),
):
    """Cambiar el estado operativo de una habitacion (available, occupied)."""
    room = db.query(Room).filter(Room.id == id).first()
    if not room:
        raise NotFoundException(f"Habitacion con ID {id} no encontrada")

    room.status = status_in.status
    db.commit()
    db.refresh(room)
    data = RoomResponse.model_validate(room).model_dump()
    return success_response(data=data, message=f"Estado de habitacion actualizado a '{status_in.status.value}'")


@router.delete("/{id}", response_model=dict)
def delete_room(
    id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(UserRole.admin)),
):
    """Desactivar habitacion (soft-delete, solo administrador)."""
    room = db.query(Room).filter(Room.id == id).first()
    if not room:
        raise NotFoundException(f"Habitacion con ID {id} no encontrada")

    room.is_active = False
    db.commit()
    return success_response(data=None, message="Habitacion desactivada exitosamente")
