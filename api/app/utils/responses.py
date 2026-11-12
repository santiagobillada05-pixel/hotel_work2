"""Response formatters and helpers."""

from typing import Any, Optional

def success_response(data: Any, message: str = "Operación exitosa", meta: Optional[dict] = None) -> dict:
    """Formats a successful response."""
    response = {
        "success": True,
        "message": message,
        "data": data
    }
    if meta is not None:
        response["meta"] = meta
    return response

def error_response(message: str, detail: Any = None, error_code: Optional[str] = None) -> dict:
    """Formats an error response."""
    response = {
        "success": False,
        "message": message,
    }
    if detail is not None:
        response["detail"] = detail
    if error_code is not None:
        response["error_code"] = error_code
    return response

def paginated_response(data: list[Any], total: int, page: int, per_page: int) -> dict:
    """Formats a paginated successful response."""
    return success_response(
        data=data,
        meta={
            "total": total,
            "page": page,
            "per_page": per_page
        }
    )
