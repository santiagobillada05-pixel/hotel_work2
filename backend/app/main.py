"""Main FastAPI application module for HotelWork."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.config import get_settings
from app.database import init_db
from app.utils.exceptions import HotelWorkException
from app.utils.responses import error_response
from app.routers import (
    auth_router,
    users_router,
    rooms_router,
    reservations_router,
    payments_router,
    reports_router,
    notifications_router,
    checkouts_router,
    extras_router,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events for the FastAPI application."""
    print(f"[{settings.APP_NAME}] Initializing database tables...")
    init_db()
    print(f"[{settings.APP_NAME}] Database ready. Application online.")
    yield
    print(f"[{settings.APP_NAME}] Shutting down application gracefully...")


app = FastAPI(
    title=settings.APP_NAME,
    description="Sistema robusto y escalable para la gestión y reserva de habitaciones de hotel.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

from starlette.exceptions import HTTPException as StarletteHTTPException

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Agrega cabeceras HTTP de seguridad para mitigar clickjacking, MIME-sniffing y XSS."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-Debug-Path"] = request.url.path
    response.headers["X-Debug-Raw-Path"] = request.scope.get("raw_path", b"").decode("utf-8", "ignore")
    return response

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
@app.exception_handler(HotelWorkException)
async def hotelwork_exception_handler(request: Request, exc: HotelWorkException):
    """Global exception handler for custom HotelWorkException."""
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response(message=exc.message, error_code=exc.error_code),
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Formats standard HTTPExceptions (like 401 Not Authenticated, 404, etc.) in standard shape."""
    detail_msg = exc.detail if isinstance(exc.detail, str) else "Error en la solicitud"
    if exc.status_code == 401:
        detail_msg = "Tu sesión ha expirado o no has iniciado sesión. Por favor inicia sesión nuevamente."
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response(
            message=detail_msg,
            detail=str(exc.detail),
            error_code=f"HTTP_{exc.status_code}",
        ),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Formats Pydantic validation errors in the standardized response shape."""
    first_error = exc.errors()[0] if exc.errors() else {}
    loc = " -> ".join(str(l) for l in first_error.get("loc", []))
    msg = first_error.get("msg", "Error de validación")
    detail_msg = f"{loc}: {msg}" if loc else msg
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=error_response(
            message="Error de validación en los datos de la reserva",
            detail=detail_msg,
            error_code="VALIDATION_ERROR",
        ),
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Captures unhandled exceptions and returns standardized error response."""
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response(
            message=f"Error en el servidor: {str(exc)}",
            detail=str(exc),
            error_code="INTERNAL_SERVER_ERROR",
        ),
    )


# Register Routers under /api/v1, /v1, and root for maximum proxy/Vercel flexibility
routers = [
    auth_router,
    users_router,
    rooms_router,
    reservations_router,
    payments_router,
    reports_router,
    notifications_router,
    checkouts_router,
    extras_router,
]

for r in routers:
    app.include_router(r, prefix="/api/v1")
    app.include_router(r, prefix="/v1")
    app.include_router(r)


@app.get("/", tags=["General"])
def root_endpoint() -> dict:
    """Root endpoint with API status and documentation link."""
    return {
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
        "redoc": "/redoc",
    }


@app.get("/health", tags=["General"])
def health_check() -> dict:
    """Health check endpoint for monitoring."""
    return {"status": "ok", "app": settings.APP_NAME}
