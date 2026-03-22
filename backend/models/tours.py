from sqlalchemy import Boolean, Column, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON

from models.base import BaseModel


class Tour(BaseModel):
    __tablename__ = "tours"

    guide_id = Column(String(36), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    short_description = Column(String(500), nullable=True)

    category = Column(String(50), nullable=False, index=True)
    # historical, cultural, adventure, food, nature, nightlife, religious, archaeological

    languages = Column(JSON, default=list)
    duration_hours = Column(Float, default=2.0)
    max_participants = Column(Integer, default=15)
    min_participants = Column(Integer, default=1)

    price_per_person = Column(Float, nullable=False)
    group_price = Column(Float, nullable=True)  # flat price for whole group
    currency = Column(String(3), default="EUR")

    # Meeting point
    meeting_point = Column(String(255), nullable=True)
    meeting_point_lat = Column(Float, nullable=True)
    meeting_point_lng = Column(Float, nullable=True)
    city = Column(String(100), nullable=True, index=True)
    country = Column(String(100), default="Greece", index=True)
    region = Column(String(100), nullable=True)

    # Route with points of interest
    route_points = Column(JSON, default=list)
    # [{name, lat, lng, description, duration_minutes, photos}]

    included_items = Column(JSON, default=list)  # ["Water", "Entry tickets"]
    excluded_items = Column(JSON, default=list)  # ["Lunch", "Transport"]
    what_to_bring = Column(JSON, default=list)  # ["Sunscreen", "Walking shoes"]

    difficulty_level = Column(String(20), default="easy")  # easy, moderate, challenging
    accessibility_info = Column(Text, nullable=True)
    age_restriction = Column(String(50), nullable=True)

    photos = Column(JSON, default=list)
    tags = Column(JSON, default=list)

    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)

    # Schedule
    schedule_type = Column(String(20), default="flexible")  # fixed, flexible
    fixed_schedule = Column(JSON, default=list)  # [{day, time, recurring}]
    cancellation_policy = Column(Text, nullable=True)

    # Stats
    total_bookings = Column(Integer, default=0)
    total_revenue = Column(Float, default=0.0)
    avg_rating = Column(Float, default=0.0)
