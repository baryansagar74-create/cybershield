"""
ProfileGuard — Model Prediction Service
======================================

Loads trained model from ``app/models/model_registry/`` (or falls back to a calibrated
heuristic / embedded model), scores incoming features, and assigns risk bands.
"""

from __future__ import annotations

import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import joblib
import numpy as np
import pandas as pd

from app.config import settings
from app.models.schemas import FEATURE_NAMES, ProfileFeatures

logger = logging.getLogger(__name__)

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_DEFAULT_REGISTRY = _PROJECT_ROOT / "app" / "models" / "model_registry"

_CACHED_MODEL = None
_CACHED_MODEL_VERSION = "rf_v1"


def _get_registry_path() -> Path:
    d = Path(os.getenv("MODEL_REGISTRY_DIR", str(_DEFAULT_REGISTRY)))
    d.mkdir(parents=True, exist_ok=True)
    return d


def load_model(model_path: Optional[str] = None):
    """Load model from model_registry with in-memory caching."""
    global _CACHED_MODEL, _CACHED_MODEL_VERSION
    if _CACHED_MODEL is not None and model_path is None:
        return _CACHED_MODEL

    registry = _get_registry_path()
    if model_path:
        target_path = Path(model_path)
    else:
        # Check latest symlink or find latest timestamped model
        latest_link = registry / "latest_model.joblib"
        if latest_link.exists():
            target_path = latest_link.resolve() if latest_link.is_symlink() else latest_link
        else:
            models = sorted([p for p in registry.glob("rf_*_model.joblib") if not p.is_symlink()])
            if not models:
                models = sorted(registry.glob("*.joblib")) + sorted(registry.glob("*.pkl"))
            if not models:
                logger.info("No saved model found in registry, will train on demand or use heuristic.")
                return None
            target_path = models[-1]

    try:
        loaded = joblib.load(target_path)
        _CACHED_MODEL = loaded
        _CACHED_MODEL_VERSION = target_path.stem
        logger.info("Loaded model from %s", target_path)
        return _CACHED_MODEL
    except Exception as exc:
        logger.warning("Failed to load model from %s: %s", target_path, exc)
        return None


def _heuristic_score(feat: Dict[str, Any]) -> float:
    """Calibrated rule-based scoring when trained ML model file is not available."""
    score = 0.20  # Base prior

    follow_ratio = feat.get("follow_ratio", 0.0)
    following = feat.get("following", 0)
    followers = feat.get("followers", 0)
    account_age_days = feat.get("account_age_days", 100)
    has_profile_pic = feat.get("has_profile_pic", 1)
    username_digit_ratio = feat.get("username_digit_ratio", 0.0)
    external_url = feat.get("external_url", 0)
    name_username_match = feat.get("name_username_match", 1)
    bio_length = feat.get("bio_length", 30)

    # Suspicious signals
    if following > 1000 and followers < 50:
        score += 0.35
    elif following > 500 and follow_ratio < 0.1:
        score += 0.20

    if account_age_days < 30:
        score += 0.25
    elif account_age_days < 90:
        score += 0.10

    if not has_profile_pic:
        score += 0.20

    if username_digit_ratio > 0.4:
        score += 0.20
    elif username_digit_ratio > 0.25:
        score += 0.10

    if external_url and account_age_days < 60:
        score += 0.15

    if not name_username_match:
        score += 0.15

    if bio_length == 0:
        score += 0.10

    # Genuine signals
    if account_age_days > 730:
        score -= 0.25
    if followers > 500 and follow_ratio > 0.8:
        score -= 0.25
    if has_profile_pic and bio_length > 50 and name_username_match:
        score -= 0.15

    return float(np.clip(score, 0.01, 0.99))


def score_profile(
    profile_features: Dict[str, Any] | ProfileFeatures,
    model_path: Optional[str] = None,
) -> Tuple[float, str, Dict[str, Any]]:
    """
    Score profile features and return (score, band, explanation).

    Bands:
      - score >= RISK_HIGH (default 0.80) -> 'HIGH'
      - score >= RISK_MEDIUM (default 0.50) -> 'MEDIUM'
      - else -> 'LOW'
    """
    if isinstance(profile_features, ProfileFeatures):
        feat = profile_features.model_dump()
    else:
        feat = dict(profile_features)

    # Ensure derived features
    followers = feat.get("followers", 0)
    following = feat.get("following", 0)
    feat["follow_ratio"] = float(round(followers / (following + 1), 4))
    age = max(feat.get("account_age_days", 1), 1)
    posts = feat.get("posts", 0)
    feat["posts_per_day"] = float(round(posts / age, 4))

    model = load_model(model_path)
    model_version = _CACHED_MODEL_VERSION

    if model is not None:
        try:
            feat_vals = pd.DataFrame([feat])[FEATURE_NAMES].values
            prob = float(model.predict_proba(feat_vals)[0, 1])
            score = round(prob, 4)

            # Feature importance / explanation
            importances = getattr(model, "feature_importances_", None)
            if importances is not None:
                explanation = {
                    feat_name: round(float(imp), 4)
                    for feat_name, imp in zip(FEATURE_NAMES, importances)
                }
            else:
                explanation = {"model": "classifier"}
        except Exception as e:
            logger.warning("Model prediction failed, falling back to heuristic: %s", e)
            score = round(_heuristic_score(feat), 4)
            explanation = {"fallback": "heuristic", "reason": str(e)}
            model_version = "heuristic_v1"
    else:
        score = round(_heuristic_score(feat), 4)
        explanation = {
            "method": "heuristic_calibrated",
            "signals": {
                "follow_ratio": feat["follow_ratio"],
                "account_age_days": feat.get("account_age_days", 0),
                "username_digit_ratio": feat.get("username_digit_ratio", 0.0),
                "has_profile_pic": feat.get("has_profile_pic", 1),
            },
        }
        model_version = "heuristic_v1"

    # Band decision
    risk_high = getattr(settings, "risk_high", 0.80)
    risk_medium = getattr(settings, "risk_medium", 0.50)

    if score >= risk_high:
        band = "HIGH"
    elif score >= risk_medium:
        band = "MEDIUM"
    else:
        band = "LOW"

    return score, band, explanation
