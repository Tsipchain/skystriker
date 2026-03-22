import logging
from sqlalchemy.ext.asyncio import AsyncSession
from models.notifications import Notification

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def send_email(self, user_id: str, recipient: str, subject: str, body: str,
                          triggered_by: str | None = None) -> Notification:
        notif = Notification(
            user_id=user_id, type="email", recipient=recipient,
            subject=subject, body=body, status="sent", triggered_by=triggered_by,
        )
        self.db.add(notif)
        await self.db.commit()
        logger.info(f"[EMAIL] To: {recipient}, Subject: {subject}")
        return notif

    async def send_booking_confirmation(self, booking_data: dict) -> Notification:
        body = (
            f"Your booking is confirmed!\n\n"
            f"Tour: {booking_data.get('tour_title', '')}\n"
            f"Date: {booking_data.get('tour_date', '')}\n"
            f"Time: {booking_data.get('tour_time', 'TBD')}\n"
            f"Participants: {booking_data.get('participants', 1)}\n"
            f"Total: {booking_data.get('total_price', 0):.2f} {booking_data.get('currency', 'EUR')}\n"
            f"Confirmation Code: {booking_data.get('confirmation_code', '')}\n\n"
            f"Meeting Point: {booking_data.get('meeting_point', 'TBD')}\n\n"
            f"Enjoy your tour!"
        )
        return await self.send_email(
            booking_data.get("guide_id", "system"),
            booking_data.get("customer_email", ""),
            f"Booking Confirmed - {booking_data.get('tour_title', 'Tour')}",
            body, triggered_by="booking_confirmed",
        )

    async def send_guide_new_booking(self, guide_email: str, booking_data: dict) -> Notification:
        body = (
            f"New booking received!\n\n"
            f"Customer: {booking_data.get('customer_name', '')}\n"
            f"Tour: {booking_data.get('tour_title', '')}\n"
            f"Date: {booking_data.get('tour_date', '')}\n"
            f"Participants: {booking_data.get('participants', 1)}\n"
            f"Your payout: {booking_data.get('guide_payout', 0):.2f} EUR\n"
        )
        return await self.send_email(
            booking_data.get("guide_id", "system"),
            guide_email, f"New Booking - {booking_data.get('tour_title', '')}",
            body, triggered_by="new_booking",
        )
