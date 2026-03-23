"""Authentication service – JWT tokens, password hashing, Google OAuth."""

import base64
import hashlib
import hmac
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Optional

import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from core.config import settings
from models.platform import AuthProvider, Guide, User, UserRole

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Password hashing (PBKDF2-SHA256, stdlib only)
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 260_000)
    return f"{salt.hex()}${dk.hex()}"


def verify_password(plain: str, hashed: str) -> bool:
    try:
        salt_hex, dk_hex = hashed.split("$", 1)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(dk_hex)
        actual = hashlib.pbkdf2_hmac("sha256", plain.encode(), salt, 260_000)
        return hmac.compare_digest(expected, actual)
    except Exception:
        return False


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(s: str) -> bytes:
    s += "=" * (4 - len(s) % 4)
    return base64.urlsafe_b64decode(s)


def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    header = _b64url_encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = _b64url_encode(json.dumps({
        "sub": user_id, "role": role, "exp": int(expire.timestamp()),
    }).encode())
    sig_input = f"{header}.{payload}".encode()
    sig = _b64url_encode(hmac.new(settings.jwt_secret.encode(), sig_input, hashlib.sha256).digest())
    return f"{header}.{payload}.{sig}"


def decode_token(token: str) -> Optional[dict]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            logger.warning("JWT rejected: wrong number of parts (%d)", len(parts))
            return None
        sig_input = f"{parts[0]}.{parts[1]}".encode()
        expected = hmac.new(settings.jwt_secret.encode(), sig_input, hashlib.sha256).digest()
        actual = _b64url_decode(parts[2])
        if not hmac.compare_digest(expected, actual):
            logger.warning("JWT rejected: signature mismatch")
            return None
        payload = json.loads(_b64url_decode(parts[1]))
        if payload.get("exp", 0) < datetime.utcnow().timestamp():
            logger.info("JWT rejected: token expired (sub=%s)", payload.get("sub", "?"))
            return None
        return payload
    except Exception:
        logger.exception("JWT decode error")
        return None


def register_email_user(
    db: Session, email: str, password: str, full_name: str, role: str = "guest",
) -> User:
    user = User(
        email=email.lower().strip(),
        full_name=full_name,
        password_hash=hash_password(password),
        auth_provider=AuthProvider.email,
        role=UserRole(role),
    )
    db.add(user)

    if role == "guide":
        guide = Guide(
            user_id=user.id,
            full_name=full_name,
            email=user.email,
        )
        db.add(guide)

    db.commit()
    db.refresh(user)
    return user


def login_email_user(db: Session, email: str, password: str) -> Optional[User]:
    stmt = select(User).where(User.email == email.lower().strip())
    user = db.execute(stmt).scalar_one_or_none()
    if not user or not user.password_hash:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


async def verify_google_token(id_token: str) -> Optional[dict]:
    """Verify a Google ID token and return user info."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
            )
            if resp.status_code != 200:
                return None
            data = resp.json()
            if settings.google_client_id and data.get("aud") != settings.google_client_id:
                return None
            return data
    except Exception:
        logger.exception("Google token verification failed")
        return None


def get_or_create_google_user(
    db: Session, google_data: dict, role: str = "guest",
) -> User:
    email = google_data["email"].lower().strip()
    google_sub = google_data.get("sub", "")

    # Try to find by Google subject ID first
    user = db.execute(
        select(User).where(User.google_sub == google_sub)
    ).scalar_one_or_none() if google_sub else None

    # Fallback: find by email
    if not user:
        user = db.execute(
            select(User).where(User.email == email)
        ).scalar_one_or_none()

    if user:
        # Update Google sub if missing
        if google_sub and not user.google_sub:
            user.google_sub = google_sub
            user.auth_provider = AuthProvider.google
        # Upgrade to guide if requested and not already
        if role == "guide" and user.role != UserRole.guide:
            user.role = UserRole.guide
            logger.info("Upgraded user %s from %s to guide", user.id, user.role.value if hasattr(user.role, 'value') else user.role)
        # Ensure Guide record exists for guide users
        if user.role == UserRole.guide:
            existing_guide = db.execute(
                select(Guide).where(Guide.user_id == user.id)
            ).scalar_one_or_none()
            if not existing_guide:
                guide = Guide(
                    user_id=user.id,
                    full_name=user.full_name,
                    email=user.email,
                    avatar_url=user.avatar_url or google_data.get("picture", ""),
                )
                db.add(guide)
                logger.info("Auto-created guide record for existing user %s", user.id)
        db.commit()
        db.refresh(user)
        return user

    # Create new user
    user = User(
        email=email,
        full_name=google_data.get("name", email.split("@")[0]),
        avatar_url=google_data.get("picture", ""),
        auth_provider=AuthProvider.google,
        google_sub=google_sub,
        role=UserRole(role),
    )
    db.add(user)

    if role == "guide":
        guide = Guide(
            user_id=user.id,
            full_name=user.full_name,
            email=user.email,
            avatar_url=user.avatar_url,
        )
        db.add(guide)

    db.commit()
    db.refresh(user)
    return user
