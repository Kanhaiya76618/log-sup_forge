"""
backend/flowforge/api/routes/agents.py
Autonomous Multi-Agent Pipeline Endpoints.
"""

from fastapi import APIRouter
from ...contracts.schemas import AgentRunRequest
from ...agents.orchestrator import orchestrator

router = APIRouter(prefix="/agents", tags=["Agents"])


@router.post("/run")
def run_agent_pipeline(payload: AgentRunRequest = None):
    """Executes the full 9-agent decision intelligence pipeline end-to-end."""
    req = payload or AgentRunRequest()
    result = orchestrator.run_pipeline(
        operational_stress=req.operational_stress,
        geo_port_risk=req.geo_port_risk,
        port_congestion_score=req.port_congestion_score,
        wave_height_m=req.wave_height_m,
        wind_speed_kmh=req.wind_speed_kmh,
        origin=req.origin,
        destination=req.destination
    )
    return result
