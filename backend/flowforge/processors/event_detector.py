from typing import Dict, Any, List

class EventDetector:
    """Evaluates multi-source feeds to identify domain critical events."""

    def synthesize_events(self, disasters: List[Dict[str, Any]], news: List[Dict[str, Any]], port_anomalies: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        events = []

        for disaster in disasters:
            if disaster.get("type") in ["TYPHOON", "EARTHQUAKE"]:
                events.append({
                    "event_id": f"EVT-{disaster.get('type')}",
                    "title": f"Disaster Impact: {disaster.get('title') or disaster.get('place')}",
                    "category": "ENVIRONMENTAL_DISASTER",
                    "severity": "CRITICAL",
                    "affected_regions": [disaster.get('place', 'Global Sea Lanes')],
                    "description": f"Event recorded at ({disaster.get('latitude')}, {disaster.get('longitude')})."
                })

        for anomaly in port_anomalies:
            events.append({
                "event_id": f"EVT-PORT-{anomaly.get('port_id')}",
                "title": f"Port Congestion Alert: {anomaly.get('port_name')}",
                "category": "PORT_DISRUPTION",
                "severity": anomaly.get("severity"),
                "affected_regions": [anomaly.get("port_name")],
                "description": anomaly.get("description")
            })

        return events

event_detector = EventDetector()
