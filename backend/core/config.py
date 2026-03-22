"""Application settings – loaded from environment / .env file."""

import logging
import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
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
