"""Async database engine and session factory.

Supports both PostgreSQL (production) and SQLite (local dev / CI).
"""

import logging
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool

from core.config import settings
from models.base import Base

logger = logging.getLogger(__name__)

_engine = None
async_session: async_sessionmaker[AsyncSession] | None = None


def _get_db_url() -> str:
    url = settings.database_url
    if url:
        url = url.strip().strip('"').strip("'")
    if not url:
        return "sqlite+aiosqlite:///./skystriker.db"
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://") and "+" not in url:
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


async def initialize_database() -> None:
    global _engine, async_session

    db_url = _get_db_url()
    engine_kwargs: dict = {"echo": settings.debug, "future": True, "pool_pre_ping": True}
    if db_url.startswith("sqlite"):
        engine_kwargs["connect_args"] = {"check_same_thread": False}
        if ":memory:" in db_url:
            engine_kwargs["poolclass"] = StaticPool
    else:
        engine_kwargs["pool_size"] = 5
        engine_kwargs["max_overflow"] = 10

    _engine = create_async_engine(db_url, **engine_kwargs)
    async_session = async_sessionmaker(
        _engine, expire_on_commit=False, class_=AsyncSession
    )

    # Import all models so their tables are registered with the metadata
    import models.platform  # noqa: F401

    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    logger.info("Database initialised (%s)", "sqlite" if db_url.startswith("sqlite") else "postgresql")


async def close_database() -> None:
    global _engine
    if _engine is not None:
        await _engine.dispose()
        logger.info("Database connection disposed")


async def get_session() -> AsyncIterator[AsyncSession]:
    if async_session is None:
        raise RuntimeError("Database session requested before initialization")
    async with async_session() as session:
        yield session
