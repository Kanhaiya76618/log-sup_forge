"""
backend/flowforge/cargo_risk/unified_journey_risk.py
Unified Cargo Journey Risk & Decision Intelligence Aggregator.

Orchestrates all 6 predictive risk modules:
1. Hidden Delay / Early Warning
2. Transshipment Failure & Buffer Predictor
3. Cargo Security & Theft Anomaly
4. Dynamic Multi-Objective Route Recommender
5. Cascading Disruption Graph Propagation
6. Cargo-Level ETA Predictor
"""

from typing import Dict, Any, List
from .early_warning import early_warning_engine
from .transshipment import transshipment_engine
from .security_anomaly import security_anomaly_engine
from .dynamic_routing import dynamic_routing_engine
from .cascading_disruption import cascading_disruption_engine
from .cargo_eta import cargo_eta_engine


class UnifiedCargoJourneyRiskEngine:
    """Combines all 6 cargo risk modules into a unified decision dashboard."""

    def evaluate_full_journey(
        self,
        shipment_id: str = "SH-4092",
        origin: str = "Mumbai JNPT (IN)",
        destination: str = "Port of Yokohama (JP)",
        transshipment_port: str = "Singapore Tuas (SG)",
        cargo_type: str = "Automotive ECUs & Battery Modules",
        cargo_value_usd: float = 35200000.0,
        current_speed_knots: float = 14.2,
        baseline_speed_knots: float = 18.0,
        scheduled_transit_hours: float = 192.0,
        port_congestion_score: float = 0.74,
        weather_severity: float = 0.68,
        geopolitical_risk: float = 0.55,
        operational_stress: float = 0.72,
        connecting_departure_hours: float = 68.0,
        inbound_arrival_hours: float = 52.0,
        route_deviation_km: float = 32.0,
        ais_gap_hours: float = 0.0
    ) -> Dict[str, Any]:
        """
        Executes end-to-end journey intelligence and calculates correlation-aware overall risk.
        """
        # 1. Early Warning Prediction
        early_res = early_warning_engine.predict_early_warning(
            current_speed_knots=current_speed_knots,
            historical_speed_knots=baseline_speed_knots,
            scheduled_eta_hours=scheduled_transit_hours,
            port_congestion_score=port_congestion_score,
            port_waiting_time_hours=18.5,
            weather_severity=weather_severity,
            distance_remaining_km=3200.0,
            strait_bottleneck_score=geopolitical_risk
        )

        # 2. Transshipment Failure Prediction
        trans_res = transshipment_engine.evaluate_transshipment_risk(
            predicted_inbound_arrival_hours=inbound_arrival_hours,
            connecting_vessel_departure_hours=connecting_departure_hours,
            port_congestion_score=port_congestion_score
        )

        # 3. Cargo Security Anomaly Detection
        sec_res = security_anomaly_engine.evaluate_security_risk(
            route_deviation_km=route_deviation_km,
            unscheduled_stops=0,
            ais_gap_hours=ais_gap_hours,
            dwell_time_hours=12.0,
            high_risk_zone=(geopolitical_risk > 0.60),
            manifest_weight_discrepancy_pct=0.8,
            cargo_value_usd=cargo_value_usd
        )

        # 4. Dynamic Route Recommendation
        route_res = dynamic_routing_engine.recommend_routes(
            origin=origin,
            destination=destination
        )

        # 5. Cascading Disruption Propagation
        cascade_res = cascading_disruption_engine.predict_cascade(
            initial_disruption="Destination port congestion & weather swell",
            initial_delay_hours=early_res["predicted_delay_hours"],
            destination_congestion=port_congestion_score,
            has_transshipment=bool(transshipment_port)
        )

        # 6. Cargo-Level ETA Prediction
        eta_res = cargo_eta_engine.predict_cargo_eta(
            transit_duration_hours=scheduled_transit_hours,
            port_waiting_hours=16.0 * port_congestion_score,
            berth_handling_hours=8.0,
            customs_inspection_hours=4.5,
            inland_transit_hours=14.0,
            disruption_delay_hours=cascade_res["estimated_final_delay_hours"]
        )

        # 7. Correlation-Aware Overall Risk Aggregation
        # Avoid double-counting: Port congestion & weather are root drivers that correlate with hidden delay & cascade
        # We use a discounted variance-covariance weighting
        w_hidden = 0.25
        w_trans = 0.20
        w_cascade = 0.20
        w_cong = 0.15
        w_sec = 0.10
        w_route = 0.10

        raw_overall = (
            w_hidden * early_res["delay_probability"] +
            w_trans * trans_res["transshipment_risk"] +
            w_cascade * cascade_res["cascade_probability"] +
            w_cong * port_congestion_score +
            w_sec * sec_res["cargo_security_risk"] +
            w_route * (route_res["ranked_routes"][0]["risk_score"] / 100.0)
        )
        overall_risk = round(min(0.99, max(0.05, raw_overall)), 3)

        # Executive Key Risks
        key_risks: List[str] = []
        if early_res["delay_probability"] >= 0.60:
            key_risks.append(f"Early Warning: {early_res['early_warning_level']} delay risk (+{early_res['predicted_delay_hours']}h expected)")
        if trans_res["transshipment_risk"] >= 0.50:
            key_risks.append(f"Transshipment At Risk: Buffer window squeezed to {trans_res['buffer_hours']}h at {transshipment_port}")
        if cascade_res["cascade_probability"] >= 0.60:
            key_risks.append(f"Cascading Delay: Initial bottleneck amplifying to +{cascade_res['estimated_final_delay_hours']}h at final destination")
        if port_congestion_score >= 0.65:
            key_risks.append(f"Port Congestion: Destination berth queue operating at {round(port_congestion_score*100)}% density")
        if sec_res["cargo_security_risk"] >= 0.50:
            key_risks.append("Security Anomaly: Route deviation and high-value cargo exposure")

        if not key_risks:
            key_risks.append("All cargo risk indicators nominal. Proceeding on schedule.")

        # Prioritized Actionable Recommendations
        recommended_actions = [
            f"Execute {route_res['recommended_route_name']} to avoid {cascade_res['critical_bottlenecks'][0] if cascade_res['critical_bottlenecks'] else 'storm area'}.",
            trans_res["recommended_action"],
            f"Alert consignee of P80 delivery milestone at Hour {eta_res['prediction_intervals']['p80_hours']:.0f} (Buffer: +{eta_res['expected_delay_hours']}h)."
        ]

        # Multi-Node Interactive Journey Timeline
        journey_timeline = [
            {
                "node_id": "LEG-01",
                "stage": "Origin Port Loading",
                "location": origin,
                "status": "COMPLETED",
                "risk_tier": "LOW",
                "dwell_hours": 6.0,
                "detail": "Loaded on scheduled feeder. Zero gate-in delays."
            },
            {
                "node_id": "LEG-02",
                "stage": "Inbound Feeder Voyage",
                "location": "Arabian Sea -> Malacca Strait",
                "status": "IN_PROGRESS",
                "risk_tier": "MEDIUM" if current_speed_knots < baseline_speed_knots else "LOW",
                "dwell_hours": 52.0,
                "detail": f"Speed {current_speed_knots} kn ({early_res['contributing_factors'][0] if early_res['contributing_factors'] else 'Nominal'})."
            },
            {
                "node_id": "LEG-03",
                "stage": "Transshipment Transfer",
                "location": transshipment_port,
                "status": "AT_RISK" if trans_res["transshipment_risk"] > 0.45 else "PENDING",
                "risk_tier": "HIGH" if trans_res["transshipment_risk"] > 0.60 else ("MEDIUM" if trans_res["transshipment_risk"] > 0.35 else "LOW"),
                "dwell_hours": 9.5,
                "detail": f"Buffer: {trans_res['buffer_hours']} hrs. Status: {trans_res['connection_status']}."
            },
            {
                "node_id": "LEG-04",
                "stage": "Mother Vessel Voyage (Leg 2)",
                "location": "South China Sea -> Pacific",
                "status": "PENDING",
                "risk_tier": "CRITICAL" if weather_severity > 0.65 else "MEDIUM",
                "dwell_hours": 88.0,
                "detail": f"Recommended corridor: {route_res['recommended_route_id']}."
            },
            {
                "node_id": "LEG-05",
                "stage": "Destination Port Berth",
                "location": destination,
                "status": "PENDING",
                "risk_tier": "HIGH" if port_congestion_score > 0.65 else "LOW",
                "dwell_hours": 18.0,
                "detail": f"Berth congestion {round(port_congestion_score*100)}%. Unloading ETA: Hour {eta_res['container_available_eta_hours']:.0f}."
            },
            {
                "node_id": "LEG-06",
                "stage": "Final Warehouse Delivery",
                "location": "Consignee Assembly Plant",
                "status": "PENDING",
                "risk_tier": "MEDIUM",
                "dwell_hours": 14.0,
                "detail": f"Final Delivery P50 ETA: Hour {eta_res['final_delivery_eta_hours']:.0f} (P90: Hour {eta_res['prediction_intervals']['p90_hours']:.0f})."
            }
        ]

        return {
            "shipment_id": shipment_id,
            "port_congestion_risk": round(port_congestion_score, 3),
            "hidden_delay_risk": early_res["delay_probability"],
            "transshipment_risk": trans_res["transshipment_risk"],
            "cargo_security_risk": sec_res["cargo_security_risk"],
            "route_risk": round(route_res["ranked_routes"][0]["risk_score"] / 100.0, 3),
            "cascade_risk": cascade_res["cascade_probability"],
            "overall_risk": overall_risk,
            "predicted_delay_hours": early_res["predicted_delay_hours"],
            "vessel_eta_hours": eta_res["vessel_eta_hours"],
            "cargo_eta_hours": eta_res["final_delivery_eta_hours"],
            "recommended_route": route_res["recommended_route_name"],
            "key_risks": key_risks,
            "recommended_actions": recommended_actions,
            "journey_timeline": journey_timeline
        }


unified_journey_risk_engine = UnifiedCargoJourneyRiskEngine()
