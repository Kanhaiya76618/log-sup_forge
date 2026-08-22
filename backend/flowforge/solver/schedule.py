"""Job-shop reassignment solver. OWNER: P3.
When a machine goes down, redistribute its jobs across the remaining machines to
minimize makespan / tardiness. This is scheduling, NOT routing — it uses OR-Tools
CP-SAT (a separate model from optimizer.py), with a greedy least-loaded fallback
so the lane never blocks. Signature mirrors optimize(): schedule(disruption) ->
list[PlanOption]; schedule_with_risk() annotates via the shared simulate layer."""
from __future__ import annotations
from ..contracts import PlanOption, PlanStep, ActionType, Disruption

try:
    from ortools.sat.python import cp_model
    _HAS_ORTOOLS = True
except Exception:
    _HAS_ORTOOLS = False

_RATE = 45.0   # cost per machine-minute of makespan (overtime/idle proxy)


def schedule(disruption: Disruption) -> list[PlanOption]:
    ctx = disruption.context
    machines = list(ctx.get("machines") or [])
    down = ctx.get("down_machine")
    jobs = list(ctx.get("jobs") or [])
    avail = [m for m in machines if m != down]
    movable = [j for j in jobs if j.get("machine") == down]
    if not avail or not movable:
        return []

    base = {m: sum(j["proc_min"] for j in jobs if j.get("machine") == m) for m in avail}

    options = []
    for label, tardy_w in (("makespan-optimal", 0), ("balanced", 4), ("tardiness-optimal", 16)):
        assign, makespan, tardiness = _solve(movable, avail, base, tardy_w)
        if assign is None:
            continue
        key = tuple(sorted((j["id"], m) for j, m in assign))
        if any(key == o[0] for o in options):
            continue
        options.append((key, _build(label, assign, makespan, tardiness, down, base)))
    return [o[1] for o in options]


def _solve(movable, avail, base, tardy_w):
    """Assign each movable job to an available machine; minimize makespan plus a
    weighted tardiness penalty. CP-SAT when present, greedy otherwise."""
    if _HAS_ORTOOLS:
        m = cp_model.CpModel()
        x = {(j["id"], k): m.NewBoolVar(f"x_{j['id']}_{k}") for j in movable for k in avail}
        for j in movable:
            m.Add(sum(x[j["id"], k] for k in avail) == 1)
        horizon = int(sum(base.values()) + sum(j["proc_min"] for j in movable) + 1)
        load = {}
        for k in avail:
            load[k] = m.NewIntVar(0, horizon, f"load_{k}")
            m.Add(load[k] == int(base[k]) + sum(int(j["proc_min"]) * x[j["id"], k] for j in movable))
        makespan = m.NewIntVar(0, horizon, "makespan")
        for k in avail:
            m.Add(makespan >= load[k])
        # tardiness: a job is late if its host machine's load exceeds its due time
        tardy_terms = []
        if tardy_w:
            for j in movable:
                late = m.NewIntVar(0, horizon, f"late_{j['id']}")
                for k in avail:
                    m.Add(late >= load[k] - int(j["due_min"]) - horizon * (1 - x[j["id"], k]))
                m.Add(late >= 0)
                tardy_terms.append(late)
        m.Minimize(makespan + tardy_w * sum(tardy_terms) if tardy_terms else makespan)
        s = cp_model.CpSolver()
        s.parameters.max_time_in_seconds = 2.0
        if s.Solve(m) not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            return None, 0, 0
        assign = [(j, k) for j in movable for k in avail if s.Value(x[j["id"], k])]
        loads = {k: base[k] + sum(j["proc_min"] for j, kk in assign if kk == k) for k in avail}
        mk = max(loads.values())
        tard = sum(max(0, loads[k] - j["due_min"]) for j, k in assign)
        return assign, mk, tard

    # greedy: drop each job on the least-loaded machine (longest job first)
    loads = dict(base)
    assign = []
    for j in sorted(movable, key=lambda x: -x["proc_min"]):
        k = min(avail, key=lambda m: loads[m])
        loads[k] += j["proc_min"]
        assign.append((j, k))
    mk = max(loads.values())
    tard = sum(max(0, loads[k] - j["due_min"]) for j, k in assign)
    return assign, mk, tard


def _build(label, assign, makespan, tardiness, down, base) -> PlanOption:
    steps = [PlanStep(action=ActionType.RESCHEDULE, target=j["id"],
                      params={"from": down, "to": k, "machine": k, "proc_min": j["proc_min"]},
                      est_cost=round(j["proc_min"] * _RATE * 0.1, 2), reversible=True)
             for j, k in assign]
    steps.append(PlanStep(action=ActionType.UPDATE_ERP, target="mes",
                          params={"status": "rescheduled", "down": down}, reversible=True))
    steps.append(PlanStep(action=ActionType.NOTIFY, target="line_supervisor",
                          params={"channel": "andon"}, reversible=True))
    # plan cost = the reassignment overhead (reversible, modest), not the full
    # makespan value — so cheap reshuffles can auto-execute while big ones escalate.
    total_cost = round(sum(s.est_cost for s in steps), 2)
    # score: lower makespan + tardiness is better, normalized against a horizon
    horizon = sum(base.values()) + makespan + 1
    score = round(max(0.0, 1.0 - 0.7 * min(1.0, makespan / horizon)
                            - 0.3 * min(1.0, tardiness / (horizon or 1))), 3)
    return PlanOption(steps=steps, total_cost=total_cost, est_time_min=float(makespan),
                      score=score,
                      rationale=(f"{label}: reassign {len(assign)} job(s) off {down}; "
                                 f"makespan {makespan:.0f} min, tardiness {tardiness:.0f} min."))


def schedule_with_risk(disruption: Disruption):
    """Solve, then fold the shared Monte-Carlo layer's robustness numbers into
    each option (non-routing plans report P(on-time) from simulate.evaluate)."""
    from .simulate import evaluate
    options = schedule(disruption)
    for opt in options:
        rp = evaluate(opt)
        opt.rationale += (f" | P(on-time) {rp.p_on_time:.0%}, "
                          f"E[cost] {rp.exp_cost:.0f}, CVaR95 {rp.cvar95_cost:.0f}")
    return options
