from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    tour_id: str
    booking_id: Optional[str] = None
    customer_name: str
    customer_email: str
    rating: int = Field(ge=1, le=5)
    title: Optional[str] = None
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    id: str
    tour_id: str
    guide_id: str
    booking_id: Optional[str] = None
    customer_name: str
    rating: int
    title: Optional[str] = None
    comment: Optional[str] = None
    guide_response: Optional[str] = None
    responded_at: Optional[datetime] = None
    is_verified: bool
    is_published: bool
    created_at: datetime

    class Config:
        from_attributes = True


class GuideResponseRequest(BaseModel):
    response: str
