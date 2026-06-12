# FlowForge — Comparison Report (mine: `flowforge 2/` vs friend: repo root)

Written before any merge changes. "MINE" = `flowforge 2/`, "FRIEND" = repo root `backend/` + `frontend/`.

## Verdict in one line

**Backend: mine wins nearly everywhere** (friend's tree breaks every required contract signature and fakes demo numbers). **Frontend: friend wins on components/scaffold, mine wins on API layer + types** — the merge keeps the friend's command-center UI re-wired onto my typed client and contracts.

---

## Backend, module by module

### contracts/ — KEEP MINE
- MINE matches the required architecture exactly: `Event`, `Plan`, `Check`, `GateOutcome`, `ResolutionRecord`, `Disruption.context` dict, `Disruption.domain`, MEDIUM severity, EXECUTED/FAILED decisions, UUID-defaulted ids, timestamps.
- FRIEND: no `Event`, no `Plan`, no `Disruption.context`, no `GateOutcome`; uses `PipelineRecord` with hacky `@property gate/plan` shims (inner classes built on the fly) to keep my copied eval harness importable. Mutable `status: str` field on Disruption instead of gate state.
- **CONTRACT BREAKS (flagged):** friend's `AuditEntry`/`VerifierReport` are entirely different shapes (`policy_checks: Dict[str,bool]` vs `checks: list[Check]`).

### interfaces/ — KEEP MINE
**CONTRACT BREAKS (flagged):** friend's ABCs are all wrong vs. the non-negotiable spec:
- `Watcher.scan(signals) -> List[Disruption]` (spec: `-> list[Event]`)
- `Diagnoser.diagnose(disruption: Disruption)` (spec: `diagnose(event) -> Disruption`)
- `Planner.propose_plans(...) -> List[PlanOption]` (spec: `plan(disruption) -> Plan`)
- `Verifier.verify(disruption, plans)` (spec: `verify(plan, option_id)`)
- `BaseExecutor.execute_step(step, connectors)` (spec-adjacent: mine is `execute(request, connector)`)

### agents/ — KEEP MINE, adopt friend's verifier policy ideas
- watcher/diagnosis: both have real mapping logic; friend's is written against the broken signatures. Mine maps cleanly to Event→Disruption and fills `context["blocked"]`.
- planner: MINE has the LLM seam (`_frame`), intent-driven option selection, and risk-adjusted scoring via `optimize_with_risk`. FRIEND's is 13 lines that call `optimize()` directly — no framing, no risk.
- verifier: FRIEND has a nice budget-cap + all-steps-reversible policy check with human-readable reasons → **adopted** into my Check-list verifier. MINE keeps structured `Check`s + `risk_flags`.

### solver/ — KEEP MINE (friend's is a byte-identical copy, minus `simulate.py`)
`network.py` and `optimizer.py` differ only by a trailing newline. Only MINE has `solver/simulate.py` (Monte Carlo: P(on-time), CVaR95, risk-adjusted scores) — required keep.

### connectors/ — KEEP MINE, adopt friend's generator variety
- Only MINE has `logistics/live.py` (Open-Meteo, provenance tags, synthetic fallback, concurrent-storm blocked-union) — required keep.
- FRIEND's `generator.py` rotates 3 realistic disruption shapes (supply shortage / multi-port closure / shipment delay) deterministically — **adopted** into my generator so repeated ticks produce a varied feed.
- manufacturing: both stubs; mine raises NotImplementedError explicitly (kept, it is unregistered).

### core/ — KEEP MINE, adopt friend's env-config idea
- engine: only MINE has the `FLOWFORGE_LIVE` switch — required keep.
- orchestrator: MINE audit-logs *every* stage and implements the HITL pending/approve queue. **FAKED OUTPUT (flagged):** friend's orchestrator broadcasts trace steps with hardcoded `confidence: 0.99 / 0.95 / 0.90` and `timeTakenMs: 45 / 120 / 230` — invented numbers, never measured. Friend also only writes audit entries on the auto-approved path.
- gate: MINE returns `GateOutcome` with reasons + irreversible-action blocking. Friend's returns a bare enum.
- config: FRIEND reads `AUTO_APPROVE_CONFIDENCE` / `MAX_AUTO_COST` from env — **adopted** (via `os.environ`, no pydantic-settings dependency). **Flag:** friend's config ships `LLM_API_KEY: str = "sk-..."` placeholder default plus unused REDIS/DATABASE URLs (not a real leaked secret, but key-in-config pattern; replaced by env-only `GROQ_API_KEY`).

### execution/ — KEEP MINE
Friend's `SQLiteAuditSink` (SQLAlchemy) is bound to their incompatible AuditEntry schema; not ported. In-memory sink retained (interface allows a DB sink later).

### eval/ — IDENTICAL (kept from mine)
`harness.py`, `eval_connector.py`, `scenarios.py` are byte-identical copies in both trees (friend's only work via the PipelineRecord property shims). Honest auto-vs-escalated metrics retained.

### api/ — KEEP MINE, plus additions
- MINE: `/health`, `POST /tick`, `/pending`, `POST /approve/{plan_id}`, `/audit` — matches what the frontend must call.
- **FAKED OUTPUT (flagged):** friend's `/api/metrics` returns hardcoded `successRate: 94.2`, `avgTimeMs: 1280`, `catchRate: 0.89`, and `autoCount: ... + 28  # Add baseline mock values`. Cost saved falls back to a fabricated `42350`.
- Friend's WebSocket-push + background feed loop is a nice demo idea but built on the broken contracts and fake trace numbers; replaced by frontend polling of the real `/tick`.
- Additions in the merge: `POST /reject/{plan_id}` (so the Reject button does something real and audited) and an **honest** `/metrics` computed from actual resolution records (counts, real cost-saved, measured latency).

### scripts/tests/pyproject
- demo.py: both work in their own tree; mine kept (matches merged contracts).
- tests: mine is an end-to-end engine smoke test; friend's tests contract details of their own (rejected) shapes. Mine kept + extended.
- pyproject: mine kept; `ortools`/`numpy` promoted from comments to real dependencies (friend listed them too). sqlalchemy/pandas/websockets/redis not needed — dropped.
- `.env.example`: both trees had identical stale content — replaced per Task 3b.

---

## Frontend, module by module

### Scaffold (vite/tailwind/tsconfig/index.html/main.tsx) — KEEP FRIEND'S
Only the friend's tree has a buildable scaffold. The cream/ink/sakura "ops command center" theme (glassmorphism, JetBrains Mono, severity colors) is good judge UX — kept.

### types.ts — KEEP MINE, extended
Mine mirrors the backend contracts (ResolutionRecord et al.). Friend's mirrors their broken contracts and has UI-invented types (`AgentTraceStep` with fake confidence). Mine is updated to a *full* mirror including `Disruption.context`, `blast_radius`, `detected_at`, `GateOutcome`, `Check`s.

### api layer — KEEP MINE (friend's client.ts/mock.ts are literally empty files)
- Friend's real layer is `services/api.ts`: every call silently falls back to hardcoded mock data on fetch failure — **dashboard looks live while showing fabricated data, with no indicator (flagged)**. Their `useWebSocket` hook goes further: a full client-side fake pipeline (`generateMockEvent`) that invents disruptions, trace steps and resolutions on a timer when the backend is down.
- MINE: typed `client.ts` with explicit `USE_MOCK` switch — kept and extended (`tick/pending/approve/reject/audit/metrics`); `mock.ts` updated to the current ResolutionRecord shape.

### Components — KEEP FRIEND'S RENDERING, REWIRED to real data
- My five components were 4-line placeholders; friend's actually render: DisruptionFeed (severity/status chips, blast-radius grid), ReasoningTrace (timeline), PlanDisplay (option cards w/ params tables, reversibility badges), ApprovalGate (approve/reject with loading states), AuditTrail (filterable ledger), AnalyticsDashboard (KPI cards).
- Rewired in the merge: trace steps now come from the real backend `audit_trail` (no invented confidences), plans from `Plan.options` (showing P(on-time)/CVaR95 from `rationale`), approve hits `POST /approve/{plan_id}`, audit shows real `AuditEntry` stages, metrics honest-only. `PlanDisplay` renamed to required `PlanCard` (friend's `PlanCard.tsx` was an empty file).

### Secrets check
No hardcoded API keys found in either tree (friend's `LLM_API_KEY=sk-...` placeholders only). `.env` is gitignored at root, backend, and frontend levels.

---

## Live web data (Task 2c)

**Friend's version has no live data layer at all**: their `LogisticsConnector.fetch_signals()` returns `[]` ("Connectors can pull live/simulated feeds. Left customizable.") and every disruption came from the synthetic index generator driven by the API's background loop. No scraping or live fetching exists anywhere in their tree (verified by grepping git HEAD), so there was nothing to evaluate or reject — my Open-Meteo layer is the only live source and was carried into the merge.

**Merged live layer, verified by tests** ([tests/test_live.py](backend/tests/test_live.py), 8 cases):
- provenance tags `live` / `synthetic_fallback (<ExcName>)` / `synthetic_injected`
- synthetic fallback on any network failure (demo can never die)
- concurrent-storm blocked-port UNION on every anomalous signal
- env switches: `FLOWFORGE_LIVE=1` selects the live connector, `DEMO_SENSITIVITY` scales thresholds, `FLOWFORGE_FORCE_DEMO=1` injects one clearly-labeled synthetic when seas are calm
- certifi-backed SSL context so macOS framework Pythons without local CA certs still reach the API (stdlib fallback kept).

**New second live source** ([news.py](backend/flowforge/connectors/logistics/news.py)): keyless Google News RSS (`"port closure" OR "port closed" OR typhoon Japan`), stdlib `urllib` + `xml.etree` — a structured feed, not HTML scraping, no paid services. A headline emits a `RawSignal` with provenance `live_news` only when it names a known route-network port AND contains a strong disruption keyword (critical keywords → `port_closure`/critical, otherwise `shipment_delay`/high). News-matched ports merge into the SAME blocked-union as the weather anomalies inside `LiveLogisticsConnector`. Gated behind `FLOWFORGE_NEWS=1`; degrades silently to zero signals on any fetch/parse failure. Live-verified: 102 real headlines fetched; none named our four ports today, so it honestly contributed nothing.
