"""AI Translator + Subscription management."""

import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from dependencies.database import get_db
from models.platform import Subscription, SubscriptionStatus, User
from services.auth import decode_token

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/translator", tags=["translator"])

# Supported languages
SUPPORTED_LANGS = {
    "en": "English", "el": "Greek", "it": "Italian", "es": "Spanish",
    "tr": "Turkish", "pt": "Portuguese", "fr": "French", "de": "German",
}

# In-memory translation pairs for common phrases (offline fallback)
PHRASE_BOOK = {
    ("en", "el"): {"hello": "γεια σας", "thank you": "ευχαριστώ", "how much": "πόσο κοστίζει", "where is": "πού είναι", "goodbye": "αντίο"},
    ("en", "it"): {"hello": "ciao", "thank you": "grazie", "how much": "quanto costa", "where is": "dov'è", "goodbye": "arrivederci"},
    ("en", "es"): {"hello": "hola", "thank you": "gracias", "how much": "cuánto cuesta", "where is": "dónde está", "goodbye": "adiós"},
    ("en", "tr"): {"hello": "merhaba", "thank you": "teşekkürler", "how much": "ne kadar", "where is": "nerede", "goodbye": "hoşça kal"},
    ("en", "pt"): {"hello": "olá", "thank you": "obrigado", "how much": "quanto custa", "where is": "onde fica", "goodbye": "adeus"},
    ("en", "fr"): {"hello": "bonjour", "thank you": "merci", "how much": "combien ça coûte", "where is": "où est", "goodbye": "au revoir"},
    ("en", "de"): {"hello": "hallo", "thank you": "danke", "how much": "wie viel kostet", "where is": "wo ist", "goodbye": "auf wiedersehen"},
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_user(authorization: str, db: Session) -> Optional[User]:
    if not authorization.startswith("Bearer "):
        return None
    payload = decode_token(authorization[7:])
    if not payload:
        return None
    return db.execute(select(User).where(User.id == payload["sub"])).scalar_one_or_none()


def _has_active_subscription(db: Session, user_id: str) -> Optional[Subscription]:
    sub = db.execute(
        select(Subscription)
        .where(Subscription.user_id == user_id)
        .where(Subscription.status.in_([SubscriptionStatus.trial, SubscriptionStatus.active]))
        .where(Subscription.expires_at > datetime.utcnow())
        .order_by(Subscription.expires_at.desc())
    ).scalar_one_or_none()
    return sub


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class TranslateRequest(BaseModel):
    text: str
    from_lang: str = "en"
    to_lang: str = "el"


class TranslateResponse(BaseModel):
    original: str
    translated: str
    from_lang: str
    to_lang: str
    from_lang_name: str
    to_lang_name: str


class SubscriptionOut(BaseModel):
    id: str
    plan: str
    status: str
    price: float
    currency: str
    started_at: str
    expires_at: str


class SubscribeRequest(BaseModel):
    plan: str = "translator_monthly"


# ---------------------------------------------------------------------------
# Translation endpoint
# ---------------------------------------------------------------------------

@router.post("/translate", response_model=TranslateResponse)
def translate_text(
    req: TranslateRequest,
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):
    # Validate languages
    if req.from_lang not in SUPPORTED_LANGS or req.to_lang not in SUPPORTED_LANGS:
        raise HTTPException(status_code=400, detail="Unsupported language")
    if req.from_lang == req.to_lang:
        return TranslateResponse(
            original=req.text, translated=req.text,
            from_lang=req.from_lang, to_lang=req.to_lang,
            from_lang_name=SUPPORTED_LANGS[req.from_lang],
            to_lang_name=SUPPORTED_LANGS[req.to_lang],
        )

    # Check subscription
    user = _get_user(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail="Login required for AI Translator")

    sub = _has_active_subscription(db, user.id)
    if not sub:
        raise HTTPException(status_code=403, detail="Active subscription required. Subscribe for €4.99/month.")

    # Simple translation engine using phrase book + word mapping
    text_lower = req.text.lower().strip()
    pair_key = (req.from_lang, req.to_lang)
    reverse_key = (req.to_lang, req.from_lang)

    translated = None

    # Direct match in phrase book
    if pair_key in PHRASE_BOOK and text_lower in PHRASE_BOOK[pair_key]:
        translated = PHRASE_BOOK[pair_key][text_lower]
    elif reverse_key in PHRASE_BOOK:
        # Reverse lookup
        for eng, trans in PHRASE_BOOK[reverse_key].items():
            if trans == text_lower:
                translated = eng
                break

    # Bridge through English if no direct pair
    if not translated and req.from_lang != "en" and req.to_lang != "en":
        # from_lang -> en -> to_lang
        en_text = None
        rev_from = (req.from_lang, "en")
        from_en = ("en", req.from_lang)
        if from_en in PHRASE_BOOK:
            for eng, trans in PHRASE_BOOK[from_en].items():
                if trans == text_lower:
                    en_text = eng
                    break
        if en_text:
            to_pair = ("en", req.to_lang)
            if to_pair in PHRASE_BOOK and en_text in PHRASE_BOOK[to_pair]:
                translated = PHRASE_BOOK[to_pair][en_text]

    if not translated:
        # Fallback: return with marker indicating AI translation needed
        # In production, this would call an AI model API
        translated = f"[{SUPPORTED_LANGS[req.to_lang]}] {req.text}"

    return TranslateResponse(
        original=req.text, translated=translated,
        from_lang=req.from_lang, to_lang=req.to_lang,
        from_lang_name=SUPPORTED_LANGS[req.from_lang],
        to_lang_name=SUPPORTED_LANGS[req.to_lang],
    )


@router.get("/languages")
def list_languages():
    return [{"code": code, "name": name} for code, name in SUPPORTED_LANGS.items()]


# ---------------------------------------------------------------------------
# Subscription endpoints
# ---------------------------------------------------------------------------

@router.get("/subscription", response_model=Optional[SubscriptionOut])
def get_subscription(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):
    user = _get_user(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")

    sub = _has_active_subscription(db, user.id)
    if not sub:
        return None

    return SubscriptionOut(
        id=sub.id, plan=sub.plan, status=sub.status.value,
        price=sub.price, currency=sub.currency,
        started_at=sub.started_at.isoformat(), expires_at=sub.expires_at.isoformat(),
    )


@router.post("/subscribe", response_model=SubscriptionOut)
def subscribe(
    req: SubscribeRequest,
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):
    user = _get_user(authorization, db)
    if not user:
        raise HTTPException(status_code=401, detail="Login required")

    # Check for existing active subscription
    existing = _has_active_subscription(db, user.id)
    if existing:
        return SubscriptionOut(
            id=existing.id, plan=existing.plan, status=existing.status.value,
            price=existing.price, currency=existing.currency,
            started_at=existing.started_at.isoformat(), expires_at=existing.expires_at.isoformat(),
        )

    # Create new subscription with 7-day trial
    now = datetime.utcnow()
    sub = Subscription(
        user_id=user.id,
        plan=req.plan,
        status=SubscriptionStatus.trial,
        price=4.99,
        currency="EUR",
        started_at=now,
        expires_at=now + timedelta(days=37),  # 7 trial + 30 days
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)

    logger.info("New subscription created for user %s", user.id)
    return SubscriptionOut(
        id=sub.id, plan=sub.plan, status=sub.status.value,
        price=sub.price, currency=sub.currency,
        started_at=sub.started_at.isoformat(), expires_at=sub.expires_at.isoformat(),
    )
