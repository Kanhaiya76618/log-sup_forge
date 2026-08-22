"""
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
