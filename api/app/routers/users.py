"""User management router."""

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session
from typing import Optional
from app.dependencies.database import get_db
from app.dependencies.auth import get_current_active_user, require_role
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserUpdate, UserAdminUpdate, StaffCreate
from app.services.auth_service import hash_password
from app.utils.exceptions import NotFoundException, BadRequestException, ForbiddenException, ConflictException
from app.utils.responses import success_response, paginated_response

router = APIRouter(prefix="/users", tags=["Usuarios"])


@router.get("/me", response_model=dict)
def get_current_user_profile(current_user: User = Depends(get_current_active_user)):
    """Obtiene el perfil del usuario autenticado."""
    data = UserResponse.model_validate(current_user).model_dump()
    return success_response(data=data, message="Perfil obtenido correctamente")


@router.put("/me", response_model=dict)
def update_current_user_profile(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Actualiza la información básica del usuario autenticado."""
    if user_in.first_name is not None:
        current_user.first_name = user_in.first_name.strip()
    if user_in.last_name is not None:
        current_user.last_name = user_in.last_name.strip()
    if user_in.phone is not None:
        current_user.phone = user_in.phone.strip()
    if user_in.document_id is not None:
        current_user.document_id = user_in.document_id.strip()

    db.commit()
    db.refresh(current_user)
    data = UserResponse.model_validate(current_user).model_dump()
    return success_response(data=data, message="Perfil actualizado correctamente")


@router.get("/", response_model=dict)
def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    role: Optional[UserRole] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(UserRole.admin)),
):
    """Lista de usuarios del sistema (solo administrador)."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            (User.email.ilike(search_term))
            | (User.first_name.ilike(search_term))
            | (User.last_name.ilike(search_term))
            | (User.document_id.ilike(search_term))
        )

    total = query.count()
    users = query.offset((page - 1) * per_page).limit(per_page).all()
    data = [UserResponse.model_validate(u).model_dump() for u in users]
    return paginated_response(data=data, total=total, page=page, per_page=per_page)


@router.get("/{id}", response_model=dict)
def get_user_by_id(
    id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(UserRole.admin)),
):
    """Obtiene un usuario por ID (solo administrador)."""
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise NotFoundException(f"Usuario con ID {id} no encontrado")
    data = UserResponse.model_validate(user).model_dump()
    return success_response(data=data)


@router.patch("/{id}", response_model=dict)
async def update_user_by_admin(
    id: int,
    user_in: UserAdminUpdate,
    request: Request,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(UserRole.admin)),
):
    """Actualiza datos de un usuario (solo administrador). No permite cambiar el rol."""
    # Detectar intento de cambio de rol en el body crudo
    try:
        raw_body = await request.json()
    except Exception:
        raw_body = {}

    if "role" in raw_body:
        raise BadRequestException(
            "No está permitido cambiar el rol de un usuario desde este endpoint",
            error_code="ROLE_CHANGE_FORBIDDEN",
        )

    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise NotFoundException(f"Usuario con ID {id} no encontrado")

    # No permitir que el admin se desactive a sí mismo
    if user.id == admin_user.id and user_in.is_active is False:
        raise BadRequestException("No puedes desactivar tu propia cuenta de administrador")

    # Aplicar campos presentes
    if user_in.first_name is not None:
        user.first_name = user_in.first_name.strip()
    if user_in.last_name is not None:
        user.last_name = user_in.last_name.strip()
    if user_in.phone is not None:
        user.phone = user_in.phone.strip()
    if user_in.document_id is not None:
        user.document_id = user_in.document_id.strip()
    if user_in.is_active is not None:
        user.is_active = user_in.is_active

    db.commit()
    db.refresh(user)
    data = UserResponse.model_validate(user).model_dump()
    return success_response(data=data, message="Usuario actualizado correctamente")


@router.post("/staff", response_model=dict, status_code=status.HTTP_201_CREATED)
def register_staff(
    staff_in: StaffCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(UserRole.admin)),
):
    """Registra un nuevo empleado con rol staff (solo administrador)."""
    existing = db.query(User).filter(User.email == staff_in.email.lower()).first()
    if existing:
        raise ConflictException("El correo electrónico ya se encuentra registrado")

    new_staff = User(
        email=staff_in.email.lower(),
        hashed_password=hash_password(staff_in.password),
        first_name=staff_in.first_name.strip(),
        last_name=staff_in.last_name.strip(),
        phone=staff_in.phone.strip() if staff_in.phone else None,
        document_id=staff_in.document_id.strip() if staff_in.document_id else None,
        role=UserRole.staff,
        is_active=True,
    )
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)

    data = UserResponse.model_validate(new_staff).model_dump()
    return success_response(data=data, message="Empleado registrado exitosamente como Staff")


@router.delete("/{id}", response_model=dict)
def delete_user(
    id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(UserRole.admin)),
):
    """Desactiva un usuario (soft-delete, solo administrador)."""
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise NotFoundException(f"Usuario con ID {id} no encontrado")

    if user.id == admin_user.id:
        raise BadRequestException("No puedes desactivar tu propia cuenta de administrador")

    user.is_active = False
    db.commit()
    return success_response(message="Usuario desactivado exitosamente")
