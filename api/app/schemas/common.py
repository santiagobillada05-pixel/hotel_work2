"""Esquemas compartidos para respuestas estandarizadas."""

from pydantic import BaseModel
from typing import Any, Optional


class PaginationMeta(BaseModel):
    """Metadatos de paginación."""
    page: int
    per_page: int
    total: int
    total_pages: int


class StandardResponse(BaseModel):
    """Respuesta exitosa estandarizada."""
    success: bool = True
    message: str = "Operación exitosa"
    data: Any = None
    meta: Optional[PaginationMeta] = None


class ErrorResponse(BaseModel):
    """Respuesta de error estandarizada."""
    success: bool = False
    message: str
    detail: Optional[str] = None
    error_code: Optional[str] = None
