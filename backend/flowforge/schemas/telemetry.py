from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field

class NormalizedWeatherData(BaseModel):
    """Normalized Weather Telemetry Schema"""
    latitude: float
    longitude: float
    wind_speed: float = Field(0.0, ge=0.0, description="Wind speed in knots")
    rainfall: float = Field(0.0, ge=0.0, description="Rainfall / precipitation in mm/hr")
    wave_height: float = Field(0.0, ge=0.0, description="Significant wave height in meters")
    visibility: float = Field(10000.0, ge=0.0, description="Visibility in meters")
    temperature: float = Field(20.0, description="Temperature in °C")
    storm_severity: str = Field("LOW", description="Storm severity rating: LOW, MODERATE, HIGH, CRITICAL")
    weather_condition: str = Field("Clear", description="Weather description or condition code text")
    cyclone_warning: bool = Field(False, description="Active cyclone/typhoon warning within radius")
    cyclone_name: Optional[str] = None
    hazard: str = Field("LOW", description="Overall hazard classification")
    source: str = Field("LIVE_OPEN_METEO", description="Data source provenance")
    status: str = Field("OK", description="Telemetry status: OK | DEGRADED | FALLBACK")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class NormalizedPortData(BaseModel):
    """Normalized Port Telemetry Schema"""
    port_id: str
    name: str
    unlocode: str
    country: str = "Japan"
    latitude: float
    longitude: float
    congestion: float = Field(0.45, ge=0.0, le=1.0, description="Berth congestion index [0.0 - 1.0]")
    waiting_time: float = Field(4.0, ge=0.0, description="Average vessel waiting time in hours")
    vessel_traffic: int = Field(10, ge=0, description="Count of occupied berths or active vessels")
    waiting_vessels: int = Field(2, ge=0, description="Count of vessels anchored waiting for berths")
    port_status: str = Field("OPERATIONAL", description="Port operational status: OPERATIONAL | CONGESTED | CLOSED")
    disruption_probability: float = Field(0.20, ge=0.0, le=1.0)
    source: str = Field("CONFIGURED_PORT_REGISTRY", description="Data source provenance")
    status: str = Field("OK", description="Telemetry status: OK | DEGRADED | FALLBACK")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class NormalizedAISData(BaseModel):
    """Normalized AIS Vessel Telemetry Schema"""
    mmsi: int
    vessel_name: str
    vessel_type: str = "Container Ship"
    flag: str = "Japan"
    vessel_location: Dict[str, float] = Field(..., description="Vessel coordinates {'lat': float, 'lon': float}")
    vessel_speed: float = Field(14.2, ge=0.0, description="Current vessel speed in knots")
    heading_deg: float = Field(85.0, ge=0.0, lt=360.0)
    course_deg: float = Field(87.0, ge=0.0, lt=360.0)
    vessel_status: str = Field("UNDERWAY_USING_ENGINE", description="AIS Navigational Status")
    destination: str = "JPYOK"
    estimated_arrival: Optional[str] = None
    source: str = Field("LIVE_AIS_SERVICE", description="Data source provenance")
    status: str = Field("OK", description="Telemetry status: OK | DEGRADED | FALLBACK")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class NormalizedRouteData(BaseModel):
    """Normalized Route Telemetry Schema"""
    origin: str
    destination: str
    distance_km: float = Field(..., ge=0.0)
    distance_nm: float = Field(..., ge=0.0)
    current_travel_conditions: str = Field("CLEAR", description="Travel conditions: CLEAR | MODERATE_HAZARD | SEVERE_HAZARD")
    route_status: str = Field("OPEN", description="Route status: OPEN | DIVERTED | RESTRICTED")
    route_availability: bool = Field(True, description="True if direct marine corridor is open")
    worst_hazard: str = Field("LOW")
    source: str = Field("LIVE_ROUTE_SERVICE", description="Data source provenance")
    status: str = Field("OK", description="Telemetry status: OK | DEGRADED | FALLBACK")
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class NormalizedLiveDataFeed(BaseModel):
    """Aggregated Live Telemetry Bundle"""
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    weather: NormalizedWeatherData
    ports: List[NormalizedPortData]
    vessels: List[NormalizedAISData]
    route: NormalizedRouteData
    disasters: List[Dict[str, Any]] = Field(default_factory=list)
    system_status: str = Field("OPERATIONAL")
