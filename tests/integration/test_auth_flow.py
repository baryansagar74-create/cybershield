def test_register_and_login_flow(client):
    email = "test_analyst@itbp.gov.in"
    password = "SecurePassword123!"

    # 1. Register
    reg_res = client.post(
        "/auth/register",
        json={"email": email, "name": "Test Officer", "password": password, "role": "analyst"},
    )
    assert reg_res.status_code == 201

    # 2. Login
    login_res = client.post(
        "/auth/login",
        data={"username": email, "password": password},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert token

    # 3. Access authenticated route
    me_res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email
