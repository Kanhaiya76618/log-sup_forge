"""The confidence/cost human-in-the-loop gate. OWNER: P1.
This is scalability pillar #3: auto-handle the confident, cheap, reversible
cases; escalate only the uncertain ones, so human load grows sublinearly."""
from ..contracts import VerifierReport, PlanOption, GateOutcome, Decision
from .config import GateThresholds


class Gate:
    def __init__(self, thresholds: GateThresholds) -> None:
        self.t = thresholds

    def decide(self, report: VerifierReport, option: PlanOption) -> GateOutcome:
        if not report.passed:
            return GateOutcome(decision=Decision.REJECTED,
                               reason="Verifier rejected the plan", requires_human=False)
        irreversible = any(not s.reversible for s in option.steps)
        if self.t.block_irreversible_auto and irreversible:
            return GateOutcome(decision=Decision.ESCALATED,
                               reason="Plan contains an irreversible action", requires_human=True)
        if report.confidence < self.t.auto_approve_confidence:
            return GateOutcome(decision=Decision.ESCALATED,
                               reason=f"Confidence {report.confidence:.2f} below threshold",
                               requires_human=True)
        if option.total_cost > self.t.max_auto_cost:
            return GateOutcome(decision=Decision.ESCALATED,
                               reason=f"Cost {option.total_cost:.0f} exceeds auto ceiling",
                               requires_human=True)
        return GateOutcome(decision=Decision.AUTO_APPROVED,
                           reason="Confident, cheap, reversible", requires_human=False)
