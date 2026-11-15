import pytest
from app.models.predict import score_profile
from app.models.schemas import ProfileFeatures
from app.models.train import generate_synthetic_data


def test_generate_synthetic_data():
    df = generate_synthetic_data(n=100)
    assert len(df) == 100
    assert "followers" in df.columns
    assert "is_fake" in df.columns
    assert df["is_fake"].nunique() == 2


def test_score_profile_high_risk():
    features = {
        "followers": 12,
        "following": 2400,
        "posts": 2,
        "account_age_days": 9,
        "has_profile_pic": 0,
        "bio_length": 0,
        "username_digit_ratio": 0.5,
        "external_url": 1,
        "name_username_match": 0,
    }
    score, band, explanation = score_profile(features)
    assert score >= 0.70
    assert band in ("HIGH", "MEDIUM")


def test_score_profile_low_risk():
    features = {
        "followers": 1200,
        "following": 300,
        "posts": 150,
        "account_age_days": 800,
        "has_profile_pic": 1,
        "bio_length": 80,
        "username_digit_ratio": 0.0,
        "external_url": 0,
        "name_username_match": 1,
    }
    score, band, explanation = score_profile(features)
    assert score < 0.50
    assert band == "LOW"
