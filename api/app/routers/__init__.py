"""API routers package."""

from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.rooms import router as rooms_router
from app.routers.reservations import router as reservations_router
from app.routers.payments import router as payments_router
from app.routers.reports import router as reports_router
from app.routers.notifications import router as notifications_router
from app.routers.checkouts import router as checkouts_router
from app.routers.extras import router as extras_router

__all__ = [
    "auth_router",
    "users_router",
    "rooms_router",
    "reservations_router",
    "payments_router",
    "reports_router",
    "notifications_router",
    "checkouts_router",
    "extras_router",
]
