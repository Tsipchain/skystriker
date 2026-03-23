"""Thronos Chain SkyStriker Global Guides – FastAPI entry-point.

Keeps startup logic minimal:
1.  Initialise the sync DB engine and run ``CREATE TABLE`` for SQLite.
2.  Optionally seed demo data when ``SEED_DEMO_DATA=true``.
3.  Mount the three router groups (public, guide, admin) plus health.
"""

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from core.config import settings
from middleware.cors import setup_cors
from services.database import close_database, initialize_database

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.basicConfig(
        level=logging.DEBUG if settings.debug else logging.INFO,
        format="%(asctime)s  %(name)-30s  %(levelname)-8s  %(message)s",
    )
    logger.info("=== SkyStriker Global Guides – startup ===")
    initialize_database()

    if settings.seed_demo_data:
        from services.seed import seed_if_empty
        seed_if_empty()

    yield
    close_database()
    logger.info("=== SkyStriker Global Guides – shutdown ===")


# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Thronos Chain SkyStriker Global Guides",
    description=(
        "Verified local guides & destination experiences. "
        "Part of the Thronos Chain ecosystem."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

setup_cors(app)

# --- routers ---
from routers.health import router as health_router  # noqa: E402
from routers.auth import router as auth_router  # noqa: E402
from routers.public import router as public_router  # noqa: E402
from routers.guide import router as guide_router  # noqa: E402
from routers.admin import router as admin_router  # noqa: E402
from routers.availability import router as availability_router  # noqa: E402
from routers.translator import router as translator_router  # noqa: E402

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(public_router)
app.include_router(guide_router)
app.include_router(admin_router)
app.include_router(availability_router)
app.include_router(translator_router)

# Serve uploaded files
_uploads_dir = Path(__file__).resolve().parent / "static" / "uploads"
_uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=_uploads_dir), name="uploads")


# ---------------------------------------------------------------------------
# Serve frontend SPA (built files copied to /app/frontend_dist at deploy)
# ---------------------------------------------------------------------------

_frontend_dir = Path("/app/frontend_dist")
# Fallback: local dev with frontend/dist next to backend/
if not _frontend_dir.exists():
    _frontend_dir = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if _frontend_dir.exists():
    # Serve /assets (JS, CSS, images) as static files
    app.mount("/assets", StaticFiles(directory=_frontend_dir / "assets"), name="frontend-assets")

    @app.get("/")
    def serve_index():
        return FileResponse(_frontend_dir / "index.html")

    # SPA catch-all: any path not matched by API routes serves index.html
    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str):
        # Try to serve a static file first (favicon, manifest, etc.)
        file_path = _frontend_dir / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(_frontend_dir / "index.html")
else:
    logger.warning("Frontend dist not found at %s – serving API only", _frontend_dir)

    @app.get("/")
    def root():
        return {
            "service": "Thronos Chain SkyStriker Global Guides",
            "version": "2.0.0",
            "docs": "/docs",
        }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(settings.port))
