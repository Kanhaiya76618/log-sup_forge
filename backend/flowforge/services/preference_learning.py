"""
Adaptive Preference Learning Engine for FlowForge (Step 2 Compliant).

Learns human risk posture & trade-off preferences from decision history ('accepted', 'paused', 'abandoned')
and adjusts decision weights (w_risk, w_eta, w_cost) for future route recommendations.
"""
import logging
from typing import Dict, Any, Tuple
from app.database.decision_memory import decision_memory_store

logger = logging.getLogger("flowforge.services.preference_learning")


class PreferenceLearningEngine:
    """
    Adaptive Preference Learning Engine — updates routing decision weights based on human feedback.
    """

    LEARNING_RATE = 0.08  # Weight adjustment step size per abandonment signal
    MIN_WEIGHT = 0.10     # Floor to ensure no criteria is completely zeroed out

    def get_active_weights(self, profile_key: str = "GLOBAL") -> Dict[str, float]:
        """
        Retrieve active learned weights (w_risk, w_eta, w_cost) for a given profile.
        """
        pref = decision_memory_store.get_preference_weights(profile_key)
        return {
            "risk_weight": pref["risk_weight"],
            "eta_weight": pref["eta_weight"],
            "cost_weight": pref["cost_weight"],
        }

    def process_decision_feedback(
        self,
        profile_key: str,
        decision_status: str,
        abandonment_reason: str = None,
    ) -> Tuple[Dict[str, float], Dict[str, float]]:
        """
        Processes human decision feedback and updates profile preference weights.

        Returns:
            (new_weights, weight_deltas)
        """
        old_pref = self.get_active_weights(profile_key)
        rw = old_pref["risk_weight"]
        ew = old_pref["eta_weight"]
        cw = old_pref["cost_weight"]

        step = self.LEARNING_RATE
        status = decision_status.lower().strip()

        if status == "abandoned" and abandonment_reason:
            reason = abandonment_reason.lower().strip()
            if reason in ["cost", "cost_too_high"]:
                # User wants lower costs → increase cost weight, decrease risk/ETA
                cw += step
                rw -= step / 2.0
                ew -= step / 2.0
            elif reason in ["risk", "risk_too_high"]:
                # User wants lower risk → increase risk weight, decrease cost/ETA
                rw += step
                cw -= step / 2.0
                ew -= step / 2.0
            elif reason in ["eta", "eta_too_long"]:
                # User wants faster transit → increase ETA weight, decrease risk/cost
                ew += step
                rw -= step / 2.0
                cw -= step / 2.0
            elif reason in ["carrier_constraint", "carrier_untrusted", "port_constraint", "regulatory"]:
                # Operational / risk constraints → boost risk weight
                rw += step * 0.75
                cw -= step * 0.375
                ew -= step * 0.375
            elif reason in ["route_preference", "customer_preference"]:
                # Preference constraint → balanced adjustment
                ew += step * 0.5
                rw += step * 0.5
                cw -= step

        # Enforce minimum floor per weight
        rw = max(self.MIN_WEIGHT, rw)
        ew = max(self.MIN_WEIGHT, ew)
        cw = max(self.MIN_WEIGHT, cw)

        # Normalize weights to sum to 1.0
        total = rw + ew + cw
        rw = round(rw / total, 4)
        ew = round(ew / total, 4)
        cw = round(1.0 - rw - ew, 4)

        # Compute deltas
        deltas = {
            "risk_weight": round(rw - old_pref["risk_weight"], 4),
            "eta_weight": round(ew - old_pref["eta_weight"], 4),
            "cost_weight": round(cw - old_pref["cost_weight"], 4),
        }

        # Save to Decision Memory
        new_pref = decision_memory_store.save_preference_weights(
            profile_key=profile_key,
            risk_weight=rw,
            eta_weight=ew,
            cost_weight=cw,
        )

        logger.info(
            f"PreferenceLearningEngine updated [{profile_key}]: "
            f"Status={status}, Reason={abandonment_reason} → "
            f"Weights(Risk={rw}, ETA={ew}, Cost={cw}), Deltas={deltas}"
        )

        return (
            {
                "risk_weight": new_pref["risk_weight"],
                "eta_weight": new_pref["eta_weight"],
                "cost_weight": new_pref["cost_weight"],
            },
            deltas,
        )

    def reset_preferences(self, profile_key: str = "GLOBAL") -> Dict[str, float]:
        pref = decision_memory_store.reset_preference_weights(profile_key)
        return {
            "risk_weight": pref["risk_weight"],
            "eta_weight": pref["eta_weight"],
            "cost_weight": pref["cost_weight"],
        }


preference_learning_engine = PreferenceLearningEngine()
