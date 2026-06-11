from ..interfaces.agent import Verifier
from ..contracts import Disruption, PlanOption, VerifierReport
from ..contracts.trust import SystemTrustProfile


class VerifierAgent(Verifier):
    def __init__(self, trust_profile: SystemTrustProfile | None = None) -> None:
        # Use provided trust profile, or fall back to a safe default
        self._trust_profile = trust_profile or SystemTrustProfile()

    @property
    def name(self) -> str:
        return "Verifier"

    def verify(self, disruption: Disruption, plans: list[PlanOption]) -> VerifierReport:
        if not plans:
            return VerifierReport(
                confidence=0.0,
                passed=False,
                policy_checks={"has_options": False, "trust_verified": False},
                reason="No viable plan options found."
            )

        best_plan = PlanOption.recommended(plans)
        if not best_plan:
            return VerifierReport(
                confidence=0.0,
                passed=False,
                policy_checks={"has_recommended_plan": False, "trust_verified": False},
                reason="No recommended plan option could be determined."
            )

        # Basic policy checks
        budget_limit = 5000.0
        cost_ok = best_plan.total_cost <= budget_limit
        reversible_ok = all(step.reversible for step in best_plan.steps)

        # Trust check — evaluate the system-wide trust profile
        trust_ok = self._trust_profile.is_trusted()

        passed = cost_ok and reversible_ok and trust_ok

        # Calculate confidence metric deterministically
        confidence = best_plan.score

        return VerifierReport(
            confidence=confidence,
            passed=passed,
            policy_checks={
                "within_budget": cost_ok,
                "fully_reversible": reversible_ok,
                "trust_verified": trust_ok,
            },
            reason=(
                "All routing policies verified successfully."
                if passed
                else (
                    f"Trust check failed (composite score: {self._trust_profile.composite_score:.2f} "
                    f"< threshold: {self._trust_profile.min_threshold})."
                    if not trust_ok
                    else "Plan exceeds budget cap or contains irreversible steps."
                )
            ),
        )
