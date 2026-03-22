"""Smoke tests for platform business rules.

Run with: ``python -m pytest backend/tests/ -v``
"""

import uuid
from datetime import datetime

import pytest

from models.platform import (
    AuditAction,
    BookingStatus,
    ExperienceCategory,
    VerificationStatus,
)
from schemas.platform import (
    BookingCreate,
    CityOut,
    ExperienceCard,
    ExperienceCreate,
    GuideCard,
    GuideProfileUpdate,
    HealthResponse,
    ReviewCreate,
    StatsOut,
)


# ---------------------------------------------------------------------------
# Enum coverage
# ---------------------------------------------------------------------------

def test_verification_status_values():
    assert set(VerificationStatus) == {
        VerificationStatus.unverified,
        VerificationStatus.pending,
        VerificationStatus.verified,
        VerificationStatus.rejected,
        VerificationStatus.suspended,
    }


def test_experience_categories():
    assert len(ExperienceCategory) >= 10


def test_booking_statuses():
    assert BookingStatus.requested.value == "requested"
    assert BookingStatus.completed.value == "completed"


def test_audit_actions():
    assert AuditAction.guide_registered.value == "guide_registered"
    assert AuditAction.review_submitted.value == "review_submitted"


# ---------------------------------------------------------------------------
# Schema construction
# ---------------------------------------------------------------------------

def test_health_response():
    h = HealthResponse(status="healthy", service="test", version="1.0.0", environment="test")
    assert h.status == "healthy"


def test_stats_out_defaults():
    s = StatsOut()
    assert s.countries == 0
    assert s.verified_guides == 0


def test_guide_card_csv_split():
    card = GuideCard(
        id="1", full_name="Test", languages=["Greek", "English"],
        specialties=["Food"], verification_status="verified",
    )
    assert card.languages == ["Greek", "English"]


def test_experience_card_fields():
    card = ExperienceCard(
        id="1", guide_id="g1", city_id="c1", title="Walk", slug="walk",
        languages=["English"], category="walking_tour",
    )
    assert card.slug == "walk"


def test_booking_create_validation():
    b = BookingCreate(
        experience_id="exp1",
        guest_name="Alice",
        guest_email="alice@example.com",
        requested_date="2025-08-15",
    )
    assert b.guests_count == 1


def test_review_create_validation():
    r = ReviewCreate(
        experience_id="exp1",
        reviewer_name="Bob",
        rating=5,
        comment="Excellent!",
    )
    assert r.rating == 5


def test_guide_profile_update():
    u = GuideProfileUpdate(bio="New bio")
    assert u.full_name is None
    assert u.bio == "New bio"


def test_experience_create():
    e = ExperienceCreate(title="Night Walk")
    assert e.duration_minutes == 120
    assert e.price == 0.0


def test_city_out():
    c = CityOut(id="1", country_id="c1", name="Athens", slug="athens")
    assert c.guide_count == 0
