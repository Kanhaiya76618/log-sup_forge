"""Monte Carlo robustness layer over the deterministic solver. OWNER: P3.

optimize() returns the cost-optimal plan for ONE assumed future. Real transit
times and disruptions are uncertain, so a single cost hides the risk. This module
re-runs each plan across many sampled futures and reports:
  - p_on_time : fraction of futures where every shipment meets its deadline
  - exp_cost  : expected cost
  - p95_cost  : 95th-percentile (near worst-case) cost
  - cvar95    : mean cost in the worst 5% of futures (tail risk)
optimize_with_risk() folds these into each option so the Planner picks the most
ROBUST plan, not just the cheapest. Pure: contracts + network + numpy only."""
from __future__ import annotations
from dataclasses import dataclass
import numpy as np
from ..contracts import PlanOption, Disruption, ActionType
from .network import lookup_order, ROUTES

_ROUTE_BY_ID = {r.id: r for r in ROUTES}

# Uncertainty model. REPLACE these knobs with values fitted from warehouse history.
_TRANSIT_SIGMA = 0.18       # lognormal spread on transit time (right-skewed delays)
_DISRUPT_PROB = 0.06        # chance a chosen route is itself disrupted mid-transit
_DISRUPT_DELAY = 0.60       # extra transit fraction if that happens
_DISRUPT_SURCHARGE = 0.50   # extra cost fraction if that happens


@dataclass(frozen=True)
class RiskProfile:
    p_on_time: float
    exp_cost: float
    p95_cost: float
    cvar95_cost: float
    exp_lateness_min: float
    samples: int


def _assignments(option: PlanOption):
    """Recover (order, route) pairs from a reroute option's steps."""
    pairs = []
    for s in option.steps:
        if s.action == ActionType.REROUTE:
            pairs.append((lookup_order(s.target), _ROUTE_BY_ID.get(s.params.get("route"))))
    return pairs


def evaluate(option: PlanOption, samples: int = 500, seed: int | None = 7) -> RiskProfile:
    """Stress-test one plan across `samples` sampled futures."""
    rng = np.random.default_rng(seed)
    pairs = _assignments(option)
    if not pairs:                       # non-routing plan (e.g. replenishment PO)
        return RiskProfile(1.0, option.total_cost, option.total_cost,
                           option.total_cost, 0.0, samples)
    costs = np.zeros(samples)
    on_time = np.zeros(samples, dtype=bool)
    lateness = np.zeros(samples)
    for k in range(samples):
        all_ok, worst_late, sample_cost = True, 0.0, 0.0
        for order, route in pairs:
            base_t = route.transit_min if route else 1e9
            base_c = route.cost if route else option.total_cost
            actual_t = base_t * rng.lognormal(mean=0.0, sigma=_TRANSIT_SIGMA)
            actual_c = base_c
            if rng.random() < _DISRUPT_PROB:
                actual_t *= (1 + _DISRUPT_DELAY)
                actual_c *= (1 + _DISRUPT_SURCHARGE)
            sample_cost += actual_c
            worst_late = max(worst_late, max(0.0, actual_t - order.due_min))
            if actual_t > order.due_min:
                all_ok = False
        costs[k], on_time[k], lateness[k] = sample_cost, all_ok, worst_late
    cut = np.percentile(costs, 95)
    return RiskProfile(
        p_on_time=float(on_time.mean()),
        exp_cost=float(costs.mean()),
        p95_cost=float(cut),
        cvar95_cost=float(costs[costs >= cut].mean()),
        exp_lateness_min=float(lateness.mean()),
        samples=samples,
    )


def optimize_with_risk(disruption: Disruption, *, intent: dict | None = None,
                       samples: int = 500):
    """Solve, then re-score each option by robustness instead of nominal cost.
    Risk is blended into `score` and appended to `rationale` (no contract change)."""
    from .optimizer import optimize
    options = optimize(disruption, intent=intent)
    for opt in options:
        rp = evaluate(opt, samples=samples)
        opt.score = round(0.5 * opt.score + 0.5 * rp.p_on_time, 3)   # risk-adjusted
        opt.rationale += (f" | P(on-time) {rp.p_on_time:.0%}, "
                          f"E[cost] {rp.exp_cost:.0f}, CVaR95 {rp.cvar95_cost:.0f}")
    return options


if __name__ == "__main__":
    from ..contracts import BlastRadius, Domain, DisruptionType, Severity
    d = Disruption(domain=Domain.LOGISTICS, type=DisruptionType.PORT_CLOSURE,
                   severity=Severity.HIGH, summary="Yokohama closed 48h",
                   blast_radius=BlastRadius(affected_orders=["ORD-1041", "ORD-1042"],
                                            value_at_risk=18000.0))
    print("option         risk-adj-score   nominal-cost   detail")
    for o in optimize_with_risk(d):
        print(f"{o.id:<14} {o.score:<15} {o.total_cost:<14.0f} {o.rationale}")