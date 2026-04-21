"""CORS middleware configuration — Phase 0 hardened."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# SECURITY: Restrict default origins to known production hosts — Phase 0 hardening
DEFAULT_ORIGINS = [
    "https://thronoschain.org",
    "https://skystriker.thronoschain.org",
    "https://api.thronoschain.org",
]


def setup_cors(app: FastAPI):
    env_origins = os.getenv("CORS_ORIGINS", "").split(",")
    origins = [o.strip() for o in env_origins if o.strip()] or DEFAULT_ORIGINS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Admin-Token", "X-Guide-Id"],
    )
