import time
import logging
import requests
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

try:
    from app.config import PORT_API_KEY, JAPAN_SAFETY_INFO_API, JAPAN_NAVIGATION_WARNINGS_API
    from app.schemas.telemetry import NormalizedPortData
    from app.services.port_registry import port_registry
except ImportError:
    from config import PORT_API_KEY, JAPAN_SAFETY_INFO_API, JAPAN_NAVIGATION_WARNINGS_API
    from schemas.telemetry import NormalizedPortData
    from services.port_registry import port_registry

logger = logging.getLogger("flowforge.services.port")

_PORT_CACHE: Dict[str, Dict[str, Any]] = {}
_PORT_CACHE_TTL = 600  # 10 minutes

class PortService:
    """
    PortService — provides port operational metrics, berth congestion, waiting times,
    vessel traffic, and status. Isolated from ML agents with NormalizedPortData contract.
    """

    def __init__(self, timeout: float = 5.0, max_retries: int = 2):
        self.timeout = timeout
        self.max_retries = max_retries
        self.api_key = PORT_API_KEY

    def _http_get_with_retry(self, url: str, params: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """HTTP GET helper with retry policy for external port APIs."""
        if not url or url.startswith("http") is False:
            return None
        params = params or {}
        if self.api_key:
            params["api_key"] = self.api_key
        for attempt in range(1, self.max_retries + 1):
            try:
                resp = requests.get(url, params=params, timeout=self.timeout)
                if resp.status_code == 200:
                    return resp.json()
            except requests.RequestException as e:
                logger.warning(f"Port API HTTP request error (attempt {attempt}/{self.max_retries}): {e}")
            if attempt < self.max_retries:
                time.sleep(0.2 * attempt)
        return None

    def get_port_telemetry(self, identifier: str) -> NormalizedPortData:
        """
        Fetches port telemetry by UN/LOCODE or port name.
        Uses TTL caching, live MSIL/external API lookup where available,
        response validation against NormalizedPortData, and fallback.
        """
        cache_key = f"port_{identifier.upper().strip()}"
        now = time.time()
        if cache_key in _PORT_CACHE and (now - _PORT_CACHE[cache_key]["ts"]) < _PORT_CACHE_TTL:
            return _PORT_CACHE[cache_key]["val"]

        # Lookup port metadata from port_registry
        port_info = port_registry.get_port(identifier)
        if not port_info:
            unlocode = identifier.upper().strip()
            name = identifier.title()
            lat, lon = 35.4437, 139.6380  # default Yokohama
            country = "Japan"
            congestion = 0.45
        else:
            unlocode = port_info.get("unlocode", identifier)
            name = port_info.get("name", identifier)
            lat = port_info.get("latitude", 35.4437)
            lon = port_info.get("longitude", 139.6380)
            country = port_info.get("country", "Japan")
            congestion = port_info.get("congestion_index", 0.45)

        # External MSIL safety / warnings check for Japan ports if API configured
        live_status = "OPERATIONAL"
        live_source = "CONFIGURED_PORT_REGISTRY"
        waiting_vessels = 4
        occupied_berths = 16

        if country == "Japan" and JAPAN_SAFETY_INFO_API:
            api_res = self._http_get_with_retry(JAPAN_SAFETY_INFO_API)
            if api_res and "features" in api_res:
                live_source = "LIVE_JAPAN_MSIL_API"
                if len(api_res["features"]) > 5:
                    live_status = "CONGESTED"

        if congestion >= 0.75:
            live_status = "CONGESTED"
            waiting_vessels = 12
            occupied_berths = 28
        elif congestion >= 0.50:
            live_status = "OPERATIONAL"
            waiting_vessels = 5
            occupied_berths = 18

        waiting_time_hours = round(congestion * 12.0, 1)

        normalized = NormalizedPortData(
            port_id=f"PORT-{unlocode}",
            name=name,
            unlocode=unlocode,
            country=country,
            latitude=lat,
            longitude=lon,
            congestion=congestion,
            waiting_time=waiting_time_hours,
            vessel_traffic=occupied_berths,
            waiting_vessels=waiting_vessels,
            port_status=live_status,
            disruption_probability=round(min(1.0, congestion * 1.1), 2),
            source=live_source,
            status="OK"
        )

        _PORT_CACHE[cache_key] = {"ts": now, "val": normalized}
        return normalized

    def get_all_japanese_ports(self) -> List[NormalizedPortData]:
        return [
            self.get_port_telemetry("JPYOK"),
            self.get_port_telemetry("JPUKB"),
            self.get_port_telemetry("JPNGO"),
            self.get_port_telemetry("JPOSA"),
        ]

    def get_all_indian_ports(self) -> List[NormalizedPortData]:
        return [
            self.get_port_telemetry("INNSA"),
            self.get_port_telemetry("INMUN"),
            self.get_port_telemetry("INMAA"),
        ]

port_service = PortService()
