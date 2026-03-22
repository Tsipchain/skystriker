import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies.auth import get_current_guide
from dependencies.database import get_db
from models.guides import TourGuide
from services.analytics import AnalyticsService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


@router.get("/revenue")
async def revenue(
    days: int = Query(30, ge=1, le=365),
    guide: TourGuide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    svc = AnalyticsService(db)
    return await svc.guide_revenue(guide.id, days)


@router.get("/popular-tours")
async def popular_tours(
    guide: TourGuide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    svc = AnalyticsService(db)
    return await svc.popular_tours(guide.id)


@router.get("/booking-stats")
async def booking_stats(
    guide: TourGuide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    svc = AnalyticsService(db)
    return await svc.booking_stats(guide.id)


@router.get("/ratings")
async def ratings(
    guide: TourGuide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    svc = AnalyticsService(db)
    return await svc.rating_summary(guide.id)
