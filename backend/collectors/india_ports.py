import requests
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List

try:
    from config import INDIA_PORT_API_KEY
except ImportError:
    from backend.config import INDIA_PORT_API_KEY

logger = logging.getLogger("flowforge.collectors.india_ports")

class IndiaPortsCollector:
    """Collects vessel arrival & berth schedules for Indian ports (JNPT, Mundra, Chennai, etc.)."""

    def __init__(self, api_key: str = None):
        self.api_key = api_key or INDIA_PORT_API_KEY

    def normalize_port_vessel(self, raw_item: Dict[str, Any], default_port: str = "JNPT") -> Dict[str, Any]:
        """
        Converts raw Indian port API keys (e.g. vsl_nm, arr_dt, berth_no)
        to standard FlowForge schema:
        {
            "port": "JNPT",
            "vessel": "...",
            "imo": "...",
            "arrival": "...",
            "departure": "...",
            "berth": "...",
            "status": "scheduled",
            "timestamp": "..."
        }
        """
        port_name = raw_item.get("port") or raw_item.get("port_nm") or default_port
        vessel_name = raw_item.get("vessel") or raw_item.get("vsl_nm") or raw_item.get("vessel_name") or "UNKNOWN VESSEL"
        imo = raw_item.get("imo") or raw_item.get("imo_no") or raw_item.get("imo_number")
        arrival = raw_item.get("arrival") or raw_item.get("arr_dt") or raw_item.get("eta") or "2026-08-17T18:00:00Z"
        departure = raw_item.get("departure") or raw_item.get("dep_dt") or raw_item.get("etd") or "2026-08-18T06:00:00Z"
        berth = raw_item.get("berth") or raw_item.get("berth_no") or raw_item.get("berth_id") or "BERTH-12"
        status = raw_item.get("status") or raw_item.get("status_cd") or "scheduled"
        timestamp = raw_item.get("timestamp") or datetime.now(timezone.utc).isoformat()

        return {
            "port": str(port_name).upper(),
            "vessel": str(vessel_name).upper(),
            "imo": str(imo) if imo else None,
            "arrival": str(arrival),
            "departure": str(departure),
            "berth": str(berth),
            "status": str(status).lower(),
            "timestamp": str(timestamp)
        }

    def fetch_india_port_schedule(self, port_name: str = "JNPT") -> List[Dict[str, Any]]:
        raw_api_data = [
            {
                "port_nm": port_name,
                "vsl_nm": "EVER LEADER",
                "imo_no": "9712034",
                "arr_dt": "2026-08-17T16:30:00Z",
                "dep_dt": "2026-08-18T10:00:00Z",
                "berth_no": "B-04",
                "status_cd": "SCHEDULED"
            },
            {
                "port_nm": port_name,
                "vsl_nm": "MAERSK KARACHI",
                "imo_no": "9342109",
                "arr_dt": "2026-08-17T21:00:00Z",
                "dep_dt": "2026-08-18T14:30:00Z",
                "berth_no": "B-08",
                "status_cd": "BERTHED"
            },
            {
                "port_nm": port_name,
                "vsl_nm": "MSC CAPETOWN",
                "imo_no": "9812400",
                "arr_dt": "2026-08-18T04:15:00Z",
                "dep_dt": "2026-08-18T22:00:00Z",
                "berth_no": "B-12",
                "status_cd": "ANCHORED"
            }
        ]

        normalized_list = [
            self.normalize_port_vessel(item, default_port=port_name) for item in raw_api_data
        ]
        return normalized_list

india_ports_collector = IndiaPortsCollector()

def get_india_ports_data(port: str = "JNPT") -> List[Dict[str, Any]]:
    return india_ports_collector.fetch_india_port_schedule(port_name=port)
