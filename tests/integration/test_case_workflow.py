def test_case_lifecycle_and_sla(client):
    email = "cases_officer@itbp.gov.in"
    password = "SecurePassword123!"

    client.post(
        "/auth/register",
        json={"email": email, "name": "Case Officer", "password": password, "role": "nodal_officer"},
    )
    login_res = client.post("/auth/login", data={"username": email, "password": password})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Scan profile
    scan_res = client.post(
        "/scan/profile",
        json={
            "platform": "instagram",
            "handle_or_url": "itbp_scam_cell",
            "raw_profile_data": {"followers": 10, "following": 3000, "account_age_days": 5},
        },
        headers=headers,
    )
    assessment_id = scan_res.json()["assessment_id"]

    # 2. Create case
    case_res = client.post(
        "/cases",
        json={"assessment_id": assessment_id, "trigger_type": "urgent_complaint"},
        headers=headers,
    )
    assert case_res.status_code == 201
    case_id = case_res.json()["id"]

    # 3. Update status to submitted
    up1 = client.patch(
        f"/cases/{case_id}/status",
        json={"status": "submitted", "notes": "Submitted to I4C Sahyog portal"},
        headers=headers,
    )
    assert up1.status_code == 200

    # 4. Generate Sahyog notice package
    notice_res = client.post(f"/cases/{case_id}/generate-notice", headers=headers)
    assert notice_res.status_code == 200
    assert "SECTION 79(3)(b)" in notice_res.json()["legal_notice_body"]

    # 5. Verify audit chain
    verify_res = client.get("/audit/verify", headers=headers)
    assert verify_res.status_code == 200
    assert verify_res.json()["is_valid"] is True
