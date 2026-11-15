"""
Pydantic schemas for the ML pipeline.

- ProfileFeatures : the 11 numeric / boolean features fed to the model.
- ScanRequest     : incoming scan request from the API.
- ScanResult      : scored result returned to the caller.
- TrainingMetrics : metrics emitted after a training run.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ProfileFeatures(BaseModel):
    """The eleven features extracted from a social-media profile."""

    followers: int = Field(0, ge=0, description="Total follower count")
    following: int = Field(0, ge=0, description="Total following count")
    follow_ratio: float = Field(
        0.0, ge=0.0, description="followers / (following + 1)"
    )
    posts: int = Field(0, ge=0, description="Number of posts / tweets")
    account_age_days: int = Field(
        0, ge=0, description="Days since account creation"
    )
    has_profile_pic: int = Field(
        1, ge=0, le=1, description="1 if the account has a non-default avatar"
    )
    bio_length: int = Field(0, ge=0, description="Character length of bio/about")
    username_digit_ratio: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="Ratio of digits to total characters in the username",
    )
    posts_per_day: float = Field(
        0.0, ge=0.0, description="posts / account_age_days"
    )
    external_url: int = Field(
        0, ge=0, le=1, description="1 if profile links to an external URL"
    )
    name_username_match: int = Field(
        0,
        ge=0,
        le=1,
        description="1 if display name closely matches the username",
    )


FEATURE_NAMES: List[str] = list(ProfileFeatures.model_fields.keys())


class ScanRequest(BaseModel):
    """Payload accepted by ``POST /scan/profile``."""

    platform: str = Field(
        ...,
        description="Platform identifier (x | instagram | facebook | telegram)",
    )
    handle_or_url: str = Field(
        ..., description="Username handle or profile URL to scan"
    )
    raw_profile_data: Optional[Dict[str, Any]] = Field(
        None, description="Pre-fetched raw profile JSON, if available"
    )


class ScanResult(BaseModel):
    """Scored result returned after profile analysis."""

    score: float = Field(..., ge=0.0, le=1.0, description="Risk probability")
    band: str = Field(
        ..., description="Risk band — HIGH, MEDIUM, or LOW"
    )
    explanation: Dict[str, Any] = Field(
        default_factory=dict,
        description="Per-feature contribution breakdown",
    )
    features_used: Dict[str, Any] = Field(
        default_factory=dict,
        description="Feature values fed to the model",
    )
    model_version: str = Field(
        "rf_v1", description="Identifier of the model version used"
    )


class TrainingMetrics(BaseModel):
    """Metrics emitted after a training run."""

    precision: float
    recall: float
    f1: float
    roc_auc: float
    confusion_matrix: List[List[int]] = Field(
        default_factory=list,
        description="2×2 confusion matrix [[TN, FP], [FN, TP]]",
    )
