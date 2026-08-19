from typing import Dict, Any

class CongestionPredictiveModel:
    """Predictive model for port berth congestion index forecasting."""

    def predict_congestion(
        self,
        incoming_vessels: int,
        outgoing_vessels: int,
        occupied_berths: int,
        total_berths: int,
        weather_severity_score: float
    ) -> Dict[str, Any]:

        occupancy = occupied_berths / max(1, total_berths)
        net_traffic_pressure = (incoming_vessels - outgoing_vessels) / max(1, total_berths)
        
        predicted_congestion = min(1.0, max(0.0, (occupancy * 0.5) + (net_traffic_pressure * 0.3) + (weather_severity_score * 0.2)))
        disruption_prob = min(1.0, max(0.0, predicted_congestion * 1.15))

        return {
            "predicted_congestion_index": round(predicted_congestion, 2),
            "disruption_probability": round(disruption_prob, 2),
            "threat_classification": "CRITICAL" if disruption_prob > 0.75 else "ELEVATED" if disruption_prob > 0.40 else "NORMAL"
        }

congestion_model = CongestionPredictiveModel()
