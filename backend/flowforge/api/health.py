from fastapi import APIRouter
from datetime import datetime, timezone
try:
    from app.models.model_loader import model_registry
    from app.services.fuel_service import fuel_service
    from app.services.geopolitical_service import geopolitical_service
except ImportError:
    from models.model_loader import model_registry
    from services.fuel_service import fuel_service
    from services.geopolitical_service import geopolitical_service

router = APIRouter(tags=["Health & Diagnostics"])

@router.get("/health", summary="Service Health Check", description="Returns simple status for system monitoring.")
async def health_check():
    return {
        "status": "healthy",
        "service": "flowforge-backend",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0"
    }

@router.get(
    "/models/status",
    summary="Model Registry Status Summary",
    description="Exposes loaded status for disruption, ETA, route, and cost models along with preprocessing objects."
)
@router.get(
    "/api/v1/models/status",
    summary="Detailed Model Status Inspection",
    description="Exposes loaded/unloaded status, file paths, model types, expected features, and preprocessing requirements."
)
async def get_models_status():
    status = model_registry.get_status()
    return {
        "disruption_model_loaded": status["models_loaded"]["disruption_model"],
        "eta_model_loaded": status["models_loaded"]["eta_model"],
        "route_model_loaded": status["models_loaded"]["route_model"],
        "cost_model_loaded": status["models_loaded"]["cost_model"],
        "preprocessing_objects_loaded": status["preprocessing_objects_loaded"],
        "registry_status": status["registry_status"],
        "loaded_models_count": status["loaded_models_count"],
        "models": status["models"]
    }

@router.get(
    "/api/v1/system/status",
    summary="System Intelligence Layer Status",
    description="Exposes current operational status across all trained ML models, live telemetry services, and orchestration layers."
)
async def system_status():
    fuel_data = fuel_service.get_fuel_price_index()
    geo_data = geopolitical_service.get_geopolitical_risk_score()
    
    models_status = model_registry.get_status()
    loaded_count = models_status.get("loaded_models_count", 0)

    return {
        "system": "FlowForge Intelligence Layer",
        "status": "OPERATIONAL" if loaded_count >= 4 else "DEGRADED",
        "models": {
            "disruption": "READY" if model_registry.disruption_model is not None else "UNAVAILABLE",
            "eta": "READY" if model_registry.eta_regressor is not None else "UNAVAILABLE",
            "delay": "READY" if model_registry.delay_classifier is not None else "UNAVAILABLE",
            "cost": "READY" if model_registry.cost_optimizer_model is not None else "UNAVAILABLE"
        },
        "live_services": {
            "weather": "LIVE",
            "geopolitical": geo_data.get("status", "LIVE"),
            "carrier": "CONFIGURED",
            "fuel": fuel_data.get("status", "FALLBACK")
        },
        "orchestrator": "READY",
        "decision_engine": "READY",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/api/v1/models/diagnostics", summary="Model Diagnostic Test Execution")
async def get_models_diagnostics():
    """Verifies that each trained model can perform a real sample prediction with latency monitoring."""
    return model_registry.run_diagnostics()
