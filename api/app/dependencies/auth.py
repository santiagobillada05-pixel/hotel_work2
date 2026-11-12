"""Authentication dependencies."""

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Callable, Any
from app.dependencies.database import get_db
from app.services.auth_service import decode_token
from app.models.user import User
from app.utils.exceptions import UnauthorizedException, ForbiddenException

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Gets the current user from the token."""
    try:
        payload = decode_token(token)
        user_id: Any = payload.get("sub")
        if user_id is None:
            raise UnauthorizedException("Could not validate credentials")
    except Exception:
        raise UnauthorizedException("Could not validate credentials")
    
    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        raise UnauthorizedException("Could not validate credentials")

    user = db.query(User).filter(User.id == user_id_int).first()
    if user is None:
        raise UnauthorizedException("User not found")
    if not user.is_active:
        raise UnauthorizedException("Inactive user")
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Ensures the current user is active."""
    if not current_user.is_active:
        raise UnauthorizedException("Inactive user")
    return current_user

def require_role(*roles: Any) -> Callable:
    """Dependency factory for checking user roles."""
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        allowed = [r.value if hasattr(r, "value") else str(r) for r in roles]
        if user_role not in allowed:
            raise ForbiddenException("Not enough permissions")
        return current_user
    return role_checker
