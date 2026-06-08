"""Eval harness. OWNER: P3.
Drives each varied scenario through the real engine and reports the numbers that
go in the video: resolution rate, the auto-vs-escalate split (human-load
sublinearity), cost saved vs. doing nothing, and latency."""
import time
from ..core import build_engine
from ..contracts import Decision
from .scenarios import scenario_batch
from .eval_connector import EvalConnector


def run(n: int = 40) -> dict:
    auto = esc = rej = resolved = 0
    total_cost = total_value = 0.0
    t0 = time.perf_counter()
    for batch in scenario_batch(n):
        engine = build_engine()
        engine.registry.register_connector(EvalConnector(batch))   # override logistics
        for rec in engine.tick():
            resolved += 1
            d = rec.gate.decision
            auto += d == Decision.AUTO_APPROVED
            esc += d == Decision.ESCALATED
            rej += d == Decision.REJECTED
            opt = rec.plan.recommended()
            if opt:
                total_cost += opt.total_cost
            total_value += rec.disruption.blast_radius.value_at_risk
    dt = time.perf_counter() - t0
    return {
        "scenarios": n, "resolved": resolved,
        "auto_approved": auto, "escalated_to_human": esc, "rejected": rej,
        "human_load_pct": round(100 * esc / resolved, 1) if resolved else 0.0,
        "avg_plan_cost": round(total_cost / resolved, 1) if resolved else 0.0,
        "cost_saved_vs_donothing": round(total_value - total_cost, 1),
        "avg_latency_ms": round(1000 * dt / resolved, 2) if resolved else 0.0,
        "elapsed_s": round(dt, 3),
    }


def scaling_curve(sizes=(10, 20, 40, 80)) -> list[dict]:
    """Money-shot: human-load % should stay roughly flat as volume rises."""
    return [{"n": s, "human_load_pct": run(s)["human_load_pct"]} for s in sizes]


if __name__ == "__main__":
    import json
    print(json.dumps(run(40), indent=2))
    print("scaling_curve:", json.dumps(scaling_curve(), indent=2))