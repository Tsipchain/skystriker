import logging
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies.auth import get_current_guide
from dependencies.database import get_db
from models.guides import TourGuide
from schemas.guides import GuideResponse, GuideUpdate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/guides", tags=["guides"])


@router.get("/me", response_model=GuideResponse)
async def get_my_profile(guide: TourGuide = Depends(get_current_guide)):
    return guide


@router.put("/me", response_model=GuideResponse)
async def update_my_profile(
    data: GuideUpdate,
    guide: TourGuide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(guide, field, value)
    guide.last_active_at = datetime.utcnow()
    await db.commit()
    await db.refresh(guide)
    return guide
