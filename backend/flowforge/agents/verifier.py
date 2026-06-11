from ..interfaces.agent import Verifier
from ..contracts import Disruption, PlanOption, VerifierReport

class VerifierAgent(Verifier):
    @property
    def name(self) -> str:
        return "Verifier"

    def verify(self, disruption: Disruption, plans: list[PlanOption]) -> VerifierReport:
        if not plans:
            return VerifierReport(
                confidence=0.0,
                passed=False,
                policy_checks={"has_options": False},
                reason="No viable plan options found."
            )

        best_plan = PlanOption.recommended(plans)
        if not best_plan:
            return VerifierReport(
                confidence=0.0,
                passed=False,
                policy_checks={"has_recommended_plan": False},
                reason="No recommended plan option could be determined."
            )

        # Basic policy guidelines checks
        budget_limit = 5000.0
        cost_ok = best_plan.total_cost <= budget_limit
        reversible_ok = all(step.reversible for step in best_plan.steps)
        
        passed = cost_ok and reversible_ok
        
        # Calculate confidence metric deterministically
        confidence = best_plan.score
        
        return VerifierReport(
            confidence=confidence,
            passed=passed,
            policy_checks={
                "within_budget": cost_ok,
                "fully_reversible": reversible_ok
            },
            reason="All routing policies verified successfully." if passed else "Plan exceeds budget cap or contains irreversible steps."
        )
