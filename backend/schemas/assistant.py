from typing import Optional
from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    context: Optional[dict] = None


class SuggestedAction(BaseModel):
    label: str
    action: str
    params: dict = {}


class ChatResponse(BaseModel):
    response: str
    data: Optional[dict] = None
    suggested_actions: list[SuggestedAction] = []
    intent: Optional[str] = None


class GenerateDescriptionRequest(BaseModel):
    category: str
    city: str
    points_of_interest: list[str] = []
    languages: list[str] = ["el", "en"]
    duration_hours: float = 2.0


class DailyBriefing(BaseModel):
    date: str
    bookings_today: list[dict]
    total_participants: int
    revenue_today: float
    pending_reviews: int
    weather: Optional[dict] = None
    tips: list[str] = []
