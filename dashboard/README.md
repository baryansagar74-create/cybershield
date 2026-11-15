# ProfileGuard — Analyst Workstation UI (Prototype)
### ITBP Nodal Cyber Cell • Ministry of Home Affairs (MHA)

A high-density, institutional-grade analyst workstation prototype designed for trained cyber intelligence and nodal-cell officers working long operational shifts to detect fake/impersonating social media accounts, build tamper-evident cryptographic evidence packages, and execute statutory takedowns compliant with **Section 79(3)(b) of the Information Technology Act** and the **IT Rules (Amended 2026)**.

---

## 🏛️ System Philosophy & Design Direction

- **Institutional, Quiet & Precise:** Designed as an operational defense center, not a consumer marketing dashboard.
- **Calm, High-Density Information Architecture:** Dense where investigators require data density (queues, hashes, tabular telemetry); spacious where decisions are signed.
- **Human-in-the-Loop Safeguard:** Permanent shell enforcement: *"No notice is sent without analyst and nodal-cell approval."* Zero automated unilateral takedowns.
- **Pure Fictional Research Data:** Every handle, number, and bio is synthetic and explicitly marked *"illustrative data"* across all screens.

---

## 🎨 Design Tokens & Color Matrix

All tokens are defined as CSS variables in `src/design/tokens.css` with 100% WCAG AA contrast compliance:

| Token | Dark Mode (Default) | Light Mode (Alternative) | Operational Role |
| :--- | :--- | :--- | :--- |
| `--bg-base` | `#081A33` | `#F3F6FA` | Deep operational background |
| `--bg-raised` | `#0F2A4D` | `#FFFFFF` | Workstation panels & cards |
| `--bg-sunken` | `#06142A` | `#E6ECF4` | Inputs, secondary bars, alternating rows |
| `--line` | `#1E3A63` | `#D3DCE8` | Structural 1px borders & dividers |
| `--text` | `#E8EEF6` | `#0B2545` | High-contrast primary prose |
| `--text-muted` | `#93A4BD` | `#51627C` | Metadata, timestamps, secondary labels |
| `--brand-teal` | `#12A89D` | `#0E8C83` | Primary action buttons, active focus ring |
| `--brand-saffron` | `#F28C28` | `#C96A0C` | Medium risk band, urgent attention |
| `--risk-high` | `#E5484D` | `#C73338` | High risk band (Score ≥ 0.80), danger alerts |
| `--risk-low` | `#2F9E62` | `#237A4B` | Low risk (genuine), verified states |
| `--evidence` | `#8FA3C0` | `#51627C` | SHA-256 digests, forensic chips |

### Non-Color Status Signaling:
- **HIGH RISK:** Red + Filled Triangle (`▲`) + Text Label
- **MEDIUM RISK:** Saffron + Diamond (`◆`) + Text Label
- **LOW RISK:** Green + Circle (`●`) + Text Label

---

## 🖋️ Typography & Multilingual Support

- **Primary UI & Prose:** **IBM Plex Sans** with full fallback to **Noto Sans Devanagari** for accurate Hindi script rendering (supports military vocabulary like "आईटीबीपी", "कमांडो", "सीधी भर्ती").
- **Forensic Data & Telemetry:** **IBM Plex Mono** with tabular numeral alignment (`font-variant-numeric: tabular-nums`).
- **Scale:** 0.75rem (2xs), 0.8125rem (xs), 0.875rem (sm), 1rem (base), 1.25rem (lg), 1.5rem (xl), 2rem (2xl).

---

## ⚡ Signature Interactive Moments

1. **The Risk Dial (Assessment Screen):**
   - Semicircular dial (0.00 to 1.00) with three color zones (Low <0.50, Medium 0.50–0.79, High ≥0.80).
   - Damped spring sweep over 1.1s with ~3% overshoot, synchronous tabular score counter, and threshold tick pulses at 0.50 and 0.80.
   - Post-settle single breath pulse in the classified band color. Instant bypass when `prefers-reduced-motion` is active.
2. **Cryptographic Chain Verification (Audit Log):**
   - Sequential verification walking down ledger rows at 60ms/row with traveling scan line, teal border flash, and checkmark confirmation.
   - "Simulate tampering" toggle breaks block #5, immediately halting sequence and isolating the unverified chain.
3. **Six-Step Scan Pipeline (Scan Screen):**
   - Node-to-node traveling teal pulse representing simulated live analysis (`Input → Fetch → Extract → Score → Band → Review`) resolving into the forensic assessment dossier.

---

## 📱 The 10 Workstation Screens

1. **Sign-In:** Two-step authentication flow (Officer Service ID + 2FA TOTP code).
2. **Dashboard:** 4 count-up stat tiles, 14-day trend line chart (flags vs removals), live nearest statutory SLA panel, and triaged target queue.
3. **Scan Profile:** Input handle/URL, drag-and-drop evidentiary screenshot capture, 6-step animated pipeline.
4. **Assessment (Signature):** 3-column forensic dossier (captured profile, Risk Dial, SHAP explanation bars, Safe Browsing intelligence, emblem match, and decision bar).
5. **Flagged Queue:** Filterable data table (by platform, risk band, keyword), J/K keyboard navigation, and side drawer preview.
6. **Cases:** Kanban columns with live IT Rules statutory countdown timers (`Drafted`, `With nodal cell`, `Notice filed`, `Actioned`, `Rejected / appealed`).
7. **Case Detail:** Event timeline, Section 65B electronic record certificate, evidence package hashes, draft notice preview, and civilian appeal dismissal path.
8. **Audit Log:** Cryptographically chained SHA-256 audit ledger with live chain verification and tampering simulation.
9. **Nodal Cell Queue:** Executive authorization queue for confirmed cases requiring nodal officer sign-off before platform transmission, with weekly metrics preview.
10. **Settings & Design System:** Interactive showcase of design tokens, theme toggles, English/Hindi language switcher, density switcher, and reduced-motion controls.

---

## 🚀 How to Run

```bash
cd dashboard
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Or build for production preview
npm run build
npm run preview -- --port 5173
```
- Open [http://localhost:5173/](http://localhost:5173/) in any modern browser.
