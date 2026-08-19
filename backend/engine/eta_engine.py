"""
engine/eta_engine.py
ETA Engine — calculates distance to destination port and estimated time of arrival.
Adds weather-based delay on top of pure sailing time.
"""
import math
import logging
from typing import Dict, Any, Optional, Tuple

logger = logging.getLogger("flowforge.engine.eta")

# ── Known port coordinates (lat, lon) ──────────────────────────────────────────
PORT_REGISTRY: Dict[str, Tuple[float, float]] = {
    # Japan
    "YOKOHAMA":  (35.4437, 139.6380),
    "KOBE":      (34.6901, 135.1955),
    "TOKYO":     (35.6191, 139.7753),
    "OSAKA":     (34.6547, 135.4336),
    "NAGOYA":    (35.0564, 136.8823),
    "HAKATA":    (33.5993, 130.3810),
    # India
    "JNPT":      (18.9435, 72.9290),
    "MUMBAI":    (18.9220, 72.8347),
    "MUNDRA":    (22.7594, 69.7096),
    "CHENNAI":   (13.0827, 80.2707),
    "COCHIN":    (9.9312, 76.2673),
    "NHAVA SHEVA": (18.9435, 72.9290),
    # Other major ports
    "SINGAPORE": (1.2966, 103.7764),
    "SHANGHAI":  (31.2304, 121.4737),
    "HONG KONG": (22.3964, 114.1095),
    "COLOMBO":   (6.9271, 79.8612),
}


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance in km between two coordinates."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lam = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _weather_delay_hours(hazard: str) -> float:
    """Return additional ETA delay hours based on weather hazard level."""
    return {"LOW": 0.0, "MODERATE": 2.0, "HIGH": 8.0, "CRITICAL": 24.0}.get(hazard, 0.0)


def resolve_port_coords(destination: Optional[str]) -> Optional[Tuple[float, float]]:
    """Look up known port coordinates from destination string."""
    if not destination:
        return None
    dest_upper = destination.upper().strip()
    if dest_upper in PORT_REGISTRY:
        return PORT_REGISTRY[dest_upper]
    for port_name, coords in PORT_REGISTRY.items():
        if port_name in dest_upper:
            return coords
    return None


def calculate_eta(
    vessel_lat: float,
    vessel_lon: float,
    destination: Optional[str],
    speed_knots: Optional[float],
    hazard_level: str = "LOW",
) -> Dict[str, Any]:
    """
    Calculate ETA to destination port.

    Returns distance_km, sailing_hours, weather_delay_hours, eta_hours.
    """
    port_coords = resolve_port_coords(destination)

    if not port_coords or not speed_knots or speed_knots <= 0:
        return {
            "destination_port": destination,
            "destination_coords": None,
            "distance_km": None,
            "sailing_hours": None,
            "weather_delay_hours": _weather_delay_hours(hazard_level),
            "eta_hours": None,
            "eta_confidence": "LOW",
        }

    dist_km = _haversine_km(vessel_lat, vessel_lon, port_coords[0], port_coords[1])
    speed_kmh = speed_knots * 1.852
    sailing_hours = dist_km / speed_kmh if speed_kmh > 0 else None
    delay_hours = _weather_delay_hours(hazard_level)
    eta_hours = round(sailing_hours + delay_hours, 1) if sailing_hours is not None else None
    confidence = "HIGH" if eta_hours is not None and hazard_level in ("LOW", "MODERATE") else "MEDIUM"

    return {
        "destination_port": destination,
        "destination_coords": {"lat": port_coords[0], "lon": port_coords[1]},
        "distance_km": round(dist_km, 1),
        "sailing_hours": round(sailing_hours, 1) if sailing_hours else None,
        "weather_delay_hours": delay_hours,
        "eta_hours": eta_hours,
        "eta_confidence": confidence,
    }
