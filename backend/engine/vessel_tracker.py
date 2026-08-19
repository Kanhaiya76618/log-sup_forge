"""
engine/vessel_tracker.py
Vessel Tracking Engine — orchestrates AIS position + Weather + Port Status + News
into a single enriched vessel intelligence record per vessel.
"""
import logging
from typing import Dict, Any, List, Optional

from engine.eta_engine import calculate_eta
from engine.route_analyzer import analyze_route_ahead
from collectors.weather import get_weather
from collectors.japan_navigation import get_japan_navigational_warnings

logger = logging.getLogger("flowforge.engine.vessel_tracker")

# ── Known port disruption registry ──────────────────────────────────────────────
PORT_DISRUPTION_DATA: Dict[str, Dict[str, Any]] = {
    "YOKOHAMA": {"port": "Port of Yokohama", "risk_score": 0.79},
    "KOBE":     {"port": "Port of Kobe",     "risk_score": 0.30},
    "TOKYO":    {"port": "Port of Tokyo",    "risk_score": 0.71},
    "JNPT":     {"port": "JNPT Mumbai",      "risk_score": 0.45},
    "MUMBAI":   {"port": "Mumbai Port",      "risk_score": 0.45},
    "MUNDRA":   {"port": "Mundra Port",      "risk_score": 0.35},
    "CHENNAI":  {"port": "Chennai Port",     "risk_score": 0.40},
}

# Alternative port recommendations
ALTERNATIVE_PORTS: Dict[str, str] = {
    "YOKOHAMA": "KOBE",
    "KOBE":     "OSAKA",
    "TOKYO":    "YOKOHAMA",
    "JNPT":     "MUNDRA",
    "MUMBAI":   "MUNDRA",
}

HAZARD_RANK = {"LOW": 0, "MODERATE": 1, "HIGH": 2, "CRITICAL": 3}


def _resolve_destination_key(destination: Optional[str]) -> Optional[str]:
    """Match destination string to known port key."""
    if not destination:
        return None
    dest = destination.upper().strip()
    for key in PORT_DISRUPTION_DATA:
        if key in dest:
            return key
    return None


def _compute_vessel_risk(
    weather_hazard: str,
    route_worst_hazard: str,
    port_risk_score: float,
    cyclone_on_path: bool,
) -> float:
    """Combine weather, route, and port risks into a single vessel risk score 0–1."""
    weather_component = {
        "LOW": 0.10, "MODERATE": 0.25, "HIGH": 0.50, "CRITICAL": 0.80
    }.get(weather_hazard, 0.10)

    route_component = {
        "LOW": 0.05, "MODERATE": 0.15, "HIGH": 0.35, "CRITICAL": 0.60
    }.get(route_worst_hazard, 0.05)

    cyclone_penalty = 0.20 if cyclone_on_path else 0.0

    score = (weather_component * 0.35) + (route_component * 0.35) + (port_risk_score * 0.30) + cyclone_penalty
    return round(min(1.0, score), 2)


def _build_ai_decision(
    vessel: Dict[str, Any],
    vessel_risk: float,
    eta: Dict[str, Any],
    route: Dict[str, Any],
    port_key: Optional[str],
) -> Dict[str, Any]:
    """Generate the FlowForge AI decision block for this vessel."""
    delay_hours = eta.get("weather_delay_hours", 0.0)
    alert_level = "LOW"
    if vessel_risk >= 0.70:
        alert_level = "CRITICAL"
    elif vessel_risk >= 0.50:
        alert_level = "HIGH"
    elif vessel_risk >= 0.30:
        alert_level = "MODERATE"

    reroute_recommended = vessel_risk >= 0.65 and port_key is not None
    alternative = ALTERNATIVE_PORTS.get(port_key, None) if port_key else None

    reasons = []
    if route.get("cyclone_on_path"):
        reasons.append("Cyclone detected on route")
    if route.get("worst_hazard_ahead") in ("HIGH", "CRITICAL"):
        reasons.append(f"{route['worst_hazard_ahead']} weather ahead")
    if port_key and PORT_DISRUPTION_DATA.get(port_key, {}).get("risk_score", 0) > 0.60:
        reasons.append(f"High disruption risk at {PORT_DISRUPTION_DATA[port_key]['port']}")

    alert_message = ". ".join(reasons)
    if delay_hours > 0:
        alert_message += f". ETA +{delay_hours:.0f}h delay."
    if reroute_recommended and alternative:
        alert_message += f" Recommend diverting to {alternative}."

    return {
        "delay_prediction_hours": delay_hours,
        "vessel_risk_score": vessel_risk,
        "alert_level": alert_level,
        "reroute_recommended": reroute_recommended,
        "reroute_suggestion": alternative,
        "alert_message": alert_message.strip() or "No significant risk detected.",
    }


def analyze_vessel(vessel: Dict[str, Any]) -> Dict[str, Any]:
    """
    Full vessel intelligence pipeline:
    AIS Position → Weather + ETA + Route → AI Decision

    Returns enriched vessel dict ready for database and frontend.
    """
    lat = vessel.get("latitude", 0.0)
    lon = vessel.get("longitude", 0.0)
    speed = vessel.get("speed") or 0.0
    course = vessel.get("course") or vessel.get("heading") or 0.0
    destination = vessel.get("destination")

    # 1. Current position weather
    try:
        weather = get_weather(lat, lon)
    except Exception as e:
        logger.warning(f"Weather fetch failed for {vessel.get('mmsi')}: {e}")
        weather = {"hazard": "LOW", "wind_speed": 0, "wave_height": 0, "cyclone_warning": False}

    # 2. ETA calculation
    eta = calculate_eta(lat, lon, destination, speed, weather.get("hazard", "LOW"))

    # 3. Route analysis (weather ahead along vessel bearing)
    try:
        route = analyze_route_ahead(lat, lon, course, speed, get_weather)
    except Exception as e:
        logger.warning(f"Route analysis failed for {vessel.get('mmsi')}: {e}")
        route = {"worst_hazard_ahead": "LOW", "cyclone_on_path": False, "sampled_points": []}

    # 4. Port disruption context
    port_key = _resolve_destination_key(destination)
    port_status = PORT_DISRUPTION_DATA.get(port_key, {}) if port_key else {}

    # 5. Vessel risk score
    vessel_risk = _compute_vessel_risk(
        weather_hazard=weather.get("hazard", "LOW"),
        route_worst_hazard=route.get("worst_hazard_ahead", "LOW"),
        port_risk_score=port_status.get("risk_score", 0.2),
        cyclone_on_path=route.get("cyclone_on_path", False),
    )

    # 6. AI Decision
    ai_decision = _build_ai_decision(vessel, vessel_risk, eta, route, port_key)

    return {
        # AIS core fields
        "mmsi":         vessel.get("mmsi"),
        "imo":          vessel.get("imo"),
        "vessel_name":  vessel.get("vessel_name"),
        "latitude":     lat,
        "longitude":    lon,
        "speed":        speed,
        "course":       course,
        "heading":      vessel.get("heading"),
        "nav_status":   vessel.get("nav_status"),
        "destination":  destination,
        "timestamp":    vessel.get("timestamp"),
        # ETA engine
        "eta":          eta,
        # Weather at current position
        "weather_now": {
            "hazard":          weather.get("hazard"),
            "wind_speed":      weather.get("wind_speed"),
            "wave_height":     weather.get("wave_height"),
            "cyclone_warning": weather.get("cyclone_warning"),
        },
        # Route analysis
        "route": {
            "worst_hazard_ahead": route.get("worst_hazard_ahead"),
            "cyclone_on_path":    route.get("cyclone_on_path"),
            "sampled_points":     route.get("sampled_points", []),
        },
        # Port status
        "port_status": port_status,
        # FlowForge AI decision
        "ai_decision": ai_decision,
    }


def analyze_fleet(vessels: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Run analyze_vessel() on a list of AIS vessel dicts."""
    return [analyze_vessel(v) for v in vessels]
