import time
import logging
import requests
from typing import Dict, Any, Optional
from datetime import datetime, timezone

try:
    from app.config import OPEN_METEO_URL, MARINE_API_URL, WEATHER_API_KEY
    from app.schemas.telemetry import NormalizedWeatherData
except ImportError:
    from config import OPEN_METEO_URL, MARINE_API_URL, WEATHER_API_KEY
    from schemas.telemetry import NormalizedWeatherData

logger = logging.getLogger("flowforge.services.weather")

_WEATHER_CACHE: Dict[str, Dict[str, Any]] = {}
_WEATHER_CACHE_TTL = 300  # 5 minutes in seconds
OPEN_METEO_FORECAST_URL = OPEN_METEO_URL or "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_MARINE_URL = MARINE_API_URL or "https://marine-api.open-meteo.com/v1/marine"
GDACS_CYCLONE_URL = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH"

class WeatherService:
    """
    WeatherService — fetches atmospheric, marine, and cyclone telemetry.
    Isolated from ML agents; provides normalized telemetry responses with timeout,
    retry policy, exception handling, logging, TTL caching, and graceful fallback.
    """

    def __init__(self, timeout: float = 5.0, max_retries: int = 3):
        self.timeout = timeout
        self.max_retries = max_retries
        self.api_key = WEATHER_API_KEY

    def _http_get_with_retry(self, url: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """HTTP GET helper with configured timeout and exponential retry policy."""
        for attempt in range(1, self.max_retries + 1):
            try:
                resp = requests.get(url, params=params, timeout=self.timeout)
                if resp.status_code == 200:
                    return resp.json()
                logger.warning(f"Weather API returned status {resp.status_code} (attempt {attempt}/{self.max_retries})")
            except requests.RequestException as e:
                logger.warning(f"Weather HTTP request failed on attempt {attempt}/{self.max_retries}: {e}")
            if attempt < self.max_retries:
                time.sleep(0.2 * (2 ** (attempt - 1)))
        return None

    def fetch_forecast(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,visibility",
            "timezone": "auto",
        }
        data = self._http_get_with_retry(OPEN_METEO_FORECAST_URL, params)
        if data and "current" in data:
            curr = data["current"]
            wind_kmh = curr.get("wind_speed_10m") or 0.0
            wind_knots = round(wind_kmh / 1.852, 2)
            return {
                "source": "LIVE_OPEN_METEO",
                "temperature": curr.get("temperature_2m"),
                "wind_speed": wind_knots,
                "wind_direction": curr.get("wind_direction_10m"),
                "precipitation": curr.get("precipitation") or 0.0,
                "pressure": curr.get("surface_pressure"),
                "weather_code": curr.get("weather_code"),
                "visibility": curr.get("visibility") or 10000.0,
            }
        return None

    def fetch_marine(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": "wave_height,wave_direction,wave_period,sea_surface_temperature,ocean_current_velocity",
            "forecast_days": 1,
            "timezone": "auto",
        }
        data = self._http_get_with_retry(OPEN_METEO_MARINE_URL, params)
        if data and "hourly" in data:
            hourly = data["hourly"]
            wave_heights = hourly.get("wave_height", [])
            sea_temps = hourly.get("sea_surface_temperature", [])
            currents = hourly.get("ocean_current_velocity", [])
            return {
                "wave_height": next((v for v in wave_heights if v is not None), 1.5),
                "sea_temperature": next((v for v in sea_temps if v is not None), 18.0),
                "current_speed": next((v for v in currents if v is not None), 0.5),
            }
        return None

    def check_cyclones(self, lat: float, lon: float, radius_deg: float = 5.0) -> Dict[str, Any]:
        """GDACS cyclone check with 5-minute cache to prevent API flooding."""
        cache_key = f"cyclone_{round(lat,1)}_{round(lon,1)}"
        now = time.time()
        if cache_key in _WEATHER_CACHE and (now - _WEATHER_CACHE[cache_key]["ts"]) < _WEATHER_CACHE_TTL:
            return _WEATHER_CACHE[cache_key]["val"]

        params = {"eventtypes": "TC", "alertlevels": "Green,Orange,Red", "limit": "20"}
        data = self._http_get_with_retry(GDACS_CYCLONE_URL, params)
        res = {"cyclone_warning": False, "cyclone_name": None}

        if data and "features" in data:
            for feature in data["features"]:
                geom = feature.get("geometry", {})
                coords = geom.get("coordinates", [None, None])
                if coords[0] is not None and coords[1] is not None:
                    if abs(coords[1] - lat) < radius_deg and abs(coords[0] - lon) < radius_deg:
                        props = feature.get("properties", {})
                        res = {
                            "cyclone_warning": True,
                            "cyclone_name": props.get("eventname") or props.get("name", "Tropical Cyclone"),
                        }
                        break

        _WEATHER_CACHE[cache_key] = {"ts": now, "val": res}
        return res

    def _determine_storm_severity(self, wind_knots: float, wave_m: float, rain_mm: float, cyclone: bool) -> str:
        if cyclone or wind_knots > 35.0 or wave_m > 4.0:
            return "CRITICAL"
        if wind_knots > 25.0 or wave_m > 2.5 or rain_mm > 10.0:
            return "HIGH"
        if wind_knots > 15.0 or wave_m > 1.5:
            return "MODERATE"
        return "LOW"

    def get_weather_normalized_model(self, lat: float, lon: float) -> NormalizedWeatherData:
        """Returns Pydantic NormalizedWeatherData model instance."""
        cache_key = f"weather_model_{round(lat, 2)}_{round(lon, 2)}"
        now = time.time()
        if cache_key in _WEATHER_CACHE and (now - _WEATHER_CACHE[cache_key]["ts"]) < _WEATHER_CACHE_TTL:
            return _WEATHER_CACHE[cache_key]["val"]

        forecast = self.fetch_forecast(lat, lon)
        marine = self.fetch_marine(lat, lon)
        cyclone = self.check_cyclones(lat, lon)

        if forecast is not None or marine is not None:
            wind = forecast.get("wind_speed", 18.0) if forecast else 18.0
            wave = marine.get("wave_height", 1.5) if marine else 1.5
            rain = forecast.get("precipitation", 0.0) if forecast else 0.0
            severity = self._determine_storm_severity(wind, wave, rain, cyclone["cyclone_warning"])

            normalized = NormalizedWeatherData(
                latitude=lat,
                longitude=lon,
                wind_speed=wind,
                rainfall=rain,
                wave_height=wave,
                visibility=forecast.get("visibility", 10000.0) if forecast else 10000.0,
                temperature=forecast.get("temperature", 20.0) if forecast else 20.0,
                storm_severity=severity,
                weather_condition="Rain / Squall" if rain > 5.0 else "Partly Cloudy" if wind > 15.0 else "Clear",
                cyclone_warning=cyclone["cyclone_warning"],
                cyclone_name=cyclone["cyclone_name"],
                hazard=severity,
                source="LIVE_OPEN_METEO",
                status="OK"
            )
        else:
            logger.info(f"Using fallback weather telemetry for location ({lat}, {lon})")
            severity = self._determine_storm_severity(18.0, 1.8, 0.0, cyclone["cyclone_warning"])
            normalized = NormalizedWeatherData(
                latitude=lat,
                longitude=lon,
                wind_speed=18.0,
                rainfall=0.0,
                wave_height=1.8,
                visibility=10000.0,
                temperature=21.0,
                storm_severity=severity,
                weather_condition="Clear / Standard Fallback",
                cyclone_warning=cyclone["cyclone_warning"],
                cyclone_name=cyclone["cyclone_name"],
                hazard=severity,
                source="FALLBACK",
                status="DEGRADED"
            )

        _WEATHER_CACHE[cache_key] = {"ts": now, "val": normalized}
        return normalized

    def get_weather_normalized(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Primary telemetry method — returns dictionary representation of NormalizedWeatherData
        so both dict `.get()` access and Pydantic validation work seamlessly across callers.
        """
        model = self.get_weather_normalized_model(lat, lon)
        return model.model_dump()

weather_service = WeatherService()
