"""Extras router for hotel complementary services."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.dependencies.database import get_db
from app.dependencies.auth import get_current_active_user, require_role
from app.models.user import User, UserRole
from app.models.reservation import Reservation, ReservationStatus
from app.models.extra_service import ExtraService
from app.models.reservation_extra import ReservationExtra
from app.schemas.extra_service import (
    ExtraServiceCreate,
    ExtraServiceResponse,
    AddReservationExtraRequest,
    ReservationExtraResponse,
)
from app.utils.exceptions import NotFoundException, BadRequestException, ForbiddenException
from app.utils.responses import success_response

router = APIRouter(prefix="/extras", tags=["Servicios Extra"])


@router.get("/", response_model=dict)
def list_extra_services(
    db: Session = Depends(get_db),
):
    """Lista todos los servicios extra activos del hotel (público)."""
    services = db.query(ExtraService).filter(ExtraService.is_active == True).all()
    data = [ExtraServiceResponse.model_validate(s).model_dump() for s in services]
    return success_response(data=data, message=f"{len(data)} servicios extra disponibles")


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_extra_service(
    service_in: ExtraServiceCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(UserRole.admin)),
):
    """Crea un nuevo servicio extra (solo admin)."""
    service = ExtraService(
        name=service_in.name,
        description=service_in.description,
        price=service_in.price,
        currency=service_in.currency,
        category=service_in.category,
        icon=service_in.icon,
        is_active=service_in.is_active,
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    data = ExtraServiceResponse.model_validate(service).model_dump()
    return success_response(data=data, message="Servicio extra creado exitosamente")


@router.post("/reservation/{reservation_id}", response_model=dict, status_code=status.HTTP_201_CREATED)
def add_extra_to_reservation(
    reservation_id: int,
    body: AddReservationExtraRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Agrega un servicio extra a una reserva.
    El usuario debe ser el dueño de la reserva.
    La reserva debe estar en estado pending o confirmed.
    """
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise NotFoundException(f"Reserva con ID {reservation_id} no encontrada")

    if current_user.role == UserRole.guest and reservation.user_id != current_user.id:
        raise ForbiddenException("No tienes permiso para modificar esta reserva")

    if reservation.status not in [ReservationStatus.pending, ReservationStatus.confirmed]:
        raise BadRequestException(
            f"Solo se pueden agregar extras a reservas en estado pending o confirmed (actual: {reservation.status.value})"
        )

    extra_service = db.query(ExtraService).filter(
        ExtraService.id == body.extra_service_id,
        ExtraService.is_active == True,
    ).first()
    if not extra_service:
        raise NotFoundException(f"Servicio extra con ID {body.extra_service_id} no encontrado o inactivo")

    unit_price = extra_service.price
    subtotal = unit_price * body.quantity

    reservation_extra = ReservationExtra(
        reservation_id=reservation_id,
        extra_service_id=body.extra_service_id,
        quantity=body.quantity,
        unit_price=unit_price,
        subtotal=subtotal,
    )
    db.add(reservation_extra)
    db.commit()
    db.refresh(reservation_extra)

    data = ReservationExtraResponse.model_validate(reservation_extra).model_dump()
    return success_response(data=data, message="Servicio extra agregado a la reserva exitosamente")


@router.delete("/reservation/{reservation_id}/{extra_id}", response_model=dict)
def remove_extra_from_reservation(
    reservation_id: int,
    extra_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Elimina un servicio extra de una reserva.
    El usuario debe ser el dueño de la reserva o ser admin/staff.
    """
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise NotFoundException(f"Reserva con ID {reservation_id} no encontrada")

    if current_user.role == UserRole.guest and reservation.user_id != current_user.id:
        raise ForbiddenException("No tienes permiso para modificar esta reserva")

    if reservation.status not in [ReservationStatus.pending, ReservationStatus.confirmed]:
        raise BadRequestException(
            f"No se pueden eliminar extras de una reserva en estado '{reservation.status.value}'"
        )

    reservation_extra = db.query(ReservationExtra).filter(
        ReservationExtra.id == extra_id,
        ReservationExtra.reservation_id == reservation_id,
    ).first()
    if not reservation_extra:
        raise NotFoundException(f"Servicio extra con ID {extra_id} no encontrado en la reserva {reservation_id}")

    db.delete(reservation_extra)
    db.commit()
    return success_response(data=None, message="Servicio extra eliminado de la reserva exitosamente")


@router.get("/reservation/{reservation_id}", response_model=dict)
def get_reservation_extras(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Obtiene todos los servicios extra asociados a una reserva."""
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise NotFoundException(f"Reserva con ID {reservation_id} no encontrada")

    if current_user.role == UserRole.guest and reservation.user_id != current_user.id:
        raise ForbiddenException("No tienes permiso para consultar esta reserva")

    extras = db.query(ReservationExtra).filter(
        ReservationExtra.reservation_id == reservation_id
    ).all()
    data = [ReservationExtraResponse.model_validate(e).model_dump() for e in extras]
    total = sum(e.subtotal for e in extras)
    return success_response(
        data=data,
        message=f"{len(data)} servicio(s) extra para la reserva {reservation_id}",
        meta={"extras_total": total},
    )
