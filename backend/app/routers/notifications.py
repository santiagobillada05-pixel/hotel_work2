"""Notifications router for guest and staff user alerts."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies.database import get_db
from app.dependencies.auth import get_current_active_user
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse
from app.utils.exceptions import NotFoundException, ForbiddenException
from app.utils.responses import success_response

router = APIRouter(prefix="/notifications", tags=["Notificaciones"])


@router.get("/", response_model=dict)
def get_user_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Obtiene la lista de notificaciones del usuario autenticado."""
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    data = [NotificationResponse.model_validate(n).model_dump() for n in notifications]
    unread_count = sum(1 for n in notifications if not n.is_read)

    return success_response(
        data={"notifications": data, "unread_count": unread_count},
        message=f"{len(data)} notificaciones obtenidas",
    )


@router.patch("/read-all", response_model=dict)
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Marca todas las notificaciones no leídas del usuario autenticado como leídas."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()

    return success_response(data={"unread_count": 0}, message="Todas las notificaciones marcadas como leídas")


@router.patch("/{id}/read", response_model=dict)
def mark_notification_as_read(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Marca una notificación como leída."""
    notification = db.query(Notification).filter(Notification.id == id).first()
    if not notification:
        raise NotFoundException(f"Notificación con ID {id} no encontrada")

    if notification.user_id != current_user.id:
        raise ForbiddenException("No tienes permiso para modificar esta notificación")

    notification.is_read = True
    db.commit()
    db.refresh(notification)

    data = NotificationResponse.model_validate(notification).model_dump()
    return success_response(data=data, message="Notificación marcada como leída")
