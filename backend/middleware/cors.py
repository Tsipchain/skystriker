"""CORS middleware configuration."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

DEFAULT_ORIGINS = [
    "https://guidestriker.thronoschain.org",
    "https://skystriker.thronoschain.org",
    "https://skystriker.up.railway.app",
    "https://skystriker.app",
    "http://localhost:5173",
    "http://localhost:3000",
]


def setup_cors(app: FastAPI):
    origins = [
        o.strip()
        for o in os.getenv("CORS_ALLOW_ORIGINS", "").split(",")
        if o.strip()
    ] or DEFAULT_ORIGINS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )
