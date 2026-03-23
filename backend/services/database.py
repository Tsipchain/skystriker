"""Synchronous database engine and session factory.

Uses synchronous SQLAlchemy to avoid the greenlet / libstdc++ dependency
that breaks on Railway's nix-based containers.  FastAPI runs sync route
handlers in a threadpool automatically so there is no performance penalty.

Supports both PostgreSQL (production) and SQLite (local dev / CI).
"""

import logging
import os
from collections.abc import Iterator
from pathlib import Path

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from core.config import settings
from models.base import Base

logger = logging.getLogger(__name__)

_engine = None
SessionLocal: sessionmaker[Session] | None = None


def _get_db_url() -> str:
    url = settings.database_url
    if url:
        url = url.strip().strip('"').strip("'")
    if not url:
        return "sqlite:///./skystriker.db"

    # Bare file path on a Railway volume (e.g. /datzza/skystriker.db)
    # Also catches paths without .db extension or with extra whitespace
    if url.startswith("/") and "://" not in url:
        db_path = Path(url)
        db_path.parent.mkdir(parents=True, exist_ok=True)
        # sqlite:////absolute/path  (4 slashes = 3 for scheme + 1 for abs path)
        result = f"sqlite:///{url}"
        logger.info("Converted bare path %r → %s", url, result)
        return result

    # Normalise any PostgreSQL URL to use the psycopg driver
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql+asyncpg://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://") and "+psycopg" not in url:
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def initialize_database() -> None:
    global _engine, SessionLocal

    db_url = _get_db_url()
    logger.info("Resolved DB URL: %s", db_url[:60] + "…" if len(db_url) > 60 else db_url)
    engine_kwargs: dict = {"echo": settings.debug, "future": True, "pool_pre_ping": True}
    if db_url.startswith("sqlite"):
        engine_kwargs["connect_args"] = {"check_same_thread": False}
        if ":memory:" in db_url:
            engine_kwargs["poolclass"] = StaticPool
    else:
        engine_kwargs["pool_size"] = 5
        engine_kwargs["max_overflow"] = 10

    _engine = create_engine(db_url, **engine_kwargs)
    SessionLocal = sessionmaker(bind=_engine, expire_on_commit=False)

    # Import all models so their tables are registered with the metadata
    import models.platform  # noqa: F401

    # Create new tables (doesn't touch existing ones)
    Base.metadata.create_all(bind=_engine)

    # Migrate existing tables: add missing columns for SQLite
    if db_url.startswith("sqlite"):
        _migrate_sqlite(_engine)

    logger.info("Database initialised (%s)", "sqlite" if db_url.startswith("sqlite") else "postgresql")


def _migrate_sqlite(engine) -> None:
    """Add missing columns to existing SQLite tables.

    SQLAlchemy's create_all only creates new tables — it won't ALTER existing
    ones.  This function inspects each model table and adds any columns that
    are missing in the live database.
    """
    insp = inspect(engine)
    existing_tables = insp.get_table_names()

    for table in Base.metadata.sorted_tables:
        if table.name not in existing_tables:
            continue  # create_all already handled new tables

        existing_cols = {c["name"] for c in insp.get_columns(table.name)}
        with engine.begin() as conn:
            for col in table.columns:
                if col.name not in existing_cols:
                    # Build a safe ALTER TABLE ADD COLUMN
                    col_type = col.type.compile(engine.dialect)
                    nullable = "NULL" if col.nullable else "NOT NULL"
                    default = ""
                    if col.default is not None:
                        dv = col.default.arg
                        if callable(dv):
                            default = "DEFAULT ''"
                        elif isinstance(dv, str):
                            default = f"DEFAULT '{dv}'"
                        elif isinstance(dv, bool):
                            default = f"DEFAULT {1 if dv else 0}"
                        elif isinstance(dv, (int, float)):
                            default = f"DEFAULT {dv}"
                        else:
                            default = "DEFAULT ''"
                    # SQLite requires DEFAULT for NOT NULL columns on existing data
                    if nullable == "NOT NULL" and not default:
                        default = "DEFAULT ''"
                    sql = f'ALTER TABLE "{table.name}" ADD COLUMN "{col.name}" {col_type} {nullable} {default}'
                    logger.info("Migration: %s", sql.strip())
                    conn.execute(text(sql))


def close_database() -> None:
    global _engine
    if _engine is not None:
        _engine.dispose()
        logger.info("Database connection disposed")


def get_session() -> Iterator[Session]:
    if SessionLocal is None:
        raise RuntimeError("Database session requested before initialization")
    with SessionLocal() as session:
        yield session
