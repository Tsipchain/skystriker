from sqlalchemy import Column, String, Text
from sqlalchemy.dialects.postgresql import JSON

from models.base import BaseModel


class Notification(BaseModel):
    __tablename__ = "notifications"

    user_id = Column(String(36), nullable=False, index=True)
    type = Column(String(20), nullable=False)  # email, sms, push
    recipient = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=True)
    body = Column(Text, nullable=False)
    status = Column(String(20), default="pending")
    triggered_by = Column(String(100), nullable=True)
    reference_id = Column(String(36), nullable=True)
    metadata = Column(JSON, default=dict)
