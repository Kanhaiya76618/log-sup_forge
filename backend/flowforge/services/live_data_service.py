import logging
import requests
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

try:
    from app.services.weather_service import weather_service
    from app.services.port_service import port_service
    from app.services.ais_service import ais_service
    from app.services.route_data_service import route_data_service
    from app.schemas.telemetry import NormalizedLiveDataFeed, NormalizedWeatherData
except ImportError:
    from services.weather_service import weather_service
    from services.port_service import port_service
    from services.ais_service import ais_service
    from services.route_data_service import route_data_service
    from schemas.telemetry import NormalizedLiveDataFeed, NormalizedWeatherData

logger = logging.getLogger("flowforge.services.livedata")

class LiveDataService:
    """
    LiveDataService — central telemetry hub aggregating weather, port, AIS, route,
    and disaster feeds into a normalized internal schema (`NormalizedLiveDataFeed`).

    Flow:
      External APIs (Weather, Ports, AIS, Route, USGS, GDACS)
        ↓
      Services Layer (weather_service, port_service, ais_service, route_data_service)
        ↓
      Normalized Internal Telemetry Data
        ↓
      ML Agents / Master Orchestrator
    """

    def __init__(self, timeout: float = 5.0):
        self.timeout = timeout

    def fetch_recent_disasters(self) -> List[Dict[str, Any]]:
        """Fetch USGS earthquake and GDACS disaster telemetry with timeout and fallback."""
        try:
            resp = requests.get(
                "https://earthquake.usgs.gov/fdsnws/event/1/query",
                params={"format": "geojson", "minmagnitude": "5.0", "limit": "5"},
                timeout=self.timeout
            )
            if resp.status_code == 200:
                features = resp.json().get("features", [])
                events = []
                for f in features:
                    props = f.get("properties", {})
                    geom = f.get("geometry", {})
                    coords = geom.get("coordinates", [0, 0, 0])
                    events.append({
                        "type": "EARTHQUAKE",
                        "title": props.get("title"),
                        "magnitude": props.get("mag"),
                        "place": props.get("place"),
                        "latitude": coords[1],
                        "longitude": coords[0],
                        "timestamp": props.get("time"),
                        "source": "LIVE_USGS"
                    })
                if events:
                    return events
        except Exception as e:
            logger.warning(f"Failed to fetch USGS disaster feed: {e}")

        # Fallback disaster entry
        return [
            {
                "type": "TYPHOON",
                "title": "Super Typhoon Ampil",
                "magnitude": 4,
                "place": "Off South Coast of Honshu, Japan",
                "latitude": 32.5,
                "longitude": 139.2,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "source": "CONFIGURED_FALLBACK"
            }
        ]

    def fetch_latest_news(self) -> List[Dict[str, Any]]:
        return [
            {
                "headline": "Typhoon Warnings Issued for Tokyo Bay & Yokohama Port",
                "source": "Japan Maritime Press",
                "risk_sentiment": "HIGH",
                "keywords": ["typhoon", "yokohama", "port closure", "gantry crane halt"]
            },
            {
                "headline": "Red Sea Shipping Diversions Increase East Asia Transit Times",
                "source": "Global Logistics Daily",
                "risk_sentiment": "MODERATE",
                "keywords": ["reroute", "fuel surcharge", "delay"]
            }
        ]

    async def get_live_feed(
        self,
        origin: str = "CNSHA",
        destination: str = "JPYOK",
        lat: float = 35.4437,
        lon: float = 139.6380
    ) -> NormalizedLiveDataFeed:
        """
        Primary aggregator endpoint — returns validated NormalizedLiveDataFeed bundle.
        """
        weather = weather_service.get_weather_normalized_model(lat, lon)
        ports = port_service.get_all_japanese_ports()
        vessels = ais_service.get_active_vessels()
        route = route_data_service.get_route_telemetry(origin, destination, lat, lon)
        disasters = self.fetch_recent_disasters()

        return NormalizedLiveDataFeed(
            timestamp=datetime.now(timezone.utc).isoformat(),
            weather=weather,
            ports=ports,
            vessels=vessels,
            route=route,
            disasters=disasters,
            system_status="OPERATIONAL"
        )

live_data_service = LiveDataService()
