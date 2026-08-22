"""
backend/flowforge/contracts/schemas.py
Pydantic Request/Response validation schemas for FlowForge API and Cargo Journey Risk OS.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------
# Legacy / Baseline Disruption Schemas (Preserved)
# ---------------------------------------------------------
class DisruptionPredictRequest(BaseModel):
    operational_stress: float = Field(default=0.82, ge=0.0, description="Vessel structural and crew stress index (0..1 or 0..100)")
    geo_port_risk: float = Field(default=0.74, ge=0.0, description="Geopolitical & meteorological port corridor risk index")
    port_congestion_score: float = Field(default=0.68, ge=0.0, description="Destination port crane/berth queue index")
    threshold: Optional[float] = Field(default=0.45, description="Classification decision cutoff")


class DisruptionPredictResponse(BaseModel):
    disruption_probability: float
    disruption_probability_percent: float
    prediction: str
    risk_level: str
    threshold: float
    model: str
    features_used: List[str]
    inputs: Dict[str, float]


class AgentRunRequest(BaseModel):
    vessel_id: Optional[str] = "CSCL-GLOBE-002"
    origin: Optional[str] = "BOM"
    destination: Optional[str] = "YOK"
    operational_stress: Optional[float] = 0.82
    geo_port_risk: Optional[float] = 0.74
    port_congestion_score: Optional[float] = 0.68
    wave_height_m: Optional[float] = 2.8
    wind_speed_kmh: Optional[float] = 45.0


class SimulationRequest(BaseModel):
    base_delay_days: Optional[float] = 4.2
    wave_height_m: Optional[float] = 2.8
    port_dwell_hours: Optional[float] = 31.0
    scenario_id: Optional[str] = "SCENARIO_B"
    sample_count: Optional[int] = 500


# ---------------------------------------------------------
# 1. Early Delay Warning Schemas
# ---------------------------------------------------------
class DelayEarlyWarningRequest(BaseModel):
    vessel_id: Optional[str] = "CSCL-GLOBE-002"
    current_speed_knots: float = Field(default=13.5, description="Current speed in knots")
    historical_speed_knots: float = Field(default=18.0, description="Baseline cruise speed")
    scheduled_eta_hours: float = Field(default=120.0, description="Hours until scheduled arrival")
    port_congestion_score: float = Field(default=0.74, description="Destination port congestion (0..1)")
    port_waiting_time_hours: float = Field(default=18.5, description="Current anchorage queue time")
    weather_severity: float = Field(default=0.65, description="Weather severity (0..1)")
    distance_remaining_km: float = Field(default=2400.0, description="Distance remaining")
    strait_bottleneck_score: float = Field(default=0.55, description="Chokepoint congestion index")


class DelayEarlyWarningResponse(BaseModel):
    delay_probability: float
    predicted_delay_hours: float
    early_warning_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    contributing_factors: List[str]
    model: str


# ---------------------------------------------------------
# 2. Transshipment Connection Schemas
# ---------------------------------------------------------
class TransshipmentRiskRequest(BaseModel):
    shipment_id: Optional[str] = "SH-4092"
    origin_vessel: str = Field(default="MV Tokyo Express", description="Inbound feeder vessel")
    connecting_vessel: str = Field(default="CMA CGM Jacques Saadé", description="Outbound mother vessel")
    intermediate_port: str = Field(default="Singapore Tuas (SG)", description="Transshipment hub port")
    predicted_inbound_arrival_hours: float = Field(default=36.0, description="Hours until inbound vessel berths")
    connecting_vessel_departure_hours: float = Field(default=52.0, description="Hours until connecting vessel sails")
    port_congestion_score: float = Field(default=0.68, description="Hub port congestion (0..1)")
    terminal_handling_hours: float = Field(default=7.5, description="Standard container discharge & transfer dwell")
    customs_dwell_hours: float = Field(default=2.0, description="Customs and security scan time")


class TransshipmentRiskResponse(BaseModel):
    transshipment_risk: float
    connection_status: str  # SAFE, AT_RISK, LIKELY_TO_MISS, MISSED
    buffer_hours: float
    predicted_container_available_hours: float
    recommended_action: str


# ---------------------------------------------------------
# 3. Cargo Security / Theft Anomaly Schemas
# ---------------------------------------------------------
class CargoSecurityRiskRequest(BaseModel):
    shipment_id: Optional[str] = "SH-4092"
    route_deviation_km: float = Field(default=45.0, description="Distance deviation from approved corridor")
    unscheduled_stops: int = Field(default=0, description="Number of unscheduled stops")
    ais_gap_hours: float = Field(default=0.0, description="Hours AIS transponder was unrecorded")
    dwell_time_hours: float = Field(default=14.0, description="Total stationary dwell hours")
    high_risk_zone: bool = Field(default=False, description="Transiting known piracy or high-theft corridor")
    manifest_weight_discrepancy_pct: float = Field(default=0.5, description="Weight manifest discrepancy %")
    cargo_value_usd: float = Field(default=18500000.0, description="Declared cargo commercial value")


class CargoSecurityRiskResponse(BaseModel):
    cargo_security_risk: float
    risk_level: str  # NORMAL, ANOMALOUS, HIGH_RISK
    anomalies: List[str]
    anomaly_score: float


# ---------------------------------------------------------
# 4. Dynamic Route Selection Schemas
# ---------------------------------------------------------
class RouteObjectiveWeights(BaseModel):
    travel_time_weight: float = Field(default=0.30, ge=0.0, le=1.0)
    cost_weight: float = Field(default=0.25, ge=0.0, le=1.0)
    delay_weight: float = Field(default=0.20, ge=0.0, le=1.0)
    congestion_weight: float = Field(default=0.10, ge=0.0, le=1.0)
    weather_weight: float = Field(default=0.10, ge=0.0, le=1.0)
    security_weight: float = Field(default=0.05, ge=0.0, le=1.0)


class RouteRecommendationRequest(BaseModel):
    origin: str = Field(default="Mumbai (IN)", description="Origin port")
    destination: str = Field(default="Yokohama (JP)", description="Destination port")
    weights: Optional[RouteObjectiveWeights] = None
    max_acceptable_delay_hours: Optional[float] = 36.0


class CandidateRoute(BaseModel):
    route_id: str
    name: str
    strategy: str
    predicted_duration_hours: float
    risk_score: float
    estimated_cost: float
    expected_delay_hours: float
    recommendation_score: float
    reasons: List[str]


class RouteRecommendationResponse(BaseModel):
    recommended_route_id: str
    recommended_route_name: str
    selection_rationale: List[str]
    ranked_routes: List[CandidateRoute]


# ---------------------------------------------------------
# 5. Cascading Disruption Graph Schemas
# ---------------------------------------------------------
class CascadeRiskRequest(BaseModel):
    shipment_id: Optional[str] = "SH-4092"
    initial_disruption: str = Field(default="Destination port congestion", description="Initial root trigger")
    initial_delay_hours: float = Field(default=16.0, description="Initial delay in hours")
    destination_congestion: float = Field(default=0.74, description="Destination port congestion")
    has_transshipment: bool = Field(default=True, description="Whether journey involves transshipment leg")
    inland_mode: str = Field(default="Rail + Truck", description="Inland intermodal transport mode")


class CascadeRiskResponse(BaseModel):
    initial_disruption: str
    cascade_probability: float
    affected_nodes: List[str]
    estimated_final_delay_hours: float
    critical_bottlenecks: List[str]
    propagation_graph: List[Dict[str, Any]]


# ---------------------------------------------------------
# 6. Cargo-Level ETA Schemas
# ---------------------------------------------------------
class CargoETARequest(BaseModel):
    vessel_departure_timestamp: Optional[str] = "2026-11-20T08:00:00Z"
    transit_duration_hours: float = Field(default=168.0, description="Scheduled sea transit hours")
    port_waiting_hours: float = Field(default=14.0, description="Port pilotage & queue dwell")
    berth_handling_hours: float = Field(default=8.0, description="Crane container discharge time")
    customs_inspection_hours: float = Field(default=4.5, description="Customs inspection & clearance")
    inland_transit_hours: float = Field(default=12.0, description="Drayage truck / rail transit time")
    disruption_delay_hours: float = Field(default=18.0, description="Predicted disruption delay")


class PredictionIntervals(BaseModel):
    p50_hours: float
    p80_hours: float
    p90_hours: float


class CargoETAResponse(BaseModel):
    vessel_eta_hours: float
    port_eta_hours: float
    container_available_eta_hours: float
    final_delivery_eta_hours: float
    expected_delay_hours: float
    eta_confidence: float
    prediction_intervals: PredictionIntervals


# ---------------------------------------------------------
# 7. Unified Cargo Journey Risk Schemas
# ---------------------------------------------------------
class ShipmentJourneyRiskRequest(BaseModel):
    shipment_id: str = Field(default="SH-4092", description="Unique container shipment identifier")
    origin: str = Field(default="Mumbai JNPT (IN)")
    destination: str = Field(default="Port of Yokohama (JP)")
    transshipment_port: Optional[str] = Field(default="Singapore Tuas (SG)")
    cargo_type: str = Field(default="Automotive ECUs & Battery Modules")
    cargo_value_usd: float = Field(default=35200000.0)
    current_speed_knots: float = Field(default=14.2)
    baseline_speed_knots: float = Field(default=18.0)
    scheduled_transit_hours: float = Field(default=192.0)
    port_congestion_score: float = Field(default=0.74)
    weather_severity: float = Field(default=0.68)
    geopolitical_risk: float = Field(default=0.55)
    operational_stress: float = Field(default=0.72)
    connecting_departure_hours: float = Field(default=68.0)
    inbound_arrival_hours: float = Field(default=52.0)
    route_deviation_km: float = Field(default=32.0)
    ais_gap_hours: float = Field(default=0.0)


class ShipmentJourneyRiskResponse(BaseModel):
    shipment_id: str
    port_congestion_risk: float
    hidden_delay_risk: float
    transshipment_risk: float
    cargo_security_risk: float
    route_risk: float
    cascade_risk: float
    overall_risk: float
    predicted_delay_hours: float
    vessel_eta_hours: float
    cargo_eta_hours: float
    recommended_route: str
    key_risks: List[str]
    recommended_actions: List[str]
    journey_timeline: List[Dict[str, Any]]
