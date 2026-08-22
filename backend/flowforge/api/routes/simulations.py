"""
backend/flowforge/api/routes/simulations.py
Digital Twin & OR-Tools Solver Endpoints.
"""

from fastapi import APIRouter
from ...contracts.schemas import SimulationRequest
from ...solver.simulate import digital_twin_simulator
from ...solver.optimizer import route_optimizer

router = APIRouter(prefix="/simulations", tags=["Simulations"])


@router.post("/monte-carlo")
def run_monte_carlo(payload: SimulationRequest):
    """Executes 500-sample Monte Carlo probabilistic simulation."""
    result = digital_twin_simulator.run_simulation(
        base_delay_days=payload.base_delay_days,
        wave_height_m=payload.wave_height_m,
        port_dwell_hours=payload.port_dwell_hours,
        route_scenario=payload.scenario_id
    )
    return result


@router.get("/routes/pareto")
def get_pareto_routes(origin: str = "BOM", destination: str = "YOK"):
    """Generates 3 Pareto optimal routes using OR-Tools."""
    return route_optimizer.solve_pareto_routes(origin_code=origin, dest_code=destination)
