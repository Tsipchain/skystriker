from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text

from models.base import BaseModel


class Review(BaseModel):
    __tablename__ = "reviews"

    tour_id = Column(String(36), nullable=False, index=True)
    guide_id = Column(String(36), nullable=False, index=True)
    booking_id = Column(String(36), nullable=True, unique=True)

    customer_name = Column(String(255), nullable=False)
    customer_email = Column(String(255), nullable=False)

    rating = Column(Integer, nullable=False)  # 1-5
    title = Column(String(255), nullable=True)
    comment = Column(Text, nullable=True)

    guide_response = Column(Text, nullable=True)
    responded_at = Column(DateTime, nullable=True)

    is_verified = Column(Boolean, default=False)  # linked to actual booking
    is_published = Column(Boolean, default=True)
