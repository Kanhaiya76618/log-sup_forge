# 🚀 FlowForge — Master Frontend Specification & Cloning Prompt

> **System Blueprint**: Autonomous Supply Chain Intelligence Platform  
> **Aesthetic Identity**: *Bloomberg Terminal × Modern Aviation Control Tower × Apple Design Precision*  
> **Version**: Round 2 Final Production Blueprint  

---

## 📋 Table of Contents
1. [Visual Design System & Design Tokens](#1-visual-design-system--design-tokens)
2. [Global Layout & Header Navigation](#2-global-layout--header-navigation)
3. [Page 01 — Mission Control Overview (`/`)](#3-page-01--mission-control-overview-)
4. [Page 02 — Network Intelligence (`/network`)](#4-page-02--network-intelligence-network)
5. [Page 03 — Incident Response & Disruption Propagation (`/disruptions`)](#5-page-03--incident-response--disruption-propagation-disruptions)
6. [Page 04 — Simulation Lab (`/simulation`)](#6-page-04--simulation-lab-simulation)
7. [Page 05 — Decision Center & Round 2 Intelligence (`/decisions`)](#7-page-05--decision-center--round-2-intelligence-decisions)
8. [Interactive Modals & Sliding Drawers](#8-interactive-modals--sliding-drawers)
9. [FastAPI Backend API Contract & PostgreSQL Persistence](#9-fastapi-backend-api-contract--postgresql-persistence)
10. [Master Cloning Prompt for AI Agents](#10-master-cloning-prompt-for-ai-agents)

---

## 🎨 1. Visual Design System & Design Tokens

### Color Palette (Tailored HSL & Hex Tokens)
* **Background Canvas**: `#F6F6F3` (Warm Alabaster Off-White)
* **Surface Containers**: `#F4F2EC` (Freight Sand Container Surface)
* **Card & Modal Background**: `#FFFFFF` (Pure White)
* **Primary Accent**: `#D94E28` (Safety Industrial Orange — Buttons, Active Tabs, Highlights)
* **Success / Operational**: `#047857` (Emerald Green — Low Risk, Cost Savings, Online Status)
* **Warning / Alert**: `#D97706` (Amber Gold — Congestion Warnings, Pending Actions)
* **Danger / Failure**: `#991B1B` (Crimson Red — High Risk, Rejected Routes, SLA Breaches)
* **Typography Primary**: `#151719` (Slate Navy Black — Headings & Primary Text)
* **Borders & Dividers**: `#E5E7EB` / `#D6D3D1` (Stone 300 Clean Borders)

### Typography Pairing
1. **Primary UI & Headings**: `Inter` (Google Font, Weights `400`, `500`, `600`, `700`, `800`, `900`)
   - Extra-Bold Uppercase Headers: `text-4xl md:text-5xl lg:text-6xl font-black font-sans text-[#151719]`
2. **Editorial Cursive Flourish**: `Caveat` (Google Font, Script)
   - `.font-cursive`: Used for humanized highlights (e.g. *“what happens next.”*, *“one clear, explainable operational decision”*)
3. **Monospace Telemetry Metrics**: `JetBrains Mono` / `Fira Code`
   - Data Badges: `text-[10px] font-mono font-black tracking-widest`

---

## 🌐 2. Global Layout & Header Navigation

The top header is **sticky across all 5 pages** (`sticky top-0 z-50 bg-[#F6F6F3]/95 backdrop-blur-md border-b border-stone-300`).

### Header Layout Structure
* **Left Brand Identity**:
  - Logo Box: Orange square (`size-7 bg-[#D94E28] text-white font-mono font-black`) containing `"F"`.
  - Brand Text: **FLOWFORGE** (`text-base font-black text-[#151719]`) with subtitle `"SUPPLY CHAIN DECISION INTELLIGENCE"` (`text-[9px] font-mono text-stone-500 font-bold`).
* **Center Navigation Bar**:
  - Links: `Mission Control` (`/`), `Network` (`/network`), `Disruptions` (`/disruptions`), `Simulation` (`/simulation`), `Decisions` (`/decisions`).
  - Active Link Styling: Orange text (`#D94E28`), `font-black`, underline with `underline-offset-4 decoration-[#D94E28]`.
* **Right Action Controls Group**:
  1. **`+ NEW ANALYSIS`** CTA Button: High-visibility orange button (`bg-[#D94E28] text-white text-[10px] font-mono font-black px-3 py-1.5 rounded hover:bg-[#C84B24]`). Triggers `CreateScenarioModal`.
  2. **`DECISION HISTORY`** Pill: Bordered white button (`border border-stone-300 bg-white text-[10px] font-mono font-bold text-stone-700 px-2.5 py-1.5 rounded`). Triggers `DecisionHistoryDrawer`.
  3. **`SYSTEM ONLINE ▾`** Dropdown Badge: Green indicator pulse (`bg-[#047857] animate-pulse`). Triggers `SystemSettingsModal`.
  4. **`ENTER CONTROL TOWER →`** CTA: White pill button navigating to `/network`.

---

## 🏠 3. Page 01 — Mission Control Overview (`/`)

### Key Components & Layout
1. **Hero Headline Section**:
   - Tag: `[ ⚡ AUTONOMOUS DECISION ENGINE ]`
   - Headline: **WHEN THE SUPPLY CHAIN BREAKS, FLOWFORGE DECIDES** <span className="font-cursive">what happens next.</span>
   - Subtitle: *FlowForge is an autonomous supply-chain decision intelligence platform. It converts chaotic disruption signals, 10,000 Monte Carlo stochastic futures, and live AIS telemetry into one clear, explainable operational decision.*
2. **Continuous System Pipeline Step Bar**:
   - `DETECT` → `PREDICT` → `SIMULATE` → `OPTIMIZE` → `DECIDE`
3. **Disruption Pulse Grid**:
   - Displays real-time incident cards: Rotterdam Berth Congestion (`87% Congestion`), Arabian Sea Weather Hazard (`Wave Height 4.8m`), Singapore Transshipment Gap.
4. **Live AIS Vessel Telemetry Feed**:
   - Shows active vessels (`MV MAERSK MC-KINNEY`, `CMA CGM ANTOINE`, `MSC GULSUN`) with LAT/LON coordinates, speed in knots, and ETA countdowns.

---

## 🗺️ 4. Page 02 — Network Intelligence (`/network`)

### Key Components & Layout
1. **Dual View Toggle**: `[ 🌐 GLOBAL MAP VIEW ]` vs `[ 📊 NETWORK LIST VIEW ]`
2. **Interactive Node Inspector (Drawer)**:
   - Selecting a node (e.g., `Rotterdam NLRTM`, `Mumbai INNSA`, `Singapore SGSIN`, `Antwerp BEANR`) slides open a detailed telemetry drawer showing:
     - Congestion %, Capacity Utilization %, Expected Delay Hours, Affected Shipments count, Financial Impact ($ USD), and Risk Driver Breakdown.
3. **Simulated Bottleneck Control**:
   - Congestion slider (`40%` to `100%`) allowing operators to stress-test terminal throughput.

---

## 🚨 5. Page 03 — Incident Response & Disruption Propagation (`/disruptions`)

### Key Components & Layout
1. **Incident Selector Tabs**:
   - `Rotterdam Berth Congestion` (Critical)
   - `Arabian Sea Weather Hazard` (Severe)
   - `Singapore Transshipment Feeder Gap` (Warning)
2. **Impact Propagation Cascade Timeline**:
   - `T+0`: Berth bottleneck anomaly detected at Rotterdam terminal.
   - `T+4H`: Vessel turnaround time increases by +6.2 hours.
   - `T+8H`: Arrival schedules shift for 18 feeder vessels.
   - `T+12H`: Antwerp cross-dock warehouse capacity imbalance.
   - `T+18H`: Tier 1 customer deliveries at risk of SLA breach.
   - `T+24H`: Demurrage and penalty clauses trigger $82.4K exposure.
3. **Affected Shipments & Vessels Data Table**:
   - Filterable list of SKU lines, carriers, weight (MT), declared value, and current route exposure.

---

## 🎲 6. Page 04 — Simulation Lab (`/simulation`)

### Key Components & Layout
1. **10,000-Run Monte Carlo Stochastic Engine**:
   - Run simulation button: `"RUN 10,000 MONTE CARLO SIMULATION SCENARIOS"`
   - Interactive progress bar during calculation (`SAMPLING CONDITIONS` → `GENERATING FUTURES` → `EVALUATING ROUTES` → `CALCULATING TAILS`).
2. **Tabbed Distribution Curves**:
   - Tabs: `[ ETA DELAY ]`, `[ COST TAIL ]`, `[ COMPOSITE RISK ]`, `[ SERVICE LEVEL ]`
3. **Percentile Metrics Cards**:
   - **P50 Delay**: `+4.8 Hours` (Nominal median)
   - **P75 Delay**: `+8.6 Hours`
   - **P90 Delay**: `+13.7 Hours` (High stress)
   - **P95 Delay**: `+18.2 Hours` (95% Confidence Tail Risk)
   - **Financial Loss Avoided**: **`$63,000 USD`** Net Savings

---

## 🏆 7. Page 05 — Decision Center & Round 2 Intelligence (`/decisions`)

### Key Components & Layout
1. **Header & Context Banner**:
   - Page Title: **DECISION CENTER** <span className="font-cursive text-2xl text-[#D94E28]">— what should we do now?</span>
   - Previous Decision Context Banner: Displays stored operator overrides & previous preference history.
2. **Round 2 Action Buttons Row**:
   - **`[ APPROVE DECISION ]`** (Primary Orange `#D94E28`)
   - **`[ REJECT ]`** (Crimson Red `#991B1B`)
   - **`[ PAUSE ]`** (Amber `#D97706`)
   - **`[ SKIP ]`** (Stone Bordered)
   - **`[ OVERRIDE ]`** (Slate Navy `#151719`)
3. **Key Business Result Highlight Card**:
   - Massive numerical display: **`$63,000 USD`** *EXPECTED FINANCIAL LOSS AVOIDED* (Emerald Green `#047857`).
4. **Current Plan vs. FlowForge Plan Comparison Table**:
   | Operational Metric | Current Plan (Rotterdam) | FlowForge Plan (Antwerp) ★ | Delta / Improvement |
   | :--- | :--- | :--- | :--- |
   | **Disruption Risk** | `73%` | `28%` | **`-45 pts`** |
   | **Expected Delay** | `+18.4 Hours` | `+5.2 Hours` | **`-13.2 Hours`** |
   | **Expected Loss** | `$82,000 USD` | `$19,000 USD` | **`-$63,000 USD`** |
   | **Transport Cost** | `$84,000 USD` | `$89,000 USD` | `+$4,700 USD` |
   | **Service Level** | `71%` | `94%` | **`+23 pts`** |

5. **Explainable Route Tradeoff & Decision Rationale Report**:
   - **Why FlowForge Chose This**: Details P95 delay tail reduction, 64% risk reduction, high carrier berth reliability.
   - **Alternatives Evaluated**: Details why current route was rejected (87% congestion) and why air freight was rejected (excess cost).

---

## 📦 8. Interactive Modals & Sliding Drawers

### A. `CreateScenarioModal.tsx` (5-Step Guided Scenario Studio)
* **Trigger**: Clicking **`+ NEW ANALYSIS`** in header.
* **Portal Rendering**: Rendered via `createPortal(children, document.body)`.
* **5 Stepper Stages**:
  1. `01 SHIPMENT`: Searchable Origin Port (`CNSHA` Shanghai, `INNSA` Mumbai), Destination Port (`JPYOK` Yokohama, `NLRTM` Rotterdam), Ocean Carrier (`MAERSK`), Transport Mode (`Ocean`).
  2. `02 CARGO`: Cargo Weight in MT (`15 MT`), Quantity (`250 units`), Declared Value (`$120,000 USD`).
  3. `03 DELIVERY`: Baseline ETA in hours (`168 hours`).
  4. `04 CONDITIONS`: Live telemetry status matrix (`● LIVE DATA CONNECTED`) + Analysis Mode toggle (`Analyze Current Conditions` vs `Simulate Disruption Scenario`).
  5. `05 CONSTRAINTS & REVIEW`: `+ Advanced Constraints` toggle (max delay, max cost, priority) + scenario summary + **`RUN FLOWFORGE ANALYSIS →`** button.
* **Form Submission**: Posts JSON payload to `http://localhost:8000/api/v1/analyze`, stores results in `sessionStorage`, and navigates to `/simulation` or `/decisions`.

### B. `DecisionReasonModal.tsx` (Round 2 Abandonment Intelligence)
* **Trigger**: Clicking `[ APPROVE ]`, `[ REJECT ]`, `[ PAUSE ]`, `[ SKIP ]`, or `[ OVERRIDE ]` on Page 05.
* **Fields**:
  - Action Badge: `APPROVE`, `REJECT`, `PAUSE`, `SKIP`, `OVERRIDE`.
  - 10 Reason Categories: `COST`, `RISK`, `CAPACITY`, `CUSTOMER COMMITMENT`, `OPERATIONAL CONSTRAINT`, `PREFERENCE`, `DISAGREEMENT`, `DATA QUALITY`, `TIMING`, `OTHER`.
  - Disagreement Selector: `"I disagree with AI risk estimate"`, `"I disagree with delay calculation"`, etc.
  - Preferred Route Selector (for OVERRIDE): Compare AI Recommended Route (`Antwerp`) vs Human Selected Route (`Colombo`).
  - Resume Condition Input (for PAUSE): e.g., *"Resume when berth congestion drops below 60%"*.
  - 500-Character Counter Text Area for custom explanation.
* **Submission**: Posts to `POST /api/v1/decisions/outcome`, updates local decision state, and appends to persistent audit timeline.

### C. `DecisionHistoryDrawer.tsx`
* **Trigger**: Clicking `DECISION HISTORY` in header.
* **Features**: Right-sliding drawer showing decision audit history, human override reasons, and timestamped system events.

### D. `SystemSettingsModal.tsx`
* **Trigger**: Clicking `SYSTEM ONLINE` badge in header.
* **Features**: Live backend health status (`/health`, `/health/database`), model artifact registry status, and database connection status.

---

## ⚡ 9. FastAPI Backend API Contract & PostgreSQL Persistence

### API Endpoint: `POST /api/v1/analyze`
```json
{
  "origin_unlocode": "CNSHA",
  "destination_unlocode": "JPYOK",
  "cargo_weight_mt": 15.0,
  "cargo_value_usd": 120000.0,
  "cargo_quantity": 250,
  "shipment_mode": "Ocean",
  "carrier_code": "MAERSK",
  "shipment_date": "2026-08-22",
  "baseline_eta_hours": 168.0,
  "vendor": "GlobalTech Ltd",
  "fulfill_via": "Direct",
  "vendor_inco_term": "FOB",
  "enable_monte_carlo": true
}
```

### PostgreSQL 8 Core Tables Schema (`app/database/db.py`)
1. `users` (id, name, email, role, created_at)
2. `shipments` (id, origin_port, destination_port, carrier, shipment_mode, baseline_eta_hours, cargo_weight_mt, cargo_quantity, cargo_value_usd, created_at)
3. `disruptions` (id, shipment_id, disruption_type, location, severity, description, detected_at, status)
4. `analyses` (id, shipment_id, disruption_id, operational_stress, geo_port_risk, port_congestion, disruption_probability, predicted_eta_hours, delay_probability, weather_hazard, geopolitical_risk, carrier_risk, fuel_price_index, status, created_at)
5. `route_options` (id, analysis_id, route_code, route_name, origin, destination, via_port, distance_nm, additional_distance_nm, estimated_delay_hours, delay_avoided_hours, route_risk, feasible, route_score, is_recommended, created_at)
6. `simulation_results` (id, analysis_id, num_scenarios, time_horizon_hours, confidence_level, p50_delay_hours, p90_delay_hours, p95_delay_hours, expected_cost, p95_cost, cvar95, simulation_status, created_at)
7. `decisions` (id, analysis_id, simulation_id, recommended_route_id, risk_score, eta_score, cost_score, risk_weight, eta_weight, cost_weight, recommendation_score, recommended_action, expected_loss, reroute_cost, gross_savings, net_savings, status, created_at)
8. `decision_outcomes` (id, decision_id, action, status, reason_category, reason_subcategory, reason_text, recommended_route_id, selected_route_id, decision_maker, resume_condition, created_at)

---

## 🤖 10. Master Cloning Prompt for AI Agents

> **Instructions**: Copy and paste the prompt below into any AI Assistant or Coding Agent to build an exact replica of the FlowForge frontend application!

```text
You are an expert Next.js 16 (Turbopack) and TailwindCSS engineer. Build an enterprise supply chain intelligence web application called "FlowForge — Autonomous Supply Chain Intelligence".

Visual Aesthetic & Theme:
- Theme: "Bloomberg Terminal × Modern Aviation Operations Center × Apple-Level Precision"
- Palette: Background #F6F6F3 (Warm Alabaster), Surface #F4F2EC (Freight Sand), Card #FFFFFF, Primary #D94E28 (Safety Industrial Orange), Success #047857 (Emerald Green), Danger #991B1B (Crimson), Text #151719 (Slate Navy).
- Typography: Inter (Google Font) for headers/data, Caveat (Google Font Script) for cursive highlights (.font-cursive), JetBrains Mono for telemetry metrics.

Key Pages to Implement:
1. Header (Sticky across all pages):
   - Logo: Orange square with "F" + "FLOWFORGE" brand.
   - Nav: Mission Control (/), Network (/network), Disruptions (/disruptions), Simulation (/simulation), Decisions (/decisions).
   - Right Controls: "+ NEW ANALYSIS" CTA button (orange), "DECISION HISTORY" button, "SYSTEM ONLINE" health dropdown, "ENTER CONTROL TOWER →" CTA.

2. Page 01 — Mission Control (/):
   - Hero section with title: "WHEN THE SUPPLY CHAIN BREAKS, FLOWFORGE DECIDES <span class="font-cursive">what happens next.</span>"
   - Pipeline step bar: DETECT → PREDICT → SIMULATE → OPTIMIZE → DECIDE.
   - Disruption cards and live AIS vessel telemetry feed.

3. Page 02 — Network Intelligence (/network):
   - Dual view toggle: MAP vs NETWORK.
   - Interactive node drawer for Rotterdam, Mumbai, Singapore, Antwerp, Colombo, Jebel Ali showing congestion, capacity, delay, financial impact.

4. Page 03 — Incident Response (/disruptions):
   - Incident tabs (Rotterdam Berth Congestion, Arabian Sea Weather, Singapore Feeder Gap).
   - Impact propagation timeline from T+0 to T+24H.
   - Affected shipments data table.

5. Page 04 — Simulation Lab (/simulation):
   - 10,000-run Monte Carlo stochastic simulator.
   - Distribution tabs (ETA, COST, RISK, SERVICE LEVEL).
   - Percentile tail metrics (P50, P75, P90, P95) and financial loss avoided ($63,000 USD).

6. Page 05 — Decision Center (/decisions):
   - Headline: "DECISION CENTER <span class="font-cursive">— what should we do now?</span>"
   - Round 2 Action Buttons Row: [ APPROVE DECISION ], [ REJECT ], [ PAUSE ], [ SKIP ], [ OVERRIDE ].
   - Key Business Result Card: $63,000 USD Expected Financial Loss Avoided.
   - Current Plan vs FlowForge Plan comparison table.
   - Explainable Route Tradeoff Report ("Why FlowForge Chose This" vs "Alternatives Evaluated").

7. Modals & Drawers:
   - CreateScenarioModal (5-Step Stepper: 01 Shipment, 02 Cargo, 03 Delivery, 04 Conditions, 05 Constraints & Review). Submits to POST /api/v1/analyze.
   - DecisionReasonModal (Round 2 Abandonment Intelligence: 5 action states, 10 reason categories, disagreement selector, route comparison, resume condition, 500-char counter). Submits to POST /api/v1/decisions/outcome.
   - DecisionHistoryDrawer & SystemSettingsModal.

Ensure all components are fully responsive, clean, and execute with zero build errors in Next.js 16!
```

---
*Generated for FlowForge Autonomous Supply Chain Intelligence Platform.*
