"""
backend/flowforge/cargo_risk/security_anomaly.py
Cargo Theft / Fraud & Security Anomaly Detection Engine.

Detects statistical behavioral anomalies across active container shipments:
- Route deviation anomalies
- AIS transponder dark gaps
- Unscheduled loitering/stops in high-risk zones
- Manifest weight/item discrepancies
"""

from typing import Dict, Any, List


class CargoSecurityAnomalyEngine:
    """Detects security anomalies and assesses theft/diversion risk."""

    def evaluate_security_risk(
        self,
        route_deviation_km: float = 0.0,
        unscheduled_stops: int = 0,
        ais_gap_hours: float = 0.0,
        dwell_time_hours: float = 0.0,
        high_risk_zone: bool = False,
        manifest_weight_discrepancy_pct: float = 0.0,
        cargo_value_usd: float = 10000000.0
    ) -> Dict[str, Any]:
        """
        Calculates cargo security anomaly score and flags risk patterns.
        """
        anomalies: List[str] = []
        anomaly_scores: List[float] = []

        # 1. Route Deviation Anomaly
        if route_deviation_km >= 60.0:
            anomalies.append(f"Significant route corridor deviation (+{route_deviation_km:.1f} km off planned lane)")
            anomaly_scores.append(0.85)
        elif route_deviation_km >= 25.0:
            anomalies.append(f"Minor course deviation (+{route_deviation_km:.1f} km)")
            anomaly_scores.append(0.40)

        # 2. AIS Transponder Gaps (Dark Ship Anomaly)
        if ais_gap_hours >= 4.0:
            anomalies.append(f"Critical AIS transponder outage ({ais_gap_hours:.1f} hours dark)")
            anomaly_scores.append(0.90)
        elif ais_gap_hours >= 1.0:
            anomalies.append(f"Intermittent AIS signal loss ({ais_gap_hours:.1f} hours)")
            anomaly_scores.append(0.45)

        # 3. Unscheduled Stops / Loitering
        if unscheduled_stops >= 2:
            anomalies.append(f"{unscheduled_stops} unscheduled open-sea stops recorded")
            anomaly_scores.append(0.80)
        elif unscheduled_stops == 1:
            anomalies.append("Single unscheduled offshore stop detected")
            anomaly_scores.append(0.50)

        # 4. Manifest / Weight Discrepancies (Tampering/Fraud)
        if manifest_weight_discrepancy_pct >= 5.0:
            anomalies.append(f"Manifest weight discrepancy alert ({manifest_weight_discrepancy_pct:.1f}% variance)")
            anomaly_scores.append(0.75)

        # 5. High-Risk Piracy/Theft Corridor
        if high_risk_zone:
            anomalies.append("Vessel transiting designated High-Risk Maritime Security Zone")
            anomaly_scores.append(0.60)

        # Aggregate Score
        if not anomaly_scores:
            base_score = 0.08
            risk_level = "NORMAL"
            anomalies.append("All navigational, AIS, and cargo weight telemetry nominal.")
        else:
            base_score = sum(anomaly_scores) / len(anomaly_scores)
            # High-value cargo multiplier
            value_factor = min(1.3, 1.0 + (cargo_value_usd / 100000000.0) * 0.3)
            base_score = min(0.99, base_score * value_factor)

            if base_score >= 0.70:
                risk_level = "HIGH_RISK"
            elif base_score >= 0.35:
                risk_level = "ANOMALOUS"
            else:
                risk_level = "NORMAL"

        return {
            "cargo_security_risk": round(base_score, 3),
            "risk_level": risk_level,
            "anomalies": anomalies,
            "anomaly_score": round(base_score * 100.0, 1)
        }


security_anomaly_engine = CargoSecurityAnomalyEngine()
