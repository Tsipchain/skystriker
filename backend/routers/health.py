"""Health-check endpoint used by Railway / load-balancers."""

from fastapi import APIRouter

from core.config import settings
from schemas.platform import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="healthy",
        service="skystriker-global-guides",
        version=settings.version,
        environment=settings.environment,
    )
