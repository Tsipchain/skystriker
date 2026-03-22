"""Database session dependency for FastAPI routes."""

from services.database import get_session


def get_db():
    yield from get_session()
