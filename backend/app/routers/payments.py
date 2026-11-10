"""Payments router for registering and tracking transaction status."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.dependencies.database import get_db
from app.dependencies.auth import get_current_active_user, require_role
from app.models.user import User, UserRole
from app.models.reservation import Reservation, ReservationStatus
from app.models.payment import Payment, PaymentStatus
from app.models.checkout_record import CheckoutRecord, CountingStatus
from app.models.notification import NotificationType
from app.schemas.payment import PaymentCreate, PaymentStatusUpdate, PaymentResponse
from app.services.notification_service import send_notification
from app.utils.exceptions import NotFoundException, BadRequestException, ForbiddenException
from app.utils.responses import success_response

router = APIRouter(prefix="/payments", tags=["Pagos"])


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def register_payment(
    payment_in: PaymentCreate,
    db: Session = Depends(get_db),
    staff_or_admin: User = Depends(require_role(UserRole.admin, UserRole.staff)),
):
    """
    Registrar un pago contra una reserva.
    Calcula si el total pagado cubre el monto final de la reserva.
    """
    reservation = db.query(Reservation).filter(Reservation.id == payment_in.reservation_id).first()
    if not reservation:
        raise NotFoundException(f"Reserva con ID {payment_in.reservation_id} no encontrada")

    if reservation.status == ReservationStatus.cancelled:
        raise BadRequestException("No se puede registrar un pago para una reserva cancelada")

    payment = Payment(
        reservation_id=reservation.id,
        amount=payment_in.amount,
        currency=payment_in.currency,
        exchange_rate=payment_in.exchange_rate,
        base_currency="COP",
        payment_method=payment_in.payment_method,
        status=PaymentStatus.completed,
        transaction_ref=payment_in.transaction_ref,
        paid_at=datetime.now(timezone.utc),
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    # Si la reserva ya quedó pagada completamente, asegurar su registro en la Lista de Pagados
    if reservation.is_paid:
        existing_record = db.query(CheckoutRecord).filter(CheckoutRecord.reservation_id == reservation.id).first()
        if not existing_record:
            payment_method_val = getattr(payment.payment_method, "value", str(payment.payment_method))
            guest_name = f"{reservation.user.first_name} {reservation.user.last_name}" if (reservation and reservation.user) else f"Usuario #{reservation.user_id}"
            room_number_val = reservation.room.room_number if reservation.room else "N/A"

            checkout_record = CheckoutRecord(
                reservation_id=reservation.id,
                guest_name=guest_name,
                room_number=room_number_val,
                check_in_date=reservation.check_in_date,
                check_out_date=reservation.check_out_date,
                total_amount=reservation.final_total,
                payment_method=str(payment_method_val),
                checked_out_at=reservation.checked_out_at or datetime.now(timezone.utc),
                cashier_id=staff_or_admin.id,
                counting_status=CountingStatus.pending
            )
            db.add(checkout_record)
            db.commit()

    # Notificación de pago
    send_notification(
        db=db,
        user_id=reservation.user_id,
        title="Pago Registrado",
        message=f"Se ha registrado un pago de ${payment.amount:,.0f} COP ({payment.payment_method.value}) para tu reserva #{reservation.id}.",
        notification_type=NotificationType.payment,
        reservation_id=reservation.id,
    )

from app.utils.exceptions import ConflictException
from app.schemas.payment import PaymentConfirmRequest

@router.patch("/{id}/confirm", response_model=dict)
def confirm_payment(
    id: int,
    payment_in: PaymentConfirmRequest,
    db: Session = Depends(get_db),
    staff_or_admin: User = Depends(require_role(UserRole.admin, UserRole.staff)),
):
    """
    Endpoint idempotente para confirmar un pago.
    """
    payment = db.query(Payment).filter(Payment.id == id).with_for_update().first()
    if not payment:
        raise NotFoundException(f"Pago con ID {id} no encontrado")

    if payment.status == PaymentStatus.completed:
        # Return 409 Conflict if already confirmed
        data = PaymentResponse.model_validate(payment).model_dump()
        raise ConflictException("PAGO_YA_CONFIRMADO")
        
    if payment.status in [PaymentStatus.failed, PaymentStatus.refunded]:
        raise ConflictException("PAGO_NO_CONFIRMABLE")

    if payment.reservation and payment.reservation.status == ReservationStatus.cancelled:
        raise ConflictException("No se puede confirmar un pago para una reserva cancelada")

    # Update payment to completed
    payment.amount = payment_in.amount
    payment.currency = payment_in.currency
    payment.exchange_rate = payment_in.exchange_rate
    payment.payment_method = payment_in.payment_method
    payment.transaction_ref = payment_in.transaction_ref
    payment.status = PaymentStatus.completed
    payment.paid_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(payment)

    reservation = payment.reservation

    # Si la reserva ya quedó pagada completamente, asegurar su registro en la Lista de Pagados
    if reservation.is_paid:
        existing_record = db.query(CheckoutRecord).filter(CheckoutRecord.reservation_id == reservation.id).first()
        if not existing_record:
            payment_method_val = getattr(payment.payment_method, "value", str(payment.payment_method))
            guest_name = f"{reservation.user.first_name} {reservation.user.last_name}" if (reservation and reservation.user) else f"Usuario #{reservation.user_id}"
            room_number_val = reservation.room.room_number if reservation.room else "N/A"

            checkout_record = CheckoutRecord(
                reservation_id=reservation.id,
                guest_name=guest_name,
                room_number=room_number_val,
                check_in_date=reservation.check_in_date,
                check_out_date=reservation.check_out_date,
                total_amount=reservation.final_total,
                payment_method=str(payment_method_val),
                checked_out_at=reservation.checked_out_at or datetime.now(timezone.utc),
                cashier_id=staff_or_admin.id,
                counting_status=CountingStatus.pending
            )
            db.add(checkout_record)
            db.commit()

    # Notificación de pago
    send_notification(
        db=db,
        user_id=reservation.user_id,
        title="Pago Registrado",
        message=f"Se ha registrado un pago de ${payment.amount:,.0f} COP ({payment.payment_method.value}) para tu reserva #{reservation.id}.",
        notification_type=NotificationType.payment,
        reservation_id=reservation.id,
    )

    data = PaymentResponse.model_validate(payment).model_dump()
    return success_response(data=data, message="Pago confirmado exitosamente")


@router.get("/reservation/{reservation_id}", response_model=dict)
def get_payments_for_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Obtiene los pagos asociados a una reserva."""
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise NotFoundException(f"Reserva con ID {reservation_id} no encontrada")

    if current_user.role == UserRole.guest and reservation.user_id != current_user.id:
        raise ForbiddenException("No tienes permiso para ver los pagos de esta reserva")

    payments = db.query(Payment).filter(Payment.reservation_id == reservation_id).all()
    data = [PaymentResponse.model_validate(p).model_dump() for p in payments]
    
    total_paid = 0.0
    for p in payments:
        if p.status == PaymentStatus.completed:
            rate = getattr(p, "exchange_rate", 1.0)
            total_paid += (p.amount / rate)

    return success_response(
        data={
            "reservation_id": reservation.id,
            "final_total": reservation.final_total,
            "total_paid": total_paid,
            "balance_pending": max(0.0, round(reservation.final_total - total_paid, 2)),
            "payments": data,
        },
        message=f"Se obtuvieron {len(data)} pagos registrados",
    )


@router.patch("/{id}/status", response_model=dict)
def update_payment_status(
    id: int,
    status_in: PaymentStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(UserRole.admin)),
):
    """Modifica el estado de un pago (solo admin)."""
    payment = db.query(Payment).filter(Payment.id == id).first()
    if not payment:
        raise NotFoundException(f"Pago con ID {id} no encontrado")

    payment.status = status_in.status
    if status_in.status == PaymentStatus.completed and not payment.paid_at:
        payment.paid_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(payment)
    data = PaymentResponse.model_validate(payment).model_dump()
    return success_response(data=data, message=f"Estado del pago actualizado a '{status_in.status.value}'")
