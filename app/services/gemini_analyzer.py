"""
ProfileGuard — Gemini Multilingual Forensic Threat Analysis Service
===================================================================
Leverages Google Gemini 2.5 Flash for contextual Devanagari Hindi, Hinglish,
and English military impersonation and recruitment fraud analysis.
"""

from __future__ import annotations

import os
import json
import logging
from typing import Dict, Any, Optional
import httpx
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("gemini_analyzer")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = "gemini-2.5-flash"
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"


class GeminiAnalyzer:
    """Forensic AI Threat Explainer & Statutory Notice Generator."""

    def __init__(self, api_key: Optional[str] = None) -> None:
        self.api_key = api_key or GEMINI_API_KEY
        self.is_active = bool(self.api_key)
        if self.is_active:
            logger.info("GeminiAnalyzer initialized with model %s", GEMINI_MODEL)
        else:
            logger.warning("GEMINI_API_KEY not found in environment.")

    async def analyze_bio(self, bio_text: str, handle: str = "") -> Dict[str, Any]:
        """Contextually analyze text/bio for military impersonation, fee scams, and recruitment fraud."""
        if not self.is_active or not bio_text.strip():
            return {
                "active": False,
                "is_scam": False,
                "confidence": 0.0,
                "forensic_summary": "Gemini API key not configured or empty bio.",
                "flags": [],
            }

        prompt = (
            "You are a Senior Cyber Forensic Investigator for the Indo-Tibetan Border Police (ITBP) and Ministry of Home Affairs.\n"
            f"Analyze this social media profile body for target handle: @{handle}\n"
            f"Bio/Content: \"\"\"{bio_text}\"\"\"\n\n"
            "Task: Identify if this profile:\n"
            "1. Impersonates an ITBP, Indian Army, or police officer.\n"
            "2. Promotes fake recruitment drives ('सीधी भर्ती', 'ITBP recruitment') or solicits advance fees.\n"
            "3. Spreads malicious phishing links or disinformation.\n\n"
            "Respond ONLY in valid JSON format with keys:\n"
            "{\n"
            '  "is_impersonation": true/false,\n'
            '  "is_recruitment_scam": true/false,\n'
            '  "threat_level": "HIGH" | "MEDIUM" | "LOW",\n'
            '  "confidence": 0.0 to 1.0,\n'
            '  "forensic_summary": "Two sentences explaining exact violation of ITBP guidelines",\n'
            '  "flags": ["list", "of", "threat", "tags"]\n'
            "}"
        )

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(
                    f"{API_URL}?key={self.api_key}",
                    json={"contents": [{"parts": [{"text": prompt}]}]},
                )
                if res.status_code == 200:
                    data = res.json()
                    text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                    # Clean markdown code blocks if wrapped
                    if text.startswith("```json"):
                        text = text[7:]
                    if text.endswith("```"):
                        text = text[:-3]
                    parsed = json.loads(text.strip())
                    parsed["active"] = True
                    return parsed
                else:
                    logger.error("Gemini API error: %s - %s", res.status_code, res.text)
                    return {"active": False, "error": f"API error {res.status_code}"}
        except Exception as exc:
            logger.error("Failed to analyze text with Gemini: %s", exc)
            return {"active": False, "error": str(exc)}

    async def draft_section79_notice(
        self,
        handle: str,
        platform: str,
        violations: list[str],
        evidence_hash: str,
    ) -> str:
        """Draft an authoritative, court-admissible Section 79(3)(b) takedown notice."""
        if not self.is_active:
            return (
                f"Formal Notice under Section 79(3)(b) Information Technology Act 2000.\n"
                f"Target: @{handle} on {platform.upper()}.\n"
                f"Evidence SHA-256 Digest: {evidence_hash}.\n"
                f"Statutory Deadline: 36 Hours pursuant to IT Rules 2026."
            )

        prompt = (
            f"Draft a formal, legally enforceable statutory takedown notice for the Nodal Cyber Cell of the Indo-Tibetan Border Police (ITBP).\n"
            f"Target Account: @{handle} on {platform.upper()}\n"
            f"Violations: {', '.join(violations)}\n"
            f"Cryptographic SHA-256 Evidence Seal: {evidence_hash}\n"
            f"Statutory References: Section 79(3)(b) Information Technology Act, 2000 and Rule 3(1)(d) of the IT (Intermediary Guidelines) Rules, Amended 2026.\n"
            "Format the notice formally addressed to the Resident Grievance Officer of the platform."
        )

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(
                    f"{API_URL}?key={self.api_key}",
                    json={"contents": [{"parts": [{"text": prompt}]}]},
                )
                if res.status_code == 200:
                    data = res.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"].strip()
                return "Failed to generate notice via Gemini."
        except Exception as exc:
            logger.error("Gemini notice drafting failed: %s", exc)
            return f"Notice generation fallback for @{handle}."
