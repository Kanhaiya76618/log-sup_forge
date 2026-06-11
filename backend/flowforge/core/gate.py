from ..contracts import PipelineRecord, Decision, VerifierReport

class Gate:
    def __init__(self, max_cost: float = 5000.0, min_confidence: float = 0.85) -> None:
        self.max_cost = max_cost
        self.min_confidence = min_confidence

    def evaluate(self, record: PipelineRecord) -> Decision:
        if not record.plans:
            return Decision.REJECTED

        best_plan = record.plan.recommended()
        if not best_plan:
            return Decision.REJECTED

        # Verification report check
        verification: VerifierReport = record.verification
        if not verification:
            return Decision.ESCALATED

        # Gate Logic
        confidence_ok = verification.confidence >= self.min_confidence
        cost_ok = best_plan.total_cost <= self.max_cost
        reversible_ok = all(step.reversible for step in best_plan.steps)

        if confidence_ok and cost_ok and reversible_ok:
            return Decision.AUTO_APPROVED
        else:
            return Decision.ESCALATED
