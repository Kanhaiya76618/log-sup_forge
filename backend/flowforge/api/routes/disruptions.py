"""
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
