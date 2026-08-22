import pytest
import asyncio
import time
from app.services.weather_service import weather_service, WeatherService
from app.services.port_service import port_service, PortService
from app.services.ais_service import ais_service, AISService
from app.services.route_data_service import route_data_service, RouteDataService
from app.services.live_data_service import live_data_service

from app.schemas.telemetry import (
    NormalizedWeatherData,
    NormalizedPortData,
    NormalizedAISData,
    NormalizedRouteData,
    NormalizedLiveDataFeed
)

def test_weather_service_returns_normalized_schema():
    """Verify WeatherService returns a validated NormalizedWeatherData model and dictionary."""
    model_data = weather_service.get_weather_normalized_model(35.4437, 139.6380)
    assert isinstance(model_data, NormalizedWeatherData)
    assert hasattr(model_data, "wind_speed")
    assert hasattr(model_data, "rainfall")
    assert hasattr(model_data, "wave_height")
    assert hasattr(model_data, "visibility")
    assert hasattr(model_data, "temperature")
    assert hasattr(model_data, "storm_severity")
    assert hasattr(model_data, "weather_condition")
    assert model_data.storm_severity in ["LOW", "MODERATE", "HIGH", "CRITICAL"]

    dict_data = weather_service.get_weather_normalized(35.4437, 139.6380)
    assert isinstance(dict_data, dict)
    assert "wind_speed" in dict_data
    assert "storm_severity" in dict_data

def test_weather_service_caching():
    """Verify WeatherService TTL cache returns cached object on second call."""
    t1 = weather_service.get_weather_normalized_model(35.4437, 139.6380)
    t2 = weather_service.get_weather_normalized_model(35.4437, 139.6380)
    assert t1.timestamp == t2.timestamp

def test_port_service_returns_normalized_schema():
    """Verify PortService returns a validated NormalizedPortData model."""
    port_data = port_service.get_port_telemetry("JPYOK")
    assert isinstance(port_data, NormalizedPortData)
    assert port_data.unlocode == "JPYOK"
    assert hasattr(port_data, "congestion")
    assert hasattr(port_data, "waiting_time")
    assert hasattr(port_data, "vessel_traffic")
    assert hasattr(port_data, "port_status")
    assert 0.0 <= port_data.congestion <= 1.0
    assert port_data.port_status in ["OPERATIONAL", "CONGESTED", "CLOSED"]

def test_port_service_all_ports():
    """Verify get_all_japanese_ports returns list of NormalizedPortData."""
    jp_ports = port_service.get_all_japanese_ports()
    assert len(jp_ports) >= 4
    for p in jp_ports:
        assert isinstance(p, NormalizedPortData)

def test_ais_service_returns_normalized_schema():
    """Verify AISService returns a validated NormalizedAISData model."""
    vessel = ais_service.get_vessel_telemetry("MV ORION")
    assert isinstance(vessel, NormalizedAISData)
    assert vessel.vessel_name == "MV ORION"
    assert hasattr(vessel, "vessel_location")
    assert "lat" in vessel.vessel_location
    assert "lon" in vessel.vessel_location
    assert hasattr(vessel, "vessel_speed")
    assert hasattr(vessel, "vessel_status")
    assert hasattr(vessel, "destination")
    assert vessel.vessel_speed >= 0.0

def test_ais_service_active_vessels():
    """Verify get_active_vessels returns list of NormalizedAISData."""
    vessels = ais_service.get_active_vessels()
    assert len(vessels) >= 3
    for v in vessels:
        assert isinstance(v, NormalizedAISData)

def test_route_data_service_returns_normalized_schema():
    """Verify RouteDataService returns a validated NormalizedRouteData model."""
    route = route_data_service.get_route_telemetry("CNSHA", "JPYOK")
    assert isinstance(route, NormalizedRouteData)
    assert route.origin == "CNSHA"
    assert route.destination == "JPYOK"
    assert hasattr(route, "distance_km")
    assert hasattr(route, "distance_nm")
    assert hasattr(route, "current_travel_conditions")
    assert hasattr(route, "route_status")
    assert hasattr(route, "route_availability")
    assert route.distance_km > 0.0
    assert route.distance_nm > 0.0
    assert isinstance(route.route_availability, bool)

def test_live_data_service_aggregation():
    """Verify LiveDataService aggregates all feeds into NormalizedLiveDataFeed."""
    feed = asyncio.run(live_data_service.get_live_feed("CNSHA", "JPYOK"))
    assert isinstance(feed, NormalizedLiveDataFeed)
    assert isinstance(feed.weather, NormalizedWeatherData)
    assert isinstance(feed.route, NormalizedRouteData)
    assert len(feed.ports) >= 4
    assert len(feed.vessels) >= 3
    assert feed.system_status == "OPERATIONAL"

def test_weather_fallback_behavior():
    """Verify WeatherService falls back gracefully on timeout/invalid URL."""
    svc = WeatherService(timeout=0.001, max_retries=1)
    svc.OPEN_METEO_FORECAST_URL = "http://invalid-weather-endpoint-12345.com"
    data = svc.get_weather_normalized_model(35.44, 139.63)
    assert isinstance(data, NormalizedWeatherData)
    assert data.source in ["FALLBACK", "LIVE_OPEN_METEO"]
    assert data.status in ["OK", "DEGRADED"]
