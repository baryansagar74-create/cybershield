def test_scan_profile_flow(client):
    email = "scanner@itbp.gov.in"
    password = "SecurePassword123!"

    client.post(
        "/auth/register",
        json={"email": email, "name": "Scanner Officer", "password": password, "role": "analyst"},
    )
    login_res = client.post("/auth/login", data={"username": email, "password": password})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Perform profile scan
    scan_res = client.post(
        "/scan/profile",
        json={
            "platform": "x",
            "handle_or_url": "fake_officer_9912",
            "raw_profile_data": {
                "username": "fake_officer_9912",
                "name": "ITBP Officer",
                "description": "ITBP recruitment officer direct bharti link",
                "followers": 15,
                "following": 2500,
                "account_age_days": 12,
                "has_profile_pic": 0,
            },
        },
        headers=headers,
    )
    assert scan_res.status_code == 200
    data = scan_res.json()
    assert data["score"] >= 0.70
    assert data["band"] in ("HIGH", "MEDIUM")
    assert "assessment_id" in data

    # Verify scan history
    hist_res = client.get("/scan/history", headers=headers)
    assert hist_res.status_code == 200
    assert len(hist_res.json()) >= 1
