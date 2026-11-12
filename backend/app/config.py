"""Application configuration settings."""

import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

_BACKEND_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    """Configuration settings for HotelWork backend."""
    APP_NAME: str = "HotelWork"
    DEBUG: bool = False
    DATABASE_URL: str = "postgresql://postgres.cgsaxlgifvlozglwnfsz:Luissan.ti0820@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
    SECRET_KEY: str = "hotelwork-super-secret-jwt-key-2025-change-in-production-secure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    TAX_RATE: float = 0.19
    DEFAULT_DISCOUNT_RATE: float = 0.0
    CORS_ORIGINS: str = "http://localhost:5173"
    DEFAULT_ADMIN_EMAIL: str = "agudelosantiago.inedan@gmail.com"
    DEFAULT_ADMIN_PASSWORD: str = "Luissanti0820"

    model_config = SettingsConfigDict(
        env_file=(".env", str(_BACKEND_DIR / ".env")),
        env_file_encoding='utf-8',
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> list[str]:
        """Returns CORS origins as a list."""
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        dev_defaults = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:80", "http://localhost"]
        for dev in dev_defaults:
            if dev not in origins:
                origins.append(dev)
        return origins

@lru_cache
def get_settings() -> Settings:
    """Gets the application settings."""
    return Settings()
