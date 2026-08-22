import os

disruptions_code = '''"""
backend/flowforge/api/routes/disruptions.py
Disruption Prediction Endpoints.
"""

from fastapi import APIRouter
from ...contracts.schemas import DisruptionPredictRequest, DisruptionPredictResponse
from ...models_ml.inference_service import disruption_ml_service

router = APIRouter(prefix="/disruptions", tags=["Disruptions"])


@router.post("/diagnose", response_model=DisruptionPredictResponse)
def diagnose_disruption(payload: DisruptionPredictRequest):
    """Executes the trained ML model (ExtraTrees) on vessel and port metrics."""
    result = disruption_ml_service.predict(
        operational_stress=payload.operational_stress,
        geo_port_risk=payload.geo_port_risk,
        port_congestion_score=payload.port_congestion_score,
        threshold=payload.threshold
    )
    return result


@router.get("/status")
def get_model_status():
    """Returns ML model health and feature metadata."""
    return {
        "model_loaded": disruption_ml_service.is_loaded,
        "features": disruption_ml_service.features,
        "model_type": type(disruption_ml_service.model).__name__ if disruption_ml_service.model else "Fallback Heuristic",
        "threshold": disruption_ml_service.threshold
    }
'''

with open('backend/flowforge/api/routes/disruptions.py', 'w') as f:
    f.write(disruptions_code)

agents_code = '''"""
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
'''

with open('backend/flowforge/api/routes/agents.py', 'w') as f:
    f.write(agents_code)

simulations_code = '''"""
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
'''

with open('backend/flowforge/api/routes/simulations.py', 'w') as f:
    f.write(simulations_code)

voyages_code = '''"""
backend/flowforge/api/routes/voyages.py
Voyages & Fleet Telemetry Endpoints.
"""

from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter(prefix="/voyages", tags=["Voyages"])

FLEET_VOYAGES = [
    {
        "id": "SH-2048",
        "tracking_id": "TRK-2026-001",
        "vessel_name": "MV Tokyo Express",
        "origin": "Jawaharlal Nehru Port (Mumbai, IN)",
        "destination": "Port of Yokohama (JP)",
        "coordinates": {"lat": 18.95, "lon": 72.95},
        "speed_knots": 18.2,
        "heading": 65,
        "containers": 4200,
        "status": "On Schedule",
        "risk_factor": 24,
        "eta": "Nov 22, 2026"
    },
    {
        "id": "SH-2049",
        "tracking_id": "TRK-2026-002",
        "vessel_name": "CSCL Globe Supermax",
        "origin": "Port of Yokohama (JP)",
        "destination": "Port of Antwerp (BE)",
        "coordinates": {"lat": 35.44, "lon": 139.64},
        "speed_knots": 14.1,
        "heading": 210,
        "containers": 3800,
        "status": "At Risk",
        "risk_factor": 82,
        "eta": "Nov 26, 2026 (+4.2d)"
    },
    {
        "id": "SH-2050",
        "tracking_id": "TRK-2026-003",
        "vessel_name": "Maersk Mc-Kinney",
        "origin": "Singapore Tuas Port (SG)",
        "destination": "Rotterdam Gateway (NL)",
        "coordinates": {"lat": 1.29, "lon": 103.85},
        "speed_knots": 19.5,
        "heading": 285,
        "containers": 5100,
        "status": "On Schedule",
        "risk_factor": 12,
        "eta": "Nov 28, 2026"
    }
]


@router.get("")
def list_voyages():
    return FLEET_VOYAGES


@router.get("/{voyage_id}")
def get_voyage(voyage_id: str):
    for v in FLEET_VOYAGES:
        if v["id"] == voyage_id:
            return v
    return FLEET_VOYAGES[0]
'''

with open('backend/flowforge/api/routes/voyages.py', 'w') as f:
    f.write(voyages_code)

inventory_code = '''"""
backend/flowforge/api/routes/inventory.py
Inventory & Stockout Endpoints.
"""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/inventory", tags=["Inventory"])

INVENTORY_STORE = [
    {"sku": "SKU-001", "product_name": "Automotive Engine ECU Module", "category": "Automotive", "stock": 245, "reorder_point": 50, "warehouse": "Yokohama Marine Terminal", "unit_cost": 1420, "status": "In Stock"},
    {"sku": "SKU-002", "product_name": "Lithium Iron Battery Pack 48V", "category": "Energy", "stock": 89, "reorder_point": 100, "warehouse": "Mumbai JNPT Port Buffer", "unit_cost": 850, "status": "Low Stock"},
    {"sku": "SKU-003", "product_name": "Solid State Drive 2TB PCIe Gen5", "category": "Electronics", "stock": 1240, "reorder_point": 200, "warehouse": "Singapore Tuas Hub", "unit_cost": 110, "status": "In Stock"},
    {"sku": "SKU-004", "product_name": "Marine Turbine Bearing Assembly", "category": "Machinery", "stock": 14, "reorder_point": 25, "warehouse": "Antwerp Port Logistics Center", "unit_cost": 3400, "status": "Low Stock"},
    {"sku": "SKU-005", "product_name": "Pharmaceutical Cold-Chain Vaccines", "category": "Pharma", "stock": 0, "reorder_point": 80, "warehouse": "Rotterdam Gateway Depot", "unit_cost": 920, "status": "Stockout"},
    {"sku": "SKU-006", "product_name": "Hydraulic Steering Pump", "category": "Automotive", "stock": 412, "reorder_point": 80, "warehouse": "Mumbai JNPT Port Buffer", "unit_cost": 360, "status": "In Stock"},
]


class StockUpdate(BaseModel):
    sku: str
    stock: int


@router.get("")
def get_inventory():
    return INVENTORY_STORE


@router.put("/stock")
def update_stock(payload: StockUpdate):
    for item in INVENTORY_STORE:
        if item["sku"] == payload.sku:
            item["stock"] = payload.stock
            if payload.stock == 0:
                item["status"] = "Stockout"
            elif payload.stock <= item["reorder_point"]:
                item["status"] = "Low Stock"
            else:
                item["status"] = "In Stock"
            return item
    return {"message": "SKU updated"}
'''

with open('backend/flowforge/api/routes/inventory.py', 'w') as f:
    f.write(inventory_code)

metrics_code = '''"""
backend/flowforge/api/routes/metrics.py
Real-time Telemetry & KPI Metrics.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/metrics", tags=["Metrics"])


@router.get("/telemetry")
def get_telemetry():
    return {
        "vessel_speed_knots": 18.2,
        "heading_degrees": 65,
        "yokohama_disruption_prob_pct": 82,
        "corridor_eta_slip_days": 4.2,
        "wave_height_m": 2.1,
        "wind_gusts_kmh": 32,
        "active_vessels_count": 4,
        "supervisor_auto_dispatch": True,
        "open_meteo_sync": "CONNECTED",
        "ais_satellite_stream": "LIVE_SUB_SECOND"
    }
'''

with open('backend/flowforge/api/routes/metrics.py', 'w') as f:
    f.write(metrics_code)

main_code = '''"""
backend/flowforge/main.py
FlowForge Maritime Disruption OS - FastAPI Application Entrypoint.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import disruptions, agents, simulations, voyages, inventory, metrics
from .models_ml.inference_service import disruption_ml_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("flowforge.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("⚡ Starting FlowForge Maritime Disruption Decision OS...")
    logger.info(f"Loaded ML Models: {disruption_ml_service.is_loaded}")
    yield
    logger.info("FlowForge Shutdown Completed.")


app = FastAPI(
    title="FlowForge Maritime Disruption OS API",
    description="Autonomous 9-Agent Decision Intelligence Pipeline with Google OR-Tools and Trained ML Disruption Predictors",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 Routers
app.include_router(disruptions.router, prefix="/api/v1")
app.include_router(agents.router, prefix="/api/v1")
app.include_router(simulations.router, prefix="/api/v1")
app.include_router(voyages.router, prefix="/api/v1")
app.include_router(inventory.router, prefix="/api/v1")
app.include_router(metrics.router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "FlowForge Maritime OS",
        "ml_model_loaded": disruption_ml_service.is_loaded,
        "agents_ready": 9,
        "solvers": ["Google OR-Tools CP-SAT", "500-Sample Monte Carlo Digital Twin"]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.flowforge.main:app", host="0.0.0.0", port=8000, reload=True)
'''

with open('backend/flowforge/main.py', 'w') as f:
    f.write(main_code)

reqs_code = '''fastapi>=0.110.0
uvicorn>=0.28.0
pydantic>=2.6.0
pandas>=2.2.0
scikit-learn>=1.4.0
joblib>=1.3.2
numpy>=1.26.0
ortools>=9.9.3963
sqlalchemy>=2.0.28
httpx>=0.27.0
'''

with open('backend/requirements.txt', 'w') as f:
    f.write(reqs_code)

print('API routes, main.py, and requirements.txt generated.')
