# ProfileGuard REST API Documentation

Base URL: `http://localhost:8000` (or configured `APP_BASE_URL`)  
Interactive Swagger UI: `http://localhost:8000/docs`

---

## 1. Authentication (`/auth`)

### `POST /auth/register`
Create a new analyst or officer account.
```json
{
  "email": "officer@itbp.gov.in",
  "name": "Inspector R. Kumar",
  "password": "SecurePassword123!",
  "role": "analyst",
  "unit": "ITBP Cyber Command"
}
```

### `POST /auth/login`
Authenticate using OAuth2 form-encoded data (`username` and `password`).
Returns JWT access token:
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "role": "analyst",
  "twofa_required": false
}
```

### `POST /auth/2fa/setup`
Generate TOTP random secret and `otpauth://` provisioning URI for authenticator app.

### `POST /auth/2fa/verify`
Verify 6-digit TOTP code and enable 2FA on the user account.

---

## 2. Profile Scanner (`/scan`)

### `POST /scan/profile`
Evaluate a profile by handle or URL. Accepts optional analyst-captured raw JSON.
```json
{
  "platform": "x",
  "handle_or_url": "officer_rajesh_8841",
  "raw_profile_data": {
    "followers": 12,
    "following": 2400,
    "posts": 2,
    "account_age_days": 9,
    "has_profile_pic": 0,
    "username_digit_ratio": 0.5
  }
}
```
**Response:**
```json
{
  "assessment_id": "7f8b9a12-...",
  "account_id": "c3d4e5f6-...",
  "platform": "x",
  "handle": "officer_rajesh_8841",
  "score": 0.884,
  "band": "HIGH",
  "features": { ... },
  "explanation": { ... },
  "text_analysis": {
    "text_risk_score": 0.45,
    "flags": ["IMPERSONATION_KEYWORDS_DETECTED"]
  },
  "url_analysis": {
    "threat_detected": false,
    "url_risk_score": 0.0
  },
  "model_version": "rf_v1"
}
```

### `GET /scan/history?limit=20`
Returns recent assessment history.

---

## 3. Takedown Cases (`/cases`)

### `POST /cases`
Initialize a takedown case from an assessment ID.
```json
{
  "assessment_id": "7f8b9a12-...",
  "trigger_type": "urgent_complaint",
  "notes": "Impersonating officer and soliciting recruitment fees"
}
```

### `GET /cases`
List cases. Filter by `status` query parameter (`draft`, `submitted`, `platform_review`, `resolved`, `escalated`).

### `GET /cases/{id}`
Returns full case dossier, metadata, SLA countdown, and associated evidence.

### `PATCH /cases/{id}/status`
Transition case status through state machine:
```json
{
  "status": "platform_review",
  "notes": "Filing registered on Meta Law Enforcement Portal"
}
```

### `POST /cases/{id}/generate-notice`
Generates Section 79(3)(b) structured legal notice package ready for Sahyog portal filing.

---

## 4. Reports & Forensic Export (`/reports`)

### `GET /reports/evidence-pdf/{case_id}`
Streams downloadable evidence dossier PDF with forensic SHA-256 integrity hashes.

### `GET /reports/weekly`
Returns 7-day operational takedown and SLA compliance metrics.

---

## 5. Audit & Trust (`/audit`)

### `GET /audit/log?limit=50&offset=0`
Paginated immutable audit log entries.

### `GET /audit/verify`
Walks and cryptographically verifies the complete SHA-256 hash-chain.
```json
{
  "is_valid": true,
  "tamper_detected": false,
  "error_count": 0,
  "errors": []
}
```
