"""VerifyID integration service.

Bridges SkyStriker guide verification with the Thronos VerifyID platform.
When the SkyStriker admin approves/rejects a guide, the result is:
1. Synced to VerifyID via its internal API
2. Hashed (SHA-256) and submitted to the Thronos blockchain
3. If no human agent is available, a WebRTC video call can be requested

The VerifyID platform URL is configured via VERIFYID_API_URL env var.
"""

import hashlib
import json
import logging
import time
from typing import Any, Optional

import httpx

from core.config import settings

logger = logging.getLogger(__name__)


class VerifyIDService:
    """Communicate with the Thronos VerifyID platform."""

    def __init__(self) -> None:
        self.api_url = (settings.verifyid_api_url or "").rstrip("/")
        self.internal_key = settings.verifyid_internal_key
        self.timeout = 15.0

    @property
    def available(self) -> bool:
        return bool(self.api_url and self.internal_key)

    def _headers(self) -> dict[str, str]:
        return {
            "Content-Type": "application/json",
            "X-Internal-Key": self.internal_key,
        }

    # ------------------------------------------------------------------
    # Fetch verification status from VerifyID
    # ------------------------------------------------------------------

    async def get_verification_status(self, verifyid_ref: str) -> Optional[dict[str, Any]]:
        """Query VerifyID for the current status of a verification."""
        if not self.available or not verifyid_ref:
            return None
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(
                    f"{self.api_url}/api/v1/verifications/{verifyid_ref}",
                    headers=self._headers(),
                )
                if resp.status_code == 200:
                    return resp.json()
                logger.warning("VerifyID status fetch failed: %d", resp.status_code)
                return None
        except Exception as e:
            logger.warning("VerifyID unreachable: %s", e)
            return None

    # ------------------------------------------------------------------
    # List all verifications from VerifyID
    # ------------------------------------------------------------------

    async def list_verifications(
        self, status: Optional[str] = None, limit: int = 100
    ) -> list[dict[str, Any]]:
        """Fetch the verification list from VerifyID platform."""
        if not self.available:
            return []
        try:
            params: dict[str, Any] = {"limit": limit}
            if status:
                params["status"] = status
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(
                    f"{self.api_url}/api/v1/verifications/list",
                    headers=self._headers(),
                    params=params,
                )
                if resp.status_code == 200:
                    return resp.json()
                logger.warning("VerifyID list failed: %d", resp.status_code)
                return []
        except Exception as e:
            logger.warning("VerifyID unreachable for listing: %s", e)
            return []

    # ------------------------------------------------------------------
    # Notify VerifyID of SkyStriker admin decision
    # ------------------------------------------------------------------

    async def notify_decision(
        self,
        guide_id: str,
        guide_email: str,
        guide_name: str,
        decision: str,  # "verified" | "rejected" | "suspended"
        verifyid_ref: str = "",
        notes: str = "",
    ) -> dict[str, Any]:
        """Push the admin verification decision to VerifyID."""
        if not self.available:
            return {"synced": False, "reason": "VerifyID not configured"}

        payload = {
            "source": "skystriker",
            "guide_id": guide_id,
            "guide_email": guide_email,
            "guide_name": guide_name,
            "decision": decision,
            "verifyid_reference": verifyid_ref,
            "notes": notes,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(
                    f"{self.api_url}/internal/ai/callback",
                    headers=self._headers(),
                    json={
                        "request_id": verifyid_ref or guide_id,
                        "fraud_score": 0.0 if decision == "verified" else 0.8,
                        "flags": [] if decision == "verified" else [f"skystriker_admin_{decision}"],
                        "requires_agent": False,
                        "status": "ai_approved" if decision == "verified" else "ai_rejected",
                        "ai_job_id": f"sky_{guide_id}_{int(time.time())}",
                        "analyzed_at": payload["timestamp"],
                    },
                )
                if resp.status_code == 200:
                    logger.info(
                        "VerifyID notified: guide=%s decision=%s", guide_id, decision
                    )
                    return {"synced": True, "response": resp.json()}
                logger.warning("VerifyID notification failed: %d", resp.status_code)
                return {"synced": False, "reason": f"HTTP {resp.status_code}"}
        except Exception as e:
            logger.warning("VerifyID notification error: %s", e)
            return {"synced": False, "reason": str(e)}

    # ------------------------------------------------------------------
    # Check if a video call agent is available
    # ------------------------------------------------------------------

    async def check_agent_available(self) -> dict[str, Any]:
        """Check if a human agent is available on VerifyID for WebRTC video call."""
        if not self.available:
            return {"agent_available": False, "reason": "VerifyID not configured"}
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(
                    f"{self.api_url}/api/v1/video-call/online-users",
                    headers=self._headers(),
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return {
                        "agent_available": data.get("count", 0) > 0,
                        "online_agents": data.get("online_users", []),
                        "count": data.get("count", 0),
                    }
                return {"agent_available": False, "reason": f"HTTP {resp.status_code}"}
        except Exception as e:
            return {"agent_available": False, "reason": str(e)}

    # ------------------------------------------------------------------
    # Blockchain hash for verification seal
    # ------------------------------------------------------------------

    @staticmethod
    def hash_verification(
        guide_id: str,
        guide_email: str,
        decision: str,
        verifyid_ref: str,
        timestamp: str,
    ) -> str:
        """Create a deterministic SHA-256 hash of the verification decision."""
        payload = json.dumps(
            {
                "guide_id": guide_id,
                "guide_email": guide_email,
                "decision": decision,
                "verifyid_reference": verifyid_ref,
                "timestamp": timestamp,
                "source": "skystriker",
            },
            sort_keys=True,
        )
        return hashlib.sha256(payload.encode()).hexdigest()


# Singleton
verifyid_service = VerifyIDService()
