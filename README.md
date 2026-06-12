# FlowForge — Autonomous Supply-Chain Exception Resolution

LLM reasons → OR-Tools/NumPy computes → Verifier red-teams → confidence/cost HITL gate decides → Executor acts → every step audited.

## One-time setup

```bash
# Backend (Python 3.11+)
cd backend
python3 -m venv .venv
.venv/bin/pip install pydantic fastapi "uvicorn[standard]" ortools numpy pytest httpx certifi
cp .env.example .env        # put your real GROQ_API_KEY here (.env is gitignored)

# Frontend (Node 18+)
cd ../frontend
npm install
cp .env.example .env        # VITE_API=http://localhost:8000
```

## Run everything (from `backend/`)

> `.env` is NOT auto-loaded — export it first: `set -a; source .env; set +a`
> (or prefix individual vars as shown below). Use `.venv/bin/python` or
> `source .venv/bin/activate` first.

```bash
# Demo (synthetic data)
PYTHONPATH=. python scripts/demo.py

# Demo with LIVE Open-Meteo weather (keyless)
FLOWFORGE_LIVE=1 PYTHONPATH=. python scripts/demo.py
FLOWFORGE_LIVE=1 DEMO_SENSITIVITY=0.3 PYTHONPATH=. python scripts/demo.py    # trip thresholds on calm days
FLOWFORGE_LIVE=1 FLOWFORGE_FORCE_DEMO=1 PYTHONPATH=. python scripts/demo.py  # calm day: inject one labeled synthetic
FLOWFORGE_LIVE=1 FLOWFORGE_NEWS=1 PYTHONPATH=. python scripts/demo.py        # + Google News RSS port watcher

# Eval harness (auto-vs-escalated metrics + scaling curve)
PYTHONPATH=. python -m flowforge.eval.harness

# Tests (engine smoke + live-layer invariants)
PYTHONPATH=. python -m pytest tests/

# API server (plain / full live demo mode)
PYTHONPATH=. python -m uvicorn flowforge.api.app:app --reload --port 8000
FLOWFORGE_LIVE=1 FLOWFORGE_NEWS=1 DEMO_SENSITIVITY=0.3 GROQ_API_KEY=$GROQ_API_KEY \
  PYTHONPATH=. python -m uvicorn flowforge.api.app:app --port 8000
```

## Frontend (from `frontend/`)

```bash
npm run dev        # dashboard at http://localhost:3000 (backend must run on :8000)
npm run build      # production build (strict tsc + vite) -> dist/
npm run preview    # serve the production build
```

## API quick reference (http://localhost:8000)

```bash
curl http://localhost:8000/health                  # liveness + registered domains
curl -X POST http://localhost:8000/tick            # run one full resolution cycle
curl http://localhost:8000/records                 # every resolution this session
curl http://localhost:8000/pending                 # HITL queue
curl -X POST http://localhost:8000/approve/<plan_id>
curl -X POST http://localhost:8000/reject/<plan_id>
curl http://localhost:8000/audit                   # immutable audit trail
curl http://localhost:8000/metrics                 # honest session metrics
# interactive docs: http://localhost:8000/docs     # schema: /openapi.json
```

## Environment variables (backend/.env.example)

| Variable | Effect |
|---|---|
| `GROQ_API_KEY` | enables LLM planner framing + verifier critic (deterministic fallback when unset) |
| `FLOWFORGE_LIVE=1` | live Open-Meteo weather connector instead of synthetic |
| `DEMO_SENSITIVITY` | scales weather thresholds (0.3 = demo-friendly, 1.0 = honest) |
| `FLOWFORGE_FORCE_DEMO=1` | inject one clearly-labeled synthetic disruption when seas are calm |
| `FLOWFORGE_NEWS=1` | add Google News RSS port watcher (keyless, silent degradation) |
| `FLOWFORGE_BRIGHTDATA=1` | add Bright Data SERP port watcher (needs `BRIGHT_DATA_API_KEY` + `BRIGHT_DATA_ZONE`; silent degradation) |
| `AUTO_APPROVE_CONFIDENCE` / `MAX_AUTO_COST` | HITL gate thresholds |

Frontend: `VITE_API` (backend URL); `USE_MOCK` in `src/api/client.ts` builds the UI fully offline against the same contract.
