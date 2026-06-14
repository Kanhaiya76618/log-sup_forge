<div align="center">

<br/>

```
███████╗██╗      ██████╗ ██╗    ██╗███████╗ ██████╗ ██████╗  ██████╗ ███████╗
██╔════╝██║     ██╔═══██╗██║    ██║██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝
█████╗  ██║     ██║   ██║██║ █╗ ██║█████╗  ██║   ██║██████╔╝██║  ███╗█████╗
██╔══╝  ██║     ██║   ██║██║███╗██║██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝
██║     ███████╗╚██████╔╝╚███╔███╔╝██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗
╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝ ╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
```

### **Autonomous Supply-Chain Exception Resolution**

*When the supply chain breaks, the fix is already in motion.*

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-log--sup--forge.vercel.app-d62828?style=for-the-badge)](https://log-sup-forge.vercel.app)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.136-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![OR-Tools](https://img.shields.io/badge/OR--Tools-CP--SAT-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://developers.google.com/optimization)
[![Built for FAR AWAY 2026](https://img.shields.io/badge/Built_for-FAR_AWAY_2026-16224a?style=for-the-badge)](https://log-sup-forge.vercel.app)

</div>

---

## 🧠 What is FlowForge?

**FlowForge** is an autonomous multi-agent system that detects, diagnoses, and resolves supply-chain disruptions — in real time, with mathematical rigor, and with humans in the loop only when it truly matters.

> **LLM reasons → OR-Tools/NumPy computes → Verifier red-teams → confidence/cost HITL gate decides → Executor acts → every step audited.**

The engine continuously monitors global port conditions (live weather via Open-Meteo, news RSS, Bright Data SERP), detects anomalies, generates provably optimal rerouting or rescheduling plans using **Google OR-Tools CP-SAT**, stress-tests each plan across **500 Monte-Carlo futures**, and only escalates to a human when confidence runs thin or costs exceed safe thresholds. Every action — auto or human-approved — is written to an immutable audit trail.

---

## ✨ Key Features

| Feature | Detail |
|---|---|
| 🌊 **Live Port Monitoring** | Real weather from [Open-Meteo](https://open-meteo.com/) (free, keyless) — wind gusts, precipitation, 3-day forecasts — across 5 countries |
| 🤖 **LLM Framing** | Groq `llama-3.3-70b-versatile` frames each disruption (speed vs. cost priority, blocked ports) — deterministic fallback when offline |
| ⚙️ **OR-Tools CP-SAT Solver** | Capacity-constrained route assignment MILP at three cost/time weightings; job-shop scheduling for manufacturing downtime |
| 📊 **Monte-Carlo Risk** | 500-sample stress tests per plan report P(on-time), E[cost], P95, and CVaR95 — options ranked by robustness, not just nominal cost |
| 🔴 **LLM Red-Teaming** | Verifier agent sends plan options to a Groq critic for hidden risks (single-supplier dependence, irreversible spend, unrealistic transit) |
| 🚦 **HITL Gate** | Auto-executes confident + cheap + reversible actions; escalates only the uncertain — human load stays **sublinear** with volume |
| 📋 **Immutable Audit Trail** | Every stage (watcher → diagnosis → planner → verifier → gate → executor) logged with timestamps and structured payloads |
| 🏭 **Dual Domain** | Both logistics (port rerouting) and manufacturing (CP-SAT job-shop scheduling on machine downtime) handled by the same agent pipeline |
| 🌍 **Multi-Country** | Japan, India, USA, Australia, China — country-specific port networks, switchable live from the dashboard |
| 📰 **News & SERP Signals** | Optional Google News RSS port watcher + Bright Data SERP connector fold into one blocked-port union |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FlowForge Engine Loop                              │
│                                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌─────────────┐ │
│  │   Connectors  │   │   Watcher    │   │  Diagnoser   │   │   Planner   │ │
│  │              │   │              │   │              │   │  (LLM +     │ │
│  │ • Live       │──▶│ Anomaly      │──▶│ Disruption   │──▶│   OR-Tools) │ │
│  │   Weather    │   │ Detection    │   │ Classification│   │             │ │
│  │ • News RSS   │   │              │   │              │   │             │ │
│  │ • SERP       │   │              │   │              │   │             │ │
│  │ • Synthetic  │   └──────────────┘   └──────────────┘   └──────┬──────┘ │
│  └──────────────┘                                                 │        │
│                                                                   ▼        │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌─────────────┐ │
│  │   Executor   │   │  HITL Gate   │   │   Verifier   │   │Monte-Carlo  │ │
│  │              │   │              │   │              │   │  Simulator  │ │
│  │ • ERP Update │◀──│ Auto-approve │◀──│ Constraint   │◀──│             │ │
│  │ • Reroute    │   │ or Escalate  │   │ Checks +     │   │ P(on-time)  │ │
│  │ • Replenish  │   │ or Reject    │   │ LLM Critic   │   │ CVaR95      │ │
│  │ • Notify     │   │              │   │              │   │             │ │
│  └──────┬───────┘   └──────────────┘   └──────────────┘   └─────────────┘ │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     Immutable Audit Sink                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

The engine is fully **interface-driven**: every agent (`Watcher`, `Diagnoser`, `Planner`, `Verifier`, `BaseExecutor`) is a swappable implementation behind a typed contract — no component touches another's internals.

---

## 🗂️ Project Structure

```
log-sup_forge/
├── backend/
│   └── flowforge/
│       ├── agents/           # Autonomous agents
│       │   ├── watcher.py    # Anomaly detection
│       │   ├── diagnosis.py  # Disruption classification
│       │   ├── planner.py    # LLM framing + OR-Tools routing
│       │   ├── scheduler.py  # Manufacturing job-shop scheduler
│       │   ├── verifier.py   # Constraint checks + LLM red-team
│       │   └── llm.py        # Groq bridge (deterministic fallback)
│       ├── connectors/
│       │   ├── logistics/
│       │   │   ├── live.py       # Open-Meteo live weather + forecasts
│       │   │   ├── news.py       # Google News RSS port watcher
│       │   │   ├── brightdata.py # Bright Data SERP connector
│       │   │   ├── countries.py  # 5-country port definitions
│       │   │   └── generator.py  # Synthetic signal generator
│       │   └── manufacturing/    # Machine downtime signals
│       ├── solver/
│       │   ├── optimizer.py  # OR-Tools CP-SAT route assignment + replenishment
│       │   ├── schedule.py   # CP-SAT job-shop scheduling
│       │   ├── simulate.py   # Monte-Carlo risk evaluation (500 samples)
│       │   └── network.py    # Route graph + order book
│       ├── core/
│       │   ├── orchestrator.py # Engine loop (tick/resolve/approve/reject)
│       │   ├── gate.py         # Confidence/cost HITL gate
│       │   ├── engine.py       # Factory: assembles the full pipeline
│       │   └── config.py       # Gate thresholds (env-tunable)
│       ├── contracts/        # Pydantic data contracts (shared truth)
│       ├── interfaces/       # Abstract base classes for all agents
│       ├── execution/        # Executor + audit sink
│       ├── eval/             # Evaluation harness + scenario batch
│       └── api/
│           └── app.py        # FastAPI REST surface
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Landing.tsx         # Marketing landing page
│       │   ├── DisruptionFeed.tsx  # Live disruption stream
│       │   ├── PlanCard.tsx        # Resolution plan viewer
│       │   ├── ReasoningTrace.tsx  # Agent reasoning steps
│       │   ├── ApprovalGate.tsx    # Human-in-the-loop UI
│       │   ├── AuditTrail.tsx      # Immutable audit log viewer
│       │   ├── AnalyticsDashboard.tsx # Engine metrics
│       │   └── PortStatusStrip.tsx    # Live port status
│       ├── api/
│       │   ├── client.ts   # REST client (VITE_API configurable)
│       │   └── mock.ts     # Full offline mock (USE_MOCK flag)
│       └── types.ts        # TypeScript mirrors of backend contracts
├── vercel.json             # SPA rewrite rules for Vercel
└── README.md
```

---

## 🚀 Live Demo

> **🌐 [https://log-sup-forge.vercel.app](https://log-sup-forge.vercel.app)**

---

## ⚡ Quick Start

### Prerequisites

- Python **3.11+**
- Node.js **18+**

### 1. Backend Setup

```bash
cd backend
python3 -m venv .venv

# Linux / macOS
source .venv/bin/activate

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
cp .env.example .env      # Add your GROQ_API_KEY here (optional — engine runs offline without it)
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env      # Set VITE_API=http://localhost:8000
```

---

## 🏃 Running the Project

### Backend — all commands run from `backend/`

> **Windows:** Export env vars with `set GROQ_API_KEY=<your_key>`
>
> **Linux/macOS:** `set -a; source .env; set +a`
>
> Always use `.venv/bin/python` or activate the venv first.

```bash
# Synthetic demo (no API keys needed)
PYTHONPATH=. python scripts/demo.py

# Live weather mode (Open-Meteo, keyless)
FLOWFORGE_LIVE=1 PYTHONPATH=. python scripts/demo.py

# Live + lowered thresholds (good on calm weather days)
FLOWFORGE_LIVE=1 DEMO_SENSITIVITY=0.3 PYTHONPATH=. python scripts/demo.py

# Live + force one injected disruption when seas are calm
FLOWFORGE_LIVE=1 FLOWFORGE_FORCE_DEMO=1 PYTHONPATH=. python scripts/demo.py

# Live + Google News RSS port watcher
FLOWFORGE_LIVE=1 FLOWFORGE_NEWS=1 PYTHONPATH=. python scripts/demo.py

# Evaluation harness (auto-vs-escalated metrics + scaling curve)
PYTHONPATH=. python -m flowforge.eval.harness

# Run tests
PYTHONPATH=. python -m pytest tests/

# Start the API server (plain)
PYTHONPATH=. python -m uvicorn flowforge.api.app:app --reload --port 8000

# Start the API server (full live demo mode)
FLOWFORGE_LIVE=1 FLOWFORGE_NEWS=1 DEMO_SENSITIVITY=0.3 GROQ_API_KEY=$GROQ_API_KEY \
  PYTHONPATH=. python -m uvicorn flowforge.api.app:app --port 8000
```

### Frontend — from `frontend/`

```bash
npm run dev        # Dev server at http://localhost:3000 (backend must be on :8000)
npm run build      # Production build (strict tsc + vite) → dist/
npm run preview    # Serve the production build locally
```

---

## 🌐 REST API Reference

All endpoints served at `http://localhost:8000` — interactive docs at `/docs`, schema at `/openapi.json`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Liveness check + registered domains |
| `POST` | `/tick?domain=logistics&country=japan` | Run one full detect→diagnose→plan→verify→gate→execute cycle |
| `GET` | `/records` | All resolutions this session (newest last) |
| `GET` | `/pending` | Escalated plans awaiting human decision |
| `POST` | `/approve/{plan_id}` | Human approves a pending plan — triggers execution |
| `POST` | `/reject/{plan_id}` | Human rejects a pending plan |
| `GET` | `/audit` | Immutable audit trail (all stages, all plans) |
| `GET` | `/metrics` | Honest session metrics (computed from real records) |
| `GET` | `/signals?domain=logistics&country=japan` | Latest raw port signals (calm + anomalous) |
| `GET` | `/countries` | Supported countries for the dashboard selector |

### Quick curl examples

```bash
curl http://localhost:8000/health
curl -X POST "http://localhost:8000/tick?country=japan"
curl http://localhost:8000/records
curl http://localhost:8000/pending
curl -X POST http://localhost:8000/approve/<plan_id>
curl -X POST http://localhost:8000/reject/<plan_id>
curl http://localhost:8000/audit
curl http://localhost:8000/metrics
```

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Effect |
|---|---|---|
| `GROQ_API_KEY` | *(unset)* | Enables LLM planner framing + verifier critic (engine runs fully deterministic when unset) |
| `FLOWFORGE_LIVE` | `0` | Use live Open-Meteo weather instead of synthetic signals |
| `DEMO_SENSITIVITY` | `1.0` | Scale weather thresholds down (e.g. `0.3`) so calm-day ports still trip for demos |
| `FLOWFORGE_FORCE_DEMO` | `0` | Inject one clearly-labeled synthetic disruption when real seas are calm |
| `FLOWFORGE_NEWS` | `0` | Enable Google News RSS port watcher (keyless, fails silently) |
| `FLOWFORGE_BRIGHTDATA` | `0` | Enable Bright Data SERP port watcher (needs `BRIGHT_DATA_API_KEY` + `BRIGHT_DATA_ZONE`) |
| `FLOWFORGE_FORECAST` | *(on)* | Enable 3-day predictive forecast layer (set `0` to disable) |
| `AUTO_APPROVE_CONFIDENCE` | `0.80` | Verifier confidence threshold below which plans escalate to human |
| `MAX_AUTO_COST` | `5000.0` | Maximum cost (USD) a plan can incur before requiring human approval |

### Frontend (`frontend/.env`)

| Variable | Default | Effect |
|---|---|---|
| `VITE_API` | `http://localhost:8000` | Backend URL the dashboard calls |

> **Offline mode:** Set `USE_MOCK = true` in `src/api/client.ts` to use the built-in synthetic mock — the full dashboard UI works without a running backend.

---

## 🤝 The HITL Gate Logic

The gate is the scalability pillar of FlowForge. It auto-executes only plans that are **confident + cheap + reversible** and escalates the rest:

```
if verifier.passed == False       → REJECTED  (no human needed)
if plan has irreversible steps    → ESCALATED (requires human approval)
if confidence < threshold (0.80)  → ESCALATED (requires human approval)
if total_cost > ceiling ($5,000)  → ESCALATED (requires human approval)
else                              → AUTO_APPROVED + executed immediately
```

Thresholds are tunable via environment variables without any code change.

---

## 📊 How the Solver Works

### Logistics — Route Optimization (OR-Tools CP-SAT)

For port disruptions, the optimizer runs three weightings of the same MILP:

| Variant | Weight | Optimizes for |
|---|---|---|
| `cost-optimal` | 1× | Minimum total cost |
| `balanced` | 8× | Cost + time balance |
| `time-optimal` | 40× | Minimum transit time (urgency) |

Each shipment is assigned to exactly one route, respecting capacity constraints. A **HOLD** fallback ensures the model is always feasible.

### Manufacturing — Job-Shop Scheduling (OR-Tools CP-SAT)

For machine downtime, the scheduler reassigns jobs across the remaining machines using CP-SAT, minimizing makespan (total completion time).

### Monte-Carlo Risk Layer (NumPy, 500 samples)

Every plan option is stress-tested across 500 sampled futures:
- **Transit times** drawn from a log-normal distribution (σ = 18%)
- **Mid-transit disruption** with 6% probability (+60% time, +50% cost)
- Reports: `P(on-time)`, `E[cost]`, `P95 cost`, `CVaR95` (expected cost in worst 5%)
- Option scores are **risk-adjusted** (50% nominal score + 50% P(on-time))

---

## 🌍 Supported Countries & Ports

| Country | Monitored Ports |
|---|---|
| 🇯🇵 Japan *(default)* | Yokohama, Kobe, Shanghai, Busan |
| 🇮🇳 India | Mumbai, Chennai, Mundra |
| 🇺🇸 United States | Los Angeles, Long Beach, New York |
| 🇦🇺 Australia | Sydney, Melbourne, Brisbane |
| 🇨🇳 China | Shanghai, Shenzhen, Ningbo |

Adding a new country is a one-line addition to `countries.py` — no engine code changes required.

---

## 🖥️ Dashboard Views

The React frontend (deployed at **[log-sup-forge.vercel.app](https://log-sup-forge.vercel.app)**) includes three main views:

| View | Description |
|---|---|
| **Control Center** | Live port status strip, disruption feed, reasoning trace, plan card, and the HITL approval/rejection gate |
| **Audit Ledger** | Immutable chronological audit log of every agent stage for every resolution |
| **Engine Metrics** | Real-time session metrics: auto-approval rate, human load %, value protected, cost saved, avg tick latency |

---

## 🧪 Testing & Evaluation

```bash
# Unit + integration tests (engine smoke + live-layer invariants)
PYTHONPATH=. python -m pytest tests/ -v

# Evaluation harness — 40 scenarios, reports auto/escalate/reject split + cost saved
PYTHONPATH=. python -m flowforge.eval.harness

# Scaling curve — human-load % across volumes (10, 20, 40, 80 scenarios)
# Money-shot: human load stays roughly flat as volume increases
```

The eval harness drives scenarios through the real engine and reports the numbers that demonstrate the HITL gate's **sublinear scaling** — the key claim of the system.

---

## 🛠️ Tech Stack

### Backend
- **Python 3.11+** with full type hints
- **FastAPI** + **Uvicorn** — async REST API
- **Pydantic v2** — data validation and typed contracts
- **Google OR-Tools** (CP-SAT) — route assignment + job-shop scheduling
- **NumPy** — Monte-Carlo risk simulation
- **Groq API** (`llama-3.3-70b-versatile`) — LLM framing + red-teaming (optional)
- **Open-Meteo** — free, keyless live weather API
- **urllib** (stdlib only) — zero new network dependencies

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** — utility-first styling
- **React Router v6** — SPA routing
- **Lucide React** — icon system
- **React Hot Toast** — notifications
- **Vercel** — edge deployment with SPA rewrite rules

---

## 📄 License

This project is licensed under the terms in [LICENSE](./LICENSE).

---

<div align="center">

**Built for [FAR AWAY 2026](https://log-sup-forge.vercel.app) · Agentic & Autonomous Systems**

*Live data · OR-Tools · Monte-Carlo · Human-in-the-loop*

[![Live Demo](https://img.shields.io/badge/🚀_Try_It_Live-log--sup--forge.vercel.app-d62828?style=for-the-badge)](https://log-sup-forge.vercel.app)

</div>
