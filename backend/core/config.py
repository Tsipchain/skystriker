import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "SkyStriker - Tour Guide Platform"
    debug: bool = False
    version: str = "1.0.0"
    environment: str = "development"

    host: str = "0.0.0.0"
    port: int = 8000

    database_url: str | None = None

    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 1440

    openai_api_key: str = ""

    # Thronos Blockchain
    thronos_node_url: str = "https://node1.thronoschain.org"

    # ether.fi integration for card issuance & liquidity
    etherfi_referral_url: str = "https://www.ether.fi/refer/74df90a0"
    etherfi_api_key: str = ""

    # Platform commission
    platform_commission_pct: float = 20.0  # 20% commission

    # Email
    email_enabled: bool = False
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "noreply@skystriker.app"

    # SMS
    sms_api_key: str = ""

    # Weather API
    weather_api_key: str = ""

    cors_allow_origins: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def backend_url(self) -> str:
        return f"http://{self.host}:{self.port}"


settings = Settings()


def validate_environment():
    import logging
    logger = logging.getLogger(__name__)
    if not settings.database_url:
        logger.warning("DATABASE_URL not set – using in-memory SQLite")
    if settings.jwt_secret_key == "change-me-in-production":
        logger.warning("JWT_SECRET_KEY is using default – change in production")
