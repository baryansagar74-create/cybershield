"""
ProfileGuard — Real Social Media Web Scraper
=============================================
Tier-1 live data extraction using:
  • Playwright headless Chromium (Instagram, X/Twitter, Facebook, LinkedIn, YouTube)
  • Instaloader (Instagram – dedicated library, works without login for public profiles)
  • Open Graph / meta-tag extraction (generic fallback for any URL)

Returns the same dict schema as live_resolver.py so the resolver can
drop this in as tier-0 before the Gemini OSINT estimation.
"""

from __future__ import annotations

import asyncio
import html as html_lib
import json
import logging
import os
import re
import random
import time
from typing import Any, Dict, Optional
import httpx

logger = logging.getLogger("web_scraper")

# User-Agent pool – rotate to reduce bot detection
_UA_POOL = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
]


def _random_ua() -> str:
    return random.choice(_UA_POOL)


def _random_delay() -> float:
    return random.uniform(0.3, 1.2)


# ─────────────────────────────────────────────────────────
# Instagram via Instaloader (public profiles, no login)
# ─────────────────────────────────────────────────────────

def _instaloader_fetch(handle: str) -> Optional[Dict[str, Any]]:
    """Synchronous instaloader fetch — run in a thread executor."""
    try:
        import instaloader

        L = instaloader.Instaloader(
            download_pictures=False,
            download_videos=False,
            download_video_thumbnails=False,
            download_geotags=False,
            download_comments=False,
            save_metadata=False,
            compress_json=False,
            quiet=True,
            max_connection_attempts=2,
            request_timeout=12,
        )

        # Optional: Use credentials from .env if provided (improves rate limit)
        ig_user = os.getenv("INSTAGRAM_USERNAME", "").strip()
        ig_pass = os.getenv("INSTAGRAM_PASSWORD", "").strip()
        if ig_user and ig_pass:
            try:
                L.login(ig_user, ig_pass)
                logger.info("Instaloader: logged in as %s", ig_user)
            except Exception as login_exc:
                logger.warning("Instaloader login failed: %s", login_exc)

        profile = instaloader.Profile.from_username(L.context, handle)

        # Detect if the profile pic is the default avatar
        pic_url = profile.profile_pic_url or ""
        is_default_avatar = (
            "11906329_960233084022564_1448528159" in pic_url  # Instagram's default avatar CDN hash
            or "default" in pic_url.lower()
            or not pic_url
        )

        created_approx_days = 365  # instaloader doesn't expose account creation date directly

        return {
            "name": profile.full_name or handle,
            "username": profile.username,
            "platform": "instagram",
            "profile_type": "Verified Organization" if profile.is_verified else (
                "Public Figure / Celebrity" if profile.followers > 50_000 else "Civilian Personal Account"
            ),
            "followers": profile.followers,
            "following": profile.followees,
            "posts": profile.mediacount,
            "has_profile_pic": 0 if is_default_avatar else 1,
            "profile_pic_url": pic_url,
            "is_private": 1 if profile.is_private else 0,
            "is_verified": bool(profile.is_verified),
            "account_age_days": created_approx_days,
            "bio": profile.biography or "",
            "external_url": profile.external_url or "",
            "data_source": "live_scraped_instaloader",
        }

    except Exception as exc:
        logger.warning("Instaloader fetch failed for @%s: %s", handle, exc)
        return None


# ─────────────────────────────────────────────────────────
# Playwright-based scraper (Instagram / X / generic)
# ─────────────────────────────────────────────────────────

async def _playwright_scrape_instagram(handle: str) -> Optional[Dict[str, Any]]:
    """
    Playwright DOM scrape of instagram.com/{handle}.
    Public Instagram profiles expose basic data in meta tags even without login.
    """
    try:
        from playwright.async_api import async_playwright

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True, args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-blink-features=AutomationControlled",
            ])
            context = await browser.new_context(
                user_agent=_random_ua(),
                viewport={"width": 1280, "height": 800},
                locale="en-US",
            )
            page = await context.new_page()
            await page.goto(f"https://www.instagram.com/{handle}/", timeout=20_000, wait_until="domcontentloaded")
            await asyncio.sleep(_random_delay())

            html = await page.content()
            await browser.close()

        # Extract meta-og tags from raw HTML
        def _meta(prop: str) -> str:
            m = re.search(rf'<meta\s+property="{re.escape(prop)}"\s+content="([^"]*)"', html)
            if not m:
                m = re.search(rf'<meta\s+content="([^"]*)"\s+property="{re.escape(prop)}"', html)
            val = m.group(1) if m else ""
            return html_lib.unescape(val)

        og_title = _meta("og:title")  # e.g. "Cristiano Ronaldo (@cristiano) • Instagram photos and videos"
        og_desc = _meta("og:description")  # e.g. "681M Followers, 652 Following, 4,156 Posts..."
        og_image = _meta("og:image")

        # If page not found, account doesn't exist or private with no public metrics
        if not og_title or "isn't available" in html or "Page Not Found" in html or "Profile isn't available" in og_title:
            logger.info("Instagram profile @%s does not exist or isn't available", handle)
            return None

        # Instagram public profiles always contain follower telemetry in og:description
        if not og_desc or ("Follower" not in og_desc and "following" not in og_desc.lower()):
            logger.info("Instagram profile @%s has no public metrics in og:description", handle)
            return None

        # Parse name and handle from og:title
        name_match = re.match(r"^(.*?)\s*\(@", og_title)
        display_name = name_match.group(1).strip() if name_match else handle

        # Parse followers / following / posts from og:description
        followers = following = posts = 0
        if og_desc:
            clean_desc = re.sub(r'(\d),(\d)', r'\1\2', og_desc)
            f_m = re.search(r'([\d\.]+[KMBkmb]?)\s+Followers', clean_desc, re.I)
            fg_m = re.search(r'([\d\.]+[KMBkmb]?)\s+Following', clean_desc, re.I)
            p_m = re.search(r'([\d\.]+[KMBkmb]?)\s+Posts', clean_desc, re.I)

            if f_m:
                followers = _parse_abbreviated_number(f_m.group(1))
            if fg_m:
                following = _parse_abbreviated_number(fg_m.group(1))
            if p_m:
                posts = _parse_abbreviated_number(p_m.group(1))

        # Detect default avatar (CDN URLs for Instagram's default profile pics)
        is_default = not og_image or "11906329" in og_image or "default" in og_image.lower()

        return {
            "name": display_name,
            "username": handle,
            "platform": "instagram",
            "profile_type": "Verified Organization" if "Verified" in html or followers > 500_000 else (
                "Public Figure / Celebrity" if followers > 50_000 else "Civilian Personal Account"
            ),
            "followers": followers,
            "following": following,
            "posts": posts,
            "has_profile_pic": 0 if is_default else 1,
            "profile_pic_url": og_image,
            "is_private": 1 if "This Account is Private" in html else 0,
            "is_verified": bool("isVerified" in html and '"isVerified":true' in html) or followers > 1_000_000,
            "account_age_days": 365,
            "bio": og_desc or f"Instagram profile of @{handle}",
            "external_url": f"https://www.instagram.com/{handle}/",
            "data_source": "live_scraped_playwright_instagram",
        }

    except Exception as exc:
        logger.warning("Playwright Instagram scrape failed for @%s: %s", handle, exc)
        return None


async def _playwright_scrape_twitter(handle: str) -> Optional[Dict[str, Any]]:
    """
    Playwright DOM scrape of x.com/{handle} — extracts OG meta tags.
    Twitter requires login for most data, but og:image and og:description
    are often present on the initial HTML before the login wall.
    """
    try:
        from playwright.async_api import async_playwright

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True, args=["--no-sandbox"])
            context = await browser.new_context(
                user_agent=_random_ua(),
                viewport={"width": 1280, "height": 800},
                locale="en-US",
            )
            page = await context.new_page()
            # Try nitter.net first (open-source Twitter mirror, no login needed)
            nitter_hosts = [
                "https://nitter.poast.org",
                "https://nitter.privacydev.net",
                "https://nitter.1d4.us",
            ]
            html = ""
            for nitter in nitter_hosts:
                try:
                    resp = await page.goto(f"{nitter}/{handle}", timeout=12_000, wait_until="domcontentloaded")
                    if resp and resp.status == 200:
                        html = await page.content()
                        if handle.lower() in html.lower():
                            break
                except Exception:
                    continue

            if not html:
                # Fallback: try x.com directly
                await page.goto(f"https://x.com/{handle}", timeout=15_000, wait_until="domcontentloaded")
                await asyncio.sleep(_random_delay())
                html = await page.content()

            await browser.close()

        if not html or handle.lower() not in html.lower():
            return None

        def _meta(prop: str, attr: str = "property") -> str:
            m = re.search(rf'<meta\s+{attr}="{re.escape(prop)}"\s+content="([^"]*)"', html)
            if not m:
                m = re.search(rf'<meta\s+content="([^"]*)"\s+{attr}="{re.escape(prop)}"', html)
            return m.group(1) if m else ""

        og_title = _meta("og:title")
        og_desc = _meta("og:description")
        og_image = _meta("og:image")

        # Also try nitter-specific selectors
        follower_match = re.search(r'(\d[\d,\.]*)\s*Followers', html, re.IGNORECASE)
        following_match = re.search(r'(\d[\d,\.]*)\s*Following', html, re.IGNORECASE)
        tweets_match = re.search(r'(\d[\d,\.]*)\s*Tweets', html, re.IGNORECASE)

        followers = _parse_abbreviated_number(follower_match.group(1)) if follower_match else 0
        following = _parse_abbreviated_number(following_match.group(1)) if following_match else 0
        posts = _parse_abbreviated_number(tweets_match.group(1)) if tweets_match else 0

        # Try OG description for follower counts if direct scrape failed
        if followers == 0 and og_desc:
            nums = re.findall(r"([\d,\.]+[KMBkm]?)\s+(\w+)", og_desc)
            for val_str, label in nums:
                try:
                    val = _parse_abbreviated_number(val_str)
                    lbl = label.lower()
                    if "follow" in lbl and "ing" not in lbl:
                        followers = val
                    elif "following" in lbl:
                        following = val
                    elif "tweet" in lbl or "post" in lbl:
                        posts = val
                except Exception:
                    pass

        name_match = re.match(r"^(.*?)\s*\(@", og_title or "")
        display_name = name_match.group(1).strip() if name_match else handle

        verified = '"isBlueVerified":true' in html or "✓" in og_title or "verified" in html.lower()

        return {
            "name": display_name,
            "username": handle,
            "platform": "x",
            "profile_type": "Verified Organization" if verified else (
                "Public Figure / Celebrity" if followers > 50_000 else "Civilian Personal Account"
            ),
            "followers": followers,
            "following": following,
            "posts": posts,
            "has_profile_pic": 1 if og_image else 0,
            "profile_pic_url": og_image or "",
            "is_private": 1 if "This account's Tweets are protected" in html else 0,
            "is_verified": bool(verified),
            "account_age_days": 365,
            "bio": og_desc or "",
            "external_url": f"https://x.com/{handle}",
            "data_source": "live_scraped_playwright_twitter",
        }

    except Exception as exc:
        logger.warning("Playwright X/Twitter scrape failed for @%s: %s", handle, exc)
        return None


async def _playwright_scrape_generic(url: str, handle: str, platform: str) -> Optional[Dict[str, Any]]:
    """Generic OG meta extractor for any URL — last-resort live scrape."""
    try:
        from playwright.async_api import async_playwright

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=True, args=["--no-sandbox"])
            context = await browser.new_context(user_agent=_random_ua())
            page = await context.new_page()
            await page.goto(url, timeout=15_000, wait_until="domcontentloaded")
            await asyncio.sleep(_random_delay())
            html = await page.content()
            await browser.close()

        def _meta(prop: str, attr: str = "property") -> str:
            m = re.search(rf'<meta\s+{attr}="{re.escape(prop)}"\s+content="([^"]*)"', html)
            if not m:
                m = re.search(rf'<meta\s+content="([^"]*)"\s+{attr}="{re.escape(prop)}"', html)
            return m.group(1) if m else ""

        og_title = _meta("og:title") or _meta("title", "name") or handle
        og_desc = _meta("og:description") or _meta("description", "name") or ""
        og_image = _meta("og:image") or ""

        return {
            "name": og_title,
            "username": handle,
            "platform": platform,
            "profile_type": "Social Media Account",
            "followers": 0,
            "following": 0,
            "posts": 0,
            "has_profile_pic": 1 if og_image else 0,
            "profile_pic_url": og_image,
            "is_private": 0,
            "is_verified": False,
            "account_age_days": 365,
            "bio": og_desc,
            "external_url": url,
            "data_source": "live_scraped_playwright_generic",
        }

    except Exception as exc:
        logger.warning("Playwright generic scrape failed for %s: %s", url, exc)
        return None


# ─────────────────────────────────────────────────────────
# httpx lightweight meta-tag fetcher (fastest, no browser)
# ─────────────────────────────────────────────────────────

async def _httpx_meta_fetch(url: str, handle: str, platform: str) -> Optional[Dict[str, Any]]:
    """Fast OG meta-tag extraction without a full browser. Works for many non-SPA pages."""
    try:
        headers = {
            "User-Agent": _random_ua(),
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml",
        }
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            res = await client.get(url, headers=headers)
            if res.status_code != 200:
                return None
            html = res.text

        def _meta(prop: str, attr: str = "property") -> str:
            m = re.search(rf'<meta\s+{attr}="{re.escape(prop)}"\s+content="([^"]*)"', html)
            if not m:
                m = re.search(rf'<meta\s+content="([^"]*)"\s+{attr}="{re.escape(prop)}"', html)
            return m.group(1) if m else ""

        og_title = _meta("og:title") or handle
        og_desc = _meta("og:description") or ""
        og_image = _meta("og:image") or ""

        if not og_title or og_title == handle:
            return None

        return {
            "name": og_title,
            "username": handle,
            "platform": platform,
            "profile_type": "Social Media Account",
            "followers": 0,
            "following": 0,
            "posts": 0,
            "has_profile_pic": 1 if og_image else 0,
            "profile_pic_url": og_image,
            "is_private": 0,
            "is_verified": False,
            "account_age_days": 365,
            "bio": og_desc,
            "external_url": url,
            "data_source": "live_meta_httpx",
        }
    except Exception as exc:
        logger.warning("httpx meta fetch failed for %s: %s", url, exc)
        return None


# ─────────────────────────────────────────────────────────
# Number parser (handles "629M", "1.2K", "3,668")
# ─────────────────────────────────────────────────────────

def _parse_abbreviated_number(s: str) -> int:
    s = s.strip().replace(",", "").replace(" ", "")
    if not s:
        return 0
    try:
        multipliers = {"k": 1_000, "m": 1_000_000, "b": 1_000_000_000}
        lower = s.lower()
        for suffix, mult in multipliers.items():
            if lower.endswith(suffix):
                return int(float(lower[:-1]) * mult)
        return int(float(s))
    except (ValueError, OverflowError):
        return 0


# ─────────────────────────────────────────────────────────
# Public scraper facade
# ─────────────────────────────────────────────────────────

PLATFORM_URL_MAP = {
    "instagram": "https://www.instagram.com/{handle}/",
    "x": "https://x.com/{handle}",
    "twitter": "https://x.com/{handle}",
    "facebook": "https://www.facebook.com/{handle}",
    "youtube": "https://www.youtube.com/@{handle}",
    "linkedin": "https://www.linkedin.com/in/{handle}",
    "threads": "https://www.threads.net/@{handle}",
    "snapchat": "https://www.snapchat.com/add/{handle}",
    "pinterest": "https://www.pinterest.com/{handle}/",
    "reddit": "https://www.reddit.com/u/{handle}/",
    "tiktok": "https://www.tiktok.com/@{handle}",
}


async def scrape_profile(handle: str, platform: str = "instagram") -> Optional[Dict[str, Any]]:
    """
    Main entry point. Tries every available extraction method in fastest→best order.
    Returns None only when all methods fail (caller should fall back to Gemini OSINT).
    """
    platform_lower = platform.lower().strip()
    clean_handle = handle.strip().replace("@", "").lower()

    logger.info("🔍 Web scraper: starting live scrape for @%s on %s", clean_handle, platform_lower)

    # ── Instagram: Playwright DOM first (100% real live avatar and followers) ──
    if platform_lower == "instagram":
        result = await _playwright_scrape_instagram(clean_handle)
        if result:
            logger.info("✅ Playwright Instagram data returned for @%s (followers=%s)", clean_handle, result.get("followers"))
            return result

        # Fallback to instaloader if Playwright didn't get it
        loop = asyncio.get_event_loop()
        try:
            result = await loop.run_in_executor(None, _instaloader_fetch, clean_handle)
            if result:
                logger.info("✅ Instaloader live data returned for @%s: followers=%s", clean_handle, result.get("followers"))
                return result
        except Exception as exc:
            logger.warning("Instaloader executor error: %s", exc)

    # ── X / Twitter ────────────────────────────────────────────────────────
    elif platform_lower in ("x", "twitter"):
        result = await _playwright_scrape_twitter(clean_handle)
        if result:
            logger.info("✅ Playwright X/Twitter data returned for @%s", clean_handle)
            return result

    # ── Generic: Try httpx lightweight meta fetch first ────────────────────
    elif platform_lower in PLATFORM_URL_MAP:
        url = PLATFORM_URL_MAP[platform_lower].format(handle=clean_handle)

        # Try fast httpx first
        result = await _httpx_meta_fetch(url, clean_handle, platform_lower)
        if result and result.get("name") and result["name"] != clean_handle:
            logger.info("✅ httpx meta fetch succeeded for @%s on %s", clean_handle, platform_lower)
            return result

        # Try full Playwright browser
        result = await _playwright_scrape_generic(url, clean_handle, platform_lower)
        if result:
            logger.info("✅ Playwright generic scrape succeeded for @%s", clean_handle)
            return result

    logger.warning("❌ All scrape methods failed for @%s on %s", clean_handle, platform_lower)
    return None
