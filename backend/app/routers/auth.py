"""Authentication router for register, login and refresh token."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.dependencies.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.utils.exceptions import BadRequestException, UnauthorizedException, ConflictException
from app.utils.responses import success_response

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    if not user_in.accepted_terms:
        raise BadRequestException("Debe aceptar los términos y condiciones para registrar la cuenta")

    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise ConflictException("El correo electrónico ya se encuentra registrado")

    new_user = User(
        email=user_in.email.lower(),
        hashed_password=hash_password(user_in.password),
        first_name=user_in.first_name.strip(),
        last_name=user_in.last_name.strip(),
        phone=user_in.phone.strip() if user_in.phone else None,
        document_id=user_in.document_id.strip() if user_in.document_id else None,
        role=UserRole.guest,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    user_data = UserResponse.model_validate(new_user).model_dump()
    return success_response(data=user_data, message="Usuario registrado exitosamente")


@router.post("/login", response_model=dict)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Inicia sesión y genera tokens JWT."""
    user = db.query(User).filter(User.email == credentials.email.lower()).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise UnauthorizedException("Credenciales inválidas. Verifique correo o contraseña")

    if not user.is_active:
        raise UnauthorizedException("La cuenta de usuario está desactivada")

    role_str = user.role.value if hasattr(user.role, "value") else str(user.role)
    token_payload = {"sub": str(user.id), "role": role_str, "email": user.email}
    
    access_token = create_access_token(data=token_payload)
    refresh_token = create_refresh_token(data=token_payload)

    return success_response(
        data={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": UserResponse.model_validate(user).model_dump(),
        },
        message="Inicio de sesión exitoso",
    )


@router.post("/refresh", response_model=dict)
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    """Renueva el token de acceso usando el token de refresco."""
    try:
        payload = decode_token(refresh_token)
        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedException("Token de refresco inválido")
    except Exception:
        raise UnauthorizedException("Token de refresco inválido o expirado")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise UnauthorizedException("Usuario no encontrado o inactivo")

    role_str = user.role.value if hasattr(user.role, "value") else str(user.role)
    token_payload = {"sub": str(user.id), "role": role_str, "email": user.email}
    new_access_token = create_access_token(data=token_payload)

    return success_response(
        data={"access_token": new_access_token, "token_type": "bearer"},
        message="Token renovado exitosamente",
    )
