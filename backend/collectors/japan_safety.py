import requests
import logging
import re
from typing import Dict, Any, List

try:
    from config import JAPAN_MSIL_API_KEY, JAPAN_SAFETY_INFO_API
except ImportError:
    from backend.config import JAPAN_MSIL_API_KEY, JAPAN_SAFETY_INFO_API

logger = logging.getLogger("flowforge.collectors.japan_safety")

# MSIL Japan Safety Information Links LayerSelection = 1
SAFETY_INFO_QUERY_URL = "https://api.msil.go.jp/safety-information-links/v2/MapServer/1/query"

class JapanSafetyCollector:
    """Collects MSIL Safety Information Links (Coast Guard Regional HQ advisories and hydrographic warnings)."""

    def __init__(self, api_key: str = None):
        self.api_key = api_key or JAPAN_MSIL_API_KEY

    def fetch_safety_links(self) -> List[Dict[str, Any]]:
        headers = {"Ocp-Apim-Subscription-Key": self.api_key}
        params = {
            "f": "json",
            "where": "1=1",
            "outFields": "*",
            "returnGeometry": "true"
        }
        try:
            resp = requests.get(SAFETY_INFO_QUERY_URL, headers=headers, params=params, timeout=20)
            resp.raise_for_status()
            data = resp.json()
            features = data.get("features", [])
            links = []
            for feat in features:
                attrs = feat.get("attributes", {})
                geom = feat.get("geometry", {})
                name = attrs.get("海上保安本部_名称", "Coast Guard HQ")
                location_name = attrs.get("海上保安本部_所在地", "Japan Coast Guard")
                
                # Extract URLs from HTML link string if needed
                raw_nav_url = attrs.get("航行警報URL", "")
                clean_nav_url = re.search(r'href="([^"]+)"', raw_nav_url)
                nav_url = clean_nav_url.group(1) if clean_nav_url else ""

                links.append({
                    "hq_name": name,
                    "location_name": location_name,
                    "nav_warning_url": nav_url,
                    "latitude": geom.get("y"),
                    "longitude": geom.get("x")
                })
            return links
        except requests.Timeout:
            raise RuntimeError("MSIL Safety API request timed out")
        except requests.HTTPError as e:
            raise RuntimeError(f"MSIL Safety API returned HTTP error: {e}")
        except requests.RequestException as e:
            raise RuntimeError(f"MSIL Safety API request failed: {e}")
        return []

japan_safety_collector = JapanSafetyCollector()

def get_japan_safety_information():
    return japan_safety_collector.fetch_safety_links()
