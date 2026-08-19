"""
collectors/japan_port.py
Japan Port Collector — fetches live MSIL navigational warnings and safety data
and normalizes them into FlowForge standard port schema.

MSIL raw format (navigational warnings layer):
{
    "attributes": {
        "OBJECTID": 1,
        "AREA": "Yokohama Ko",
        "WARNINGTYPE": "Navigation Warning",
        "STARTDATE": 1723852800000,
        "ENDDATE": null,
        ...
    },
    "geometry": { "x": 139.638, "y": 35.4437 }
}

FlowForge standard port schema:
{
    "source":     "japan_msil",
    "port":       "Yokohama Ko",
    "latitude":   35.4437,
    "longitude":  139.638,
    "warning_type": "Navigation Warning",
    "status":     "active",
    "start_time": "2026-08-17T00:00:00Z",
    "end_time":   null
}
"""
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from .japan_navigation import get_japan_navigational_warnings
from .japan_safety import get_japan_safety_information

logger = logging.getLogger("flowforge.collectors.japan_port")


def _epoch_ms_to_iso(epoch_ms: Optional[int]) -> Optional[str]:
    """Convert MSIL epoch milliseconds to ISO 8601 string."""
    if not epoch_ms:
        return None
    try:
        return datetime.fromtimestamp(epoch_ms / 1000, tz=timezone.utc).isoformat()
    except Exception:
        return None


def _normalize_warning(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    Map raw MSIL navigational warning → FlowForge standard port schema.

    MSIL field     → Standard field
    name           → port (area/zone name)
    description    → warning_type
    latitude       → latitude
    longitude      → longitude
    """
    return {
        "source":       "japan_msil",
        "port":         raw.get("name") or "Japan Waters",
        "latitude":     raw.get("latitude"),
        "longitude":    raw.get("longitude"),
        "warning_type": "Navigation Warning",
        "description":  raw.get("description", ""),
        "status":       "active",
        "start_time":   None,
        "end_time":     None,
    }


def _normalize_safety(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    Map raw MSIL safety information link → FlowForge standard port schema.

    MSIL field          → Standard field
    hq_name             → port
    nav_warning_url     → description (URL context)
    latitude            → latitude
    longitude           → longitude
    """
    return {
        "source":       "japan_msil_safety",
        "port":         raw.get("hq_name") or "Japan Waters",
        "latitude":     raw.get("latitude"),
        "longitude":    raw.get("longitude"),
        "warning_type": "Safety Information",
        "description":  f"Safety links URL: {raw.get('nav_warning_url')}",
        "status":       "active",
        "start_time":   None,
        "end_time":     None,
    }


class JapanPortCollector:
    """
    Collects live MSIL port data (warnings + safety) and normalizes
    to FlowForge standard port schema. No hardcoded port records.
    """

    def get_normalized_warnings(self) -> List[Dict[str, Any]]:
        """Return live navigational warnings in standard schema."""
        raw_warnings = get_japan_navigational_warnings()
        return [_normalize_warning(w) for w in raw_warnings]

    def get_normalized_safety(self) -> List[Dict[str, Any]]:
        """Return live safety information links in standard schema."""
        raw_safety = get_japan_safety_information()
        return [_normalize_safety(s) for s in raw_safety]

    def get_all_port_data(self) -> List[Dict[str, Any]]:
        """Return combined live warnings + safety data in standard schema."""
        return self.get_normalized_warnings() + self.get_normalized_safety()


japan_port_collector = JapanPortCollector()


def get_japan_port_metadata() -> List[Dict[str, Any]]:
    """Entry point — returns all normalized live MSIL port data."""
    return japan_port_collector.get_all_port_data()
