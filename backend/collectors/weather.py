"""
collectors/weather.py
Weather Collector — fetches live atmospheric + marine data from multiple sources
and normalizes them all into a single standard FlowForge schema.

Sources:
  Forecast  → Open-Meteo  (temperature, wind, pressure, precipitation)
  Marine    → Open-Meteo Marine API (wave height, sea temp, ocean current)
  Cyclones  → GDACS TC feed (tropical cyclone proximity check)

FlowForge AI only sees one standard format regardless of source:
{
    "source":        "open_meteo",
    "timestamp":     "2026-08-17T16:00:00Z",
    "latitude":      19.076,
    "longitude":     72.878,
    "temperature":   29.4,
    "wind_speed":    12.7,
    "wind_direction": 220,
    "precipitation": 0.0,
    "pressure":      1008.5,
    "weather_code":  2,
    "wave_height":   1.8,
    "sea_temperature": 28.0,
    "current_speed": 0.5,
    "visibility":    10000.0,
    "cyclone_warning": false,
    "cyclone_name":  null,
    "hazard":        "LOW"
}
"""
import requests
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

try:
    from config import OPEN_METEO_URL, MARINE_API_URL
except ImportError:
    from backend.config import OPEN_METEO_URL, MARINE_API_URL

logger = logging.getLogger("flowforge.collectors.weather")

OPEN_METEO_FORECAST_URL = OPEN_METEO_URL or "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_MARINE_URL   = MARINE_API_URL or "https://marine-api.open-meteo.com/v1/marine"
GDACS_CYCLONE_URL       = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH"


def _fetch_open_meteo_forecast(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    """
    Fetch atmospheric forecast from Open-Meteo.
    Raw fields: temperature_2m, wind_speed_10m, wind_direction_10m,
                precipitation, surface_pressure, weather_code, visibility
    Normalized to: temperature, wind_speed, wind_direction, precipitation,
                   pressure, weather_code, visibility
    """
    try:
        resp = requests.get(
            OPEN_METEO_FORECAST_URL,
            params={
                "latitude":  lat,
                "longitude": lon,
                "current":   "temperature_2m,relative_humidity_2m,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,visibility",
                "timezone":  "auto",
            },
            timeout=20,
        )
        resp.raise_for_status()
        current = resp.json().get("current", {})
        return {
            "source":        "open_meteo",
            "temperature":   current.get("temperature_2m"),
            "wind_speed":    current.get("wind_speed_10m"),
            "wind_direction":current.get("wind_direction_10m"),
            "precipitation": current.get("precipitation"),
            "pressure":      current.get("surface_pressure"),
            "weather_code":  current.get("weather_code"),
            "visibility":    current.get("visibility"),
        }
    except (requests.RequestException, Exception) as e:
        logger.warning(f"Open-Meteo forecast error ({lat},{lon}): {e}")
    return None


def _fetch_open_meteo_marine(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    """
    Fetch marine conditions from Open-Meteo Marine API.
    Raw fields: wave_height, sea_surface_temperature, ocean_current_velocity
    Normalized to: wave_height, sea_temperature, current_speed
    """
    try:
        resp = requests.get(
            OPEN_METEO_MARINE_URL,
            params={
                "latitude":     lat,
                "longitude":    lon,
                "hourly":       "wave_height,wave_direction,wave_period,sea_surface_temperature,ocean_current_velocity",
                "forecast_days": 1,
                "timezone":     "auto",
            },
            timeout=20,
        )
        resp.raise_for_status()
        hourly = resp.json().get("hourly", {})
        wave_heights = hourly.get("wave_height", [])
        sea_temps    = hourly.get("sea_surface_temperature", [])
        currents     = hourly.get("ocean_current_velocity", [])
        return {
            "wave_height":    next((v for v in wave_heights if v is not None), None),
            "sea_temperature":next((v for v in sea_temps if v is not None), None),
            "current_speed":  next((v for v in currents if v is not None), None),
        }
    except (requests.RequestException, Exception) as e:
        logger.warning(f"Open-Meteo marine error ({lat},{lon}): {e}")
    return None


def _fetch_gdacs_cyclones(lat: float, lon: float, radius_deg: float = 5.0) -> Dict[str, Any]:
    """
    Check GDACS for active tropical cyclones near given coordinates.
    Returns cyclone_warning bool, cyclone_name if within radius.
    """
    try:
        resp = requests.get(
            GDACS_CYCLONE_URL,
            params={"eventtypes": "TC", "alertlevels": "Green,Orange,Red", "limit": "20"},
            timeout=20,
        )
        resp.raise_for_status()
        for feature in resp.json().get("features", []):
            geom   = feature.get("geometry", {})
            coords = geom.get("coordinates", [None, None])
            if coords[0] is None:
                continue
            if abs(coords[1] - lat) < radius_deg and abs(coords[0] - lon) < radius_deg:
                props = feature.get("properties", {})
                return {
                    "cyclone_warning": True,
                    "cyclone_name":    props.get("eventname") or props.get("name", "Tropical Cyclone"),
                }
    except (requests.RequestException, RuntimeError, Exception) as e:
        logger.warning(f"GDACS cyclone check warning ({lat},{lon}): {e}")
    return {"cyclone_warning": False, "cyclone_name": None}


def _hazard_level(wind_speed: float, wave_height: float, precipitation: float, cyclone: bool) -> str:
    """Map atmospheric values to FlowForge hazard level: LOW / MODERATE / HIGH / CRITICAL."""
    if cyclone or wind_speed > 35.0 or wave_height > 4.0:
        return "CRITICAL"
    if wind_speed > 25.0 or wave_height > 2.5 or precipitation > 10.0:
        return "HIGH"
    if wind_speed > 15.0 or wave_height > 1.5:
        return "MODERATE"
    return "LOW"


class WeatherCollector:
    """
    Multi-source weather collector.
    All sources are normalized into one standard FlowForge format.
    FlowForge AI never sees raw API field names — only the standard keys.
    """

    def get_weather_normalized(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Fetch and normalize weather from all sources.
        Returns None values for any field that could not be fetched (no hardcoded fallbacks).
        """
        forecast = _fetch_open_meteo_forecast(lat, lon) or {}
        marine   = _fetch_open_meteo_marine(lat, lon) or {}
        cyclone  = _fetch_gdacs_cyclones(lat, lon)

        wind_speed    = forecast.get("wind_speed") or 0.0
        wave_height   = marine.get("wave_height") or 0.0
        precipitation = forecast.get("precipitation") or 0.0

        return {
            "source":          "open_meteo",
            "timestamp":       datetime.now(timezone.utc).isoformat(),
            "latitude":        lat,
            "longitude":       lon,
            # Atmospheric (Open-Meteo Forecast)
            "temperature":     forecast.get("temperature"),
            "wind_speed":      forecast.get("wind_speed"),
            "wind_direction":  forecast.get("wind_direction"),
            "precipitation":   forecast.get("precipitation"),
            "pressure":        forecast.get("pressure"),
            "weather_code":    forecast.get("weather_code"),
            "visibility":      forecast.get("visibility"),
            # Marine (Open-Meteo Marine)
            "wave_height":     marine.get("wave_height"),
            "sea_temperature": marine.get("sea_temperature"),
            "current_speed":   marine.get("current_speed"),
            # Cyclone (GDACS)
            "cyclone_warning": cyclone["cyclone_warning"],
            "cyclone_name":    cyclone["cyclone_name"],
            # Derived
            "hazard":          _hazard_level(wind_speed, wave_height, precipitation, cyclone["cyclone_warning"]),
        }

    def get_weather_geojson(self, lat: float, lon: float) -> Dict[str, Any]:
        """Wrap normalized weather in standard GeoJSON Feature format."""
        norm = self.get_weather_normalized(lat, lon)
        return {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": norm,
        }

    async def get_yokohama_weather(self) -> Dict[str, Any]:
        """Convenience method — fetch weather for Port of Yokohama."""
        return self.get_weather_normalized(35.4437, 139.6380)

    async def fetch_marine_conditions(self, lat: float, lon: float) -> Dict[str, Any]:
        """Convenience async method for marine-only data."""
        return _fetch_open_meteo_marine(lat, lon) or {}


weather_collector = WeatherCollector()


def get_weather(latitude: float, longitude: float) -> Dict[str, Any]:
    """Single-call entry point for any collector or engine."""
    return weather_collector.get_weather_normalized(latitude, longitude)


def get_weather_geojson(latitude: float, longitude: float) -> Dict[str, Any]:
    return weather_collector.get_weather_geojson(latitude, longitude)
