"""
collectors/disasters.py
Disaster Collector — fetches 100% live natural disaster events from:
  - GDACS (Global Disaster Alert and Coordination System): Cyclones, Typhoons, Earthquakes, Floods, Volcanoes
  - USGS (United States Geological Survey): Earthquakes M5.0+

No hardcoded data. No API key required.

Target schema per event:
{
    "event_type": "typhoon",
    "location":   "Western Pacific",
    "latitude":   23.1,
    "longitude":  132.5,
    "severity":   "HIGH",
    "start_time": "2026-08-14T00:00:00Z",
    "end_time":   null,
    "source":     "GDACS"
}
"""
import httpx
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

logger = logging.getLogger("flowforge.collectors.disasters")

GDACS_URL = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH"
USGS_URL  = "https://earthquake.usgs.gov/fdsnws/event/1/query"

# GDACS alert level → FlowForge severity
GDACS_SEVERITY = {"Green": "LOW", "Orange": "MODERATE", "Red": "HIGH"}

# GDACS event type code → human-readable event_type
GDACS_EVENT_TYPES = {
    "TC": "typhoon",
    "EQ": "earthquake",
    "FL": "flood",
    "VO": "volcano",
    "DR": "drought",
    "WF": "wildfire",
    "TS": "tsunami",
}


def _gdacs_location(feature: dict) -> str:
    """Extract best available location label from GDACS feature."""
    props = feature.get("properties", {})
    name  = props.get("eventname") or props.get("name") or ""
    desc  = props.get("description") or ""
    return name or desc or "Unknown Location"


def _normalize_gdacs(feature: dict) -> Dict[str, Any]:
    props  = feature.get("properties", {})
    geom   = feature.get("geometry", {})
    coords = geom.get("coordinates", [None, None])

    alert    = props.get("alertlevel", "Green")
    etype    = GDACS_EVENT_TYPES.get(props.get("eventtype", ""), "disaster")
    severity = GDACS_SEVERITY.get(alert, "LOW")

    # Timestamps — GDACS provides fromdate/todate in some endpoints; parse if available
    start_time: Optional[str] = props.get("fromdate") or props.get("todate") or None
    end_time:   Optional[str] = props.get("todate") or None

    return {
        "event_type": etype,
        "location":   _gdacs_location(feature),
        "latitude":   coords[1] if len(coords) > 1 else None,
        "longitude":  coords[0] if len(coords) > 0 else None,
        "severity":   severity,
        "start_time": start_time,
        "end_time":   end_time,
        "source":     "GDACS",
    }


def _normalize_usgs(feature: dict) -> Dict[str, Any]:
    props  = feature.get("properties", {})
    geom   = feature.get("geometry", {})
    coords = geom.get("coordinates", [None, None, None])
    mag    = props.get("mag", 0)

    severity  = "HIGH" if mag >= 7.0 else ("MODERATE" if mag >= 6.0 else "LOW")
    title     = props.get("title") or props.get("place") or "Seismic Event"

    # USGS time is epoch ms
    time_ms   = props.get("time")
    start_iso = (
        datetime.fromtimestamp(time_ms / 1000, tz=timezone.utc).isoformat()
        if time_ms else None
    )

    return {
        "event_type": "earthquake",
        "location":   title,
        "latitude":   coords[1],
        "longitude":  coords[0],
        "severity":   severity,
        "start_time": start_iso,
        "end_time":   None,
        "source":     "USGS",
        # Extra fields useful for the disruption agent
        "magnitude":      mag,
        "depth_km":       coords[2],
        "tsunami_threat": props.get("tsunami", 0) == 1,
    }


class DisasterCollector:
    """Fetches and normalizes live disaster events from GDACS + USGS. Zero hardcoded data."""

    async def _fetch_gdacs(self, client: httpx.AsyncClient) -> List[Dict[str, Any]]:
        try:
            resp = await client.get(
                GDACS_URL,
                params={
                    "eventtypes":  "TC,EQ,FL,VO,TS",
                    "alertlevels": "Green,Orange,Red",
                    "limit":       "20",
                },
                timeout=20.0,
            )
            resp.raise_for_status()
            features = resp.json().get("features", [])
            logger.info(f"GDACS: {len(features)} live events fetched.")
            return [_normalize_gdacs(f) for f in features]
        except httpx.TimeoutException:
            raise RuntimeError("GDACS Disasters API request timed out")
        except httpx.HTTPStatusError as e:
            raise RuntimeError(f"GDACS Disasters API returned HTTP error: {e}")
        except httpx.RequestError as e:
            raise RuntimeError(f"GDACS Disasters API request failed: {e}")
        return []

    async def _fetch_usgs(self, client: httpx.AsyncClient) -> List[Dict[str, Any]]:
        try:
            resp = await client.get(
                USGS_URL,
                params={
                    "format":       "geojson",
                    "minmagnitude": "5.0",
                    "limit":        "5",
                    "orderby":      "time",
                },
                timeout=20.0,
            )
            resp.raise_for_status()
            features = resp.json().get("features", [])
            logger.info(f"USGS: {len(features)} live earthquakes fetched.")
            return [_normalize_usgs(f) for f in features]
        except httpx.TimeoutException:
            raise RuntimeError("USGS Earthquakes API request timed out")
        except httpx.HTTPStatusError as e:
            raise RuntimeError(f"USGS Earthquakes API returned HTTP error: {e}")
        except httpx.RequestError as e:
            raise RuntimeError(f"USGS Earthquakes API request failed: {e}")
        return []

    async def get_recent_disasters(self) -> List[Dict[str, Any]]:
        """Return combined live disasters from GDACS + USGS in target schema."""
        async with httpx.AsyncClient() as client:
            gdacs = await self._fetch_gdacs(client)
            usgs  = await self._fetch_usgs(client)
        return gdacs + usgs


disaster_collector = DisasterCollector()
