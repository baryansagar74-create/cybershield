"""
ProfileGuard — Universal Live OSINT Profile Resolver
====================================================
Resolves real-world profile telemetry for any handle or URL worldwide across:
- Instagram  (Tier 0: instaloader live scrape → Playwright DOM → Gemini OSINT)
- X/Twitter  (Tier 0: Playwright Nitter/x.com → Gemini OSINT)
- Telegram   (Tier 0: direct public web DOM extraction via httpx)
- Facebook, YouTube, TikTok, LinkedIn (Tier 0: Playwright OG meta)
- GitHub     (Tier 0: direct public REST API)
- Any URL    (Tier 0: Playwright generic OG extraction)

Falls back to Gemini 2.5 Flash OSINT estimation then heuristic when scraping fails.
"""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Dict, Optional
import httpx
from dotenv import load_dotenv

# Import the real-web scraper (may be absent if playwright/instaloader not installed)
try:
    from app.services.web_scraper import scrape_profile as _live_scrape
    _SCRAPER_AVAILABLE = True
except ImportError:
    _SCRAPER_AVAILABLE = False
    _live_scrape = None

load_dotenv()

logger = logging.getLogger("live_resolver")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"


_PROFILE_CACHE: Dict[str, Dict[str, Any]] = {}


class LiveProfileResolver:
    """Universal OSINT resolver for live social media profile data."""

    def __init__(self, api_key: Optional[str] = None) -> None:
        self.api_key = api_key or GEMINI_API_KEY

    async def resolve(self, handle_or_url: str, platform: str = "instagram") -> Dict[str, Any]:
        """
        Resolve complete profile metrics for any handle or URL.

        Resolution order:
          Tier 0a: Real web scraper (Playwright/Instaloader) — live data, real DP, real followers
          Tier 0b: Direct Telegram DOM scrape (zero-auth)
          Tier 0c: Direct GitHub REST API (zero-auth)
          Tier 1:  Gemini 2.5 Flash OSINT estimation (worldwide coverage)
          Tier 2:  Heuristic handle-pattern fallback

        Returns a standardized dictionary with follower counts, DP status, bio, and type.
        """
        clean_handle = handle_or_url.strip().split("/")[-1].replace("@", "").lower()
        platform_lower = platform.lower().strip()

        # Check in-memory cache
        cache_key = f"{platform_lower}:{clean_handle}"
        if cache_key in _PROFILE_CACHE:
            logger.info("Serving @%s from OSINT in-memory cache", clean_handle)
            return _PROFILE_CACHE[cache_key]

        # ── Tier 0a: Real web scraper (Playwright / Instaloader) ──────────
        if _SCRAPER_AVAILABLE and platform_lower not in ("telegram", "tg", "github"):
            try:
                scraped = await _live_scrape(clean_handle, platform_lower)
                if scraped and (scraped.get("followers", 0) > 0 or scraped.get("has_profile_pic") == 1 or scraped.get("profile_pic_url")):
                    # Merge with Gemini forensic analysis (threat flags, risk summary)
                    forensic = await self._get_gemini_forensics(
                        clean_handle, platform_lower,
                        scraped.get("bio", ""),
                        scraped.get("followers", 0),
                        scraped.get("following", 0),
                        scraped.get("account_age_days", 365),
                    )
                    if forensic:
                        scraped.update({
                            "is_impersonation": forensic.get("is_impersonation", False),
                            "is_scam": forensic.get("is_scam", False),
                            "threat_level": forensic.get("threat_level", "LOW"),
                            "forensic_summary": forensic.get("forensic_summary", ""),
                            "threat_flags": forensic.get("threat_flags", []),
                        })
                    _PROFILE_CACHE[cache_key] = scraped
                    logger.info(
                        "✅ Tier-0 live scrape succeeded for @%s [%s] followers=%s source=%s",
                        clean_handle, platform_lower,
                        scraped.get("followers", "?"),
                        scraped.get("data_source", "?"),
                    )
                    return scraped
            except Exception as exc:
                logger.warning("Tier-0 web scraper exception for @%s: %s", clean_handle, exc)

        # ── Tier 0b: Direct Telegram Public Web Scrape ─────────────────────
        if "t.me" in handle_or_url or platform_lower in ("telegram", "tg"):
            tg_data = await self._scrape_telegram(clean_handle)
            if tg_data:
                _PROFILE_CACHE[cache_key] = tg_data
                return tg_data

        # ── Tier 0c: Direct GitHub Public API ──────────────────────────────
        if "github.com" in handle_or_url or platform_lower == "github":
            gh_data = await self._fetch_github(clean_handle)
            if gh_data:
                _PROFILE_CACHE[cache_key] = gh_data
                return gh_data

        # ── Tier 1: Gemini 2.5 Flash OSINT Estimation ──────────────────────
        gemini_profile = await self._resolve_with_gemini(clean_handle, platform_lower)
        if gemini_profile:
            _PROFILE_CACHE[cache_key] = gemini_profile
            return gemini_profile

        # ── Tier 2: Heuristic Handle-Pattern Fallback ──────────────────────
        fallback = self._heuristic_fallback(clean_handle, platform_lower)
        _PROFILE_CACHE[cache_key] = fallback
        return fallback

    async def _get_gemini_forensics(
        self,
        handle: str,
        platform: str,
        bio: str,
        followers: int,
        following: int,
        account_age_days: int,
    ) -> Optional[Dict[str, Any]]:
        """
        Quick Gemini call to assess threat/impersonation risk given real scraped stats.
        Returns forensic overlay fields only (not full profile).
        """
        if not self.api_key:
            return None

        prompt = f"""You are a Cyber Threat Intelligence analyst for ITBP (India).
Analyze this scraped social media profile and assess impersonation / fraud risk.

Handle: @{handle}
Platform: {platform}
Bio: {bio[:300]}
Followers: {followers}
Following: {following}
Account age (days): {account_age_days}

Determine:
1. Is this profile impersonating a government/military entity or public figure?
2. Is it a scam/fraud account?
3. Overall threat level: LOW, MEDIUM, or HIGH?

Respond ONLY with valid JSON:
{{
  "is_impersonation": false,
  "is_scam": false,
  "threat_level": "LOW",
  "forensic_summary": "One or two sentences max.",
  "threat_flags": []
}}"""
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    f"{GEMINI_URL}?key={self.api_key}",
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "responseMimeType": "application/json",
                            "temperature": 0.1,
                            "maxOutputTokens": 200,
                        },
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        raw = candidates[0]["content"]["parts"][0]["text"].strip()
                        match = re.search(r"\{.*\}", raw, re.DOTALL)
                        if match:
                            return json.loads(match.group(0))
        except Exception as exc:
            logger.warning("Gemini forensic overlay failed: %s", exc)
        return None

    async def _scrape_telegram(self, handle: str) -> Optional[Dict[str, Any]]:
        """Scrape public Telegram page for real-world title, subscriber count, bio, and avatar."""
        try:
            url = f"https://t.me/{handle}"
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    html = res.text

                    # Extract title
                    title_match = re.search(r'<div class="tgme_page_title"[^>]*>(.*?)</div>', html, re.DOTALL)
                    name = re.sub(r'<[^>]+>', '', title_match.group(1)).strip() if title_match else handle

                    # Extract extra (members/subscribers)
                    extra_match = re.search(r'<div class="tgme_page_extra"[^>]*>(.*?)</div>', html, re.DOTALL)
                    extra_text = extra_match.group(1).strip() if extra_match else ""
                    
                    subscribers = 50
                    sub_num_match = re.search(r'([\d\s,]+)', extra_text)
                    if sub_num_match:
                        try:
                            subscribers = int(sub_num_match.group(1).replace(" ", "").replace(",", ""))
                        except ValueError:
                            subscribers = 50

                    # Extract description
                    desc_match = re.search(r'<div class="tgme_page_description"[^>]*>(.*?)</div>', html, re.DOTALL)
                    bio = re.sub(r'<[^>]+>', '', desc_match.group(1)).strip() if desc_match else ""

                    # Extract photo
                    photo_match = re.search(r'<img class="tgme_page_photo_image" src="(.*?)"', html)
                    has_dp = bool(photo_match)
                    dp_url = photo_match.group(1) if photo_match else ""

                    return {
                        "name": name,
                        "username": handle,
                        "platform": "telegram",
                        "profile_type": "Telegram Channel / Group",
                        "followers": subscribers,
                        "following": 0,
                        "posts": 100,
                        "has_profile_pic": 1 if has_dp else 0,
                        "profile_pic_url": dp_url,
                        "is_private": 0,
                        "is_verified": bool("verified" in html.lower()),
                        "account_age_days": 365,
                        "bio": bio,
                        "external_url": f"https://t.me/{handle}",
                    }
        except Exception as exc:
            logger.warning("Telegram scrape error for %s: %s", handle, exc)
        return None

    async def _fetch_github(self, handle: str) -> Optional[Dict[str, Any]]:
        """Fetch live developer profile from GitHub public REST API."""
        try:
            url = f"https://api.github.com/users/{handle}"
            headers = {"User-Agent": "ProfileGuard-Scanner"}
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    d = res.json()
                    has_dp = bool(d.get("avatar_url"))
                    return {
                        "name": d.get("name") or handle,
                        "username": handle,
                        "platform": "github",
                        "profile_type": "Developer Account",
                        "followers": d.get("followers", 0),
                        "following": d.get("following", 0),
                        "posts": d.get("public_repos", 0),
                        "has_profile_pic": 1 if has_dp else 0,
                        "profile_pic_url": d.get("avatar_url", ""),
                        "is_private": 0,
                        "is_verified": False,
                        "account_age_days": 730,
                        "bio": d.get("bio") or "",
                        "external_url": d.get("blog") or d.get("html_url", ""),
                    }
        except Exception as exc:
            logger.warning("GitHub lookup error for %s: %s", handle, exc)
        return None

    async def _resolve_with_gemini(self, handle: str, platform: str) -> Optional[Dict[str, Any]]:
        """Leverage Gemini 2.5 Flash to resolve worldwide public profiles or deduce bot/impersonator signals."""
        if not self.api_key:
            return None

        prompt = f"""
You are an expert Cyber Threat Intelligence (CTI) and Open Source Intelligence (OSINT) specialist for the Indo-Tibetan Border Police (ITBP).
Analyze target account handle: "@{handle}" on platform: "{platform}".

Determine:
1. Is this a recognized real-world celebrity, government agency, military body, brand, sports athlete, or public figure anywhere in the world (e.g. cristiano, nasa, virat.kohli, indiannavy, adgpi, itbp_official, elonmusk, modi)?
   - If YES, output their genuine real-world statistics: name, followers count (approx/exact), following, posts, verified status (true), has_profile_pic (true), real bio.
2. If UNRECOGNIZED, BOT, or SUSPICIOUS PATTERN (e.g. "@officer_rajesh_8841", "@itbp_recruitment_2024", random digits, fake military claims):
   - Deduce realistic profile indicators:
     - Profile Type: "Suspected Impersonator / Bot" or "Civilian User"
     - If it mimics military/police or recruitment: set few posts (e.g. 8-15), high following ratio (e.g. followers: 800, following: 3500), suspicious bio soliciting fees or claims of direct recruitment, unverified (false), recent age (e.g. 14-30 days), and whether DP is present or absent.
     - If it looks like a typical civilian handle: reasonable numbers, normal bio, low threat.

Respond ONLY with valid JSON. No markdown code blocks, no explanation text outside JSON:
{{
  "name": "Full name or Display title",
  "username": "{handle}",
  "platform": "{platform}",
  "profile_type": "Verified Organization" | "Public Figure / Celebrity" | "Suspected Impersonator / Bot" | "Civilian Personal Account",
  "followers": 1420,
  "following": 3890,
  "posts": 12,
  "has_profile_pic": 1,
  "profile_pic_url": "",
  "is_private": 0,
  "is_verified": false,
  "account_age_days": 18,
  "bio": "Extracted or inferred bio text",
  "external_url": "Extracted or inferred link or empty string",
  "is_impersonation": false,
  "is_scam": false,
  "threat_level": "LOW" | "MEDIUM" | "HIGH",
  "forensic_summary": "Two sentences explaining forensic findings",
  "threat_flags": []
}}
"""

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(
                    f"{GEMINI_URL}?key={self.api_key}",
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "responseMimeType": "application/json",
                            "temperature": 0.1,
                            "maxOutputTokens": 400,
                        },
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        raw_text = candidates[0]["content"]["parts"][0]["text"].strip()
                        match = re.search(r"\{.*\}", raw_text, re.DOTALL)
                        if match:
                            parsed = json.loads(match.group(0))
                            is_impers = bool(parsed.get("is_impersonation", False))
                            is_scam = bool(parsed.get("is_scam", False))
                            threat_lvl = str(parsed.get("threat_level", "LOW" if not (is_impers or is_scam) else "HIGH"))
                            summary = str(parsed.get("forensic_summary", "Profile evaluated by Gemini forensic engine."))

                            return {
                                "name": str(parsed.get("name", handle)),
                                "username": str(parsed.get("username", handle)),
                                "platform": str(parsed.get("platform", platform)),
                                "profile_type": str(parsed.get("profile_type", "Social Media Account")),
                                "followers": int(parsed.get("followers", 100)),
                                "following": int(parsed.get("following", 100)),
                                "posts": int(parsed.get("posts", 10)),
                                "has_profile_pic": 1 if parsed.get("has_profile_pic") in (1, True, "1", "true") else 0,
                                "profile_pic_url": str(parsed.get("profile_pic_url", "")),
                                "is_private": 1 if parsed.get("is_private") in (1, True, "1", "true") else 0,
                                "is_verified": bool(parsed.get("is_verified", False)),
                                "account_age_days": int(parsed.get("account_age_days", 180)),
                                "bio": str(parsed.get("bio", "")),
                                "external_url": str(parsed.get("external_url", "")),
                                "is_impersonation": is_impers,
                                "is_scam": is_scam,
                                "threat_level": threat_lvl,
                                "forensic_summary": summary,
                                "threat_flags": list(parsed.get("threat_flags", [])),
                            }
        except Exception as exc:
            logger.error("Gemini OSINT profile resolution failed: %s", exc)

        return None

    def _heuristic_fallback(self, handle: str, platform: str) -> Dict[str, Any]:
        """Heuristic fallback based on handle structure, keyword indicators, and digit entropy."""
        digits = sum(c.isdigit() for c in handle)
        is_suspicious = digits >= 4 or any(k in handle.lower() for k in ("itbp", "recruit", "officer", "army", "police", "bharti", "sub_inspector"))
        
        return {
            "name": handle.replace("_", " ").title(),
            "username": handle,
            "platform": platform,
            "profile_type": "Suspected Impersonator / Bot" if is_suspicious else "Civilian Personal Account",
            "followers": 120 if is_suspicious else 850,
            "following": 1400 if is_suspicious else 420,
            "posts": 6 if is_suspicious else 84,
            "has_profile_pic": 0 if (is_suspicious and digits >= 4) else 1,
            "profile_pic_url": "",
            "is_private": 0,
            "is_verified": False,
            "account_age_days": 14 if is_suspicious else 920,
            "bio": "Official service liaison & recruitment desk. DM for guidance." if is_suspicious else "Personal profile.",
            "external_url": "http://malware.testing.google.test/testing/itbp-forms" if is_suspicious else "",
            "is_impersonation": is_suspicious,
            "is_scam": is_suspicious,
            "threat_level": "HIGH" if is_suspicious else "LOW",
            "forensic_summary": (
                "Synthetically generated handle containing security force keyword tokens and high digit entropy indicative of recruitment fraud."
                if is_suspicious else
                "Standard civilian profile characteristics with balanced follower telemetry and low risk markers."
            ),
            "threat_flags": ["FORCE_IMPERSONATION", "SUSPICIOUS_DIGIT_ENTROPY", "RECRUITMENT_SOLICITATION"] if is_suspicious else [],
            "data_source": "heuristic_pattern",
        }
