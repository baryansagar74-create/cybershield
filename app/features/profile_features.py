"""
ProfileGuard — Profile Feature Extraction
=========================================

Extracts the standard 11 feature set from raw API payloads across X, Instagram,
Facebook, and Telegram, or manual inputs.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.models.schemas import ProfileFeatures


def _calc_digit_ratio(username: str) -> float:
    if not username:
        return 0.0
    digits = sum(c.isdigit() for c in username)
    return round(digits / len(username), 3)


def _calc_name_username_match(name: str, username: str) -> int:
    if not name or not username:
        return 0
    clean_name = re.sub(r"[^a-zA-Z0-9]", "", name).lower()
    clean_user = re.sub(r"[^a-zA-Z0-9]", "", username).lower()
    if clean_name in clean_user or clean_user in clean_name:
        return 1
    # Check partial overlap
    tokens = set(re.findall(r"\w+", name.lower()))
    user_tokens = set(re.findall(r"\w+", username.lower()))
    if tokens & user_tokens:
        return 1
    return 0


def _parse_account_age_days(created_at_val: Any) -> int:
    if not created_at_val:
        return 180  # Default reasonable assumption if missing
    try:
        if isinstance(created_at_val, (int, float)):
            dt = datetime.fromtimestamp(created_at_val, tz=timezone.utc)
        elif isinstance(created_at_val, str):
            from dateutil.parser import parse
            dt = parse(created_at_val)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
        else:
            return 180
        diff = datetime.now(timezone.utc) - dt
        return max(1, diff.days)
    except Exception:
        return 180


def extract_features_from_x(data: Dict[str, Any]) -> ProfileFeatures:
    """Extract features from X API v2 user payload or analyst evidence."""
    metrics = data.get("public_metrics", {})
    followers = metrics.get("followers_count", data.get("followers", 0))
    following = metrics.get("following_count", data.get("following", 0))
    posts = metrics.get("tweet_count", data.get("posts", 0))
    username = data.get("username", data.get("handle", ""))
    name = data.get("name", username)
    description = data.get("description", data.get("bio", ""))
    profile_image_url = data.get("profile_image_url", "")

    if "has_profile_pic" in data:
        has_pic = int(data["has_profile_pic"])
    else:
        has_pic = 0 if "default_profile_images" in profile_image_url else (1 if profile_image_url else 1)

    if "account_age_days" in data:
        age_days = max(int(data["account_age_days"]), 1)
    else:
        age_days = _parse_account_age_days(data.get("created_at"))

    external_url = 1 if (data.get("url") or re.search(r"https?://", description) or data.get("external_url")) else 0
    digit_ratio = _calc_digit_ratio(username) if "username_digit_ratio" not in data else float(data["username_digit_ratio"])
    match = _calc_name_username_match(name, username) if "name_username_match" not in data else int(data["name_username_match"])

    follow_ratio = round(followers / (following + 1), 4)
    posts_per_day = round(posts / max(age_days, 1), 4)

    return ProfileFeatures(
        followers=followers,
        following=following,
        follow_ratio=follow_ratio,
        posts=posts,
        account_age_days=age_days,
        has_profile_pic=has_pic,
        bio_length=len(description),
        username_digit_ratio=digit_ratio,
        posts_per_day=posts_per_day,
        external_url=external_url,
        name_username_match=match,
    )


def extract_features_from_instagram(data: Dict[str, Any]) -> ProfileFeatures:
    """Extract features from Meta/Instagram Business Discovery or analyst evidence payload."""
    followers = data.get("followers_count", data.get("followers", 0))
    following = data.get("follows_count", data.get("following", 0))
    posts = data.get("media_count", data.get("posts", 0))
    username = data.get("username", data.get("handle", ""))
    name = data.get("name", username)
    bio = data.get("biography", data.get("bio", ""))
    website = data.get("website", "")

    if "account_age_days" in data:
        age_days = max(int(data["account_age_days"]), 1)
    else:
        age_days = _parse_account_age_days(data.get("created_at"))

    if "has_profile_pic" in data:
        has_pic = int(data["has_profile_pic"])
    else:
        has_pic = 1 if data.get("profile_picture_url") else 0

    external_url = 1 if (website or re.search(r"https?://", bio) or data.get("external_url")) else 0
    digit_ratio = _calc_digit_ratio(username) if "username_digit_ratio" not in data else float(data["username_digit_ratio"])
    match = _calc_name_username_match(name, username) if "name_username_match" not in data else int(data["name_username_match"])

    return ProfileFeatures(
        followers=followers,
        following=following,
        follow_ratio=round(followers / (following + 1), 4),
        posts=posts,
        account_age_days=age_days,
        has_profile_pic=has_pic,
        bio_length=len(bio),
        username_digit_ratio=digit_ratio,
        posts_per_day=round(posts / max(age_days, 1), 4),
        external_url=external_url,
        name_username_match=match,
    )


def extract_features_from_telegram(data: Dict[str, Any]) -> ProfileFeatures:
    """Extract features from Telegram getChat response."""
    username = data.get("username", "")
    title = data.get("title", data.get("first_name", username))
    description = data.get("description", data.get("bio", ""))
    photo = 1 if data.get("photo") else 0

    members = data.get("member_count", data.get("members_count", 100))
    following = 0  # Telegram channels don't follow others
    age_days = 365  # Approximate if unknown

    external_url = 1 if re.search(r"https?://|t\.me/", description) else 0
    digit_ratio = _calc_digit_ratio(username)
    match = _calc_name_username_match(title, username)

    return ProfileFeatures(
        followers=members,
        following=following,
        follow_ratio=float(members),
        posts=10,
        account_age_days=age_days,
        has_profile_pic=photo,
        bio_length=len(description),
        username_digit_ratio=digit_ratio,
        posts_per_day=round(10 / age_days, 4),
        external_url=external_url,
        name_username_match=match,
    )


def extract_features(platform: str, raw_data: Dict[str, Any]) -> ProfileFeatures:
    """Universal feature extractor dispatch."""
    plat = platform.lower()
    if plat in ("x", "twitter"):
        return extract_features_from_x(raw_data)
    elif plat in ("instagram", "ig"):
        return extract_features_from_instagram(raw_data)
    elif plat in ("telegram", "tg"):
        return extract_features_from_telegram(raw_data)
    else:
        # Generic fallback mapping direct fields or using heuristics
        followers = raw_data.get("followers", raw_data.get("followers_count", 0))
        following = raw_data.get("following", raw_data.get("follows_count", 0))
        posts = raw_data.get("posts", raw_data.get("media_count", 0))
        age = raw_data.get("account_age_days", 100)
        username = raw_data.get("username", raw_data.get("handle", ""))
        name = raw_data.get("name", username)
        bio = raw_data.get("bio", raw_data.get("description", ""))

        return ProfileFeatures(
            followers=followers,
            following=following,
            follow_ratio=round(followers / (following + 1), 4),
            posts=posts,
            account_age_days=age,
            has_profile_pic=int(raw_data.get("has_profile_pic", 1)),
            bio_length=len(bio) if isinstance(bio, str) else 0,
            username_digit_ratio=_calc_digit_ratio(username),
            posts_per_day=round(posts / max(age, 1), 4),
            external_url=int(raw_data.get("external_url", 0)),
            name_username_match=_calc_name_username_match(name, username),
        )
