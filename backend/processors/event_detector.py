from typing import Dict, Any, List

class EventDetector:
    """Evaluates multi-source feeds to identify domain critical events (e.g. Typhoon landfall, Port Closure)."""

    def synthesize_events(self, disasters: List[Dict[str, Any]], news: List[Dict[str, Any]], port_anomalies: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        events = []

        # Check typhoons
        for disaster in disasters:
            if disaster.get("type") == "TYPHOON":
                events.append({
                    "event_id": f"EVT-{disaster.get('id')}",
                    "title": f"Typhoon Impact: {disaster.get('name')}",
                    "category": "WEATHER_DISASTER",
                    "severity": "CRITICAL",
                    "affected_regions": disaster.get("affected_zones", ["East Asia Sea Lanes"]),
                    "description": f"Typhoon with wind speeds up to {disaster.get('wind_speed_knots')} knots intersecting container shipping channels."
                })

        # Check port disruption alerts
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
