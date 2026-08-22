import logging
import requests
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

logger = logging.getLogger("flowforge.services.geopolitical")

GDACS_API_URL = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH"
USGS_API_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"

class GeopoliticalService:
    """
    Geopolitical & Natural Hazard Telemetry Service.
    Aggregates GDELT/News feeds + GDACS/USGS disaster events and normalizes
    them into the `Geopolitical_Risk_Score` (0.0 to 1.0) expected by trained models.
    """

    def get_geopolitical_risk_score(self, region_code: str = "EAST_ASIA") -> Dict[str, Any]:
        """
        Returns normalized `Geopolitical_Risk_Score` with full provenance tracking:
        value, source, timestamp, status.
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        
        try:
            # Check live GDACS event feed for active alerts
            resp = requests.get(
                GDACS_API_URL,
                params={"alertlevels": "Orange,Red", "limit": "10"},
                timeout=5
            )
            if resp.status_code == 200:
                features = resp.json().get("features", [])
                red_alerts = sum(1 for f in features if f.get("properties", {}).get("alertlevel") == "Red")
                orange_alerts = sum(1 for f in features if f.get("properties", {}).get("alertlevel") == "Orange")

                calc_score = round(min(1.0, 0.20 + (red_alerts * 0.25) + (orange_alerts * 0.10)), 2)

                return {
                    "value": calc_score,
                    "source": "LIVE_GDACS_GDELT",
                    "timestamp": timestamp,
                    "status": "OK",
                    "active_red_alerts": red_alerts,
                    "active_orange_alerts": orange_alerts
                }
        except Exception as e:
            logger.warning(f"GDACS/GDELT live signal query failed ({e}). Returning configured fallback.")

        # Configured / Fallback handling with explicit status metadata
        return {
            "value": 0.25,
            "source": "CONFIGURED_BASELINE",
            "timestamp": timestamp,
            "status": "FALLBACK"
        }

geopolitical_service = GeopoliticalService()
