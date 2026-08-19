"""
engine/route_analyzer.py
Route Analyzer — checks weather hazards along the vessel's current bearing
by sampling points at 1h, 3h, and 6h ahead.
"""
import math
import logging
from typing import Dict, Any, List

logger = logging.getLogger("flowforge.engine.route")

HAZARD_RANK = {"LOW": 0, "MODERATE": 1, "HIGH": 2, "CRITICAL": 3}


def _project_position(lat: float, lon: float, course_deg: float, speed_knots: float, hours: float):
    """
    Project a vessel's position ahead by `hours` at current course and speed.
    Uses simple flat-earth approximation sufficient for short-range projections.
    """
    dist_km = speed_knots * 1.852 * hours
    bearing = math.radians(course_deg)
    R = 6371.0
    lat_r = math.radians(lat)
    lon_r = math.radians(lon)
    new_lat_r = math.asin(
        math.sin(lat_r) * math.cos(dist_km / R) +
        math.cos(lat_r) * math.sin(dist_km / R) * math.cos(bearing)
    )
    new_lon_r = lon_r + math.atan2(
        math.sin(bearing) * math.sin(dist_km / R) * math.cos(lat_r),
        math.cos(dist_km / R) - math.sin(lat_r) * math.sin(new_lat_r)
    )
    return math.degrees(new_lat_r), math.degrees(new_lon_r)


def analyze_route_ahead(
    vessel_lat: float,
    vessel_lon: float,
    course_deg: float,
    speed_knots: float,
    weather_fn,
    lookahead_hours: List[float] = [1.0, 3.0, 6.0],
) -> Dict[str, Any]:
    """
    Sample weather at projected positions ahead of the vessel.

    Args:
        weather_fn: Callable(lat, lon) -> weather dict with 'hazard', 'wind_speed', 'cyclone_warning'

    Returns:
        {
            "worst_hazard_ahead": "HIGH",
            "cyclone_on_path": false,
            "sampled_points": [...]
        }
    """
    sampled = []
    worst_hazard = "LOW"
    cyclone_on_path = False

    for hours in lookahead_hours:
        try:
            proj_lat, proj_lon = _project_position(vessel_lat, vessel_lon, course_deg, speed_knots, hours)
            weather = weather_fn(proj_lat, proj_lon)
            hazard = weather.get("hazard", "LOW")
            cyclone = weather.get("cyclone_warning", False)

            if HAZARD_RANK.get(hazard, 0) > HAZARD_RANK.get(worst_hazard, 0):
                worst_hazard = hazard
            if cyclone:
                cyclone_on_path = True

            sampled.append({
                "hours_ahead": hours,
                "lat": round(proj_lat, 4),
                "lon": round(proj_lon, 4),
                "hazard": hazard,
                "wind_speed": weather.get("wind_speed"),
                "wave_height": weather.get("wave_height"),
                "cyclone_warning": cyclone,
            })
        except Exception as e:
            logger.warning(f"Route sample failed at {hours}h ahead: {e}")

    return {
        "worst_hazard_ahead": worst_hazard,
        "cyclone_on_path": cyclone_on_path,
        "sampled_points": sampled,
    }
