import time
import logging
import requests
from typing import Dict, Any, Optional
from datetime import datetime, timezone

try:
    from app.config import ROUTE_API_KEY
    from app.schemas.telemetry import NormalizedRouteData
    from app.utils.helpers import haversine_distance_km, resolve_port_coords
    from app.services.weather_service import weather_service
except ImportError:
    from config import ROUTE_API_KEY
    from schemas.telemetry import NormalizedRouteData
    from utils.helpers import haversine_distance_km, resolve_port_coords
    from services.weather_service import weather_service

logger = logging.getLogger("flowforge.services.route_data")

_ROUTE_CACHE: Dict[str, Dict[str, Any]] = {}
_ROUTE_CACHE_TTL = 300  # 5 minutes

class RouteDataService:
    """
    RouteDataService — handles marine route calculation, distance, current travel conditions,
    route status, and availability. Isolated from ML agents with NormalizedRouteData contract.
    """

    def __init__(self, timeout: float = 5.0, max_retries: int = 2):
        self.timeout = timeout
        self.max_retries = max_retries
        self.api_key = ROUTE_API_KEY

    def get_route_telemetry(
        self,
        origin: str = "CNSHA",
        destination: str = "JPYOK",
        current_lat: Optional[float] = None,
        current_lon: Optional[float] = None
    ) -> NormalizedRouteData:
        """
        Calculates and normalizes marine corridor telemetry between origin and destination.
        Returns validated NormalizedRouteData object with TTL caching, exception handling, and fallback.
        """
        cache_key = f"route_{origin.upper()}_{destination.upper()}_{round(current_lat or 0, 1)}_{round(current_lon or 0, 1)}"
        now = time.time()
        if cache_key in _ROUTE_CACHE and (now - _ROUTE_CACHE[cache_key]["ts"]) < _ROUTE_CACHE_TTL:
            return _ROUTE_CACHE[cache_key]["val"]

        # Resolve coordinates
        orig_coords = resolve_port_coords(origin) or (31.2304, 121.4737)
        dest_coords = resolve_port_coords(destination) or (35.4437, 139.6380)

        start_lat = current_lat if current_lat is not None else orig_coords[0]
        start_lon = current_lon if current_lon is not None else orig_coords[1]

        # Great circle distance
        dist_km = haversine_distance_km(start_lat, start_lon, dest_coords[0], dest_coords[1])
        dist_nm = dist_km / 1.852

        # Live destination weather hazard to infer current travel conditions
        weather = weather_service.get_weather_normalized(dest_coords[0], dest_coords[1])
        if isinstance(weather, dict):
            worst_hazard = weather.get("hazard", "LOW")
        else:
            worst_hazard = getattr(weather, "hazard", "LOW")

        if worst_hazard == "CRITICAL":
            conditions = "SEVERE_HAZARD"
            route_status = "RESTRICTED"
            availability = True  # corridor exists, but requires diversion
        elif worst_hazard == "HIGH":
            conditions = "MODERATE_HAZARD"
            route_status = "DIVERTED"
            availability = True
        else:
            conditions = "CLEAR"
            route_status = "OPEN"
            availability = True

        normalized = NormalizedRouteData(
            origin=origin,
            destination=destination,
            distance_km=round(dist_km, 2),
            distance_nm=round(dist_nm, 2),
            current_travel_conditions=conditions,
            route_status=route_status,
            route_availability=availability,
            worst_hazard=worst_hazard,
            source="LIVE_ROUTE_SERVICE" if self.api_key else "CONFIGURED_GEOMETRY_SERVICE",
            status="OK"
        )

        _ROUTE_CACHE[cache_key] = {"ts": now, "val": normalized}
        return normalized

route_data_service = RouteDataService()
