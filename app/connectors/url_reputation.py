"""
ProfileGuard — URL Reputation Checker
======================================

Combines **Google Safe Browsing v4** and **VirusTotal v3** into a
single threat-assessment result for any URL.

Environment variables
---------------------
GOOGLE_SAFE_BROWSING_KEY, VIRUSTOTAL_API_KEY
"""

from __future__ import annotations

import asyncio
import logging
import os
from typing import Any, Dict, List, Optional

import httpx

from app.connectors import BaseConnector
from app.connectors.rate_limiter import RateLimiter

logger = logging.getLogger(__name__)

_SAFE_BROWSING_URL = (
    "https://safebrowsing.googleapis.com/v4/threatMatches:find"
)
_VIRUSTOTAL_URL = "https://www.virustotal.com/api/v3/urls"


class UrlReputationChecker(BaseConnector):
    """Check a URL against Google Safe Browsing and VirusTotal.

    Parameters
    ----------
    rate_limiter : RateLimiter | None
        Shared rate limiter (optional).
    """

    PLATFORM = "url_reputation"

    def __init__(self, rate_limiter: Optional[RateLimiter] = None) -> None:
        self._safe_browsing_key: str = os.getenv("GOOGLE_SAFE_BROWSING_KEY", "")
        self._virustotal_key: str = os.getenv("VIRUSTOTAL_API_KEY", "")
        self._rate_limiter = rate_limiter

        logger.info(
            "UrlReputationChecker initialised (gsb=%s, vt=%s)",
            self._mask_secret(self._safe_browsing_key),
            self._mask_secret(self._virustotal_key),
        )

    # ------------------------------------------------------------------ #
    #  BaseConnector interface                                            #
    # ------------------------------------------------------------------ #

    async def fetch_profile(self, handle: str) -> Dict[str, Any]:
        """Run a full threat assessment on *handle* (treated as a URL)."""
        return await self.assess(handle)

    def check_rate_limit(self) -> Dict[str, Any]:
        return {"remaining": None, "limit": None, "resets_at": None, "ok": True}

    def get_remaining_budget(self) -> Dict[str, Any]:
        return {"spent_usd": 0.0, "budget_usd": None, "remaining_usd": None}

    # ------------------------------------------------------------------ #
    #  Google Safe Browsing                                               #
    # ------------------------------------------------------------------ #

    async def check_safe_browsing(self, url: str) -> Dict[str, Any]:
        """Check *url* against Google Safe Browsing v4.

        Parameters
        ----------
        url : str
            The URL to look up.

        Returns
        -------
        dict
            ``{"safe": bool, "threats": list[str]}``
        """
        if self._is_mock_mode(self._safe_browsing_key):
            return self._mock_safe_browsing(url)

        if not self._safe_browsing_key:
            logger.warning("GOOGLE_SAFE_BROWSING_KEY not set — skipping check")
            return {"safe": True, "threats": [], "skipped": True}

        payload = {
            "client": {"clientId": "profileguard", "clientVersion": "1.0.0"},
            "threatInfo": {
                "threatTypes": [
                    "MALWARE",
                    "SOCIAL_ENGINEERING",
                    "UNWANTED_SOFTWARE",
                    "POTENTIALLY_HARMFUL_APPLICATION",
                ],
                "platformTypes": ["ANY_PLATFORM"],
                "threatEntryTypes": ["URL"],
                "threatEntries": [{"url": url}],
            },
        }

        params = {"key": self._safe_browsing_key}

        logger.info("UrlReputationChecker.check_safe_browsing: POST %s", _SAFE_BROWSING_URL)
        data = await self._request(
            "POST", _SAFE_BROWSING_URL, params=params, json_body=payload
        )

        matches: List[str] = []
        for match in data.get("matches", []):
            threat_type = match.get("threatType", "UNKNOWN")
            matches.append(threat_type)

        return {"safe": len(matches) == 0, "threats": matches}

    # ------------------------------------------------------------------ #
    #  VirusTotal                                                         #
    # ------------------------------------------------------------------ #

    async def check_virustotal(self, url: str) -> Dict[str, Any]:
        """Check *url* against VirusTotal v3.

        Parameters
        ----------
        url : str
            The URL to scan.

        Returns
        -------
        dict
            ``{"malicious": int, "suspicious": int, "harmless": int,
            "undetected": int, "scan_id": str | None}``
        """
        if self._is_mock_mode(self._virustotal_key):
            return self._mock_virustotal(url)

        if not self._virustotal_key:
            logger.warning("VIRUSTOTAL_API_KEY not set — skipping check")
            return {
                "malicious": 0,
                "suspicious": 0,
                "harmless": 0,
                "undetected": 0,
                "scan_id": None,
                "skipped": True,
            }

        headers = {"x-apikey": self._virustotal_key}

        logger.info("UrlReputationChecker.check_virustotal: POST %s", _VIRUSTOTAL_URL)

        # Step 1: submit URL for analysis
        async with httpx.AsyncClient(timeout=30.0) as client:
            submit_resp = await client.post(
                _VIRUSTOTAL_URL,
                headers=headers,
                data={"url": url},
            )

            if submit_resp.status_code in (401, 403):
                raise PermissionError("VirusTotal auth error: check VIRUSTOTAL_API_KEY")
            submit_resp.raise_for_status()
            submit_data = submit_resp.json()

        analysis_url = submit_data.get("data", {}).get("links", {}).get("self")
        if not analysis_url:
            logger.warning("VirusTotal: no analysis link returned")
            return {
                "malicious": 0,
                "suspicious": 0,
                "harmless": 0,
                "undetected": 0,
                "scan_id": None,
            }

        # Step 2: poll for results (simple retry)
        for _ in range(5):
            await asyncio.sleep(3)
            async with httpx.AsyncClient(timeout=30.0) as client:
                analysis_resp = await client.get(analysis_url, headers=headers)
                if analysis_resp.status_code != 200:
                    continue
                analysis_data = analysis_resp.json()
                status = (
                    analysis_data.get("data", {})
                    .get("attributes", {})
                    .get("status")
                )
                if status == "completed":
                    stats = (
                        analysis_data.get("data", {})
                        .get("attributes", {})
                        .get("stats", {})
                    )
                    return {
                        "malicious": stats.get("malicious", 0),
                        "suspicious": stats.get("suspicious", 0),
                        "harmless": stats.get("harmless", 0),
                        "undetected": stats.get("undetected", 0),
                        "scan_id": analysis_data.get("data", {}).get("id"),
                    }

        logger.warning("VirusTotal: analysis did not complete in time")
        return {
            "malicious": 0,
            "suspicious": 0,
            "harmless": 0,
            "undetected": 0,
            "scan_id": None,
            "timeout": True,
        }

    # ------------------------------------------------------------------ #
    #  Combined assessment                                                #
    # ------------------------------------------------------------------ #

    async def assess(self, url: str) -> Dict[str, Any]:
        """Run both Safe Browsing and VirusTotal and combine results.

        Parameters
        ----------
        url : str
            URL to assess.

        Returns
        -------
        dict
            ``{"platform": "url_reputation", "handle": str, "raw": dict,
            "threat_level": str, "is_malicious": bool}``
        """
        sb_result, vt_result = await asyncio.gather(
            self.check_safe_browsing(url),
            self.check_virustotal(url),
            return_exceptions=True,
        )

        # Handle exceptions gracefully
        if isinstance(sb_result, Exception):
            logger.error("Safe Browsing check failed: %s", sb_result)
            sb_result = {"safe": True, "threats": [], "error": str(sb_result)}
        if isinstance(vt_result, Exception):
            logger.error("VirusTotal check failed: %s", vt_result)
            vt_result = {
                "malicious": 0,
                "suspicious": 0,
                "harmless": 0,
                "undetected": 0,
                "scan_id": None,
                "error": str(vt_result),
            }

        # Determine combined threat level
        sb_threats = sb_result.get("threats", [])  # type: ignore[union-attr]
        vt_malicious = vt_result.get("malicious", 0)  # type: ignore[union-attr]
        vt_suspicious = vt_result.get("suspicious", 0)  # type: ignore[union-attr]

        is_malicious = bool(sb_threats) or vt_malicious > 3
        is_suspicious = vt_suspicious > 2 or (0 < vt_malicious <= 3)

        if is_malicious:
            threat_level = "high"
        elif is_suspicious:
            threat_level = "medium"
        else:
            threat_level = "low"

        return {
            "platform": "url_reputation",
            "handle": url,
            "raw": {
                "safe_browsing": sb_result,
                "virustotal": vt_result,
            },
            "threat_level": threat_level,
            "is_malicious": is_malicious,
        }

    # ------------------------------------------------------------------ #
    #  HTTP helper                                                        #
    # ------------------------------------------------------------------ #

    async def _request(
        self,
        method: str,
        url: str,
        *,
        params: Optional[Dict[str, str]] = None,
        json_body: Optional[Dict[str, Any]] = None,
        retries: int = 3,
    ) -> Dict[str, Any]:
        """Generic request with retry logic."""
        if self._rate_limiter and not self._rate_limiter.allow(self.PLATFORM):
            raise RuntimeError("Rate limit reached for URL reputation service")

        last_exc: Optional[Exception] = None
        for attempt in range(1, retries + 1):
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.request(
                        method, url, params=params, json=json_body
                    )

                if resp.status_code == 429:
                    wait = 2 ** attempt
                    logger.warning(
                        "URL rep service 429 — retrying in %ds", wait
                    )
                    await asyncio.sleep(wait)
                    continue

                if resp.status_code in (401, 403):
                    raise PermissionError(
                        f"URL rep service auth error ({resp.status_code})"
                    )

                if resp.status_code >= 500:
                    wait = 2 ** attempt
                    logger.warning(
                        "URL rep service %d — retrying in %ds",
                        resp.status_code,
                        wait,
                    )
                    await asyncio.sleep(wait)
                    continue

                resp.raise_for_status()
                return resp.json()

            except httpx.HTTPStatusError:
                raise
            except httpx.RequestError as exc:
                last_exc = exc
                await asyncio.sleep(2 ** attempt)

        raise ConnectionError(
            f"URL rep request failed after {retries} attempts"
        ) from last_exc

    # ------------------------------------------------------------------ #
    #  Mock responses                                                     #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _mock_safe_browsing(url: str) -> Dict[str, Any]:
        logger.info("MOCK MODE — returning synthetic Safe Browsing result for %s", url)
        # Simulate a clean result
        return {"safe": True, "threats": []}

    @staticmethod
    def _mock_virustotal(url: str) -> Dict[str, Any]:
        logger.info("MOCK MODE — returning synthetic VirusTotal result for %s", url)
        return {
            "malicious": 0,
            "suspicious": 0,
            "harmless": 65,
            "undetected": 5,
            "scan_id": "mock_scan_id_12345",
        }


# Backwards-compatible alias
UrlReputationConnector = UrlReputationChecker

