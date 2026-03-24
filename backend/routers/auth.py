"""Authentication endpoints – email signup/login + Google OAuth."""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.orm import Session

from dependencies.database import get_db
from models.platform import Guide, User
from services.auth import (
    create_access_token,
    decode_token,
    get_or_create_google_user,
    login_email_user,
    register_email_user,
    verify_google_token,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "guest"  # "guest" or "guide"
    terms_accepted: bool = False


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleAuthRequest(BaseModel):
    id_token: str
    role: str = "guest"  # "guest" or "guide"


class AuthResponse(BaseModel):
    token: str
    user: dict


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    avatar_url: str
    role: str
    auth_provider: str
    guide_id: Optional[str] = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/signup", response_model=AuthResponse)
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    # Check if email already exists
    existing = db.execute(
        select(User).where(User.email == req.email.lower().strip())
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    if req.role not in ("guest", "guide"):
        raise HTTPException(status_code=400, detail="Invalid role")

    if not req.terms_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must accept the Terms of Service and Privacy Policy",
        )

    user = register_email_user(db, req.email, req.password, req.full_name, req.role, terms_accepted=True)
    token = create_access_token(user.id, user.role.value)

    guide_id = None
    if user.role.value == "guide":
        guide = db.execute(
            select(Guide).where(Guide.user_id == user.id)
        ).scalar_one_or_none()
        if guide:
            guide_id = guide.id

    return AuthResponse(
        token=token,
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "role": user.role.value,
            "auth_provider": user.auth_provider.value,
            "guide_id": guide_id,
        },
    )


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = login_email_user(db, req.email, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    guide_id = None
    if user.role.value == "guide":
        guide = db.execute(
            select(Guide).where(Guide.user_id == user.id)
        ).scalar_one_or_none()
        if guide:
            guide_id = guide.id

    token = create_access_token(user.id, user.role.value)
    return AuthResponse(
        token=token,
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "role": user.role.value,
            "auth_provider": user.auth_provider.value,
            "guide_id": guide_id,
        },
    )


@router.post("/google", response_model=AuthResponse)
async def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    google_data = await verify_google_token(req.id_token)
    if not google_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )

    if req.role not in ("guest", "guide"):
        raise HTTPException(status_code=400, detail="Invalid role")

    user = get_or_create_google_user(db, google_data, req.role)
    token = create_access_token(user.id, user.role.value)

    guide_id = None
    if user.role.value == "guide":
        guide = db.execute(
            select(Guide).where(Guide.user_id == user.id)
        ).scalar_one_or_none()
        if guide:
            guide_id = guide.id

    return AuthResponse(
        token=token,
        user={
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "role": user.role.value,
            "auth_provider": user.auth_provider.value,
            "guide_id": guide_id,
        },
    )


@router.get("/me", response_model=UserResponse)
def get_me(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):
    """Get current user from Authorization header."""
    token = ""
    if authorization.startswith("Bearer "):
        token = authorization[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.execute(
        select(User).where(User.id == payload["sub"])
    ).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    guide_id = None
    if user.role.value == "guide":
        guide = db.execute(
            select(Guide).where(Guide.user_id == user.id)
        ).scalar_one_or_none()
        if guide:
            guide_id = guide.id

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        role=user.role.value,
        auth_provider=user.auth_provider.value,
        guide_id=guide_id,
    )
