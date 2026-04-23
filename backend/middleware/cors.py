"""CORS middleware configuration — Phase 0 hardened."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

DEFAULT_ORIGINS = [
    "https://thronoschain.org",
    "https://guidestriker.thronoschain.org",
    "https://skystriker.thronoschain.org",
    "https://skystriker.up.railway.app",
    "https://skystriker.app",
    "https://api.thronoschain.org",
    "http://localhost:5173",
    "http://localhost:3000",
]


def setup_cors(app: FastAPI):
    raw = os.getenv("CORS_ORIGINS", "") or os.getenv("CORS_ALLOW_ORIGINS", "")
    origins = [o.strip() for o in raw.split(",") if o.strip()] or DEFAULT_ORIGINS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Admin-Token", "X-Guide-Id"],
    )
