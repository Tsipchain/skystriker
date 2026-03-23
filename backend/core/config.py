"""Application settings – loaded from environment / .env file."""

import logging
import os

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    @field_validator("jwt_expire_minutes", "port", mode="before")
    @classmethod
    def _strip_quoted_int(cls, v):
        if isinstance(v, str):
            return int(v.strip().strip('"').strip("'"))
        return v
    app_name: str = "Thronos Chain SkyStriker Global Guides"
    debug: bool = False
    version: str = "2.0.0"
    environment: str = "development"

    host: str = "0.0.0.0"
    port: int = 8000
    frontend_url: str = "http://localhost:5173"

    database_url: str | None = None

    # Verification provider
    verifyid_base_url: str = "https://verifyid.thronos.example/api"
    verifyid_provider_label: str = "VerifyID"

    # Auth / JWT
    jwt_secret: str = "skystriker-dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""

    # Demo bootstrap
    seed_demo_data: bool = True
    default_country_code: str = "gr"

    cors_allow_origins: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()


def validate_environment():
    logger = logging.getLogger(__name__)
    if not settings.database_url:
        logger.warning("DATABASE_URL not set – using in-memory SQLite")
