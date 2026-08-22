"""
backend/flowforge/config.py
Unified FlowForge Environment Configuration & Domain Constants.
"""

import os
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Explicitly load .env file from root or backend directory
env_path = Path(__file__).resolve().parent.parent / ".env"
if not env_path.exists():
    env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)


class Settings(BaseModel):
    # API & Server Configuration
    PROJECT_NAME: str = "FlowForge Maritime Disruption OS & Cargo Intelligence API"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = Field(default_factory=lambda: os.getenv("ENVIRONMENT", "development"))
    DEBUG: bool = Field(default_factory=lambda: os.getenv("DEBUG", "false").lower() in ("true", "1", "yes"))
    HOST: str = Field(default_factory=lambda: os.getenv("HOST", "0.0.0.0"))
    PORT: int = Field(default_factory=lambda: int(os.getenv("PORT", "8000")))
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: [
            origin.strip()
            for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,*").split(",")
            if origin.strip()
        ]
    )

    # ML & Decision Model Thresholds
    DISRUPTION_THRESHOLD: float = Field(default_factory=lambda: float(os.getenv("DISRUPTION_THRESHOLD", "0.45")))
    DEFAULT_SPEED_KNOTS: float = Field(default_factory=lambda: float(os.getenv("DEFAULT_SPEED_KNOTS", "16.0")))
    MAX_SPEED_KNOTS: float = Field(default_factory=lambda: float(os.getenv("MAX_SPEED_KNOTS", "24.0")))
    
    # Economic Constants (Fuel & Demurrage)
    FUEL_PRICE_PER_MT: float = Field(default_factory=lambda: float(os.getenv("FUEL_PRICE_PER_MT", "620.0")))
    HOURLY_VESSEL_COST: float = Field(default_factory=lambda: float(os.getenv("HOURLY_VESSEL_COST", "1750.0")))
    DEMURRAGE_RATE_PER_DAY: float = Field(default_factory=lambda: float(os.getenv("DEMURRAGE_RATE_PER_DAY", "12000.0")))
    
    # Stochastic Simulation Parameters
    DEFAULT_SIMULATION_SAMPLES: int = Field(default_factory=lambda: int(os.getenv("DEFAULT_SIMULATION_SAMPLES", "500")))
    
    # External APIs & Telemetry Endpoints
    WEATHER_API_KEY: Optional[str] = Field(default_factory=lambda: os.getenv("WEATHER_API_KEY"))
    OPEN_METEO_URL: str = Field(default_factory=lambda: os.getenv("OPEN_METEO_URL") or os.getenv("WEATHER_API_URL", "https://api.open-meteo.com/v1/forecast"))
    MARINE_API_URL: str = Field(default_factory=lambda: os.getenv("MARINE_API_URL", "https://marine-api.open-meteo.com/v1/marine"))
    DISASTER_API_URL: str = Field(default_factory=lambda: os.getenv("DISASTER_API_URL", "https://earthquake.usgs.gov/fdsnws/event/1/query"))
    NEWS_FEED_URL: str = Field(default_factory=lambda: os.getenv("NEWS_FEED_URL", "https://newsapi.org/v2/everything"))
    NEWS_API_KEY: Optional[str] = Field(default_factory=lambda: os.getenv("NEWS_API_KEY"))
    
    # Japan MSIL Endpoints
    JAPAN_SAFETY_INFO_API: str = Field(default_factory=lambda: os.getenv("JAPAN_SAFETY_INFO_API", "https://api.msil.go.jp/safety-information-links/v2/MapServer"))
    JAPAN_NAVIGATION_WARNINGS_API: str = Field(default_factory=lambda: os.getenv("JAPAN_NAVIGATION_WARNINGS_API", "https://api.msil.go.jp/navigational-warnings/v2/MapServer"))
    JAPAN_MSIL_API_KEY: Optional[str] = Field(default_factory=lambda: os.getenv("JAPAN_MSIL_API_KEY"))
    
    # Port & AIS Stream Integrations
    PORT_API_KEY: Optional[str] = Field(default_factory=lambda: os.getenv("PORT_API_KEY") or os.getenv("JAPAN_MSIL_API_KEY"))
    AIS_API_KEY: Optional[str] = Field(default_factory=lambda: os.getenv("AIS_API_KEY") or os.getenv("VESSEL_API_KEY") or os.getenv("AISSTREAM_API_KEY"))
    AISSTREAM_API_KEY: Optional[str] = Field(default_factory=lambda: os.getenv("AISSTREAM_API_KEY") or os.getenv("AIS_API_KEY"))
    AISSTREAM_WS_URL: str = Field(default_factory=lambda: os.getenv("AISSTREAM_WS_URL", "wss://stream.aisstream.io/v0/stream"))
    ROUTE_API_KEY: Optional[str] = Field(default_factory=lambda: os.getenv("ROUTE_API_KEY"))
    
    # Databases & Memory Storage
    MONGODB_URI: str = Field(default_factory=lambda: os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
    MONGODB_DB_NAME: str = Field(default_factory=lambda: os.getenv("MONGODB_DB_NAME", "flowforge"))
    DATABASE_URL: Optional[str] = Field(default_factory=lambda: os.getenv("DATABASE_URL"))
    FRONTEND_URL: str = Field(default_factory=lambda: os.getenv("FRONTEND_URL", "http://localhost:3000"))


settings = Settings()

# Direct module-level exports for backwards compatibility with all services
PORT = settings.PORT
HOST = settings.HOST
MONGODB_URI = settings.MONGODB_URI
MONGODB_DB_NAME = settings.MONGODB_DB_NAME
FRONTEND_URL = settings.FRONTEND_URL

WEATHER_API_KEY = settings.WEATHER_API_KEY
PORT_API_KEY = settings.PORT_API_KEY
AIS_API_KEY = settings.AIS_API_KEY
AISSTREAM_API_KEY = settings.AISSTREAM_API_KEY
ROUTE_API_KEY = settings.ROUTE_API_KEY

OPEN_METEO_URL = settings.OPEN_METEO_URL
MARINE_API_URL = settings.MARINE_API_URL
DISASTER_API_URL = settings.DISASTER_API_URL
NEWS_FEED_URL = settings.NEWS_FEED_URL
NEWS_API_KEY = settings.NEWS_API_KEY

JAPAN_SAFETY_INFO_API = settings.JAPAN_SAFETY_INFO_API
JAPAN_NAVIGATION_WARNINGS_API = settings.JAPAN_NAVIGATION_WARNINGS_API
JAPAN_MSIL_API_KEY = settings.JAPAN_MSIL_API_KEY
