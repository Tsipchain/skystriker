"""Seed the database with demo data when ``SEED_DEMO_DATA=true``.

Runs once at startup – skipped if countries already exist.
"""

import logging
import uuid

from sqlalchemy import func, select

from core.config import settings
from models.platform import (
    City,
    Country,
    Experience,
    ExperienceCategory,
    Guide,
    User,
    UserRole,
    AuthProvider,
    VerificationStatus,
)
from services.auth import hash_password
from services.database import SessionLocal

logger = logging.getLogger(__name__)


def _uuid() -> str:
    return str(uuid.uuid4())


def seed_if_empty() -> None:
    if SessionLocal is None:
        logger.warning("seed_if_empty called before DB init – skipping")
        return

    with SessionLocal() as db:
        count = (db.execute(select(func.count(Country.id)))).scalar()
        if count and count > 0:
            logger.info("Database already seeded (%d countries) – skipping", count)
            return

        logger.info("Seeding demo data …")

        # --- Countries ---
        gr = Country(id=_uuid(), code="GR", name="Greece", flag_emoji="🇬🇷")
        it = Country(id=_uuid(), code="IT", name="Italy", flag_emoji="🇮🇹")
        es = Country(id=_uuid(), code="ES", name="Spain", flag_emoji="🇪🇸")
        hr = Country(id=_uuid(), code="HR", name="Croatia", flag_emoji="🇭🇷")
        tr = Country(id=_uuid(), code="TR", name="Turkey", flag_emoji="🇹🇷")
        pt = Country(id=_uuid(), code="PT", name="Portugal", flag_emoji="🇵🇹")
        db.add_all([gr, it, es, hr, tr, pt])

        # --- Cities ---
        athens = City(
            id=_uuid(), country_id=gr.id, name="Athens", slug="athens",
            tagline="The cradle of Western civilisation",
            description="Walk where Socrates walked, taste modern Athenian street food, and watch the sunset paint the Parthenon gold.",
            lat=37.9838, lng=23.7275,
            photo_url="https://images.unsplash.com/photo-1555993539-1732b0258235?w=800",
        )
        thessaloniki = City(
            id=_uuid(), country_id=gr.id, name="Thessaloniki", slug="thessaloniki",
            tagline="Greece's cultural capital",
            description="Byzantine churches, Ottoman markets, and the best nightlife north of Athens.",
            lat=40.6401, lng=22.9444,
            photo_url="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800",
        )
        santorini = City(
            id=_uuid(), country_id=gr.id, name="Santorini", slug="santorini",
            tagline="Iconic sunsets and volcanic beaches",
            description="Blue-domed churches perched on cliffs above a flooded caldera – the most photographed island on Earth.",
            lat=36.3932, lng=25.4615,
            photo_url="https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800",
        )
        rome = City(
            id=_uuid(), country_id=it.id, name="Rome", slug="rome",
            tagline="The Eternal City",
            description="Two thousand years of art, architecture, and pasta.",
            lat=41.9028, lng=12.4964,
            photo_url="https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800",
        )
        barcelona = City(
            id=_uuid(), country_id=es.id, name="Barcelona", slug="barcelona",
            tagline="Where Gaudí meets the Mediterranean",
            description="Modernist architecture, tapas bars, and golden beaches.",
            lat=41.3874, lng=2.1686,
            photo_url="https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800",
        )
        dubrovnik = City(
            id=_uuid(), country_id=hr.id, name="Dubrovnik", slug="dubrovnik",
            tagline="The Pearl of the Adriatic",
            description="Medieval walls, terracotta rooftops, and crystal-clear waters.",
            lat=42.6507, lng=18.0944,
            photo_url="https://images.unsplash.com/photo-1580137189272-c9379f8864fd?w=800",
        )
        istanbul = City(
            id=_uuid(), country_id=tr.id, name="Istanbul", slug="istanbul",
            tagline="Where East meets West",
            description="Mosques, bazaars, and the Bosphorus strait.",
            lat=41.0082, lng=28.9784,
            photo_url="https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800",
        )
        lisbon = City(
            id=_uuid(), country_id=pt.id, name="Lisbon", slug="lisbon",
            tagline="City of seven hills",
            description="Fado music, pastel de nata, and tram 28.",
            lat=38.7223, lng=-9.1393,
            photo_url="https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800",
        )
        db.add_all([athens, thessaloniki, santorini, rome, barcelona, dubrovnik, istanbul, lisbon])

        # --- Guides ---
        nikos = Guide(
            id=_uuid(), full_name="Nikos Papadopoulos", email="nikos@example.com",
            bio="Born and raised in Plaka. Historian by training, storyteller by passion.",
            languages="Greek,English,French", specialties="History,Food,Walking Tours",
            city_id=athens.id, verification_status=VerificationStatus.verified,
            rating=4.9, total_reviews=127,
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
        )
        maria = Guide(
            id=_uuid(), full_name="Maria Konstantinou", email="maria@example.com",
            bio="Santorini local with a passion for wine and sunsets.",
            languages="Greek,English,German", specialties="Wine,Photography,Sailing",
            city_id=santorini.id, verification_status=VerificationStatus.verified,
            rating=4.8, total_reviews=89,
            avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
        )
        dimitris = Guide(
            id=_uuid(), full_name="Dimitris Alexiou", email="dimitris@example.com",
            bio="Thessaloniki foodie – I'll show you where the locals eat.",
            languages="Greek,English", specialties="Food,Nightlife,Culture",
            city_id=thessaloniki.id, verification_status=VerificationStatus.pending,
            rating=4.6, total_reviews=42,
            avatar_url="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
        )
        giulia = Guide(
            id=_uuid(), full_name="Giulia Rossi", email="giulia@example.com",
            bio="Art historian specialising in Renaissance and Baroque Rome.",
            languages="Italian,English,Spanish", specialties="Art,History,Architecture",
            city_id=rome.id, verification_status=VerificationStatus.verified,
            rating=4.9, total_reviews=203,
            avatar_url="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
        )
        carlos = Guide(
            id=_uuid(), full_name="Carlos Fernández", email="carlos@example.com",
            bio="Barcelona born, Gaudí obsessed.",
            languages="Spanish,English,Catalan", specialties="Architecture,Food,Nightlife",
            city_id=barcelona.id, verification_status=VerificationStatus.verified,
            rating=4.7, total_reviews=156,
            avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
        )
        db.add_all([nikos, maria, dimitris, giulia, carlos])

        # --- Experiences ---
        experiences = [
            Experience(
                id=_uuid(), guide_id=nikos.id, city_id=athens.id,
                title="Athens Hidden Gems Walking Tour",
                slug="athens-hidden-gems-walking-tour-" + _uuid()[:8],
                description="Discover the secret corners of Athens that most tourists never see. From street art in Psyrri to the antique shops of Monastiraki.",
                category=ExperienceCategory.walking_tour,
                duration_minutes=180, price=45.0, max_guests=8,
                languages="English,Greek", avg_rating=4.9,
                photo_url="https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?w=800",
            ),
            Experience(
                id=_uuid(), guide_id=nikos.id, city_id=athens.id,
                title="Athenian Street Food Adventure",
                slug="athenian-street-food-adventure-" + _uuid()[:8],
                description="Taste your way through Athens – souvlaki, loukoumades, bougatsa, and more.",
                category=ExperienceCategory.food_and_drink,
                duration_minutes=150, price=55.0, max_guests=6,
                languages="English,Greek,French", avg_rating=4.8,
                photo_url="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
            ),
            Experience(
                id=_uuid(), guide_id=maria.id, city_id=santorini.id,
                title="Santorini Sunset Wine Tasting",
                slug="santorini-sunset-wine-tasting-" + _uuid()[:8],
                description="Sample volcanic wines while watching the legendary Santorini sunset from a private vineyard terrace.",
                category=ExperienceCategory.food_and_drink,
                duration_minutes=120, price=75.0, max_guests=10,
                languages="English,Greek,German", avg_rating=4.9,
                photo_url="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
            ),
            Experience(
                id=_uuid(), guide_id=maria.id, city_id=santorini.id,
                title="Santorini Photography Workshop",
                slug="santorini-photography-workshop-" + _uuid()[:8],
                description="Capture the iconic blue domes and whitewashed streets with a professional photographer as your guide.",
                category=ExperienceCategory.photography,
                duration_minutes=180, price=90.0, max_guests=4,
                languages="English,Greek", avg_rating=4.7,
                photo_url="https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800",
            ),
            Experience(
                id=_uuid(), guide_id=dimitris.id, city_id=thessaloniki.id,
                title="Thessaloniki Food & Market Tour",
                slug="thessaloniki-food-market-tour-" + _uuid()[:8],
                description="From Modiano Market to hidden tavernas – eat like a true Thessalonikian.",
                category=ExperienceCategory.food_and_drink,
                duration_minutes=180, price=40.0, max_guests=8,
                languages="English,Greek", avg_rating=4.6,
                photo_url="https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800",
            ),
            Experience(
                id=_uuid(), guide_id=giulia.id, city_id=rome.id,
                title="Vatican & Sistine Chapel Deep Dive",
                slug="vatican-sistine-chapel-deep-dive-" + _uuid()[:8],
                description="Skip the crowds and hear stories no audio guide will tell you.",
                category=ExperienceCategory.history_and_culture,
                duration_minutes=240, price=85.0, max_guests=6,
                languages="English,Italian,Spanish", avg_rating=5.0,
                photo_url="https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800",
            ),
            Experience(
                id=_uuid(), guide_id=carlos.id, city_id=barcelona.id,
                title="Gaudí Masterpieces & Modernisme Walk",
                slug="gaudi-masterpieces-modernisme-walk-" + _uuid()[:8],
                description="From Sagrada Família to Park Güell – understand the genius behind the curves.",
                category=ExperienceCategory.walking_tour,
                duration_minutes=210, price=60.0, max_guests=10,
                languages="English,Spanish,Catalan", avg_rating=4.8,
                photo_url="https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800",
            ),
        ]
        db.add_all(experiences)

        db.commit()
        logger.info(
            "Demo data seeded: %d countries, %d cities, %d guides, %d experiences",
            6, 8, 5, len(experiences),
        )

    # Always ensure admin account exists (runs even if data already seeded)
    _ensure_admin_account()


def _ensure_admin_account() -> None:
    """Create or update the admin account from env vars."""
    if SessionLocal is None:
        return
    with SessionLocal() as db:
        from sqlalchemy import select
        admin_email = settings.admin_email.lower().strip()
        existing = db.execute(
            select(User).where(User.email == admin_email)
        ).scalar_one_or_none()
        if existing:
            # Ensure role is admin
            if existing.role != UserRole.admin:
                existing.role = UserRole.admin
                logger.info("Upgraded %s to admin role", settings.admin_email)
            # Always sync password hash with current config value
            existing.password_hash = hash_password(settings.admin_password)
            db.commit()
            logger.info("Admin account synced: %s", settings.admin_email)
            return
        admin = User(
            id=_uuid(),
            email=admin_email,
            full_name="SkyStriker Admin",
            password_hash=hash_password(settings.admin_password),
            auth_provider=AuthProvider.email,
            role=UserRole.admin,
        )
        db.add(admin)
        db.commit()
        logger.info("Admin account created: %s", settings.admin_email)
