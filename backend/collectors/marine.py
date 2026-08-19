import requests
try:
    from config import MARINE_API_URL
except ImportError:
    from backend.config import MARINE_API_URL


def get_marine_data(latitude: float, longitude: float):
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": ",".join([
            "wave_height",
            "wave_direction",
            "wave_period",
            "sea_surface_temperature",
            "ocean_current_velocity",
            "ocean_current_direction",
        ]),
        "forecast_days": 1,
        "timezone": "auto"
    }

    response = requests.get(
        MARINE_API_URL,
        params=params,
        timeout=20
    )

    response.raise_for_status()

    data = response.json()

    return {
        "latitude": latitude,
        "longitude": longitude,
        "time": data["hourly"]["time"],
        "wave_height": data["hourly"]["wave_height"],
        "wave_direction": data["hourly"]["wave_direction"],
        "wave_period": data["hourly"]["wave_period"],
        "sea_temperature": data["hourly"]["sea_surface_temperature"],
        "current_speed": data["hourly"]["ocean_current_velocity"],
        "current_direction": data["hourly"]["ocean_current_direction"],
    }


class MarineCollector:
    """Async-compatible wrapper around get_marine_data for FastAPI endpoints."""

    async def fetch_marine_conditions(self, lat: float, lon: float) -> dict:
        try:
            return get_marine_data(lat, lon)
        except Exception:
            return {}


marine_collector = MarineCollector()
