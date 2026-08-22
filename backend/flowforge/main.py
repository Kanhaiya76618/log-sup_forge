"""
backend/flowforge/main.py
FlowForge Maritime Disruption OS & Multi-Agent Intelligence Layer API.
"""

import os
import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager

_current_dir = os.path.dirname(os.path.abspath(__file__))
_backend_dir = os.path.dirname(_current_dir)
if _current_dir not in sys.path:
    sys.path.insert(0, _current_dir)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from fastapi import FastAPI, Request, status, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

# Ensure 'app' alias is registered before importing internal submodules
if __name__ in sys.modules and "app" not in sys.modules:
    sys.modules["app"] = sys.modules[__name__.split('.')[0]]

from .config import settings
from .utils.logger import logger
from .models.model_loader import model_registry
from .models_ml.inference_service import disruption_ml_service

# Staging Routers
from .api.staging_routes import router as staged_api_router
from .api.health import router as health_router
from .api.decisions import router as decisions_router

# Core & Cargo Risk Routers
from .api.routes import disruptions, agents, simulations, voyages, inventory, metrics, journey_risk


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("⚡ Initializing FlowForge Intelligence Layer, Decision Memory & Model Registry...")
    logger.info(f"Loaded ML Models (Disruption Service): {disruption_ml_service.is_loaded}")
    logger.info(f"Model Registry Active: {model_registry is not None}")
    yield
    logger.info("FlowForge Backend Services shutting down gracefully.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "Production-grade FastAPI backend for FlowForge AI Supply Chain & Maritime Decision Intelligence.\n\n"
        "Exposes ML prediction endpoints (Disruption, ETA, Cost), real-time telemetry ingestion "
        "(Open-Meteo, GDACS), route optimization, Monte Carlo digital twin simulation, and deterministic decision engine."
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Error Handling — Request Validation Errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    error_msg = f"Request validation failed for {request.method} {request.url.path}"
    if errors:
        first_err = errors[0]
        field_loc = " -> ".join([str(loc) for loc in first_err.get("loc", [])])
        error_msg = f"Validation error at '{field_loc}': {first_err.get('msg')}"

    # Sanitize errors: Pydantic v2 may embed non-serializable Exception objects in ctx["error"]
    safe_errors = []
    for err in errors:
        safe_err = {k: v for k, v in err.items() if k != "ctx"}
        if "ctx" in err:
            safe_err["ctx"] = {
                ck: str(cv) if isinstance(cv, Exception) else cv
                for ck, cv in err["ctx"].items()
            }
        safe_errors.append(safe_err)

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "VALIDATION_ERROR",
            "message": error_msg,
            "details": safe_errors,
            "path": str(request.url.path)
        }
    )

# Error Handling — HTTP Exceptions
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP_ERROR",
            "message": exc.detail,
            "path": str(request.url.path)
        }
    )

# Global Unhandled Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected internal server error occurred while processing the request.",
            "path": str(request.url.path)
        }
    )


# 1. Mount Intelligence API Routers
app.include_router(staged_api_router)
app.include_router(health_router)
app.include_router(health_router, prefix="/api/v1")
app.include_router(decisions_router)
app.include_router(decisions_router, prefix="/api/v1")

# 2. Mount Core Domain & Cargo Risk Routers (/api/v1/...)
app.include_router(disruptions.router, prefix="/api/v1")
app.include_router(agents.router, prefix="/api/v1")
app.include_router(simulations.router, prefix="/api/v1")
app.include_router(voyages.router, prefix="/api/v1")
app.include_router(inventory.router, prefix="/api/v1")
app.include_router(metrics.router, prefix="/api/v1")
app.include_router(journey_risk.router, prefix="/api/v1")
# Root alias mount for journey_risk direct paths
app.include_router(journey_risk.router)
