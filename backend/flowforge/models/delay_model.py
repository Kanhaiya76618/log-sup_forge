import numpy as np
from typing import Dict, Any

class DelayPredictiveModel:
    """ML/Heuristic model for predicting vessel ETA delays based on route telemetry."""

    def predict_delay_hours(
        self,
        distance_nm: float,
        vessel_speed_knots: float,
        wind_speed_knots: float,
        wave_height_meters: float,
        destination_port_congestion: float
    ) -> Dict[str, Any]:
        nominal_hours = distance_nm / (vessel_speed_knots + 1e-5)
        weather_delay_factor = 1.0 + (max(0.0, wind_speed_knots - 20.0) * 0.03) + (wave_height_meters * 0.05)
        port_delay_hours = destination_port_congestion * 48.0
        
        total_estimated_hours = (nominal_hours * weather_delay_factor) + port_delay_hours
        delay_delta_hours = max(0.0, total_estimated_hours - nominal_hours)

        return {
            "nominal_transit_hours": round(nominal_hours, 1),
            "predicted_total_hours": round(total_estimated_hours, 1),
            "estimated_delay_hours": round(delay_delta_hours, 1),
            "estimated_delay_days": round(delay_delta_hours / 24.0, 1),
            "confidence_score": 0.91
        }

delay_model = DelayPredictiveModel()
