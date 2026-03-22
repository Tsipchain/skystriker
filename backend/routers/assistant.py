import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies.auth import get_current_guide
from dependencies.database import get_db
from models.guides import TourGuide
from schemas.assistant import ChatRequest, ChatResponse, DailyBriefing
from services.ai_assistant import SkyStrikerAssistant

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/assistant", tags=["assistant"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    guide: TourGuide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    assistant = SkyStrikerAssistant(db)
    result = await assistant.process_message(guide.id, request.message, request.context)
    return ChatResponse(**result)


@router.get("/daily-briefing", response_model=DailyBriefing)
async def daily_briefing(
    guide: TourGuide = Depends(get_current_guide),
    db: AsyncSession = Depends(get_db),
):
    assistant = SkyStrikerAssistant(db)
    return await assistant.daily_briefing(guide.id)
