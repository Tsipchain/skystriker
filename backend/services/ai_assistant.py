"""SkyStriker AI Assistant - Helps tour guides manage their business."""
import logging
import re
from datetime import datetime, timedelta

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models.bookings import Booking
from models.guides import TourGuide
from models.reviews import Review
from models.tours import Tour
from services.analytics import AnalyticsService
from services.weather import WeatherService

logger = logging.getLogger(__name__)

INTENT_MAP = {
    "bookings_today": [
        "κρατήσεις", "κρατησεις", "bookings", "σήμερα", "σημερα", "today",
        "αύριο", "αυριο", "tomorrow", "schedule", "πρόγραμμα",
    ],
    "earnings": [
        "έβγαλα", "εβγαλα", "earnings", "revenue", "πόσα", "ποσα",
        "income", "εισόδημα", "εισοδημα", "money", "λεφτά",
    ],
    "reviews": [
        "κριτικές", "κριτικες", "reviews", "απαντήσω", "απαντησω",
        "respond", "feedback", "αξιολόγηση",
    ],
    "weather": [
        "καιρό", "καιρο", "weather", "βροχή", "βροχη", "ήλιος",
        "temperature", "θερμοκρασία",
    ],
    "generate_description": [
        "περιγραφή", "περιγραφη", "description", "γράψε", "γραψε",
        "write", "generate", "δημιουργ",
    ],
    "popular_tours": [
        "δημοφιλ", "popular", "top", "best", "καλύτερ", "καλυτερ",
    ],
    "stats": [
        "στατιστικά", "στατιστικα", "stats", "analytics", "απόδοση",
        "performance",
    ],
    "help": [
        "βοήθεια", "βοηθεια", "help", "τι μπορείς", "commands", "εντολές",
    ],
}


class SkyStrikerAssistant:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.analytics = AnalyticsService(db)

    async def process_message(self, guide_id: str, message: str, context: dict | None = None) -> dict:
        msg_lower = message.lower().strip()
        intent = self._detect_intent(msg_lower)
        logger.info(f"[SkyStriker AI] guide={guide_id} intent={intent}")

        try:
            handler = getattr(self, f"_handle_{intent}", None)
            if handler:
                return await handler(guide_id, message, context)
            return self._help_response()
        except Exception as e:
            logger.error(f"Assistant error: {e}", exc_info=True)
            return {"response": f"Σφάλμα: {e}", "data": None, "suggested_actions": [], "intent": intent}

    def _detect_intent(self, message: str) -> str:
        best, best_score = "help", 0
        for intent, keywords in INTENT_MAP.items():
            score = sum(1 for kw in keywords if kw in message)
            if score > best_score:
                best_score = score
                best = intent
        return best

    async def _handle_bookings_today(self, guide_id: str, message: str, ctx: dict | None) -> dict:
        is_tomorrow = any(w in message.lower() for w in ["αύριο", "αυριο", "tomorrow"])
        target_date = datetime.utcnow().date() + timedelta(days=1 if is_tomorrow else 0)
        day_start = datetime.combine(target_date, datetime.min.time())
        day_end = datetime.combine(target_date, datetime.max.time())

        result = await self.db.execute(
            select(Booking).where(
                and_(Booking.guide_id == guide_id, Booking.tour_date >= day_start,
                     Booking.tour_date <= day_end, Booking.status.in_(["pending", "confirmed"]))
            ).order_by(Booking.tour_date)
        )
        bookings = result.scalars().all()
        total_participants = sum(b.participants_count for b in bookings)
        total_revenue = sum(b.guide_payout for b in bookings)

        day_label = "Αύριο" if is_tomorrow else "Σήμερα"
        if not bookings:
            return {"response": f"{day_label} δεν έχεις κρατήσεις.", "data": {"bookings": []},
                    "suggested_actions": [], "intent": "bookings_today"}

        lines = []
        for b in bookings:
            tour_result = await self.db.execute(select(Tour.title).where(Tour.id == b.tour_id))
            title = tour_result.scalar() or "Tour"
            lines.append(
                f"- {b.tour_time or 'TBD'} | {title} | {b.participants_count} άτομα | "
                f"{b.customer_name} | {b.total_price:.0f}€"
            )

        return {
            "response": (
                f"📅 {day_label} ({target_date.strftime('%d/%m/%Y')}):\n"
                f"{len(bookings)} κρατήσεις, {total_participants} άτομα, {total_revenue:.2f}€\n\n"
                + "\n".join(lines)
            ),
            "data": {"date": str(target_date), "count": len(bookings),
                     "participants": total_participants, "revenue": total_revenue},
            "suggested_actions": [
                {"label": "Weather", "action": "weather", "params": {}},
            ],
            "intent": "bookings_today",
        }

    async def _handle_earnings(self, guide_id: str, message: str, ctx: dict | None) -> dict:
        days = 30
        if "εβδομάδα" in message or "week" in message:
            days = 7
        elif "σήμερα" in message or "today" in message:
            days = 1
        elif "χρόνο" in message or "year" in message:
            days = 365

        stats = await self.analytics.guide_revenue(guide_id, days)
        return {
            "response": (
                f"💰 Έσοδα ({days} ημέρες):\n"
                f"Κρατήσεις: {stats['total_bookings']}\n"
                f"Καθαρά: €{stats['total_earnings']:.2f}\n"
                f"Ακαθάριστα: €{stats['gross_revenue']:.2f}\n"
                f"Προμήθεια SkyStriker: €{stats['platform_commission']:.2f}\n"
                f"Μ.Ο./κράτηση: €{stats['avg_per_booking']:.2f}\n"
                f"Συμμετέχοντες: {stats['total_participants']}"
            ),
            "data": stats,
            "suggested_actions": [
                {"label": "Popular tours", "action": "popular_tours", "params": {}},
            ],
            "intent": "earnings",
        }

    async def _handle_reviews(self, guide_id: str, message: str, ctx: dict | None) -> dict:
        pending = await self.analytics.pending_reviews(guide_id)
        rating_info = await self.analytics.rating_summary(guide_id)

        if not pending:
            return {
                "response": f"Δεν έχεις κριτικές χωρίς απάντηση! Rating: {rating_info['avg_rating']}/5 ({rating_info['total_reviews']} reviews)",
                "data": rating_info, "suggested_actions": [], "intent": "reviews",
            }

        lines = [f"- ⭐{r['rating']} | {r['customer']} | \"{(r['comment'] or '')[:60]}\"" for r in pending[:5]]
        return {
            "response": (
                f"📝 {len(pending)} κριτικές χωρίς απάντηση:\n" + "\n".join(lines)
                + f"\n\nΣυνολικό rating: {rating_info['avg_rating']}/5"
            ),
            "data": {"pending": pending, "rating": rating_info},
            "suggested_actions": [
                {"label": "Respond to reviews", "action": "respond_reviews", "params": {}},
            ],
            "intent": "reviews",
        }

    async def _handle_weather(self, guide_id: str, message: str, ctx: dict | None) -> dict:
        guide_result = await self.db.execute(select(TourGuide).where(TourGuide.id == guide_id))
        guide = guide_result.scalar_one_or_none()
        city = guide.location_city if guide else "Athens"

        # Extract city from message if mentioned
        cities = ["αθήνα", "athens", "θεσσαλονίκη", "thessaloniki", "κρήτη", "crete",
                  "σαντορίνη", "santorini", "μύκονος", "mykonos", "ρόδος", "rhodes"]
        for c in cities:
            if c in message.lower():
                city = c.title()
                break

        weather = await WeatherService.get_forecast(city)
        indoor = WeatherService.suggest_indoor_alternatives(weather)

        response = (
            f"🌤 Καιρός στην {city}:\n"
            f"Θερμοκρασία: {weather.get('temperature', 'N/A')}°C\n"
            f"Κατάσταση: {weather.get('description', 'N/A')}\n"
            f"Υγρασία: {weather.get('humidity', 'N/A')}%\n"
            f"Άνεμος: {weather.get('wind_speed', 'N/A')} m/s\n"
        )
        if weather.get("recommendation"):
            response += f"\n💡 {weather['recommendation']}"
        if indoor:
            response += f"\n\n🏠 Εναλλακτικές: {', '.join(indoor)}"

        return {"response": response, "data": weather, "suggested_actions": [], "intent": "weather"}

    async def _handle_generate_description(self, guide_id: str, message: str, ctx: dict | None) -> dict:
        # Parse what kind of tour description they want
        categories = {
            "food": "γαστρονομική", "archaeological": "αρχαιολογική", "cultural": "πολιτιστική",
            "historical": "ιστορική", "nature": "φύση", "nightlife": "νυχτερινή",
        }
        detected_cat = "cultural"
        for eng, gr in categories.items():
            if eng in message.lower() or gr in message.lower():
                detected_cat = eng
                break

        descriptions = {
            "food": "Ανακαλύψτε τις γεύσεις της Ελλάδας σε μια μοναδική γαστρονομική περιήγηση! Θα επισκεφτούμε τοπικές αγορές, παραδοσιακά ταβερνάκια και κρυφά στέκια που μόνο οι ντόπιοι γνωρίζουν. Δοκιμάστε φρέσκα τυριά, ελιές, μεζέδες και γλυκά ενώ μαθαίνετε την ιστορία πίσω από κάθε πιάτο.",
            "archaeological": "Ταξιδέψτε πίσω στο χρόνο με μια συναρπαστική ξενάγηση σε αρχαιολογικούς χώρους. Ζωντανέψτε τους μύθους της αρχαίας Ελλάδας καθώς περπατάτε ανάμεσα σε ναούς, αγορές και θέατρα χιλιάδων ετών. Ο ξεναγός σας θα σας μεταφέρει στην εποχή του Περικλή.",
            "cultural": "Βυθιστείτε στον πολιτισμό της σύγχρονης Ελλάδας! Από τη street art μέχρι τα παραδοσιακά εργαστήρια, ανακαλύψτε πώς η αρχαία κληρονομιά συναντά τη μοντέρνα δημιουργικότητα. Μουσεία, γκαλερί, τοπική τέχνη και ζωντανές γειτονιές.",
            "historical": "Ακολουθήστε τα βήματα της ιστορίας σε μια ξενάγηση που καλύπτει χιλιετίες ελληνικού πολιτισμού. Από την αρχαιότητα στο Βυζάντιο και από την Οθωμανική περίοδο στη σύγχρονη Ελλάδα.",
            "nature": "Εξερευνήστε τα φυσικά τοπία της Ελλάδας! Μονοπάτια, φαράγγια, σπηλιές και κρυστάλλινες παραλίες σας περιμένουν. Μια εμπειρία για λάτρεις της φύσης.",
            "nightlife": "Ανακαλύψτε τη νυχτερινή ζωή με τοπικό guide! Cocktail bars, live μουσική, ταράτσες με θέα και τα καλύτερα spots που μόνο οι ντόπιοι ξέρουν.",
        }

        desc = descriptions.get(detected_cat, descriptions["cultural"])
        return {
            "response": f"📝 Ετοιμη περιγραφή ({detected_cat} tour):\n\n{desc}\n\nΜπορείς να την τροποποιήσεις ή να ζητήσεις σε άλλη γλώσσα.",
            "data": {"description": desc, "category": detected_cat},
            "suggested_actions": [
                {"label": "Translate to EN", "action": "translate", "params": {"lang": "en"}},
            ],
            "intent": "generate_description",
        }

    async def _handle_popular_tours(self, guide_id: str, message: str, ctx: dict | None) -> dict:
        tours = await self.analytics.popular_tours(guide_id)
        if not tours:
            return {"response": "Δεν υπάρχουν tours ακόμα.", "data": {"tours": []},
                    "suggested_actions": [], "intent": "popular_tours"}
        lines = [f"- {t['title']} ({t['city']}): {t['bookings']} κρατήσεις, ⭐{t['rating']}, €{t['revenue']}" for t in tours]
        return {
            "response": "🏆 Δημοφιλέστερα tours:\n" + "\n".join(lines),
            "data": {"tours": tours},
            "suggested_actions": [], "intent": "popular_tours",
        }

    async def _handle_stats(self, guide_id: str, message: str, ctx: dict | None) -> dict:
        revenue = await self.analytics.guide_revenue(guide_id, 30)
        rating = await self.analytics.rating_summary(guide_id)
        booking_stats = await self.analytics.booking_stats(guide_id)
        return {
            "response": (
                f"📊 Στατιστικά (30 ημέρες):\n"
                f"Κρατήσεις: {revenue['total_bookings']}\n"
                f"Έσοδα: €{revenue['total_earnings']:.2f}\n"
                f"Rating: {rating['avg_rating']}/5 ({rating['total_reviews']} reviews)\n"
                f"Κατάσταση κρατήσεων: {booking_stats}"
            ),
            "data": {"revenue": revenue, "rating": rating, "bookings": booking_stats},
            "suggested_actions": [], "intent": "stats",
        }

    def _help_response(self) -> dict:
        return {
            "response": (
                "Γεια! Είμαι ο SkyStriker Assistant. Μπορώ να σε βοηθήσω με:\n\n"
                "📅 'Τι κρατήσεις έχω αύριο;'\n"
                "💰 'Πόσα έβγαλα αυτόν τον μήνα;'\n"
                "📝 'Ποιες κριτικές πρέπει να απαντήσω;'\n"
                "🌤 'Τι καιρό θα κάνει αύριο στην Αθήνα;'\n"
                "✏️ 'Γράψε μια περιγραφή για food tour'\n"
                "🏆 'Ποια tours μου πάνε καλύτερα;'\n"
                "📊 'Δείξε μου στατιστικά'"
            ),
            "data": None,
            "suggested_actions": [
                {"label": "Bookings today", "action": "bookings_today", "params": {}},
                {"label": "Earnings", "action": "earnings", "params": {}},
                {"label": "Reviews", "action": "reviews", "params": {}},
            ],
            "intent": "help",
        }

    async def daily_briefing(self, guide_id: str) -> dict:
        today = datetime.utcnow().date()
        day_start = datetime.combine(today, datetime.min.time())
        day_end = datetime.combine(today, datetime.max.time())

        bookings_result = await self.db.execute(
            select(Booking).where(
                and_(Booking.guide_id == guide_id, Booking.tour_date >= day_start,
                     Booking.tour_date <= day_end, Booking.status.in_(["pending", "confirmed"]))
            ).order_by(Booking.tour_date)
        )
        bookings = bookings_result.scalars().all()
        total_participants = sum(b.participants_count for b in bookings)
        revenue = sum(b.guide_payout for b in bookings)

        pending = await self.analytics.pending_reviews(guide_id)

        guide_result = await self.db.execute(select(TourGuide).where(TourGuide.id == guide_id))
        guide = guide_result.scalar_one_or_none()
        city = guide.location_city if guide else "Athens"
        weather = await WeatherService.get_forecast(city)

        booking_data = []
        for b in bookings:
            tour_result = await self.db.execute(select(Tour.title).where(Tour.id == b.tour_id))
            title = tour_result.scalar() or "Tour"
            booking_data.append({
                "time": b.tour_time, "tour": title, "participants": b.participants_count,
                "customer": b.customer_name, "status": b.status,
            })

        tips = []
        if weather.get("temperature", 20) > 35:
            tips.append("Πολύ ζέστη - φρόντισε για νερό και σκιά")
        if len(pending) > 3:
            tips.append(f"Έχεις {len(pending)} κριτικές χωρίς απάντηση - βοηθάει στο ranking!")
        if not bookings:
            tips.append("Σήμερα είσαι ελεύθερος - ίσως update τα tours σου;")

        return {
            "date": str(today),
            "bookings_today": booking_data,
            "total_participants": total_participants,
            "revenue_today": round(revenue, 2),
            "pending_reviews": len(pending),
            "weather": weather,
            "tips": tips,
        }
