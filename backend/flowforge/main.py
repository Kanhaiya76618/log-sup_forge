"""
backend/flowforge/main.py
FlowForge Maritime Disruption OS - FastAPI Application Entrypoint.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import disruptions, agents, simulations, voyages, inventory, metrics, journey_risk
from .models_ml.inference_service import disruption_ml_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("flowforge.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("⚡ Starting FlowForge Maritime Disruption Decision OS & Cargo Journey Risk System...")
    logger.info(f"Loaded ML Models: {disruption_ml_service.is_loaded}")
    yield
    logger.info("FlowForge Shutdown Completed.")


app = FastAPI(
    title="FlowForge Maritime Disruption OS & Cargo Journey Risk API",
    description="Predictive Cargo Journey Risk, 9-Agent Decision Intelligence Pipeline, Google OR-Tools CP-SAT, and Trained ML Predictors",
    version="2.0.0",
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
app.include_router(journey_risk.router, prefix="/api/v1")
# Also mount journey_risk routes at root for direct paths (/predict/delay, /shipment/risk)
app.include_router(journey_risk.router)


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "FlowForge Maritime OS & Predictive Cargo Journey Risk",
        "ml_model_loaded": disruption_ml_service.is_loaded,
        "agents_ready": 9,
        "journey_risk_modules": [
            "Early Delay Warning (Weak Signal Engine)",
            "Transshipment Connection Failure Predictor",
            "Cargo Security / Theft Anomaly Detector",
            "Dynamic Route Selection Under Uncertainty",
            "Cascading Disruption Dependency Graph",
            "Cargo-Level Availability ETA (P50/P80/P90)"
        ],
        "solvers": ["Google OR-Tools CP-SAT", "500-Sample Monte Carlo Digital Twin"]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.flowforge.main:app", host="0.0.0.0", port=8000, reload=True)
