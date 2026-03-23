"""Thronos blockchain integration for payout recording.

Every payout release is hashed (SHA256) and submitted to the Thronos network,
creating an immutable record and giving work to the network.
"""

import hashlib
import json
import logging
import time
from typing import Any

import requests

from core.config import settings

logger = logging.getLogger(__name__)


class ThronosBlockchainService:
    """Records payout transactions on the Thronos blockchain."""

    def __init__(self) -> None:
        self.node1_url = settings.thronos_node1_url
        self.node2_url = settings.thronos_node2_url
        self.headers: dict[str, str] = {}
        if settings.thronos_admin_secret:
            self.headers["X-Admin-Secret"] = settings.thronos_admin_secret
        self.timeout = 30

    # ------------------------------------------------------------------
    # Hashing
    # ------------------------------------------------------------------

    @staticmethod
    def hash_payout(
        booking_id: str,
        guide_id: str,
        guide_email: str,
        amount: float,
        currency: str,
        platform_fee: float,
        timestamp: str,
    ) -> str:
        """Create a deterministic SHA256 hash of the payout data."""
        payload = json.dumps(
            {
                "booking_id": booking_id,
                "guide_id": guide_id,
                "guide_email": guide_email,
                "amount": amount,
                "currency": currency,
                "platform_fee": platform_fee,
                "timestamp": timestamp,
            },
            sort_keys=True,
        )
        return hashlib.sha256(payload.encode()).hexdigest()

    # ------------------------------------------------------------------
    # Blockchain submission
    # ------------------------------------------------------------------

    def submit_payout_to_chain(
        self,
        booking_id: str,
        guide_id: str,
        guide_email: str,
        amount: float,
        currency: str,
        platform_fee: float,
    ) -> dict[str, Any]:
        """Hash the payout and submit to Thronos blockchain.

        Returns dict with ``success``, ``tx_hash``, and optional ``error``.
        """
        ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        tx_hash = self.hash_payout(
            booking_id=booking_id,
            guide_id=guide_id,
            guide_email=guide_email,
            amount=amount,
            currency=currency,
            platform_fee=platform_fee,
            timestamp=ts,
        )

        payload = {
            "tx": f"0xPAYOUT{tx_hash[:16]}",
            "network": "mainnet",
            "payout_data": {
                "type": "guide_payout",
                "booking_id": booking_id,
                "guide_id": guide_id,
                "amount": amount,
                "currency": currency,
                "platform_fee": platform_fee,
                "payout_hash": tx_hash,
                "timestamp": ts,
                "source": "skystriker",
            },
        }

        # Try Node 1 (master)
        result = self._submit_to_node(self.node1_url, payload, tx_hash)
        if result["success"]:
            return result

        # Fallback to Node 2 (replica)
        logger.warning("Node 1 failed, trying Node 2 for payout %s", booking_id)
        result = self._submit_to_node(self.node2_url, payload, tx_hash)
        if result["success"]:
            return result

        # If both nodes fail, still return the hash (it's deterministic and can be verified later)
        logger.error("Both nodes failed for payout %s – hash recorded locally only", booking_id)
        return {
            "success": False,
            "tx_hash": tx_hash,
            "error": "Blockchain nodes unreachable – hash recorded locally",
        }

    def _submit_to_node(
        self, node_url: str, payload: dict, tx_hash: str
    ) -> dict[str, Any]:
        try:
            response = requests.post(
                f"{node_url}/submit_block",
                json=payload,
                headers=self.headers,
                timeout=self.timeout,
            )
            if response.status_code == 200:
                logger.info(
                    "Payout hash %s submitted to %s", tx_hash[:16], node_url
                )
                return {
                    "success": True,
                    "tx_hash": tx_hash,
                    "node_url": node_url,
                    "response": response.json(),
                }
            logger.warning(
                "Node %s returned %d: %s",
                node_url,
                response.status_code,
                response.text[:200],
            )
            return {"success": False, "tx_hash": tx_hash, "error": f"HTTP {response.status_code}"}
        except requests.exceptions.Timeout:
            return {"success": False, "tx_hash": tx_hash, "error": "Timeout"}
        except Exception as e:
            return {"success": False, "tx_hash": tx_hash, "error": str(e)}

    # ------------------------------------------------------------------
    # Verification
    # ------------------------------------------------------------------

    def verify_payout_hash(self, tx_hash: str) -> dict[str, Any]:
        """Check whether a payout hash exists on the blockchain."""
        for label, url in [("node1", self.node1_url), ("node2", self.node2_url)]:
            try:
                r = requests.get(
                    f"{url}/api/v1/tx/0xPAYOUT{tx_hash[:16]}",
                    headers=self.headers,
                    timeout=self.timeout,
                )
                if r.status_code == 200:
                    return {"success": True, "data": r.json(), "node": label}
            except Exception:
                continue
        return {"success": False, "error": "Hash not found on blockchain"}


# Singleton
thronos_blockchain = ThronosBlockchainService()
