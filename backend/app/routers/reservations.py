"""Reservations router for booking lifecycle, tariffs, check-in/out and history."""

from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.dependencies.database import get_db
from app.dependencies.auth import get_current_active_user, require_role
from app.models.user import User, UserRole
from app.models.room import Room, RoomStatus
from app.models.reservation import Reservation, ReservationStatus
from app.models.notification import NotificationType
from app.models.checkout_record import CheckoutRecord, CountingStatus
from app.models.payment import PaymentStatus
from app.schemas.reservation import (
    ReservationCreate,
    ReservationUpdate,
    ReservationResponse,
)
from app.services.reservation_service import calculate_tariffs, check_room_availability
from app.services.notification_service import send_notification
from app.utils.exceptions import NotFoundException, BadRequestException, ForbiddenException, ConflictException
from app.utils.responses import success_response, paginated_response

router = APIRouter(prefix="/reservations", tags=["Reservas"])


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_reservation(
    res_in: ReservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Crea una nueva reserva.
    - Valida disponibilidad de la habitación en las fechas solicitadas.
    - Calcula automáticamente noches, subtotal, descuentos e impuestos.
    - Envía notificación de confirmación al huésped.
    """
    room = db.query(Room).filter(Room.id == res_in.room_id, Room.is_active == True).first()
    if not room:
        raise NotFoundException("La habitación solicitada no existe o no está disponible")
        
    if room.status == RoomStatus.occupied:
        raise ConflictException("La habitación se encuentra ocupada y no está disponible para reservas")

    if res_in.num_guests > room.capacity:
        raise BadRequestException(f"La habitación seleccionada tiene capacidad máxima para {room.capacity} persona(s)")

    is_available = check_room_availability(db, res_in.room_id, res_in.check_in_date, res_in.check_out_date)
    if not is_available:
        raise ConflictException("La habitación ya se encuentra reservada para las fechas seleccionadas")

    # Cálculo automático de tarifas
    nights, base_total, discount_amount, tax_amount, final_total = calculate_tariffs(
        room_price=room.price_per_night,
        check_in=res_in.check_in_date,
        check_out=res_in.check_out_date,
        discount_rate=res_in.discount_rate,
    )

    reservation = Reservation(
        user_id=current_user.id,
        room_id=room.id,
        check_in_date=res_in.check_in_date,
        check_out_date=res_in.check_out_date,
        num_guests=res_in.num_guests,
        status=ReservationStatus.confirmed,
        base_total=base_total,
        discount_amount=discount_amount,
        tax_amount=tax_amount,
        final_total=final_total,
        special_requests=res_in.special_requests,
    )
    db.add(reservation)
    db.commit()
    db.refresh(reservation)

    # Create a pending payment
    from app.models.payment import Payment, PaymentMethod
    pending_payment = Payment(
        reservation_id=reservation.id,
        amount=reservation.final_total,
        currency=room.currency or "COP",
        payment_method=PaymentMethod.cash,
        status=PaymentStatus.pending
    )
    db.add(pending_payment)
    db.commit()
    db.refresh(reservation)

    # Mock de notificación
    formatted_total = f"${reservation.final_total:,.0f}" if (room.currency or "COP") == "COP" else f"${reservation.final_total:.2f}"
    send_notification(
        db=db,
        user_id=current_user.id,
        title="¡Reserva Confirmada!",
        message=f"Tu reserva para la habitación {room.room_number} del {reservation.check_in_date} al {reservation.check_out_date} ha sido registrada. Total: {formatted_total} {room.currency or 'COP'}",
        notification_type=NotificationType.confirmation,
        reservation_id=reservation.id,
    )

    data = ReservationResponse.model_validate(reservation).model_dump()
    return success_response(data=data, message="Reserva creada exitosamente")


@router.get("/my", response_model=dict)
def get_my_reservations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Obtiene el historial completo de reservas del usuario autenticado."""
    reservations = (
        db.query(Reservation)
        .filter(Reservation.user_id == current_user.id)
        .order_by(Reservation.created_at.desc())
        .all()
    )
    data = [ReservationResponse.model_validate(r).model_dump() for r in reservations]
    return success_response(data=data, message=f"Historial de {len(data)} reservas obtenido")


@router.get("/", response_model=dict)
def list_all_reservations(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status_filter: Optional[ReservationStatus] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    staff_or_admin: User = Depends(require_role(UserRole.admin, UserRole.staff)),
):
    """Lista de todas las reservas del hotel (solo admin y staff)."""
    query = db.query(Reservation)
    if status_filter:
        query = query.filter(Reservation.status == status_filter)

    total = query.count()
    reservations = (
        query.order_by(Reservation.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    data = [ReservationResponse.model_validate(r).model_dump() for r in reservations]
    return paginated_response(data=data, total=total, page=page, per_page=per_page)


@router.get("/{id}", response_model=dict)
def get_reservation_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Detalle de reserva. Huésped solo ve la suya; staff/admin pueden ver cualquiera."""
    reservation = db.query(Reservation).filter(Reservation.id == id).first()
    if not reservation:
        raise NotFoundException(f"Reserva con ID {id} no encontrada")

    if current_user.role == UserRole.guest and reservation.user_id != current_user.id:
        raise ForbiddenException("No tienes permiso para consultar esta reserva")

    data = ReservationResponse.model_validate(reservation).model_dump()
    return success_response(data=data)


@router.put("/{id}", response_model=dict)
def update_reservation(
    id: int,
    res_in: ReservationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Modificar reserva.
    Permitido para el dueño de la reserva o admin si está en estado pending o confirmed.
    Recalcula tarifas si cambian las fechas.
    """
    reservation = db.query(Reservation).filter(Reservation.id == id).first()
    if not reservation:
        raise NotFoundException(f"Reserva con ID {id} no encontrada")

    if current_user.role == UserRole.guest and reservation.user_id != current_user.id:
        raise ForbiddenException("No tienes permiso para modificar esta reserva")

    if reservation.status not in [ReservationStatus.pending, ReservationStatus.confirmed]:
        raise BadRequestException(f"No se puede modificar una reserva en estado '{reservation.status.value}'")

    room = db.query(Room).filter(Room.id == reservation.room_id).first()
    if (res_in.check_in_date or res_in.check_out_date) and room.status != RoomStatus.available:
        raise ConflictException("HABITACION_FUERA_DE_SERVICIO")

    new_check_in = res_in.check_in_date or reservation.check_in_date
    new_check_out = res_in.check_out_date or reservation.check_out_date

    # Validate availability for modified dates
    if res_in.check_in_date or res_in.check_out_date:
        is_available = check_room_availability(
            db=db,
            room_id=reservation.room_id,
            check_in=new_check_in,
            check_out=new_check_out,
            exclude_reservation_id=reservation.id,
        )
        if not is_available:
            raise ConflictException("La habitación no está disponible para las nuevas fechas")

        nights, base_total, discount_amount, tax_amount, final_total = calculate_tariffs(
            room_price=room.price_per_night,
            check_in=new_check_in,
            check_out=new_check_out,
            discount_rate=res_in.discount_rate if res_in.discount_rate is not None else (reservation.discount_amount / reservation.base_total if reservation.base_total > 0 else 0.0),
        )
        reservation.check_in_date = new_check_in
        reservation.check_out_date = new_check_out
        reservation.base_total = base_total
        reservation.discount_amount = discount_amount
        reservation.tax_amount = tax_amount
        reservation.final_total = final_total

    if res_in.num_guests is not None:
        if res_in.num_guests > room.capacity:
            raise BadRequestException(f"Capacidad máxima de la habitación: {room.capacity} persona(s)")
        reservation.num_guests = res_in.num_guests

    if res_in.special_requests is not None:
        reservation.special_requests = res_in.special_requests

    db.commit()
    db.refresh(reservation)

    data = ReservationResponse.model_validate(reservation).model_dump()
    return success_response(data=data, message="Reserva actualizada exitosamente")


@router.patch("/{id}/cancel", response_model=dict)
def cancel_reservation(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Cancela una reserva.
    Permitido para el dueño o admin. No puede cancelarse si ya hizo check-in.
    """
    reservation = db.query(Reservation).filter(Reservation.id == id).first()
    if not reservation:
        raise NotFoundException(f"Reserva con ID {id} no encontrada")

    if current_user.role == UserRole.guest and reservation.user_id != current_user.id:
        raise ForbiddenException("No tienes permiso para cancelar esta reserva")

    if reservation.status in [ReservationStatus.checked_in, ReservationStatus.checked_out]:
        raise BadRequestException("No se puede cancelar una reserva que ya completó o inició check-in")

    if reservation.status == ReservationStatus.cancelled:
        raise BadRequestException("La reserva ya se encuentra cancelada")

    reservation.status = ReservationStatus.cancelled
    # Eliminar cualquier registro en la lista de pagados/conteo si existía
    db.query(CheckoutRecord).filter(CheckoutRecord.reservation_id == reservation.id).delete(synchronize_session=False)
    db.commit()
    db.refresh(reservation)

    # Notification
    send_notification(
        db=db,
        user_id=reservation.user_id,
        title="Reserva Cancelada",
        message=f"Tu reserva #{reservation.id} ha sido cancelada satisfactoriamente.",
        notification_type=NotificationType.cancellation,
        reservation_id=reservation.id,
    )

    data = ReservationResponse.model_validate(reservation).model_dump()
    return success_response(data=data, message="Reserva cancelada exitosamente")


@router.patch("/{id}/check-in", response_model=dict)
def check_in_guest(
    id: int,
    db: Session = Depends(get_db),
    staff_or_admin: User = Depends(require_role(UserRole.admin, UserRole.staff)),
):
    """
    Check-in del huésped (staff o admin).
    Cambia el estado de la reserva a checked_in y la habitación a occupied.
    """
    reservation = db.query(Reservation).filter(Reservation.id == id).first()
    if not reservation:
        raise NotFoundException(f"Reserva con ID {id} no encontrada")

    if reservation.status != ReservationStatus.confirmed:
        raise BadRequestException(f"Solo se puede hacer check-in en reservas 'confirmed' (actual: {reservation.status.value})")

    room = db.query(Room).filter(Room.id == reservation.room_id).first()
    reservation.status = ReservationStatus.checked_in
    reservation.checked_in_at = datetime.now(timezone.utc)
    room.status = RoomStatus.occupied

    db.commit()
    db.refresh(reservation)

    send_notification(
        db=db,
        user_id=reservation.user_id,
        title="Check-in Realizado",
        message=f"¡Bienvenido! Has realizado check-in en la habitación {room.room_number}.",
        notification_type=NotificationType.general,
        reservation_id=reservation.id,
    )

    data = ReservationResponse.model_validate(reservation).model_dump()
    return success_response(data=data, message="Check-in realizado exitosamente")


@router.patch("/{id}/check-out", response_model=dict)
def check_out_guest(
    id: int,
    db: Session = Depends(get_db),
    staff_or_admin: User = Depends(require_role(UserRole.admin, UserRole.staff)),
):
    """
    Check-out del huésped (staff o admin).
    Cambia el estado de la reserva a checked_out y la habitación queda disponible automáticamente.
    """
    reservation = db.query(Reservation).filter(Reservation.id == id).first()
    if not reservation:
        raise NotFoundException(f"Reserva con ID {id} no encontrada")

    if reservation.status != ReservationStatus.checked_in:
        raise BadRequestException(f"Solo se puede hacer check-out en reservas 'checked_in' (actual: {reservation.status.value})")

    if not reservation.is_paid:
        raise BadRequestException("El pago de la reserva no está confirmado. Se requiere pago completo antes del check-out.")

    room = db.query(Room).filter(Room.id == reservation.room_id).first()
    reservation.status = ReservationStatus.checked_out
    reservation.checked_out_at = datetime.now(timezone.utc)
    room.status = RoomStatus.available

    # Crear o actualizar registro en la lista de pagados (Conteo)
    existing_record = db.query(CheckoutRecord).filter(CheckoutRecord.reservation_id == reservation.id).first()
    if existing_record:
        existing_record.checked_out_at = reservation.checked_out_at
    else:
        completed_payments = [p for p in reservation.payments if p.status == PaymentStatus.completed]
        last_payment = max(completed_payments, key=lambda x: x.paid_at or x.created_at, default=None) if completed_payments else None
        
        if last_payment:
            payment_method_val = getattr(last_payment.payment_method, "value", str(last_payment.payment_method))
        else:
            payment_method_val = "cash"
            
        guest_name = f"{reservation.user.first_name} {reservation.user.last_name}" if (reservation and reservation.user) else f"Usuario #{reservation.user_id}"
        room_number_val = room.room_number if room else "N/A"

        checkout_record = CheckoutRecord(
            reservation_id=reservation.id,
            guest_name=guest_name,
            room_number=room_number_val,
            check_in_date=reservation.check_in_date,
            check_out_date=reservation.check_out_date,
            total_amount=reservation.final_total,
            payment_method=str(payment_method_val),
            checked_out_at=reservation.checked_out_at,
            cashier_id=staff_or_admin.id,
            counting_status=CountingStatus.pending
        )
        db.add(checkout_record)

    db.commit()
    db.refresh(reservation)

    send_notification(
        db=db,
        user_id=reservation.user_id,
        title="Check-out Realizado",
        message=f"Gracias por hospedarte con nosotros. Esperamos verte pronto.",
        notification_type=NotificationType.general,
        reservation_id=reservation.id,
    )

    data = ReservationResponse.model_validate(reservation).model_dump()
    return success_response(data=data, message="Check-out realizado exitosamente. La habitación ahora está disponible automáticamente.")
