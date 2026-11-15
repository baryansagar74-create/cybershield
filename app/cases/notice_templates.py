"""
ProfileGuard — Notice Templates
===============================

Structured templates for:
- Section 79(3)(b) IT Act content removal notices (via I4C Sahyog Portal)
- Intermediary grievance/impersonation reports
- Law Enforcement Portal data requests

ALL LEGAL PROVISIONS AND TIME LIMITS MUST BE CONFIRMED WITH LEGAL COUNSEL.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict


def generate_sahyog_notice(
    case_ref: str,
    target_platform: str,
    target_handle: str,
    target_url: str,
    impersonated_entity: str,
    nodal_officer_name: str = "Authorized Nodal Officer",
    nodal_officer_unit: str = "ITBP Cyber Security Cell",
    offence_summary: str = "Impersonation of Indo-Tibetan Border Police (ITBP) Personnel and unauthorized solicitation",
) -> Dict[str, Any]:
    """
    Generate standard Section 79(3)(b) structured notice package.
    NOTE: CONFIRM WITH LEGAL before dispatch.
    """
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")

    body_text = f"""
NOTICE UNDER SECTION 79(3)(b) OF THE INFORMATION TECHNOLOGY ACT, 2000
READ WITH RULE 3(1)(d) OF THE INFORMATION TECHNOLOGY (INTERMEDIARY GUIDELINES
AND DIGITAL MEDIA ETHICS CODE) RULES, 2021 (AS AMENDED 2026)
[CONFIRM WITH LEGAL]

To: Grievance Officer / Legal Cell, {target_platform.capitalize()}
Notice Reference: {case_ref}
Date: {now_str}

1. IDENTITY OF COMPLAINANT AGENCY:
   Agency: Indo-Tibetan Border Police (ITBP), Ministry of Home Affairs, Government of India
   Issuing Cell: {nodal_officer_unit}
   Authorized Officer: {nodal_officer_name}

2. UNLAWFUL COMPUTER RESOURCE IDENTIFIED:
   Platform: {target_platform}
   Account Handle / Identifier: @{target_handle}
   Uniform Resource Locator (URL): {target_url}
   Impersonated Official Entity: {impersonated_entity}

3. GROUNDS AND APPLICABLE LEGAL PROVISIONS [CONFIRM WITH LEGAL]:
   The above-referenced profile has been verified as a fraudulent / impersonating account.
   The user falsely represents themselves as associated with the Indo-Tibetan Border Police (ITBP),
   an Armed Force of the Union guarding strategic borders.

   Applicable Offence Sections:
   - Section 66C, Information Technology Act, 2000 (Identity Theft / Fraudulent use of electronic signature/password/identity)
   - Section 66D, Information Technology Act, 2000 (Cheating by personation by using computer resource)
   - Relevant provisions under Bharatiya Nyaya Sanhita (BNS) for cheating and personation of public servant.

4. STATUTORY REQUISITION [CONFIRM WITH LEGAL]:
   Pursuant to Rule 3(1)(d) of the IT Rules 2021 (as amended 2026), you are hereby directed to
   remove or disable access to the offending account / profile within the stipulated timeframe of
   THREE (3) HOURS upon receipt of this reasoned government notice.

5. PRESERVATION OF EVIDENCE:
   Pursuant to Section 67C of the IT Act, 2000 and Rule 3(1)(h) of the IT Rules, you are required to
   preserve all electronic records, IP access logs, registration information, and communication metadata
   associated with this account for a minimum duration of 180 days for law enforcement access.

Issued by:
{nodal_officer_name}
{nodal_officer_unit}
Government of India
    """.strip()

    return {
        "case_ref": case_ref,
        "platform": target_platform,
        "target_handle": target_handle,
        "target_url": target_url,
        "issued_at": now_str,
        "sla_stipulation": "3 hours (Rule 3(1)(d) amendment 2026) [CONFIRM WITH LEGAL]",
        "legal_notice_body": body_text,
    }
