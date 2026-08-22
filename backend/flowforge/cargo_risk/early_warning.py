"""
backend/flowforge/cargo_risk/early_warning.py
Hidden Delay / Early Warning Prediction Engine.

Detects weak signals hours/days before delays become visible to standard trackers:
- Unusual vessel speed decay vs baseline
- Escalating port waiting queues
- Weather gradient deterioration
- Chokepoint & strait congestion
"""

import math
from typing import Dict, Any, List
from ..models_ml.inference_service import disruption_ml_service


class EarlyDelayWarningEngine:
    """Predicts hidden delays and triggers early warning signals."""

    def __init__(self):
        self.critical_speed_loss_threshold = 0.20  # 20% speed drop is significant
        self.critical_port_wait_hours = 24.0

    def predict_early_warning(
        self,
        current_speed_knots: float,
        historical_speed_knots: float,
        scheduled_eta_hours: float,
        port_congestion_score: float,
        port_waiting_time_hours: float,
        weather_severity: float,
        distance_remaining_km: float,
        strait_bottleneck_score: float = 0.50
    ) -> Dict[str, Any]:
        """
        Evaluates weak signals and predicts delay hours & early warning severity.
        """
        contributing_factors: List[str] = []

        # 1. Speed Decay Factor (Weak Signal 1)
        speed_loss_pct = max(0.0, (historical_speed_knots - current_speed_knots) / max(1.0, historical_speed_knots))
        if speed_loss_pct >= 0.25:
            contributing_factors.append(f"Severe speed decay (-{round(speed_loss_pct*100, 1)}% vs baseline cruise)")
        elif speed_loss_pct >= 0.12:
            contributing_factors.append(f"Moderate speed loss (-{round(speed_loss_pct*100, 1)}% vs baseline cruise)")

        # 2. Port Queue & Berth Dwell (Weak Signal 2)
        if port_congestion_score >= 0.70:
            contributing_factors.append(f"Destination port congestion severe ({round(port_congestion_score*100)}%)")
        elif port_congestion_score >= 0.45:
            contributing_factors.append(f"Elevated berth queue dwell ({round(port_congestion_score*100)}%)")

        if port_waiting_time_hours >= 24.0:
            contributing_factors.append(f"Anchorage backlog exceeds {port_waiting_time_hours:.1f} hours")

        # 3. Weather Deterioration (Weak Signal 3)
        if weather_severity >= 0.70:
            contributing_factors.append("Active storm front & wave swell along active voyage corridor")
        elif weather_severity >= 0.45:
            contributing_factors.append("Adverse headwinds & monsoon swells impeding transit velocity")

        # 4. Maritime Chokepoints (Weak Signal 4)
        if strait_bottleneck_score >= 0.65:
            contributing_factors.append("Strait of Malacca / Suez transit density causing navigation slowdown")

        # 5. ML Model Integration
        operational_stress = min(1.0, (speed_loss_pct * 0.5) + (weather_severity * 0.5))
        geo_risk = min(1.0, (strait_bottleneck_score * 0.6) + (port_congestion_score * 0.4))
        
        ml_res = disruption_ml_service.predict(
            operational_stress=operational_stress,
            geo_port_risk=geo_risk,
            port_congestion_score=port_congestion_score
        )
        ml_prob = ml_res["disruption_probability"]

        # 6. Mathematical Delay Hours Estimation
        # Hours lost to speed deficit
        effective_hours_remaining = distance_remaining_km / max(5.0, current_speed_knots * 1.852)
        baseline_hours_remaining = distance_remaining_km / max(5.0, historical_speed_knots * 1.852)
        speed_delay_hours = max(0.0, effective_hours_remaining - baseline_hours_remaining)

        # Port and weather delay components
        port_delay_hours = port_waiting_time_hours * port_congestion_score
        weather_delay_hours = (weather_severity ** 1.5) * 16.0
        chokepoint_delay_hours = strait_bottleneck_score * 8.0

        total_delay_hours = round(speed_delay_hours + port_delay_hours + weather_delay_hours + chokepoint_delay_hours, 1)

        # 7. Early Warning Level Classification
        combined_prob = round((ml_prob * 0.65) + (min(1.0, total_delay_hours / 48.0) * 0.35), 4)

        if combined_prob >= 0.75 or total_delay_hours >= 36.0:
            level = "CRITICAL"
        elif combined_prob >= 0.50 or total_delay_hours >= 20.0:
            level = "HIGH"
        elif combined_prob >= 0.30 or total_delay_hours >= 8.0:
            level = "MEDIUM"
        else:
            level = "LOW"

        if not contributing_factors:
            contributing_factors.append("Nominal maritime transit conditions. Minor ocean currents.")

        return {
            "delay_probability": combined_prob,
            "predicted_delay_hours": total_delay_hours,
            "early_warning_level": level,
            "contributing_factors": contributing_factors,
            "model": f"FlowForge Early Warning Engine + {ml_res.get('model', 'ExtraTrees')}"
        }


early_warning_engine = EarlyDelayWarningEngine()
