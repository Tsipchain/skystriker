import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies.auth import get_current_guide
from dependencies.database import get_db
from models.guides import TourGuide
from models.tours import Tour
from schemas.tours import TourCreate, TourResponse, TourUpdate
from services.tours import TourService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/tours", tags=["tours"])


@router.get("/", response_model=list[TourResponse])
async def list_my_tours(
    guide: TourGuide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Tour).where(Tour.guide_id == guide.id).order_by(Tour.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=TourResponse, status_code=201)
async def create_tour(
    data: TourCreate,
    guide: TourGuide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    tour = Tour(
        guide_id=guide.id,
        **data.model_dump(exclude={"route_points"}),
        route_points=[rp.model_dump() if hasattr(rp, 'model_dump') else rp for rp in data.route_points],
    )
    db.add(tour)
    await db.commit()
    await db.refresh(tour)
    return tour


@router.get("/{tour_id}", response_model=TourResponse)
async def get_tour(
    tour_id: str,
    guide: TourGuide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Tour).where(and_(Tour.id == tour_id, Tour.guide_id == guide.id))
    )
    tour = result.scalar_one_or_none()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    return tour


@router.put("/{tour_id}", response_model=TourResponse)
async def update_tour(
    tour_id: str, data: TourUpdate,
    guide: TourGuide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Tour).where(and_(Tour.id == tour_id, Tour.guide_id == guide.id))
    )
    tour = result.scalar_one_or_none()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(tour, field, value)
    await db.commit()
    await db.refresh(tour)
    return tour


@router.delete("/{tour_id}")
async def delete_tour(
    tour_id: str,
    guide: TourGuide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Tour).where(and_(Tour.id == tour_id, Tour.guide_id == guide.id))
    )
    tour = result.scalar_one_or_none()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    tour.is_active = False
    await db.commit()
    return {"detail": "Tour deactivated"}


@router.post("/{tour_id}/clone", response_model=TourResponse)
async def clone_tour(
    tour_id: str,
    guide: TourGuide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    svc = TourService(db)
    try:
        return await svc.clone_tour(tour_id, guide.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
