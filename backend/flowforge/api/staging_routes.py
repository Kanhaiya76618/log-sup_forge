from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any, List

try:
    from app.schemas.requests import (
        ShipmentAnalysisRequest,
        DisruptionRequest,
        ETARequest,
        RouteRequest,
        CostRequest,
        SimulationRequest,
        AgentOrchestrationRequest
    )
    from app.agents.disruption_agent import disruption_agent
    from app.agents.eta_agent import eta_agent
    from app.agents.route_agent import route_agent
    from app.agents.cost_agent import cost_agent
    from app.agents.orchestrator import orchestrator
    from app.services.weather_service import weather_service
    from app.services.port_service import port_service
    from app.services.port_registry import port_registry
    from app.services.ais_service import ais_service
    from app.services.live_data_service import live_data_service
except ImportError:
    from schemas.requests import (
        ShipmentAnalysisRequest,
        DisruptionRequest,
        ETARequest,
        RouteRequest,
        CostRequest,
        SimulationRequest,
        AgentOrchestrationRequest
    )
    from agents.disruption_agent import disruption_agent
    from agents.eta_agent import eta_agent
    from agents.route_agent import route_agent
    from agents.cost_agent import cost_agent
    from agents.orchestrator import orchestrator
    from services.weather_service import weather_service
    from services.port_service import port_service
    from services.port_registry import port_registry
    from services.ais_service import ais_service
    from services.live_data_service import live_data_service

router = APIRouter(prefix="/api/v1", tags=["FlowForge Supply Chain Intelligence API"])

@router.post(
    "/analyze",
    summary="End-to-End Supply Chain Intelligence Analysis",
    description="Submits a shipment request through live telemetry, trained ML models (Disruption, ETA, Cost), Route Optimization, and Deterministic Decision Engine."
)
async def analyze_shipment(req: ShipmentAnalysisRequest) -> Dict[str, Any]:
    """FastAPI endpoint containing zero business logic — delegates strictly to MasterOrchestrator."""
    try:
        return await orchestrator.analyze_shipment(req)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing supply chain analysis pipeline: {str(e)}"
        )

@router.post(
    "/analyze/demo",
    summary="Deterministic End-to-End Demo Analysis",
    description="Runs a pre-configured, realistic demo shipment request executing all real trained ML models and live telemetry without requiring manual JSON construction."
)
@router.post("/analyze-demo", include_in_schema=False)
async def analyze_shipment_demo() -> Dict[str, Any]:
    demo_request = ShipmentAnalysisRequest(
        origin_unlocode="CNSHA",
        destination_unlocode="JPYOK",
        cargo_weight_mt=15.0,
        cargo_value_usd=120000.0,
        cargo_quantity=250,
        shipment_mode="Ocean",
        carrier_code="MAERSK",
        shipment_date="2026-08-25",
        baseline_eta_hours=168.0,
        vendor="GlobalTech Ltd",
        fulfill_via="Direct",
        vendor_inco_term="FOB"
    )
    return await orchestrator.analyze_shipment(demo_request)

# Legacy / Sub-agent direct endpoints
@router.post("/disruption/assess", summary="Disruption Agent Direct Assessment")
async def assess_disruption(req: DisruptionRequest):
    weather = weather_service.get_weather_normalized(req.latitude, req.longitude) if req.include_weather else {}
    disasters = live_data_service.fetch_recent_disasters() if req.include_disasters else []
    return await disruption_agent.evaluate_disruption(req.port_name, weather, disasters)

@router.post("/eta/predict", summary="ETA Agent Direct Prediction")
async def predict_eta(req: ETARequest):
    return eta_agent.predict_eta(
        vessel_lat=req.vessel_lat,
        vessel_lon=req.vessel_lon,
        destination_port=req.destination_port,
        speed_knots=req.speed_knots,
        carrier_code=req.carrier_code,
        hazard_level=req.hazard_level or "LOW",
        wind_speed_knots=req.wind_speed_knots or 20.0,
        wave_height_meters=req.wave_height_meters or 2.0,
        destination_port_congestion=req.destination_port_congestion or 0.45
    )

@router.post("/route/optimize", summary="Route Agent Direct Optimization")
async def optimize_route(req: RouteRequest):
    return route_agent.analyze_route(
        current_lat=req.current_lat,
        current_lon=req.current_lon,
        course_deg=req.course_deg,
        speed_knots=req.speed_knots,
        origin=req.origin,
        destination=req.destination,
        lookahead_hours=req.lookahead_hours
    )

@router.post("/cost/calculate", summary="Cost Agent Direct Calculation")
async def calculate_cost(req: CostRequest):
    return cost_agent.calculate_cost_impact(
        vessel_name=req.vessel_name,
        baseline_route_nm=req.baseline_route_nm,
        alternative_route_nm=req.alternative_route_nm,
        daily_vessel_charter_usd=req.daily_vessel_charter_usd,
        fuel_cost_per_ton_usd=req.fuel_cost_per_ton_usd,
        demurrage_cost_per_day_usd=req.demurrage_cost_per_day_usd,
        delay_hours_avoided=req.delay_hours_avoided
    )

@router.post("/orchestrate", summary="Master Orchestrator Direct Execution")
async def orchestrate_agents(req: AgentOrchestrationRequest):
    analysis_req = ShipmentAnalysisRequest(
        origin_unlocode=req.origin,
        destination_unlocode=req.destination,
        cargo_weight_mt=15.0,
        cargo_value_usd=50000.0,
        cargo_quantity=100,
        shipment_mode="Ocean",
        carrier_code=req.carrier_code or "MAERSK",
        shipment_date="2026-08-25",
        baseline_eta_hours=168.0
    )
    return await orchestrator.analyze_shipment(analysis_req)

@router.get("/vessels", summary="AIS Active Vessels")
async def get_vessels():
    vessels = ais_service.get_active_vessels()
    return {"count": len(vessels), "vessels": vessels}

@router.get("/ports/india", summary="Indian Ports Registry")
async def get_indian_ports():
    ports = port_registry.list_ports_by_country("India")
    return {"country": "India", "count": len(ports), "ports": ports}

@router.get("/ports/japan", summary="Japanese Ports Registry")
async def get_japanese_ports():
    ports = port_registry.list_ports_by_country("Japan")
    return {"country": "Japan", "count": len(ports), "ports": ports}

@router.get("/live-feed", summary="Live Telemetry Feed Ingestion")
async def get_live_feed():
    return await live_data_service.get_live_feed()

@router.post("/simulate", summary="Disruption Simulation")
async def run_simulation(req: SimulationRequest):
    scenarios = ["PORT CLOSURE", "TYPHOON", "FACTORY FAILURE", "SUPPLIER FAILURE", "SHIPPING DELAY"]
    idx = max(0, min(req.scenario_index, len(scenarios) - 1))
    scenario_name = scenarios[idx]

    delay_res = eta_agent.predict_eta(
        vessel_lat=33.8500,
        vessel_lon=137.2000,
        destination_port="JPYOK",
        speed_knots=14.2,
        hazard_level="CRITICAL" if idx == 1 else "MODERATE",
        wind_speed_knots=38.0 if idx == 1 else 20.0,
        wave_height_meters=4.5 if idx == 1 else 2.0,
        destination_port_congestion=0.88 if idx == 0 else 0.45
    )

    cost_res = cost_agent.calculate_cost_impact(
        vessel_name="MV ORION",
        delay_hours_avoided=delay_res.get("estimated_delay_hours", 18.0)
    )

    return {
        "scenario": scenario_name,
        "baseline_health": "94.7%",
        "disruption_exposure": "82%" if idx in [0, 1] else "64%",
        "projected_recovery_health": "91.6%",
        "delay_forecast": delay_res,
        "cost_analysis": cost_res
    }
