from typing import Optional, List, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, model_validator

SUPPORTED_SHIPMENT_MODES = {"Ocean", "Air", "Truck", "Rail"}
SUPPORTED_CARRIERS = {"MAERSK", "MSC", "CMA_CGM", "COSCO", "ONE", "EVERGREEN", "DEFAULT"}

class ShipmentAnalysisRequest(BaseModel):
    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "origin": "CNSHA",
                "destination": "JPYOK",
                "carrier": "MAERSK",
                "shipment_mode": "Ocean",
                "cargo_weight_mt": 15.0,
                "cargo_units": 250,
                "cargo_value_usd": 120000.0,
                "baseline_eta_hours": 168.0,
                "vessel_speed_knots": 14.2,
                "shipment_date": "2026-08-25",
                "vendor": "GlobalTech Ltd",
                "fulfill_via": "Direct",
                "vendor_inco_term": "FOB"
            }
        }
    }

    origin_unlocode: str = Field(..., alias="origin", description="UN/LOCODE or port identifier for Origin")
    destination_unlocode: str = Field(..., alias="destination", description="UN/LOCODE or port identifier for Destination")
    cargo_weight_mt: float = Field(..., gt=0, description="Cargo weight in metric tons")
    cargo_value_usd: float = Field(50000.0, ge=0, description="Declared cargo value in USD")
    cargo_quantity: int = Field(100, gt=0, alias="cargo_units", description="Quantity of items")
    shipment_mode: str = Field("Ocean", description="Shipment mode e.g. Ocean, Air, Truck")
    carrier_code: str = Field("MAERSK", alias="carrier", description="Ocean Carrier Code e.g. MAERSK, MSC")
    shipment_date: str = Field("2026-08-25", description="Shipment departure date in YYYY-MM-DD format")
    baseline_eta_hours: float = Field(168.0, gt=0, description="Nominal baseline transit ETA in hours")
    vessel_speed_knots: float = Field(14.2, gt=0, description="Cruising speed in knots")
    vendor: str = Field("VendorA", description="Supplier or vendor identifier")
    fulfill_via: str = Field("Direct", description="Fulfillment channel")
    vendor_inco_term: str = Field("FOB", description="Incoterms string e.g. FOB, CIF, EXW")

    @model_validator(mode="before")
    @classmethod
    def normalize_aliases(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "origin" in values and "origin_unlocode" not in values:
                values["origin_unlocode"] = values["origin"]
            if "destination" in values and "destination_unlocode" not in values:
                values["destination_unlocode"] = values["destination"]
            if "carrier" in values and "carrier_code" not in values:
                values["carrier_code"] = values["carrier"]
            if "cargo_units" in values and "cargo_quantity" not in values:
                values["cargo_quantity"] = values["cargo_units"]
            if "shipment_date" not in values:
                values["shipment_date"] = datetime.now().strftime("%Y-%m-%d")
        return values

    @field_validator("shipment_mode")
    @classmethod
    def validate_shipment_mode(cls, v: str) -> str:
        mode = v.strip().title()
        if mode not in SUPPORTED_SHIPMENT_MODES:
            raise ValueError(f"Unsupported shipment mode '{v}'. Supported modes: {sorted(list(SUPPORTED_SHIPMENT_MODES))}")
        return mode

    @field_validator("carrier_code")
    @classmethod
    def validate_carrier_code(cls, v: str) -> str:
        code = v.strip().upper()
        if code not in SUPPORTED_CARRIERS:
            return code
        return code

    @field_validator("shipment_date")
    @classmethod
    def validate_shipment_date(cls, v: str) -> str:
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            try:
                datetime.fromisoformat(v)
            except ValueError:
                raise ValueError(f"Invalid shipment_date format '{v}'. Expected YYYY-MM-DD or ISO 8601 string.")
        return v


# Direct agent request schemas
class DisruptionRequest(BaseModel):
    port_name: Optional[str] = "JPYOK"
    latitude: Optional[float] = 35.4437
    longitude: Optional[float] = 139.6380
    include_weather: bool = True
    include_disasters: bool = True

class ETARequest(BaseModel):
    vessel_lat: float = 33.8500
    vessel_lon: float = 137.2000
    destination_port: str = "JPYOK"
    speed_knots: float = 14.2
    carrier_code: Optional[str] = "MAERSK"
    hazard_level: Optional[str] = "LOW"
    wind_speed_knots: Optional[float] = 20.0
    wave_height_meters: Optional[float] = 2.0
    destination_port_congestion: Optional[float] = 0.45

class RouteRequest(BaseModel):
    origin: str = "CNSHA"
    destination: str = "JPYOK"
    current_lat: float = 31.2304
    current_lon: float = 121.4737
    course_deg: float = 85.0
    speed_knots: float = 14.2
    lookahead_hours: List[float] = [1.0, 3.0, 6.0]

class CostRequest(BaseModel):
    vessel_name: str = "MV ORION"
    baseline_route_nm: float = 1200.0
    alternative_route_nm: float = 1380.0
    daily_vessel_charter_usd: float = 25000.0
    fuel_cost_per_ton_usd: Optional[float] = None
    demurrage_cost_per_day_usd: float = 45000.0
    delay_hours_avoided: float = 18.0

class SimulationRequest(BaseModel):
    scenario_index: int = Field(1, ge=0, le=4)

class AgentOrchestrationRequest(BaseModel):
    origin: str = "CNSHA"
    destination: str = "JPYOK"
    vessel_id: Optional[str] = "IMO9823412"
    carrier_code: Optional[str] = "MAERSK"
    latitude: Optional[float] = 35.4437
    longitude: Optional[float] = 139.6380
