"""FastAPI surface — the contract P5's frontend consumes. OWNER: P1.
Run:  uvicorn flowforge.api.app:app --reload
Every number served here is computed from real engine activity — no baked-in
demo metrics."""
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ..core import build_engine
from ..contracts import Domain, Decision, ResolutionRecord

app = FastAPI(title="FlowForge", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
engine = build_engine()

# Session history: every record this process produced, by plan id (insertion-ordered).
_records: dict[str, ResolutionRecord] = {}
_tick_ms: list[float] = []


@app.get("/health")
def health():
    return {"ok": True, "domains": [d.value for d in engine.registry.domains()]}


@app.post("/tick")
def tick(domain: Domain = Domain.LOGISTICS):
    """Run one detect->diagnose->plan->verify->gate->execute cycle."""
    t0 = time.perf_counter()
    records = engine.tick(domain)
    _tick_ms.append(1000 * (time.perf_counter() - t0))
    for r in records:
        _records[r.plan.id] = r
    return [r.model_dump() for r in records]


@app.get("/records")
def records():
    """Every resolution this session, newest last (the dashboard's feed)."""
    return [r.model_dump() for r in _records.values()]


@app.get("/pending")
def pending():
    """Resolutions escalated to a human (the HITL queue)."""
    return [r.model_dump() for r in engine.pending()]


@app.post("/approve/{plan_id}")
def approve(plan_id: str, domain: Domain = Domain.LOGISTICS):
    try:
        return engine.approve(plan_id, domain).model_dump()
    except KeyError:
        raise HTTPException(404, f"No pending plan {plan_id}")


@app.post("/reject/{plan_id}")
def reject(plan_id: str):
    try:
        return engine.reject(plan_id).model_dump()
    except KeyError:
        raise HTTPException(404, f"No pending plan {plan_id}")


@app.get("/audit")
def audit():
    return [e.model_dump() for e in engine.audit.all()]


@app.get("/metrics")
def metrics():
    """Honest session metrics, derived from actual resolution records."""
    recs = list(_records.values())
    auto = sum(r.gate.decision == Decision.AUTO_APPROVED for r in recs)
    escalated = sum(r.pending for r in recs)
    executed_by_human = sum(r.gate.decision == Decision.EXECUTED for r in recs)
    rejected = sum(r.gate.decision == Decision.REJECTED for r in recs)
    executed = [r for r in recs if r.results]
    actions = [res for r in executed for res in r.results]
    chosen_cost = 0.0
    value_protected = 0.0
    for r in executed:
        opt = r.plan.recommended() or (r.plan.options[0] if r.plan.options else None)
        if opt:
            chosen_cost += opt.total_cost
        value_protected += r.disruption.blast_radius.value_at_risk
    return {
        "disruptions": len(recs),
        "autoApproved": auto,
        "pendingHuman": escalated,
        "humanApproved": executed_by_human,
        "rejected": rejected,
        "humanLoadPct": round(100 * (escalated + executed_by_human + rejected) / len(recs), 1) if recs else 0.0,
        "actionsExecuted": len(actions),
        "actionSuccessPct": round(100 * sum(a.success for a in actions) / len(actions), 1) if actions else 0.0,
        "valueProtected": round(value_protected, 2),
        "planCost": round(chosen_cost, 2),
        "costSaved": round(value_protected - chosen_cost, 2),
        "avgTickMs": round(sum(_tick_ms) / len(_tick_ms), 1) if _tick_ms else 0.0,
    }


@app.get("/signals")
def signals(domain: Domain = Domain.LOGISTICS):
    """Latest raw signals — includes calm LIVE port readings, not just anomalies."""
    return [s.model_dump() for s in engine.registry.connector(domain).fetch_signals()]
