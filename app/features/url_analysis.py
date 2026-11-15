"""
ProfileGuard — URL Reputation and Phishing Analysis
===================================================

Extracts and validates URLs found in profiles/bios, running:
- Domain reputation heuristics (suspicious TLDs, IP hostnames, homographs)
- Integration with Google Safe Browsing and VirusTotal connector clients
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

from app.connectors.url_reputation import UrlReputationConnector

SUSPICIOUS_TLDS = {".xyz", ".top", ".tk", ".ml", ".ga", ".cf", ".gq", ".buzz", ".cam", ".work"}
OFFICIAL_DOMAINS = {"itbp.gov.in", "itbpolice.nic.in", "mha.gov.in", "cybercrime.gov.in"}


def extract_urls(text: str) -> List[str]:
    """Find all URLs in a string."""
    pattern = r"https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+[/\w\.-]*"
    return re.findall(pattern, text)


def analyze_url_heuristics(url: str) -> Dict[str, Any]:
    """Inspect URL structure for common phishing indicators."""
    flags = []
    risk = 0.0

    try:
        parsed = urlparse(url)
        hostname = (parsed.hostname or "").lower()

        # Check IP address host
        if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", hostname):
            flags.append("RAW_IP_HOSTNAME")
            risk += 0.40

        # Check suspicious TLD
        for tld in SUSPICIOUS_TLDS:
            if hostname.endswith(tld):
                flags.append("SUSPICIOUS_TLD")
                risk += 0.25
                break

        # Check typosquatting ITBP / GOV
        if "itbp" in hostname and not any(hostname.endswith(d) for d in OFFICIAL_DOMAINS):
            flags.append("TYPOSQUATTED_GOV_OR_ITBP_DOMAIN")
            risk += 0.50

        # Check URL shorteners
        if hostname in ("bit.ly", "tinyurl.com", "cutt.ly", "t.co", "is.gd"):
            flags.append("SHORTENED_URL")
            risk += 0.15

    except Exception:
        flags.append("INVALID_URL_FORMAT")
        risk += 0.10

    return {
        "url": url,
        "risk_score": min(round(risk, 3), 1.0),
        "flags": flags,
    }


async def evaluate_urls(urls: List[str]) -> Dict[str, Any]:
    """Evaluate multiple URLs through heuristics and external reputation APIs."""
    if not urls:
        return {"url_risk_score": 0.0, "analyzed_urls": [], "threat_detected": False}

    reputation_client = UrlReputationConnector()
    results = []
    max_risk = 0.0
    threat_detected = False

    for u in urls:
        heuristic = analyze_url_heuristics(u)
        rep = await reputation_client.check_url(u)

        combined_risk = max(heuristic["risk_score"], 0.8 if rep.get("is_threat") else 0.0)
        if rep.get("is_threat"):
            threat_detected = True

        heuristic["reputation_result"] = rep
        heuristic["combined_risk"] = combined_risk
        results.append(heuristic)
        max_risk = max(max_risk, combined_risk)

    return {
        "url_risk_score": round(max_risk, 3),
        "analyzed_urls": results,
        "threat_detected": threat_detected,
    }
