"""Planner agent. OWNER: P3.
The LLM lives in _frame(): it reads the disruption and decides HOW to optimize
(which levers, whether speed beats cost). The solver then computes the numbers,
and the planner selects the recommended option per the framing.
Signature kept: plan(disruption) -> Plan."""
from ..interfaces import Planner
from ..contracts import Disruption, Plan, Severity
from ..solver import optimize_with_risk


class OptimizingPlanner(Planner):
    def plan(self, disruption: Disruption) -> Plan:
        intent = self._frame(disruption)
        # solver computes the numbers; simulate.py stress-tests each plan so the
        # option scores are risk-adjusted (reliability), not just nominal cost.
        options = optimize_with_risk(disruption, intent=intent)
        if not options:
            return Plan(disruption_id=disruption.id, options=[], recommended_option_id=None)
        if intent.get("prefer_speed"):
            best = min(options, key=lambda o: o.est_time_min)   # urgency wins
        else:
            best = max(options, key=lambda o: o.score)          # cost/value balance wins
        return Plan(disruption_id=disruption.id, options=options,
                    recommended_option_id=best.id, created_by="planner")

    def _frame(self, disruption: Disruption) -> dict:
        """Decide the optimization intent. REPLACE this body with an LLM call;
        the deterministic heuristic below keeps the engine running offline.

        An LLM prompt here would read disruption.summary + severity + blast_radius
        and return JSON like {"prefer_speed": true, "blocked": ["Yokohama"]}."""
        urgent = disruption.severity in (Severity.HIGH, Severity.CRITICAL)
        return {"prefer_speed": urgent, "type": disruption.type.value}


# Keep core/engine.py's `from ..agents.planner import StubPlanner` working with
# zero changes in P1's lane. P1 may rename the import to OptimizingPlanner later.
StubPlanner = OptimizingPlanner