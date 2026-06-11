# File: backend/flowforge/execution/gate.py

from __future__ import annotations

from flowforge.contracts.enums import Decision
from flowforge.contracts.pipeline import PipelineRecord
from flowforge.contracts.plan import PlanOption


# ── Thresholds ────────────────────────────────────────────────────────────────
CONFIDENCE_MIN: float = 0.70   # below this → ESCALATED
COST_MAX: float = 50_000.0     # above this  → ESCALATED
# ─────────────────────────────────────────────────────────────────────────────


class Gate:
    """
    Evaluates a completed PipelineRecord and returns a Decision.

    Rules (evaluated in order – first match wins):
    1. No verification report present           → REJECTED
    2. Verification did not pass                → REJECTED
    3. trust_verified policy check failed       → ESCALATED
    4. Best plan cost exceeds COST_MAX          → ESCALATED
    5. Verifier confidence < CONFIDENCE_MIN     → ESCALATED
    6. Any plan step is not reversible          → ESCALATED
    7. All checks pass                          → AUTO_APPROVED
    """

    def evaluate(self, record: PipelineRecord) -> Decision:
        # 1. Missing verification
        if record.verification is None:
            return Decision.REJECTED

        report = record.verification

        # 2. Verification failed entirely
        if not report.passed:
            return Decision.REJECTED

        # 3. Trust policy
        if not report.policy_checks.get("trust_verified", True):
            return Decision.ESCALATED

        # 4. Cost ceiling
        best: PlanOption | None = record.plan.recommended()
        if best is not None and best.total_cost > COST_MAX:
            return Decision.ESCALATED

        # 5. Confidence floor
        if report.confidence < CONFIDENCE_MIN:
            return Decision.ESCALATED

        # 6. Reversibility – all steps must be reversible for full auto-approval
        if best is not None:
            if any(not step.reversible for step in best.steps):
                return Decision.ESCALATED

        # 7. All clear
        return Decision.AUTO_APPROVED
