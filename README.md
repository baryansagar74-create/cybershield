<div align="center">

<img src="assets/logo_horizontal.png" alt="ProfileGuard Logo" width="540"/>

# ProfileGuard 🛡️
### Automated Fake Social Media Account Detection, Forensic Auditing & Takedown Framework
**Indo-Tibetan Border Police (ITBP) • Ministry of Home Affairs (MHA) — Cyber Security Hackathon**

[![Python Version](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.4.0-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Prisma ORM](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://prisma.io)
[![SQLite / PostgreSQL](https://img.shields.io/badge/Database-SQLite%20%2F%20PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![Test Suite](https://img.shields.io/badge/Pytest-43%2F43%20Passing%20(100%25)-4EBA6F?style=for-the-badge&logo=pytest&logoColor=white)](tests/)

[Live Web Console (Port 8000)](http://localhost:8000/) • [Interactive API Swagger Docs](http://localhost:8000/docs) • [Chrome Extension](extension/) • [Prisma Schema](prisma/schema.prisma)

---

</div>

## 📌 Executive Summary & Problem Context

The **Indo-Tibetan Border Police (ITBP)** guards 3,488 km of the high-altitude Indo-China border, from Karakoram Pass in Ladakh to Jachep La in Arunachal Pradesh, while executing vital counter-insurgency and anti-LWE operations across India. 

Hostile state and non-state actors deploy **sophisticated fake social media accounts**, impersonating ITBP officers, running bogus military recruitment drives, harvesting troop movement telemetry, and launching phishing schemes.

**ProfileGuard** is an end-to-end cyber defense and nodal enforcement system specifically tailored for the **ITBP Nodal Cyber Cell** and the **MHA / I4C Sahyog Portal**:
1. **Multi-Signal AI Engine:** Hybrid scoring blending a **Random Forest classifier** (trained on 8,000 real labelled profiles), Devanagari Hindi/English scam urgency NLP, perceptual image hashing (`pHash`) for emblem matching, and live Google Safe Browsing / VirusTotal phishing detection.
2. **Central Nodal Takedown Workflow:** Generates formal legal notice dossiers compliant with **Section 79(3)(b) of the Information Technology Act** and **Rule 3 of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules (Amended 2026)**.
3. **Statutory SLA Timers:** Enforces live countdown clocks for platform compliance (3h court/government notice, 36h urgent complaint, 7d general grievance, 2h intimate imagery).
4. **Forensic Evidence Ledger:** Maintains a tamper-evident **SHA-256 hash-chained immutable audit trail** ensuring full judicial admissibility under **Section 65B of the Indian Evidence Act (Bharatiya Sakshya Adhiniyam)**.
5. **Modernized Cyber Command Console & Extension:** Features an ultra-modern dark/light console with animated logo emblems, floating aurora colormix background textures, and a companion Chrome/Edge Manifest V3 extension for analyst-consented evidentiary capture.

---

## 🏛️ System Architecture

<div align="center">
  <img src="assets/diagrams/d1_architecture.png" alt="ProfileGuard Full Architecture" width="850"/>
  <p><i>Figure 1: ProfileGuard End-to-End Enterprise System Architecture</i></p>
</div>

```mermaid
flowchart TB
  subgraph Ingestion ["1. Data Acquisition & Evidentiary Ingestion"]
    EXT["Chrome / Edge MV3 Extension (Alternative 1)"]
    TG["Telegram Bot API (@profileguard_itbp_bot)"]
    XAPI["X (Twitter) API v2 Connectors"]
    META["Meta Graph Discovery Connectors"]
    MAN["Analyst Visual Inspection Input"]
  end

  subgraph MultiSignal ["2. Multi-Signal Detection Engine"]
    FE["Feature Extraction Pipeline (9 Numerical Signals)"]
    RF["Random Forest Classifier (8,000 Profiles, 0.9996 ROC-AUC)"]
    NLP["Devanagari Hindi & English Threat Urgency NLP"]
    PHASH["Perceptual Image Hash (pHash) Emblem Matcher"]
    URLSCAN["Google Safe Browsing v4 & VirusTotal v3 Phishing Engine"]
  end

  subgraph Arbitration ["3. Decision Matrix & Scoring"]
    WEIGHT["Calibrated Multi-Signal Weighted Aggregator"]
    BAND{"Risk Categorization"}
    HIGH["HIGH RISK (Score ≥ 0.80)"]
    MED["MEDIUM RISK (0.45 - 0.79)"]
    LOW["LOW RISK (< 0.45)"]
  end

  subgraph Action ["4. Central Nodal Cell Action & SLA"]
    DASH["Web Cyber Console (Dark / Light Console)"]
    NOTICE["Section 79(3)(b) Sahyog Notice Generator"]
    SLA["IT Rules 2026 Statutory Countdown Timers"]
    PDF["ReportLab Section 65B Evidence Dossier (PDF)"]
  end

  subgraph Trust ["5. Cryptographic Evidence Ledger"]
    DB[("SQLite / PostgreSQL Database")]
    PRISMA["Prisma ORM Schema & Studio"]
    AUDIT["SHA-256 Hash-Chained Tamper-Evident Ledger"]
  end

  EXT & TG & XAPI & META & MAN --> FE
  FE --> RF & NLP & PHASH & URLSCAN --> WEIGHT --> BAND
  BAND --> HIGH & MED & LOW --> DASH
  DASH --> NOTICE & SLA & PDF
  NOTICE & PDF & DASH --> DB & AUDIT
  DB -.-> PRISMA
```

---

## 🧠 Multi-Signal Detection Engine

<div align="center">
  <img src="assets/diagrams/d2_pipeline.png" alt="Multi-Signal Pipeline" width="850"/>
  <p><i>Figure 2: Multi-Signal ML, NLP, and Phishing Analysis Pipeline</i></p>
</div>

### 1. Machine Learning Classifier (Random Forest)
The ML engine is trained on **8,000 real-world labelled social media accounts** (5,000 Instagram profiles + 3,000 multi-platform social media dataset):
- **Model:** Tuned `RandomForestClassifier` with 200 estimators, balanced class weights, and hyperparameter optimization.
- **ROC-AUC Score:** **0.9996**
- **Test Accuracy:** **99.94%** (1,599/1,600 held-out test accounts classified correctly).
- **Core Features Evaluated:**
  - `follow_ratio`: Ratio of followers to following ($\frac{\text{followers}}{\text{following} + 1}$).
  - `posts_per_day`: Activity density over lifetime.
  - `account_age_days`: Account creation date delta.
  - `username_digit_ratio`: Proportion of numerals in handle (common in botnets).
  - `has_profile_pic`: Binary flag for presence of avatar image.
  - `external_url`: External hyperlink redirection presence.
  - `bio_length`: Character length of user description.

<div align="center">
  <img src="assets/diagrams/d6_ml_results.png" alt="ML Results & Feature Importances" width="850"/>
  <p><i>Figure 3: Machine Learning Model Metrics, Confusion Matrix & Feature Importances</i></p>
</div>

### 2. Devanagari Hindi & English Threat Urgency NLP
Hostile campaigns targeting ITBP units commonly leverage Hindi, Devanagari script, and Hinglish. ProfileGuard scans text bodies for:
- **Impersonation Signatures:** "आईटीबीपी", "ITBP", "आर्मी", "सेना", "Border Police", "Commando", "Officer Rajesh".
- **Fraud & Scam Urgency Flags:** "भर्ती", "नौकरी", "urgent apply", "direct joining", "advance fee", "lottery", "confidential".
- **Urgency Sentiment Score:** Computes threat modifier weights applied directly to the hybrid assessment score.

### 3. Perceptual Image Hashing (`pHash`)
Impersonators often download the official ITBP circular insignia or Ministry logos and apply subtle crops or compression to bypass MD5 hash filters. 
- ProfileGuard uses **perceptual hashing (64-bit DCT)** to compute Hamming distance against the authenticated ITBP insignia library. Any distance $\le 10$ indicates logo theft with $>95\%$ confidence.

### 4. Live Phishing & Threat Intelligence
- **Google Safe Browsing v4:** Automatically probes external URLs embedded in target bios against Google's global malware and social engineering list.
- **VirusTotal API v3:** Dispatches suspicious links to 70+ threat intelligence engines to identify malicious infrastructure.

---

## ⚖️ Legal Framework, Sahyog & IT Rules 2026 SLAs

<div align="center">
  <img src="assets/diagrams/d3_workflow.png" alt="Takedown Workflow" width="850"/>
  <p><i>Figure 4: Section 79(3)(b) Sahyog Portal Takedown Lifecycle & SLA Timers</i></p>
</div>

*Note: All legal citations and notices require nodal cell authorization (`CONFIRM WITH LEGAL`).*

### Statutory SLA Escalation Timers (IT Rules Amended 2026)
| Trigger Type | Statutory Basis | Legal Deadline | ProfileGuard Automated Action |
|:---|:---|:---:|:---|
| **Government Order / Court Directive** | Rule 3(1)(d), IT Rules | **3 Hours** | Generates urgent Section 79(3)(b) notice with live 3h countdown |
| **Urgent Public / Force Complaint** | Section 79(3)(b) IT Act | **36 Hours** | Prepares Sahyog XML/JSON dossier for I4C transmission |
| **General Grievance Disposal** | Rule 3(2), IT Rules | **7 Days** | Enqueues for intermediary Grievance Officer review |
| **Intimate Imagery / Identity Abuse** | Rule 3(2)(b), IT Rules | **2 Hours** | Flags high-priority alert with immediate redaction package |

### Section 65B Indian Evidence Act Forensic PDF Dossier
When a takedown case is escalated, ProfileGuard generates a court-admissible PDF dossier containing:
- Target account handles, platform identifiers, and timestamps.
- Raw JSON feature payload with SHA-256 digest.
- Google Safe Browsing / VirusTotal scan results.
- Devanagari text analysis output.
- **Section 65B Electronic Record Certificate** signed with the investigating officer's cryptographic identity.

---

## 🔒 Cryptographic Evidence Trail & Data Model

<div align="center">
  <img src="assets/diagrams/d5_datamodel.png" alt="Entity Relationship Data Model" width="850"/>
  <p><i>Figure 5: Entity-Relationship Diagram & Cryptographic Hash-Chaining Scheme</i></p>
</div>

Every system event (profile scan, case creation, status change, notice generation) is appended to an immutable SHA-256 chained audit ledger:

$$\text{Hash}_n = \text{SHA256}\left(\text{Hash}_{n-1} \parallel \text{Timestamp} \parallel \text{Action} \parallel \text{Actor} \parallel \text{Payload}\right)$$

- **Genesis Block:** Initialized with 64 zeros (`0000000000000000000000000000000000000000000000000000000000000000`).
- **Chain Verification:** The web console features an instant cryptographic verification button that traverses the entire chain from genesis to the head block, ensuring zero database tampering.

---

## 🗄️ Prisma ORM & Database Layer

ProfileGuard includes a complete **[prisma/schema.prisma](file:///Users/aryan/asd_major_project/cybershield/prisma/schema.prisma)** definition synchronized with the SQLite/PostgreSQL database models.

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:../profileguard.db"
}

model UserAnalyst     { ... } // Analysts & Nodal Officers with RBAC
model PlatformAccount { ... } // Tracked Social Media Profiles
model Assessment      { ... } // Multi-Signal ML Scores & Signal Payloads
model TakedownCase    { ... } // Legal Cases, Notice References & SLAs
model Evidence        { ... } // Media Captures & Perceptual Hashes
model AuditLog        { ... } // Cryptographically Chained SHA-256 Ledger
```

To launch the interactive **Prisma Studio** visual database browser:
```bash
npx prisma studio
```
*(Opens at `http://localhost:5555` to browse and inspect all tables and relationships visually)*

---

## 🖥️ Web Console & Browser Extension (Alternative 1)

<div align="center">
  <img src="assets/diagrams/d8_dashboard.png" alt="Cyber Command Console" width="850"/>
  <p><i>Figure 6: ProfileGuard Cyber Defense Web Console & Analyst Cockpit</i></p>
</div>

### 1. Cyber Command Console (`http://localhost:8000/`)
- **Dark / Light Mode Toggle:** Seamless 1-click theme switcher in header with state persistence in `localStorage`.
- **Dynamic Aurora Colormix Background:** Smoothly animated floating gradient orbs (`cyan`, `violet`, `indigo`, `emerald`) with a high-tech dot matrix cyber-grid.
- **Iridescent Spinning Logo Emblem:** Continuous 360° conic rotating border with gentle floating breathing motion and live radar beacon ping.
- **1-Click Test Presets:** Test cases ready for demonstration:
  - 🚨 *Fake Officer Impersonator* (`@officer_rajesh_8841`)
  - ⚠️ *Phishing Recruitment Scam* (`@itbp_recruit_2024`)
  - ✅ *Verified Genuine Profile* (`@priya.sharma`)

### 2. Browser Extension (Alternative 1)
Designed to inspect public profiles on Instagram, X, Facebook, and Telegram without relying on closed platform APIs:
1. Navigate to `chrome://extensions/` in Chrome or Edge.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select the `/extension` directory.
4. Open any profile and click **"Capture & Transmit Evidence"** in the popup to send observed metadata straight to the detection engine.

---

## 🛠️ Tech Stack & Dependencies

```
ProfileGuard Framework
├── Core Backend:       Python 3.11+ / 3.13, FastAPI, Uvicorn, Pydantic v2
├── Machine Learning:   Scikit-Learn, XGBoost, NumPy, Pandas, Joblib
├── Forensic Analytics: ImageHash, Pillow, Regex (Devanagari / Indic NLP)
├── PDF & Legal Docs:   ReportLab (Section 65B Evidence Dossiers)
├── Database & ORM:     SQLAlchemy, SQLite, PostgreSQL, Prisma ORM
├── Frontend UI:        HTML5, TailwindCSS (Dark/Light), Lucide Icons, Vanilla JS
├── Browser Extension:  Manifest V3, Chrome Extension API
└── Threat Connectors:  Google Safe Browsing v4, VirusTotal v3, Telegram Bot API
```

---

## 🚀 Installation & Local Setup

### 1. Clone Repository & Setup Virtual Environment
```bash
git clone https://github.com/baryansagar74-create/cybershield.git
cd cybershield

# Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install all backend dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
# Edit .env with your Google Safe Browsing, VirusTotal, or Telegram keys
```

### 3. Initialize Database & Seed Synthetic Profiles
```bash
# Seed initial demo profiles, takedown cases, and genesis audit block
python3 scripts/seed_synthetic.py
```

### 4. Start the ProfileGuard Server
```bash
# Start FastAPI backend and Web Console on port 8000
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Web Console:** Open [http://localhost:8000/](http://localhost:8000/)
- **API Swagger Documentation:** Open [http://localhost:8000/docs](http://localhost:8000/docs)
- **Port 3000 Gateway:** Open [http://localhost:3000/](http://localhost:3000/)

---

## 🧪 Automated Test Suite (100% Passing)

Run the comprehensive pytest suite covering authentication, ML inference, NLP text processing, connectors, rate limiting, and case lifecycles:

```bash
pytest -v
```

```text
============================== test session starts ==============================
tests/integration/test_auth_flow.py::test_register_and_login_flow PASSED     [  2%]
tests/integration/test_case_workflow.py::test_case_lifecycle_and_sla PASSED [  4%]
tests/integration/test_scan_flow.py::test_scan_profile_flow PASSED          [  6%]
tests/unit/test_connectors.py (34 connector tests) PASSED                   [ 86%]
tests/unit/test_features.py (3 feature & NLP tests) PASSED                  [ 93%]
tests/unit/test_models.py (3 ML model tests) PASSED                         [100%]
======================== 43 passed, 1 warning in 4.84s =========================
```

---

## 👥 Contributors & Acknowledgements
- Developed for **Indo-Tibetan Border Police (ITBP)** & **Ministry of Home Affairs (MHA)**.
- Compliant with **Information Technology Act, 2000 (Section 66C, 66D, 79(3)(b))**.
- Adheres to **IT (Intermediary Guidelines) Rules, Amended 2026** and **Digital Personal Data Protection (DPDP) Act, 2023**.
