"""Verifier agent. OWNER: P4.
Red-teams the chosen option: deterministic constraint/policy checks first
(those alone decide pass/fail), then an OPTIONAL LLM critic that can only
lower confidence / add risk flags — never approve. Skipped silently when
GROQ_API_KEY is unset or the call fails.
KEEP the signature: (Plan, option_id) -> VerifierReport."""
from ..interfaces import Verifier
from ..contracts import Plan, PlanOption, VerifierReport, Check, ActionType
from .llm import groq_json

_CRITIC_SYSTEM = (
    "You red-team supply-chain resolution plans. Look for hidden risks: "
    "single-supplier dependence, irreversible spend, unrealistic transit "
    "assumptions, missing notifications. Respond with ONLY a JSON object "
    '{"ok": true|false, "concerns": ["short concern", ...]} (max 3 concerns).'
)


class StubVerifier(Verifier):
    def verify(self, plan: Plan, option_id: str) -> VerifierReport:
        opt = next((o for o in plan.options if o.id == option_id), None)
        checks, flags = [], []

        cost_ok = bool(opt and opt.total_cost < 50000)
        checks.append(Check(name="cost_ceiling", passed=cost_ok,
                            detail=f"cost={opt.total_cost if opt else 'NA'}"))
        steps_ok = bool(opt and opt.steps)
        checks.append(Check(name="has_steps", passed=steps_ok))
        # policy: every plan that acts must leave the ERP consistent
        erp_ok = bool(opt and any(s.action == ActionType.UPDATE_ERP for s in opt.steps))
        checks.append(Check(name="erp_sync", passed=erp_ok,
                            detail="plan must include an update_erp step"))
        if opt and any(not s.reversible for s in opt.steps):
            flags.append("irreversible_action")

        passed = all(c.passed for c in checks)
        confidence = 0.88 if passed and not flags else 0.55

        if passed and opt:
            critic = self._llm_critique(plan, opt)
            if critic is not None:
                ok, concerns = critic
                checks.append(Check(name="llm_critic", passed=ok,
                                    detail="; ".join(concerns) or "no concerns"))
                if not ok:
                    flags.extend(f"critic:{c}" for c in concerns[:3])
                    confidence = min(confidence, 0.65)   # force escalation, not failure

        return VerifierReport(plan_id=plan.id, option_id=option_id, passed=passed,
                              confidence=confidence, checks=checks, risk_flags=flags)

    @staticmethod
    def _llm_critique(plan: Plan, opt: PlanOption) -> tuple[bool, list[str]] | None:
        """Optional LLM red-team pass; None (= skip) on any failure."""
        steps = "; ".join(f"{s.action.value}->{s.target}"
                          f"{' (IRREVERSIBLE)' if not s.reversible else ''}"
                          for s in opt.steps)
        raw = groq_json(_CRITIC_SYSTEM,
                        f"Plan option: {opt.rationale}\nSteps: {steps}\n"
                        f"Total cost {opt.total_cost:.0f}, est time {opt.est_time_min:.0f} min.")
        if not isinstance(raw, dict) or not isinstance(raw.get("ok"), bool):
            return None
        concerns = raw.get("concerns", [])
        if not isinstance(concerns, list):
            concerns = []
        return raw["ok"], [str(c)[:120] for c in concerns[:3]]
