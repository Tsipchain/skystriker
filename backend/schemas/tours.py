from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class RoutePoint(BaseModel):
    name: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    description: Optional[str] = None
    duration_minutes: int = 15
    photos: list[str] = []


class TourCreate(BaseModel):
    title: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    category: str  # historical, cultural, adventure, food, nature, nightlife, religious, archaeological
    languages: list[str] = ["el", "en"]
    duration_hours: float = 2.0
    max_participants: int = 15
    min_participants: int = 1
    price_per_person: float
    group_price: Optional[float] = None
    currency: str = "EUR"
    meeting_point: Optional[str] = None
    meeting_point_lat: Optional[float] = None
    meeting_point_lng: Optional[float] = None
    city: Optional[str] = None
    country: str = "Greece"
    region: Optional[str] = None
    route_points: list[RoutePoint] = []
    included_items: list[str] = []
    excluded_items: list[str] = []
    what_to_bring: list[str] = []
    difficulty_level: str = "easy"
    accessibility_info: Optional[str] = None
    age_restriction: Optional[str] = None
    photos: list[str] = []
    tags: list[str] = []
    schedule_type: str = "flexible"
    fixed_schedule: list[dict] = []
    cancellation_policy: Optional[str] = None


class TourUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    category: Optional[str] = None
    languages: Optional[list[str]] = None
    duration_hours: Optional[float] = None
    max_participants: Optional[int] = None
    price_per_person: Optional[float] = None
    group_price: Optional[float] = None
    meeting_point: Optional[str] = None
    meeting_point_lat: Optional[float] = None
    meeting_point_lng: Optional[float] = None
    city: Optional[str] = None
    route_points: Optional[list[dict]] = None
    included_items: Optional[list[str]] = None
    excluded_items: Optional[list[str]] = None
    what_to_bring: Optional[list[str]] = None
    difficulty_level: Optional[str] = None
    photos: Optional[list[str]] = None
    tags: Optional[list[str]] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    cancellation_policy: Optional[str] = None


class TourResponse(BaseModel):
    id: str
    guide_id: str
    title: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    category: str
    languages: list = []
    duration_hours: float
    max_participants: int
    min_participants: int
    price_per_person: float
    group_price: Optional[float] = None
    currency: str
    meeting_point: Optional[str] = None
    meeting_point_lat: Optional[float] = None
    meeting_point_lng: Optional[float] = None
    city: Optional[str] = None
    country: str
    region: Optional[str] = None
    route_points: list = []
    included_items: list = []
    excluded_items: list = []
    what_to_bring: list = []
    difficulty_level: str
    accessibility_info: Optional[str] = None
    age_restriction: Optional[str] = None
    photos: list = []
    tags: list = []
    is_active: bool
    is_featured: bool
    total_bookings: int
    avg_rating: float
    created_at: datetime

    class Config:
        from_attributes = True
