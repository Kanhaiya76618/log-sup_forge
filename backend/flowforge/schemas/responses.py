from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field

class TelemetryValue(BaseModel):
    """Provenance data structure for all external metrics."""
    value: Union[float, int, str]
    source: str = Field(..., description="LIVE, CONFIGURED, CACHED, or FALLBACK")
    timestamp: str
    status: str = Field(..., description="OK, DEFAULT_FALLBACK, or UNAVAILABLE")

class DisruptionResponse(BaseModel):
    agent: str = "DISRUPTION_AGENT"
    target_port: str
    disruption_probability: float
    hazard_level: str
    decision_threshold: float
    ml_model_active: bool
    active_disasters_count: int
    status: str
    model_features: Dict[str, float]
    provenance: Optional[Dict[str, TelemetryValue]] = None

class ETAPredictionResponse(BaseModel):
    agent: str = "ETA_AGENT"
    destination_port: str
    destination_coords: Optional[Dict[str, float]] = None
    distance_km: Optional[float] = None
    distance_nm: Optional[float] = None
    nominal_hours: Optional[float] = None
    estimated_delay_hours: Optional[float] = None
    predicted_total_hours: Optional[float] = None
    predicted_delay_days: Optional[float] = None
    delay_probability_percent: Optional[float] = None
    confidence: str
    ml_models_active: bool
    provenance: Optional[Dict[str, TelemetryValue]] = None

class RouteOptimizationResponse(BaseModel):
    agent: str = "ROUTE_AGENT"
    corridor: str
    worst_hazard_ahead: str
    cyclone_on_path: bool
    sampled_waypoints: List[Dict[str, Any]]
    alternative_routes: List[Dict[str, Any]]
    reroute_required: bool
    provenance: Optional[Dict[str, TelemetryValue]] = None

class CostCalculationResponse(BaseModel):
    agent: str = "COST_AGENT"
    vessel_name: str
    baseline_route_nm: float
    alternative_route_nm: float
    extra_distance_nm: float
    cost_breakdown: Dict[str, float]
    savings_breakdown: Dict[str, float]
    net_financial_savings_usd: float
    recommendation: str
    fuel_provenance: TelemetryValue

class OrchestrationResponse(BaseModel):
    orchestrator: str = "MASTER_ORCHESTRATOR"
    overall_network_health: str
    target_corridor: str
    composite_risk_score: float
    risk_classification: str
    agent_evaluations: Dict[str, Any]
    recovery_playbook: Dict[str, Any]
    telemetry_provenance: Dict[str, TelemetryValue]
