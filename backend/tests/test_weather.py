import sys
import json
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from collectors.weather import get_weather, get_weather_geojson

def test_weather_normalized():
    # Test Chennai / JNPT coordinates (13.0827, 80.2707)
    lat, lon = 13.0827, 80.2707
    data = get_weather(lat, lon)
    
    print("── Normalized Weather Data Output ──────────────────")
    print("Location:      ", data["location"])
    print("Timestamp:     ", data["timestamp"])
    print("Wind Speed:    ", data["wind_speed"], "knots/kmh")
    print("Wind Direction:", data["wind_direction"], "°")
    print("Rainfall:      ", data["rainfall"], "mm")
    print("Temperature:   ", data["temperature"], "°C")
    print("Pressure:      ", data["pressure"], "hPa")
    print("Wave Height:   ", data["wave_height"], "m")
    print("Visibility:    ", data["visibility"], "m")
    print("Cyclone Warning:", data["cyclone_warning"])
    print("Hazard Level:  ", data["hazard"])
    print()

    assert data["location"]["lat"] == lat
    assert data["location"]["lon"] == lon
    assert "wind_speed" in data
    assert "wave_height" in data
    assert "hazard" in data

def test_weather_geojson():
    lat, lon = 35.4437, 139.6380 # Yokohama
    geojson = get_weather_geojson(lat, lon)
    
    print("── GeoJSON Feature Output ─────────────────────────")
    print(json.dumps(geojson, indent=2))
    print()

    assert geojson["type"] == "Feature"
    assert geojson["geometry"]["type"] == "Point"
    assert geojson["geometry"]["coordinates"] == [lon, lat]
    assert "hazard" in geojson["properties"]

if __name__ == "__main__":
    test_weather_normalized()
    test_weather_geojson()
    print("Weather Collector 3-Tier GeoJSON pipeline tests PASSED successfully!")
