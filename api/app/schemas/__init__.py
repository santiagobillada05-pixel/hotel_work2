"""Pydantic schemas for request/response validation."""

from app.schemas.common import StandardResponse, ErrorResponse, PaginationMeta
from app.schemas.user import (
    UserCreate, UserLogin, UserUpdate, UserAdminUpdate, StaffCreate,
    UserResponse, TokenResponse, TokenData,
)
from app.schemas.room import (
    RoomCreate, RoomUpdate, RoomStatusUpdate, RoomResponse, RoomSearchParams,
)
from app.schemas.reservation import (
    ReservationCreate, ReservationUpdate, ReservationResponse,
)
from app.schemas.payment import (
    PaymentCreate, PaymentStatusUpdate, PaymentResponse,
)
from app.schemas.notification import NotificationResponse
