import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies.auth import get_current_guide
from dependencies.database import get_db
from models.bookings import Booking
from models.guides import TourGuide
from models.reviews import Review
from models.tours import Tour
from schemas.reviews import ReviewCreate, ReviewResponse, GuideResponseRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/reviews", tags=["reviews"])


@router.get("/", response_model=list[ReviewResponse])
async def list_my_reviews(
    pending_only: bool = False,
    guide: TourGuide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    query = select(Review).where(Review.guide_id == guide.id)
    if pending_only:
        query = query.where(Review.guide_response == None)
    query = query.order_by(Review.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=ReviewResponse, status_code=201)
async def create_review(data: ReviewCreate, db: AsyncSession = Depends(get_db)):
    """Public endpoint - customers leave reviews."""
    tour_result = await db.execute(select(Tour).where(Tour.id == data.tour_id))
    tour = tour_result.scalar_one_or_none()
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")

    is_verified = False
    if data.booking_id:
        booking_result = await db.execute(
            select(Booking).where(and_(Booking.id == data.booking_id, Booking.status == "completed"))
        )
        is_verified = booking_result.scalar_one_or_none() is not None

    review = Review(
        tour_id=data.tour_id,
        guide_id=tour.guide_id,
        booking_id=data.booking_id,
        customer_name=data.customer_name,
        customer_email=data.customer_email,
        rating=data.rating,
        title=data.title,
        comment=data.comment,
        is_verified=is_verified,
    )
    db.add(review)

    # Update tour and guide ratings
    all_reviews = await db.execute(
        select(Review.rating).where(and_(Review.tour_id == data.tour_id, Review.is_published == True))
    )
    ratings = [r for (r,) in all_reviews.all()] + [data.rating]
    tour.avg_rating = sum(ratings) / len(ratings)

    guide_result = await db.execute(select(TourGuide).where(TourGuide.id == tour.guide_id))
    guide = guide_result.scalar_one_or_none()
    if guide:
        guide.total_reviews += 1
        all_guide_reviews = await db.execute(
            select(Review.rating).where(and_(Review.guide_id == guide.id, Review.is_published == True))
        )
        all_ratings = [r for (r,) in all_guide_reviews.all()] + [data.rating]
        guide.rating = sum(all_ratings) / len(all_ratings)

    await db.commit()
    await db.refresh(review)
    return review


@router.post("/{review_id}/respond", response_model=ReviewResponse)
async def respond_to_review(
    review_id: str,
    data: GuideResponseRequest,
    guide: TourGuide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Review).where(and_(Review.id == review_id, Review.guide_id == guide.id))
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.guide_response = data.response
    review.responded_at = datetime.utcnow()
    await db.commit()
    await db.refresh(review)
    return review
