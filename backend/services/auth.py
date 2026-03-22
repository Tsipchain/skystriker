from datetime import datetime, timedelta
from jose import jwt
from core.config import settings


def create_access_token(user_id: str, email: str, role: str = "guide", guide_id: str | None = None) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "guide_id": guide_id,
        "exp": datetime.utcnow() + timedelta(minutes=settings.jwt_expiration_minutes),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
