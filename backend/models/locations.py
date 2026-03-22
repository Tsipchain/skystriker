from sqlalchemy import Boolean, Column, Float, String, Text
from sqlalchemy.dialects.postgresql import JSON

from models.base import BaseModel


class PointOfInterest(BaseModel):
    __tablename__ = "points_of_interest"

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)  # monument, museum, temple, beach, restaurant, market
    address = Column(String(500), nullable=True)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    city = Column(String(100), nullable=True, index=True)
    country = Column(String(100), default="Greece", index=True)
    region = Column(String(100), nullable=True)

    opening_hours = Column(JSON, default=dict)
    admission_fee = Column(String(100), nullable=True)
    website = Column(String(500), nullable=True)

    photos = Column(JSON, default=list)
    tags = Column(JSON, default=list)

    is_active = Column(Boolean, default=True)
