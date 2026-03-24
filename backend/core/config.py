"""Application settings – loaded from environment / .env file."""

import logging
import os

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    @field_validator("jwt_expire_minutes", "port", mode="before")
    @classmethod
    def _strip_quoted_int(cls, v):
        if isinstance(v, str):
            return int(v.strip().strip('"').strip("'"))
        return v

    @field_validator("jwt_secret", mode="before")
    @classmethod
    def _strip_quoted_str(cls, v):
        if isinstance(v, str):
            return v.strip().strip('"').strip("'")
        return v

    app_name: str = "Thronos Chain SkyStriker Global Guides"
    debug: bool = False
    version: str = "2.0.0"
    environment: str = "development"

    host: str = "0.0.0.0"
    port: int = 8000
    frontend_url: str = "http://localhost:5173"

    database_url: str | None = None

    # Verification provider (VerifyID SaaS platform)
    verifyid_base_url: str = "https://verifyid.thronos.example/api"
    verifyid_api_url: str = ""        # e.g. https://thronos-verifyid.vercel.app
    verifyid_internal_key: str = ""   # shared key for cross-service auth
    verifyid_provider_label: str = "VerifyID"

    # Auth / JWT  (accepts JWT_SECRET or JWT_SECRET_KEY env var)
    jwt_secret: str = Field(
        default="skystriker-dev-secret-change-in-production",
        validation_alias=AliasChoices("jwt_secret", "jwt_secret_key"),
    )
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440  # 24 hours

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""

    # Demo bootstrap
    seed_demo_data: bool = True
    default_country_code: str = "gr"

    # Platform commission (0.22 = 22%)
    platform_commission_rate: float = 0.22

    # Admin account (must be set via environment variables)
    admin_email: str = "admin@thronoschain.org"
    admin_password: str = ""
    admin_token: str = ""

    # Thronos blockchain nodes
    thronos_node1_url: str = "https://thrchain.up.railway.app"
    thronos_node2_url: str = "https://node-2.up.railway.app"
    thronos_admin_secret: str = ""

    # Ether.fi debit card referral
    etherfi_referral_url: str = "https://app.ether.fi/card"

    cors_allow_origins: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()


def validate_environment():
    logger = logging.getLogger(__name__)
    if not settings.database_url:
        logger.warning("DATABASE_URL not set – using in-memory SQLite")
