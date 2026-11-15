"""
ProfileGuard — Text and NLP Analysis
====================================

Analyzes bios, profile descriptions, and sample messages for:
- Impersonation keywords (ITBP, MHA, recruitment, officer ranks)
- Phishing and urgency phrases (English and Hindi)
- Repetitive / templated content
- Suspicious links or payment mentions (UPI, Paytm, telegram links)
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Tuple

# Impersonation triggers (ITBP and security forces)
OFFICIAL_KEYWORDS = [
    "itbp", "indo-tibetan", "indo tibetan", "border police", "mha", "paramilitary",
    "capf", "commandant", "inspector general", "dig itbp", "recruitment 2024",
    "recruitment 2025", "recruitment 2026", "itbp bharti", "bharti", "sub inspector",
    "constable", "commanding officer", "official handle", "itbp verified"
]

# Urgency / Scam phrases (English)
URGENCY_EN = [
    "urgent", "act now", "limited seats", "apply immediately", "pay fee",
    "registration fee", "admit card download", "exclusive link", "dm to join",
    "whatsapp to apply", "pension update", "kyc update", "congratulations selected"
]

# Urgency / Scam phrases (Hindi in Devanagari and Romanized)
URGENCY_HI = [
    "तुरंत", "भर्ती", "सीधी भर्ती", "पेंशन", "पंजीकरण शुल्क", "आवेदन करें",
    "अंतिम तिथि", "चयनित", "संपर्क करें", "व्हाट्सएप", "टेलीग्राम ज्वाइन करें",
    "bharti", "turant", "pension", "chayanit", "antim tithi"
]


def analyze_text(text: str) -> Dict[str, Any]:
    """
    Analyze bio or message text for impersonation, scam urgency, and scam links.
    Returns:
        dict with text_risk_score (0.0 to 1.0), flags, and detected entities.
    """
    if not text:
        return {"text_risk_score": 0.0, "flags": [], "matched_keywords": []}

    text_lower = text.lower()
    flags = []
    matched_keywords = []
    risk_score = 0.0

    # 1. Impersonation checks
    for kw in OFFICIAL_KEYWORDS:
        if kw in text_lower:
            matched_keywords.append(kw)
    if matched_keywords:
        flags.append("IMPERSONATION_KEYWORDS_DETECTED")
        risk_score += 0.35 + min(len(matched_keywords) * 0.1, 0.3)

    # 2. Urgency and Scam checks (English)
    urgency_hits = [u for u in URGENCY_EN if u in text_lower]
    if urgency_hits:
        flags.append("URGENCY_OR_SCAM_PATTERNS_EN")
        risk_score += 0.25

    # 3. Urgency and Scam checks (Hindi / Hinglish)
    urgency_hi_hits = [u for u in URGENCY_HI if u in text_lower]
    if urgency_hi_hits:
        flags.append("URGENCY_OR_SCAM_PATTERNS_HI")
        risk_score += 0.25

    # 4. Payment / UPI mentions
    if re.search(r"\b[\w\.\-]+@(upi|okhdfcbank|okicici|okaxis|ybl|paytm)\b", text_lower):
        flags.append("UPI_ID_IN_BIO")
        risk_score += 0.30

    if re.search(r"(\+91[\-\s]?)?[6789]\d{9}", text):
        flags.append("CONTACT_NUMBER_IN_BIO")
        risk_score += 0.15

    # 5. Shortened or redirect links
    if re.search(r"(bit\.ly|tinyurl\.com|t\.co|cutt\.ly|is\.gd|wa\.me|t\.me/joinchat)", text_lower):
        flags.append("SUSPICIOUS_REDIRECT_LINK")
        risk_score += 0.20

    score = min(round(risk_score, 3), 1.0)
    return {
        "text_risk_score": score,
        "flags": flags,
        "matched_keywords": matched_keywords,
        "urgency_triggers": urgency_hits + urgency_hi_hits,
    }
