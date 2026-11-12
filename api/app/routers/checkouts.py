"""Checkouts router for counting and history."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from app.dependencies.database import get_db
from app.dependencies.auth import require_role
from app.models.user import User, UserRole
from app.models.checkout_record import CheckoutRecord, CountingStatus
from app.models.reservation import Reservation, ReservationStatus
from app.schemas.checkout_record import CheckoutRecordResponse, CheckoutRecordStatusUpdate
from app.utils.exceptions import NotFoundException
from app.utils.responses import success_response, paginated_response

router = APIRouter(prefix="/checkouts", tags=["Checkouts"])


@router.get("/", response_model=dict)
def list_checkouts(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    status_filter: Optional[CountingStatus] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    staff_or_admin: User = Depends(require_role(UserRole.admin, UserRole.staff)),
):
    """Obtiene la lista de check-outs pagados (para recepcion y admin). Excluye reservas canceladas."""
    query = (
        db.query(CheckoutRecord)
        .join(Reservation, CheckoutRecord.reservation_id == Reservation.id)
        .filter(Reservation.status != ReservationStatus.cancelled)
    )
    if status_filter:
        query = query.filter(CheckoutRecord.counting_status == status_filter)

    total = query.count()
    checkouts = (
        query.order_by(CheckoutRecord.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    
    data = [CheckoutRecordResponse.model_validate(c).model_dump() for c in checkouts]
    return paginated_response(data=data, total=total, page=page, per_page=per_page)


@router.patch("/{id}/status", response_model=dict)
def update_checkout_status(
    id: int,
    status_update: CheckoutRecordStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(UserRole.admin)),
):
    """Actualiza el estado en el conteo de un registro de check-out (solo admin)."""
    record = db.query(CheckoutRecord).filter(CheckoutRecord.id == id).first()
    if not record:
        raise NotFoundException("Registro de check-out no encontrado")

    record.counting_status = status_update.status
    db.commit()
    db.refresh(record)

    data = CheckoutRecordResponse.model_validate(record).model_dump()
    return success_response(data=data, message="Estado del registro actualizado")


@router.delete("/{id}", response_model=dict)
def delete_checkout_record(
    id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(UserRole.admin)),
):
    """Elimina (marca como removed) un registro del conteo de caja (solo admin)."""
    record = db.query(CheckoutRecord).filter(CheckoutRecord.id == id).first()
    if not record:
        raise NotFoundException("Registro de check-out no encontrado")

    record.counting_status = CountingStatus.removed
    db.commit()
    db.refresh(record)

    data = CheckoutRecordResponse.model_validate(record).model_dump()
    return success_response(data=data, message="Registro eliminado del conteo por el administrador")

