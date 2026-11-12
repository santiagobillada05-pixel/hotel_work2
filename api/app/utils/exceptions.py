"""Custom exceptions for the application."""

from typing import Optional

class HotelWorkException(Exception):
    """Base exception for HotelWork application."""
    def __init__(self, message: str, status_code: int = 500, error_code: Optional[str] = None):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(self.message)

class NotFoundException(HotelWorkException):
    """Exception raised when a resource is not found."""
    def __init__(self, message: str = "Not Found", error_code: Optional[str] = None):
        super().__init__(message, 404, error_code)

class BadRequestException(HotelWorkException):
    """Exception raised for bad requests."""
    def __init__(self, message: str = "Bad Request", error_code: Optional[str] = None):
        super().__init__(message, 400, error_code)

class UnauthorizedException(HotelWorkException):
    """Exception raised when authentication fails or is missing."""
    def __init__(self, message: str = "Unauthorized", error_code: Optional[str] = None):
        super().__init__(message, 401, error_code)

class ForbiddenException(HotelWorkException):
    """Exception raised when a user does not have permission."""
    def __init__(self, message: str = "Forbidden", error_code: Optional[str] = None):
        super().__init__(message, 403, error_code)

class ConflictException(HotelWorkException):
    """Exception raised when a resource already exists or conflicts."""
    def __init__(self, message: str = "Conflict", error_code: Optional[str] = None):
        super().__init__(message, 409, error_code)
