"""Esquemas Pydantic para usuarios y autenticación."""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """Roles de usuario (mirror del modelo ORM)."""
    guest = "guest"
    staff = "staff"
    admin = "admin"


# ── Request Schemas ──────────────────────────────────────────────

class UserCreate(BaseModel):
    """Esquema para registro de nuevo usuario."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128, description="Contraseña del usuario")
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    document_id: Optional[str] = Field(None, max_length=50, description="Cédula o pasaporte")
    accepted_terms: bool = Field(default=True, description="Aceptación obligatoria de términos y condiciones")


class UserLogin(BaseModel):
    """Esquema para inicio de sesión."""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Esquema para actualización de perfil."""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    document_id: Optional[str] = Field(None, max_length=50)


class UserAdminUpdate(BaseModel):
    """Esquema para que admin edite un usuario (sin rol)."""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    document_id: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


class StaffCreate(BaseModel):
    """Esquema para que admin registre un empleado (staff)."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128, description="Contraseña del empleado")
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    document_id: Optional[str] = Field(None, max_length=50)


# ── Response Schemas ─────────────────────────────────────────────

class UserResponse(BaseModel):
    """Esquema de respuesta para datos de usuario."""
    id: int
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    document_id: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """Esquema de respuesta para tokens JWT."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Datos decodificados del token JWT."""
    user_id: Optional[int] = None
    role: Optional[str] = None
