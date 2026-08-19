import requests
import logging
import re
from typing import Dict, Any, List

try:
    from config import JAPAN_MSIL_API_KEY, JAPAN_NAVIGATION_WARNINGS_API
except ImportError:
    from backend.config import JAPAN_MSIL_API_KEY, JAPAN_NAVIGATION_WARNINGS_API

logger = logging.getLogger("flowforge.collectors.japan_navigation")

# MSIL Japan Navigational Warnings LayerSelection = 1
NAV_WARNINGS_QUERY_URL = "https://api.msil.go.jp/navigational-warnings/v2/MapServer/1/query"

class JapanNavigationCollector:
    """Collects MSIL Navigational Warnings (light outages, hazard markers, swell alerts)."""

    def __init__(self, api_key: str = None):
        self.api_key = api_key or JAPAN_MSIL_API_KEY

    def fetch_navigational_warnings(self) -> List[Dict[str, Any]]:
        headers = {"Ocp-Apim-Subscription-Key": self.api_key}
        params = {
            "f": "json",
            "where": "1=1",
            "outFields": "*",
            "returnGeometry": "true"
        }
        try:
            resp = requests.get(NAV_WARNINGS_QUERY_URL, headers=headers, params=params, timeout=20)
            resp.raise_for_status()
            data = resp.json()
            features = data.get("features", [])
            warnings = []
            for feat in features:
                attrs = feat.get("attributes", {})
                geom = feat.get("geometry", {})
                raw_desc = attrs.get("description", "")
                clean_desc = re.sub(r'<[^>]+>', ' ', raw_desc).strip()
                warnings.append({
                    "name": attrs.get("name"),
                    "description": clean_desc,
                    "latitude": geom.get("y"),
                    "longitude": geom.get("x")
                })
            return warnings
        except requests.Timeout:
            raise RuntimeError("MSIL Navigation API request timed out")
        except requests.HTTPError as e:
            raise RuntimeError(f"MSIL Navigation API returned HTTP error: {e}")
        except requests.RequestException as e:
            raise RuntimeError(f"MSIL Navigation API request failed: {e}")
        return []

japan_navigation_collector = JapanNavigationCollector()

def get_japan_navigational_warnings():
    return japan_navigation_collector.fetch_navigational_warnings()
