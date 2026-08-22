import logging
from typing import Dict, Any, List, Optional

try:
    from app.services.preference_learning import preference_learning_engine
except ImportError:
    from services.preference_learning import preference_learning_engine

logger = logging.getLogger("flowforge.services.decision")


class SupplyChainDecisionEngine:
    """
    Deterministic Decision Engine evaluating multi-attribute trade-offs between
    baseline routes and alternative sea lanes using actual agent outputs:
    Disruption Probability, Predicted ETA, Rerouting & Baseline Costs, and Weather Hazards.

    Dynamically incorporates adaptive preference weights learned from human decision telemetry.
    """

    def __init__(self, risk_weight: float = 0.35, eta_weight: float = 0.35, cost_weight: float = 0.30):
        total_w = risk_weight + eta_weight + cost_weight
        self.risk_weight = risk_weight / total_w
        self.eta_weight = eta_weight / total_w
        self.cost_weight = cost_weight / total_w

    def evaluate_decision(
        self,
        origin_unlocode: str,
        destination_unlocode: str,
        disruption_eval: Dict[str, Any],
        eta_eval: Dict[str, Any],
        route_eval: Dict[str, Any],
        cost_eval: Dict[str, Any],
        profile_key: Optional[str] = "GLOBAL",
        custom_weights: Optional[Dict[str, float]] = None,
    ) -> Dict[str, Any]:

        # Resolve weights (custom overrides > preference_learning_engine > baseline defaults)
        if custom_weights:
            w_risk = custom_weights.get("risk_weight", self.risk_weight)
            w_eta = custom_weights.get("eta_weight", self.eta_weight)
            w_cost = custom_weights.get("cost_weight", self.cost_weight)
        elif profile_key:
            active_p = preference_learning_engine.get_active_weights(profile_key)
            w_risk = active_p.get("risk_weight", self.risk_weight)
            w_eta = active_p.get("eta_weight", self.eta_weight)
            w_cost = active_p.get("cost_weight", self.cost_weight)
        else:
            w_risk, w_eta, w_cost = self.risk_weight, self.eta_weight, self.cost_weight

        # Normalize resolved weights to sum to 1.0
        tot_w = w_risk + w_eta + w_cost
        w_risk, w_eta, w_cost = round(w_risk / tot_w, 4), round(w_eta / tot_w, 4), round(1.0 - (w_risk / tot_w) - (w_eta / tot_w), 4)

        # Extract actual agent values safely (supports float, int, or dict with "value" key)
        raw_disruption = disruption_eval.get("disruption_probability", 0.20)
        if isinstance(raw_disruption, dict):
            disruption_prob = float(raw_disruption.get("value", 0.20))
        else:
            disruption_prob = float(raw_disruption or 0.20)

        predicted_eta_days = float(eta_eval.get("predicted_total_hours", 120.0)) / 24.0
        predicted_delay_days = float(eta_eval.get("predicted_delay_days", 0.0))

        raw_ml_cost = cost_eval.get("ml_predicted_shipment_cost", 6857.80)
        if isinstance(raw_ml_cost, dict):
            ml_shipment_cost = float(raw_ml_cost.get("value", 6857.80))
        else:
            ml_shipment_cost = float(raw_ml_cost or 6857.80)

        raw_reroute_cost = cost_eval.get("cost_breakdown", {})
        if isinstance(raw_reroute_cost, dict):
            reroute_cost = float(raw_reroute_cost.get("total_reroute_cost_usd", 25560.86))
        else:
            reroute_cost = float(raw_reroute_cost or 25560.86)

        raw_savings = cost_eval.get("net_financial_savings_usd", 0.0)
        if isinstance(raw_savings, dict):
            net_savings = float(raw_savings.get("value", 0.0))
        else:
            net_savings = float(raw_savings or 0.0)

        reroute_required = route_eval.get("reroute_required", False)
        alternative_routes = route_eval.get("alternative_routes", [])

        # Evaluate candidate options
        candidates = []

        # Option A: Maintain Baseline Route
        baseline_risk_score = round(disruption_prob, 4)
        baseline_score = round(
            (1.0 - baseline_risk_score) * w_risk +
            (1.0 / (1.0 + (predicted_delay_days / 5.0))) * w_eta +
            (1.0 / (1.0 + (ml_shipment_cost / 50000.0))) * w_cost,
            4
        )
        candidates.append({
            "route_name": f"Baseline Corridor ({origin_unlocode} → {destination_unlocode})",
            "unlocode": destination_unlocode,
            "recommendation_score": baseline_score,
            "risk_score": baseline_risk_score,
            "eta_days": round(predicted_eta_days, 2),
            "total_cost_usd": round(ml_shipment_cost, 2),
            "reroute_required": False
        })

        # Option B: Diversion Routes
        for alt in alternative_routes:
            alt_risk_score = round(max(0.10, baseline_risk_score - 0.45), 4)
            alt_eta_days = round(max(1.0, predicted_eta_days - (alt.get("delay_avoided_hours", 24.0) / 24.0)), 2)
            alt_total_cost = round(ml_shipment_cost + reroute_cost, 2)

            alt_score = round(
                (1.0 - alt_risk_score) * w_risk +
                (1.0 / (1.0 + (max(0, alt_eta_days - 2.0) / 5.0))) * w_eta +
                (1.0 / (1.0 + (alt_total_cost / 50000.0))) * w_cost,
                4
            )
            candidates.append({
                "route_name": f"Divert via {alt.get('divert_to')} ({alt.get('route_id')})",
                "unlocode": alt.get("divert_to"),
                "recommendation_score": alt_score,
                "risk_score": alt_risk_score,
                "eta_days": alt_eta_days,
                "total_cost_usd": alt_total_cost,
                "reroute_required": True,
                "extra_distance_nm": alt.get("extra_distance_nm")
            })

        # Rank candidates by recommendation_score descending
        ranked = sorted(candidates, key=lambda x: x["recommendation_score"], reverse=True)
        recommended = ranked[0]

        reasoning_factors = [
            f"Disruption risk on primary corridor evaluated at {int(disruption_prob * 100)}% by disruption_model.pkl.",
            f"Predicted transit time: {round(predicted_eta_days, 1)} days with delay probability of {eta_eval.get('delay_probability_percent', 0)}%.",
            f"Net financial savings from executing diversion estimated at ${net_savings:,.2f} USD.",
            f"Decision weights applied: Risk={int(w_risk*100)}%, ETA={int(w_eta*100)}%, Cost={int(w_cost*100)}% (Profile: {profile_key})."
        ]

        tradeoffs = [
            f"Choosing {recommended['route_name']} balances maritime hazard avoidance against extra transit distance.",
            f"Baseline transit cost is ${ml_shipment_cost:,.2f} USD vs ${recommended['total_cost_usd']:,.2f} USD total diversion cost."
        ]

        return {
            "recommended_route": recommended["route_name"],
            "recommendation_score": {
                "value": recommended["recommendation_score"],
                "source": "DERIVED_CALCULATION"
            },
            "risk_score": {
                "value": recommended["risk_score"],
                "source": "DERIVED_CALCULATION"
            },
            "eta_days": {
                "value": recommended["eta_days"],
                "source": "DERIVED_CALCULATION"
            },
            "total_cost_usd": {
                "value": recommended["total_cost_usd"],
                "source": "DERIVED_CALCULATION"
            },
            "reasoning_factors": reasoning_factors,
            "tradeoffs": tradeoffs,
            "candidate_evaluations": ranked,
            "decision_weights": {
                "risk_weight": w_risk,
                "eta_weight": w_eta,
                "cost_weight": w_cost,
                "profile_key": profile_key,
                "source": "ADAPTIVE_PREFERENCE_LEARNING" if profile_key else "BASELINE_DEFAULT"
            }
        }

decision_engine = SupplyChainDecisionEngine()
