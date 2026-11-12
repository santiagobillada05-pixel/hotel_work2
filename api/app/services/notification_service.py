"""Notification services."""

from sqlalchemy.orm import Session
from typing import Optional, Any
from app.models.notification import Notification

def send_notification(
    db: Session,
    user_id: Any,
    title: str,
    message: str,
    notification_type: str,
    reservation_id: Optional[Any] = None
) -> Notification:
    """Sends a notification to a user and saves it to the database."""
    print(f"[NOTIFICATION] To user {user_id}: {title} - {message}")
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
        reservation_id=reservation_id
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
