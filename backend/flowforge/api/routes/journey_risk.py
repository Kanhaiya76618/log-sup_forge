"""
backend/flowforge/api/routes/journey_risk.py
REST API Endpoints for Predictive Cargo Journey Risk & Decision Support System.
"""

from fastapi import APIRouter
from ...contracts.schemas import (
    DelayEarlyWarningRequest, DelayEarlyWarningResponse,
    TransshipmentRiskRequest, TransshipmentRiskResponse,
    CargoSecurityRiskRequest, CargoSecurityRiskResponse,
    RouteRecommendationRequest, RouteRecommendationResponse,
    CascadeRiskRequest, CascadeRiskResponse,
    CargoETARequest, CargoETAResponse,
    ShipmentJourneyRiskRequest, ShipmentJourneyRiskResponse
)
from ...cargo_risk.early_warning import early_warning_engine
from ...cargo_risk.transshipment import transshipment_engine
from ...cargo_risk.security_anomaly import security_anomaly_engine
from ...cargo_risk.dynamic_routing import dynamic_routing_engine
from ...cargo_risk.cascading_disruption import cascading_disruption_engine
from ...cargo_risk.cargo_eta import cargo_eta_engine
from ...cargo_risk.unified_journey_risk import unified_journey_risk_engine

router = APIRouter(tags=["Cargo Journey Risk"])


# 1. Hidden Delay / Early Warning
@router.post("/predict/delay", response_model=DelayEarlyWarningResponse)
def predict_delay_early_warning(payload: DelayEarlyWarningRequest):
    """Predicts hidden delays and triggers early warning signals before they become visible."""
    return early_warning_engine.predict_early_warning(
        current_speed_knots=payload.current_speed_knots,
        historical_speed_knots=payload.historical_speed_knots,
        scheduled_eta_hours=payload.scheduled_eta_hours,
        port_congestion_score=payload.port_congestion_score,
        port_waiting_time_hours=payload.port_waiting_time_hours,
        weather_severity=payload.weather_severity,
        distance_remaining_km=payload.distance_remaining_km,
        strait_bottleneck_score=payload.strait_bottleneck_score
    )


# 2. Transshipment Connection Failure
@router.post("/predict/transshipment", response_model=TransshipmentRiskResponse)
def predict_transshipment_failure(payload: TransshipmentRiskRequest):
    """Predicts whether a container is likely to miss its connecting mother vessel."""
    return transshipment_engine.evaluate_transshipment_risk(
        predicted_inbound_arrival_hours=payload.predicted_inbound_arrival_hours,
        connecting_vessel_departure_hours=payload.connecting_vessel_departure_hours,
        port_congestion_score=payload.port_congestion_score,
        terminal_handling_hours=payload.terminal_handling_hours,
        customs_dwell_hours=payload.customs_dwell_hours
    )


# 3. Cargo Security / Theft Anomaly
@router.post("/predict/security", response_model=CargoSecurityRiskResponse)
def predict_cargo_security_risk(payload: CargoSecurityRiskRequest):
    """Identifies suspicious route deviations, AIS gaps, and cargo security anomalies."""
    return security_anomaly_engine.evaluate_security_risk(
        route_deviation_km=payload.route_deviation_km,
        unscheduled_stops=payload.unscheduled_stops,
        ais_gap_hours=payload.ais_gap_hours,
        dwell_time_hours=payload.dwell_time_hours,
        high_risk_zone=payload.high_risk_zone,
        manifest_weight_discrepancy_pct=payload.manifest_weight_discrepancy_pct,
        cargo_value_usd=payload.cargo_value_usd
    )


# 4. Dynamic Route Recommendation
@router.post("/route/recommend", response_model=RouteRecommendationResponse)
def recommend_dynamic_routes(payload: RouteRecommendationRequest):
    """Evaluates candidate routes using a configurable multi-objective loss function."""
    return dynamic_routing_engine.recommend_routes(
        origin=payload.origin,
        destination=payload.destination,
        weights=payload.weights,
        max_acceptable_delay_hours=payload.max_acceptable_delay_hours or 36.0
    )


# 5. Cascading Disruption Propagation
@router.post("/predict/cascade", response_model=CascadeRiskResponse)
def predict_cascading_disruptions(payload: CascadeRiskRequest):
    """Simulates how a disruption propagates through the container dependency graph."""
    return cascading_disruption_engine.predict_cascade(
        initial_disruption=payload.initial_disruption,
        initial_delay_hours=payload.initial_delay_hours,
        destination_congestion=payload.destination_congestion,
        has_transshipment=payload.has_transshipment,
        inland_mode=payload.inland_mode
    )


# 6. Cargo-Level ETA
@router.post("/predict/eta", response_model=CargoETAResponse)
def predict_cargo_availability_eta(payload: CargoETARequest):
    """Predicts container availability ETA with P50/P80/P90 prediction intervals."""
    return cargo_eta_engine.predict_cargo_eta(
        transit_duration_hours=payload.transit_duration_hours,
        port_waiting_hours=payload.port_waiting_hours,
        berth_handling_hours=payload.berth_handling_hours,
        customs_inspection_hours=payload.customs_inspection_hours,
        inland_transit_hours=payload.inland_transit_hours,
        disruption_delay_hours=payload.disruption_delay_hours
    )


# 7. Unified Cargo Journey Risk
@router.post("/shipment/risk", response_model=ShipmentJourneyRiskResponse)
def evaluate_unified_shipment_risk(payload: ShipmentJourneyRiskRequest):
    """Unified endpoint calculating the full cargo journey risk and decision report."""
    return unified_journey_risk_engine.evaluate_full_journey(
        shipment_id=payload.shipment_id,
        origin=payload.origin,
        destination=payload.destination,
        transshipment_port=payload.transshipment_port or "Singapore Tuas (SG)",
        cargo_type=payload.cargo_type,
        cargo_value_usd=payload.cargo_value_usd,
        current_speed_knots=payload.current_speed_knots,
        baseline_speed_knots=payload.baseline_speed_knots,
        scheduled_transit_hours=payload.scheduled_transit_hours,
        port_congestion_score=payload.port_congestion_score,
        weather_severity=payload.weather_severity,
        geopolitical_risk=payload.geopolitical_risk,
        operational_stress=payload.operational_stress,
        connecting_departure_hours=payload.connecting_departure_hours,
        inbound_arrival_hours=payload.inbound_arrival_hours,
        route_deviation_km=payload.route_deviation_km,
        ais_gap_hours=payload.ais_gap_hours
    )
