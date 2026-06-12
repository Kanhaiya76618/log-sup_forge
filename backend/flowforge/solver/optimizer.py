"""Deterministic optimizer. OWNER: P3.
The 'wrapper-antidote': the LLM never does arithmetic — this does, with OR-Tools
CP-SAT (capacity-constrained route assignment) and a small replenishment model.
Signature kept: optimize(disruption) -> list[PlanOption].  `intent` is an optional
hint the Planner (LLM) passes; ignored if absent."""
from __future__ import annotations
from ..contracts import (PlanOption, PlanStep, ActionType, Disruption,
                         DisruptionType, Severity)
from .network import lookup_order, candidate_routes, Route, Order, SUPPLIERS

try:
    from ortools.sat.python import cp_model
    _HAS_ORTOOLS = True
except Exception:                       # graceful fallback keeps the lane unblocked
    _HAS_ORTOOLS = False


def optimize(disruption: Disruption, *, intent: dict | None = None) -> list[PlanOption]:
    intent = intent or {}
    if disruption.type == DisruptionType.SUPPLY_SHORTAGE:
        return _replenish(disruption)
    return _reroute(disruption, intent)


# ---------- reroute: assignment MILP solved at three cost/time weightings ----------
def _reroute(disruption: Disruption, intent: dict) -> list[PlanOption]:
    ids = disruption.blast_radius.affected_orders or [f"ORD-{disruption.id}"]
    orders = [lookup_order(o) for o in ids]
    routes = candidate_routes(_blocked(disruption, intent))
    # HOLD fallback so the model is always feasible; expensive on purpose (= lose value).
    hold = Route("hold", ("CN", "JP"), (), max(o.value for o in orders), 100000.0, 10**9)
    routes = routes + [hold]

    options, seen = [], set()
    for label, w in (("cost-optimal", 1), ("balanced", 8), ("time-optimal", 40)):
        assign, total_cost, max_time = _solve(orders, routes, w)
        if assign is None:
            continue
        key = tuple(sorted((o.id, r.id) for o, r in assign))
        if key in seen:
            continue
        seen.add(key)
        options.append(_build_reroute_option(label, assign, total_cost, max_time, orders))
    return options


def _solve(orders: list[Order], routes: list[Route], delay_w: int):
    """Min  sum(cost + delay_w*lateness) s.t. one route per order + route capacity."""
    if _HAS_ORTOOLS:
        m = cp_model.CpModel()
        x = {(i, j): m.NewBoolVar(f"x_{i}_{j}")
             for i in range(len(orders)) for j in range(len(routes))}
        for i in range(len(orders)):
            m.Add(sum(x[i, j] for j in range(len(routes))) == 1)
        for j, r in enumerate(routes):
            cap = min(int(r.capacity), 10**9)
            m.Add(sum(int(round(orders[i].demand)) * x[i, j]
                      for i in range(len(orders))) <= cap)
        obj = []
        for i, o in enumerate(orders):
            for j, r in enumerate(routes):
                lateness = max(0.0, r.transit_min - o.due_min)
                obj.append(int(round(r.cost + delay_w * lateness)) * x[i, j])
        m.Minimize(sum(obj))
        s = cp_model.CpSolver()
        s.parameters.max_time_in_seconds = 2.0
        if s.Solve(m) not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            return None, 0.0, 0.0
        assign, total, mx = [], 0.0, 0.0
        for i, o in enumerate(orders):
            for j, r in enumerate(routes):
                if s.Value(x[i, j]):
                    assign.append((o, r)); total += r.cost; mx = max(mx, r.transit_min)
        return assign, total, mx

    # fallback: per-order greedy (ignores shared capacity) so the lane never blocks
    assign, total, mx = [], 0.0, 0.0
    for o in orders:
        best = min(routes, key=lambda r: r.cost + delay_w * max(0.0, r.transit_min - o.due_min))
        assign.append((o, best)); total += best.cost; mx = max(mx, best.transit_min)
    return assign, total, mx


def _build_reroute_option(label, assign, total_cost, max_time, orders) -> PlanOption:
    steps = [PlanStep(action=ActionType.REROUTE, target=o.id,
                      params={"route": r.id, "via": list(r.via)},
                      est_cost=r.cost, reversible=True) for o, r in assign]
    steps.append(PlanStep(action=ActionType.UPDATE_ERP, target="erp",
                          params={"status": "rerouted"}, reversible=True))
    steps.append(PlanStep(action=ActionType.NOTIFY, target="procurement",
                          params={"channel": "email"}, reversible=True))
    value = sum(o.value for o in orders) or 1.0
    score = round(max(0.0, 1.0 - 0.6 * min(1.0, total_cost / value)
                            - 0.4 * min(1.0, max_time / 5000.0)), 3)
    return PlanOption(steps=steps, total_cost=round(total_cost, 2),
                      est_time_min=round(max_time, 1), score=score,
                      rationale=(f"{label}: reroute {len(assign)} shipment(s); "
                                 f"cost {total_cost:.0f}, max transit {max_time:.0f} min."))


# ---------- replenish: cheapest supplier covering the shortfall (commits a PO) ----------
def _replenish(disruption: Disruption) -> list[PlanOption]:
    var = disruption.blast_radius.value_at_risk or 5000.0
    units = max(10, int(var / 50))
    sid, price, cap, lead = min(SUPPLIERS, key=lambda s: s[1])
    qty = min(units, cap)
    cost = qty * price
    steps = [
        PlanStep(action=ActionType.REPLENISH, target=sid, params={"qty": qty},
                 est_cost=cost, reversible=True),
        # committing funds is irreversible -> the gate will require a human.
        PlanStep(action=ActionType.ISSUE_PO, target=sid,
                 params={"qty": qty, "unit_price": price}, est_cost=cost, reversible=False),
        PlanStep(action=ActionType.UPDATE_ERP, target="erp", params={"po": sid}, reversible=True),
    ]
    score = round(max(0.0, 1.0 - min(1.0, cost / (var + 1))), 3)
    return [PlanOption(steps=steps, total_cost=round(cost, 2), est_time_min=float(lead),
                       score=score,
                       rationale=(f"Cover ~{units}-unit shortfall via {sid} at {price}/unit "
                                  f"(lead {lead} min). PO commits funds, so human approval is required."))]


def _blocked(disruption: Disruption, intent: dict) -> tuple[str, ...]:
    if intent.get("blocked"):
        return tuple(intent["blocked"])
    t, sev = disruption.type, disruption.severity
    if t == DisruptionType.PORT_CLOSURE:
        return ("Yokohama", "Kobe") if sev == Severity.CRITICAL else ("Yokohama",)
    if t == DisruptionType.SHIPMENT_DELAY and sev in (Severity.HIGH, Severity.CRITICAL):
        return ("Yokohama",)
    return ()
