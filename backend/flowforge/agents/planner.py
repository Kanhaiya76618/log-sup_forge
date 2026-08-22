"""Planner agent. OWNER: P3.
The LLM lives in _frame(): it reads the disruption and decides HOW to optimize
(which levers, whether speed beats cost). The solver then computes the numbers,
and the planner selects the recommended option per the framing.
Signature kept: plan(disruption) -> Plan."""
from ..interfaces import Planner
from ..contracts import Disruption, Plan, Severity
from ..solver import optimize_with_risk
from .llm import groq_json

_PORTS = ("Shanghai", "Yokohama", "Kobe", "Busan", "PVG", "Narita", "Tokyo_DC")

_FRAME_SYSTEM = (
    "You frame supply-chain disruption resolution for a deterministic solver. "
    "Decide whether speed matters more than cost, and which ports/hubs must be "
    "avoided. Respond with ONLY a JSON object of the form "
    '{"prefer_speed": true|false, "blocked": ["PortName", ...]}. '
    f"Valid port names: {', '.join(_PORTS)}. Use [] when nothing is blocked."
)


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
        """LLM framing with a deterministic fallback: if GROQ_API_KEY is unset,
        the call fails, or the JSON is invalid, the heuristic keeps the engine
        running offline with identical behavior to before."""
        intent = self._heuristic_frame(disruption)
        raw = groq_json(_FRAME_SYSTEM, self._frame_prompt(disruption))
        validated = self._validate_intent(raw)
        if validated is not None:
            intent.update(validated)
            intent["framed_by"] = "llm"
        return intent

    def _frame_prompt(self, d: Disruption) -> str:
        return (f"Disruption: {d.summary}\n"
                f"Type: {d.type.value}; severity: {d.severity.value}\n"
                f"Blast radius: {len(d.blast_radius.affected_orders)} order(s), "
                f"{len(d.blast_radius.affected_skus)} SKU(s), "
                f"value at risk {d.blast_radius.value_at_risk:.0f}\n"
                f"Context: {d.context}")

    @staticmethod
    def _validate_intent(raw: dict | None) -> dict | None:
        if not isinstance(raw, dict) or not isinstance(raw.get("prefer_speed"), bool):
            return None
        blocked = raw.get("blocked", [])
        if not isinstance(blocked, list):
            return None
        blocked = [b for b in blocked if isinstance(b, str) and b in _PORTS]
        out = {"prefer_speed": raw["prefer_speed"]}
        if blocked:
            out["blocked"] = blocked
        return out

    def _heuristic_frame(self, disruption: Disruption) -> dict:
        urgent = disruption.severity in (Severity.HIGH, Severity.CRITICAL)
        intent = {"prefer_speed": urgent, "type": disruption.type.value,
                  "framed_by": "heuristic"}
        if disruption.context.get("blocked"):
            intent["blocked"] = list(disruption.context["blocked"])
        return intent


# Keep core/engine.py's `from ..agents.planner import StubPlanner` working with
# zero changes in P1's lane. P1 may rename the import to OptimizingPlanner later.
StubPlanner = OptimizingPlanner
