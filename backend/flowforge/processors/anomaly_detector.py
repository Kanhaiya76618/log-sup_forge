import numpy as np
from typing import Dict, Any, List

class AnomalyDetector:
    """Detects statistical and threshold-based anomalies across sea lanes and ports."""

    def detect_vessel_anomalies(self, vessels: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        anomalies = []
        if not vessels:
            return anomalies

        speeds = [v.get("speed_knots", 15.0) for v in vessels]
        mean_speed = np.mean(speeds) if len(speeds) > 0 else 15.0
        std_speed = np.std(speeds) if len(speeds) > 1 else 3.0

        for vessel in vessels:
            speed = vessel.get("speed_knots", 15.0)
            z_score = (speed - mean_speed) / (std_speed + 1e-5)
            if z_score < -1.5 or speed < 12.0:
                anomalies.append({
                    "vessel_name": vessel.get("vessel_name") or vessel.get("name"),
                    "mmsi": vessel.get("mmsi"),
                    "type": "SPEED_DROP_ANOMALY",
                    "severity": "HIGH" if speed < 8.0 else "MEDIUM",
                    "description": f"Vessel speed {speed} knots is significantly below average ({round(mean_speed, 1)} knots)."
                })
        return anomalies

    def detect_port_anomalies(self, ports: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        anomalies = []
        for port in ports:
            congestion = port.get("congestion_index", 0.0)
            disruption_prob = port.get("disruption_probability", 0.0)
            if congestion > 0.75 or disruption_prob > 0.60:
                anomalies.append({
                    "port_id": port.get("port_id") or port.get("id"),
                    "port_name": port.get("name"),
                    "type": "CRITICAL_PORT_CONGESTION",
                    "severity": "CRITICAL" if disruption_prob > 0.80 else "HIGH",
                    "congestion_index": congestion,
                    "disruption_probability": disruption_prob,
                    "description": f"Port {port.get('name')} experiencing severe operational congestion ({int(disruption_prob*100)}% disruption prob)."
                })
        return anomalies

anomaly_detector = AnomalyDetector()
