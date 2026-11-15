import pytest
from app.features.profile_features import extract_features
from app.features.text_analysis import analyze_text
from app.features.url_analysis import analyze_url_heuristics


def test_profile_features_extraction():
    raw_x = {
        "username": "officer_8821",
        "name": "Rajesh Kumar",
        "description": "ITBP Commandant profile. Contact for recruitment.",
        "public_metrics": {
            "followers_count": 25,
            "following_count": 1800,
            "tweet_count": 5,
        },
        "created_at": "2026-01-01T00:00:00Z",
    }
    feats = extract_features("x", raw_x)
    assert feats.followers == 25
    assert feats.following == 1800
    assert feats.username_digit_ratio > 0.3


def test_text_analysis_impersonation_detection():
    bio = "Official ITBP recruitment notification. Direct bharti. Contact immediately."
    res = analyze_text(bio)
    assert res["text_risk_score"] > 0.3
    assert "IMPERSONATION_KEYWORDS_DETECTED" in res["flags"]


def test_url_analysis_phishing():
    url = "http://itbp-recruitment-portal.xyz/login"
    res = analyze_url_heuristics(url)
    assert res["risk_score"] >= 0.4
    assert any("TYPOSQUATTED" in f or "SUSPICIOUS_TLD" in f for f in res["flags"])
