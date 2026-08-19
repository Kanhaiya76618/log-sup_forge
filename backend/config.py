import os
from pathlib import Path
from dotenv import load_dotenv

# Explicitly load .env file from the backend directory
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

# Server & Database Settings
PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "0.0.0.0")
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "flowforge")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# API Endpoints & Telemetry Config
OPEN_METEO_URL = os.getenv("OPEN_METEO_URL") or os.getenv("WEATHER_API_URL", "https://api.open-meteo.com/v1/forecast")
MARINE_API_URL = os.getenv("MARINE_API_URL", "https://marine-api.open-meteo.com/v1/marine")
DISASTER_API_URL = os.getenv("DISASTER_API_URL", "https://earthquake.usgs.gov/fdsnws/event/1/query")
NEWS_FEED_URL = os.getenv("NEWS_FEED_URL", "https://newsapi.org/v2/everything")

# Japan MSIL Endpoints
JAPAN_SAFETY_INFO_API = os.getenv("JAPAN_SAFETY_INFO_API", "https://api.msil.go.jp/safety-information-links/v2/MapServer")
JAPAN_NAVIGATION_WARNINGS_API = os.getenv("JAPAN_NAVIGATION_WARNINGS_API", "https://api.msil.go.jp/navigational-warnings/v2/MapServer")

# External API Keys
AIS_API_KEY = os.getenv("AIS_API_KEY") or os.getenv("VESSEL_API_KEY")
INDIA_PORT_API_KEY = os.getenv("INDIA_PORT_API_KEY")
JAPAN_PORT_API_KEY = os.getenv("JAPAN_PORT_API_KEY")
JAPAN_MSIL_API_KEY = os.getenv("JAPAN_MSIL_API_KEY", "0e83ad5d93214e04abf37c970c32b641")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
