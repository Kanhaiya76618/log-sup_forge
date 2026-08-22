# 🌊 FlowForge: Maritime Supply Chain Disruption OS

[![Next.js](https://img.shields.io/badge/Next.js-16.3.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

> **FlowForge** is a next-generation Maritime Exception & Supply Chain Decision Intelligence Operating System. It pairs real-time satellite AIS telemetry, atmospheric radar forecasts, trained machine learning models, and mathematical constraint solvers (Google OR-Tools CP-SAT) with an autonomous 9-agent cooperative pipeline to predict maritime disruptions, calculate financial exposure, and automatically orchestrate recovered nautical routes.

---

## 🌟 Key Architecture & Highlights

### 1. 🪐 Interactive 3D Cobe Earth Globe (Right Corner Command Widget)
- **Real-time WebGL Globe**: Rendered with great-circle nautical arcs connecting global ports (e.g., Jawaharlal Nehru / Mumbai ➔ Port of Yokohama, Singapore ➔ Antwerp).
- **Interactive Control**: Inertial mouse drag rotation and **mouse-wheel smooth zoom in/out** with clamped boundary scaling.
- **Direct 2D Navigation**: Integrated **"Track Shipment (2D Map)"** button inside the 3D widget for instant camera transition to the 2D geospatial port network.

### 2. 🗺️ Interactive 2D World Map (Suppliers & Port Hubs)
- Embedded Google Maps engine with customized nautical coordinates.
- Dynamic pulsating status pins (`on-time` Emerald, `delayed` Amber, `critical` Rose).
- Interactive click tooltips showcasing vessel tracking IDs, origin/destination ports, speed, and real-time ETA slips.

### 3. 🤖 The 9-Agent Decision Intelligence Pipeline
Cooperative multi-agent architecture resolving maritime supply chain exceptions:
1. **Agent 01: Live Risk Detection Agent** — Ingests Open-Meteo atmospheric radar & AIS stream to flag storm anomalies.
2. **Agent 02: Shipment Disruption Predictor** — XGBoost classification model predicting voyage disruption probability.
3. **Agent 03: ETA Delay Predictor** — LightGBM regression model estimating arrival calendar variance in days.
4. **Agent 04: Port Congestion Agent** — RandomForest model forecasting terminal berth queues and dwell times (e.g., Yokohama 31h dwell, 74% load).
5. **Agent 05: Inventory Impact Agent** — Predicts downstream warehouse stockouts and buffer depletion horizons.
6. **Agent 06: Cost & Financial Exposure Engine** — Computes demurrage fees, SLA breach penalties, and fuel burn delta.
7. **Agent 07: Route Optimization Agent** — Google OR-Tools CP-SAT mathematical solver generating 3 optimal recovery scenarios.
8. **Agent 08: Digital Twin Simulation Engine** — 500-sample probabilistic Monte Carlo simulation stress-testing scenarios under wave and weather stochasticity.
9. **Agent 09: Supervisor / Orchestrator Agent** — Coordinates peer agent outputs, verifies Human-in-the-Loop (HITL) approval limits, and dispatches automated Port Authority notices.

---

## 🖥️ Workspace Features & Interactive Modules

| Feature Module | Path / Component | Description |
| :--- | :--- | :--- |
| **Operations Dashboard** | `/dashboard` (`app/dashboard/page.tsx`) | Primary command center featuring the 3D globe, live agent event bus, telemetry metrics, and inventory flow charts. |
| **Inventory Management** | `InventoryView.tsx` | Real-time stock levels across global port buffers, category filters, quick restock actions, and add SKU modal. |
| **Logistics & Fleet** | `LogisticsView.tsx` | Active sea voyages, voyage creator modal, vessel capacity (TEUs), speeds, and Telemetry Inspector. |
| **Suppliers & Port Directory**| `SuppliersView.tsx` | Carrier scorecard, dwell-time compliance, partner registration, and the full interactive **2D World Map**. |
| **Users & Access Control** | `UsersView.tsx` | Role-Based Access Control (RBAC) and Human-in-the-Loop (HITL) financial auto-approval threshold configuration ($50K–$500K). |
| **Automation Policies** | `AutomationView.tsx` | Multi-agent trigger conditions and autonomous actions with live toggle switch support. |
| **System Integrations** | `IntegrationsView.tsx` | Connectors for AIS MarineTraffic, Open-Meteo Radar, PostgreSQL (SQLAlchemy), and SAP S/4HANA with one-click sync. |
| **Live Operations** | `LiveOperationsView.tsx` | Active satellite beacon feeds, marine transponder logs, and sea swell/wind telemetry. |
| **Executive Reports** | `ReportsView.tsx` | PDF exportable financial loss mitigation audits, solver synthesis logs, and accuracy benchmarks. |

---

## 🛠️ Tech Stack & Dependencies

- **Framework**: [Next.js 16 (Turbopack)](https://nextjs.org/)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom Apple & Antigravity spatial glassmorphism tokens
- **3D Graphics**: [Cobe 2.0 WebGL Globe](https://github.com/shuding/cobe)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Motion**: CSS 3D transforms & Framer Motion transitions

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- Node.js 18+ or 20+
- npm, pnpm, or yarn

### 1. Clone the repository
```bash
git clone https://github.com/24bcs050-stack/frontend.git
cd frontend
```

### 2. Install dependencies
```bash
npm install
# or
pnpm install
```

### 3. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- Landing Page: `http://localhost:3000/`
- Operations Dashboard: `http://localhost:3000/dashboard`
- Network Blueprint: `http://localhost:3000/network`

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 📂 Project Structure

```
frontend/
├── app/
│   ├── dashboard/
│   │   └── page.tsx          # Main Operations Command Center
│   ├── network/
│   │   └── page.tsx          # Global Network Visualizer
│   ├── globals.css           # Tailwind CSS v4 design tokens
│   ├── layout.tsx            # Root HTML layout with Geist font
│   └── page.tsx              # Public Landing Page (Hero, Agents showcase)
├── components/
│   ├── ui/
│   │   ├── AppIcon.tsx       # Dynamic Lucide icon renderer
│   │   ├── button.tsx        # Styled button variants
│   │   ├── cobe-globe.tsx    # 3D WebGL Globe with drag & wheel zoom
│   │   └── GlobalMap.tsx     # 2D Interactive Map with shipment pins
│   └── views/
│       ├── AutomationView.tsx   # Agent rule triggers & actions
│       ├── DecisionAgentsView.tsx # 9-Agent Studio & Inspector
│       ├── IntegrationsView.tsx # ERP & Telemetry connectors
│       ├── InventoryView.tsx    # SKU tracking & warehouse restock
│       ├── LiveOperationsView.tsx # Real-time AIS transponder feeds
│       ├── LogisticsView.tsx    # Sea voyages & vessel inspector
│       ├── ReportsView.tsx      # Audit exports & accuracy metrics
│       ├── SuppliersView.tsx    # Supplier directory & 2D World Map
│       └── UsersView.tsx        # HITL permission limits & user roles
├── lib/
│   ├── mockData.ts           # Typed state models & mock store
│   └── utils.ts              # Class merging utilities (clsx/tailwind-merge)
├── public/                   # Static assets & brand icons
├── package.json
└── README.md
```

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
Built with ⚡ by **Team Orion / FlowForge**.
