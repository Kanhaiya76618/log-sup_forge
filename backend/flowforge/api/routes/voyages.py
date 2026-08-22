"""
backend/flowforge/api/routes/voyages.py
Voyages & Fleet Telemetry Endpoints with Granular Voyage Checkpoints & Weather Forecasts.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/voyages", tags=["Voyages"])

FLEET_VOYAGES = [
    {
        "id": "SH-2049",
        "tracking_id": "TRK-2026-002",
        "vessel_name": "CSCL Globe Supermax",
        "origin": "Jawaharlal Nehru Port (Mumbai, IN)",
        "hub": "Singapore Tuas Transshipment Hub (SG)",
        "destination": "Port of Yokohama (JP)",
        "coordinates": {"lat": 1.29, "lon": 103.85},
        "speed_knots": 14.2,
        "heading": 65,
        "containers": 3800,
        "status": "At Risk",
        "risk_factor": 82,
        "eta": "Nov 26, 2026 (+4.2d)",
        "total_distance_nm": 5170,
        "distance_covered_nm": 2140,
        "distance_remaining_nm": 3030,
        "progress_percent": 41.4,
        "current_checkpoint_id": "CP-04"
    },
    {
        "id": "SH-2048",
        "tracking_id": "TRK-2026-001",
        "vessel_name": "MV Tokyo Express",
        "origin": "Jawaharlal Nehru Port (Mumbai, IN)",
        "hub": "Colombo Port (LK)",
        "destination": "Port of Yokohama (JP)",
        "coordinates": {"lat": 18.95, "lon": 72.95},
        "speed_knots": 18.2,
        "heading": 65,
        "containers": 4200,
        "status": "On Schedule",
        "risk_factor": 24,
        "eta": "Nov 22, 2026",
        "total_distance_nm": 4850,
        "distance_covered_nm": 420,
        "distance_remaining_nm": 4430,
        "progress_percent": 8.7,
        "current_checkpoint_id": "CP-01"
    },
    {
        "id": "SH-2050",
        "tracking_id": "TRK-2026-003",
        "vessel_name": "Maersk Mc-Kinney",
        "origin": "Singapore Tuas Port (SG)",
        "hub": "Suez Canal Gateway (EG)",
        "destination": "Rotterdam Gateway (NL)",
        "coordinates": {"lat": 1.29, "lon": 103.85},
        "speed_knots": 19.5,
        "heading": 285,
        "containers": 5100,
        "status": "On Schedule",
        "risk_factor": 12,
        "eta": "Nov 28, 2026",
        "total_distance_nm": 8400,
        "distance_covered_nm": 6200,
        "distance_remaining_nm": 2200,
        "progress_percent": 73.8,
        "current_checkpoint_id": "CP-05"
    }
]

VOYAGE_CHECKPOINTS_DB: Dict[str, Dict[str, Any]] = {
    "SH-2049": {
        "voyage_id": "SH-2049",
        "vessel_name": "CSCL Globe Supermax",
        "route_name": "Mumbai JNPT ➔ Singapore Tuas Hub ➔ Port of Yokohama",
        "total_distance_nm": 5170,
        "distance_covered_nm": 2140,
        "distance_remaining_nm": 3030,
        "progress_percent": 41.4,
        "total_transit_days": 13.5,
        "elapsed_days": 5.8,
        "remaining_days": 7.7,
        "active_checkpoint_id": "CP-04",
        "checkpoints": [
            {
                "checkpoint_id": "CP-01",
                "sequence": 1,
                "name": "Mumbai JNPT Pilot Boarding Station",
                "location_name": "Mumbai, India",
                "coordinates": {"lat": 18.95, "lon": 72.95},
                "category": "PORT_DEPARTURE",
                "distance_covered_nm": 0,
                "distance_remaining_nm": 5170,
                "progress_percent": 0.0,
                "elapsed_days": 0.0,
                "eta_or_passed": "Nov 12, 2026 08:00 UTC (Passed)",
                "status": "COMPLETED",
                "ship_telemetry": {
                    "speed_knots": 12.0,
                    "heading_deg": 185,
                    "engine_load_pct": 65,
                    "fuel_burn_mt_day": 42.0,
                    "draft_m": 14.8,
                    "safety_status": "NORMAL"
                },
                "forecast_conditions": {
                    "wave_height_m": 1.2,
                    "wind_speed_kmh": 18.0,
                    "wind_direction": "NW",
                    "sea_state": "Calm to Slight Swell",
                    "visibility_nm": 10.0,
                    "risk_tier": "LOW",
                    "risk_score": 12
                }
            },
            {
                "checkpoint_id": "CP-02",
                "sequence": 2,
                "name": "Sri Lanka Dondra Head Corridor",
                "location_name": "South of Sri Lanka",
                "coordinates": {"lat": 5.85, "lon": 80.55},
                "category": "OPEN_OCEAN_TRANSIT",
                "distance_covered_nm": 980,
                "distance_remaining_nm": 4190,
                "progress_percent": 19.0,
                "elapsed_days": 2.5,
                "eta_or_passed": "Nov 14, 2026 20:00 UTC (Passed)",
                "status": "COMPLETED",
                "ship_telemetry": {
                    "speed_knots": 17.8,
                    "heading_deg": 105,
                    "engine_load_pct": 82,
                    "fuel_burn_mt_day": 58.5,
                    "draft_m": 14.8,
                    "safety_status": "NORMAL"
                },
                "forecast_conditions": {
                    "wave_height_m": 2.1,
                    "wind_speed_kmh": 28.0,
                    "wind_direction": "SW",
                    "sea_state": "Moderate Monsoon Swell",
                    "visibility_nm": 8.5,
                    "risk_tier": "MEDIUM",
                    "risk_score": 38
                }
            },
            {
                "checkpoint_id": "CP-03",
                "sequence": 3,
                "name": "Malacca Strait Western Entry",
                "location_name": "Strait of Malacca (North Gate)",
                "coordinates": {"lat": 5.25, "lon": 97.50},
                "category": "STRAIT_CHOKEPOINT",
                "distance_covered_nm": 1890,
                "distance_remaining_nm": 3280,
                "progress_percent": 36.6,
                "elapsed_days": 5.0,
                "eta_or_passed": "Nov 17, 2026 09:30 UTC (Passed)",
                "status": "COMPLETED",
                "ship_telemetry": {
                    "speed_knots": 15.4,
                    "heading_deg": 130,
                    "engine_load_pct": 74,
                    "fuel_burn_mt_day": 49.0,
                    "draft_m": 14.7,
                    "safety_status": "RESTRICTED SPEED"
                },
                "forecast_conditions": {
                    "wave_height_m": 0.8,
                    "wind_speed_kmh": 14.0,
                    "wind_direction": "NE",
                    "sea_state": "Calm Channel",
                    "visibility_nm": 7.0,
                    "risk_tier": "LOW",
                    "risk_score": 22
                }
            },
            {
                "checkpoint_id": "CP-04",
                "sequence": 4,
                "name": "Singapore Tuas Transshipment Hub",
                "location_name": "Singapore Tuas Terminal",
                "coordinates": {"lat": 1.29, "lon": 103.85},
                "category": "TRANSSHIPMENT_HUB",
                "distance_covered_nm": 2140,
                "distance_remaining_nm": 3030,
                "progress_percent": 41.4,
                "elapsed_days": 5.8,
                "eta_or_passed": "Nov 18, 2026 04:00 UTC (Active Buffer)",
                "status": "ACTIVE_CURRENT",
                "ship_telemetry": {
                    "speed_knots": 14.2,
                    "heading_deg": 65,
                    "engine_load_pct": 68,
                    "fuel_burn_mt_day": 45.0,
                    "draft_m": 14.8,
                    "safety_status": "BERTH CONGESTION BUFFER"
                },
                "forecast_conditions": {
                    "wave_height_m": 0.6,
                    "wind_speed_kmh": 12.0,
                    "wind_direction": "E",
                    "sea_state": "Smooth Roads",
                    "visibility_nm": 9.0,
                    "risk_tier": "HIGH",
                    "risk_score": 74
                }
            },
            {
                "checkpoint_id": "CP-05",
                "sequence": 5,
                "name": "South China Sea Central Basin",
                "location_name": "South China Sea (Mid Corridor)",
                "coordinates": {"lat": 12.50, "lon": 114.20},
                "category": "OPEN_OCEAN_TRANSIT",
                "distance_covered_nm": 3250,
                "distance_remaining_nm": 1920,
                "progress_percent": 62.9,
                "elapsed_days": 8.8,
                "eta_or_passed": "Nov 21, 2026 14:00 UTC (Estimated)",
                "status": "UPCOMING",
                "ship_telemetry": {
                    "speed_knots": 16.5,
                    "heading_deg": 42,
                    "engine_load_pct": 80,
                    "fuel_burn_mt_day": 56.0,
                    "draft_m": 14.6,
                    "safety_status": "PREDICTED NOMINAL"
                },
                "forecast_conditions": {
                    "wave_height_m": 2.6,
                    "wind_speed_kmh": 36.0,
                    "wind_direction": "ENE",
                    "sea_state": "High Swell Anomaly",
                    "visibility_nm": 6.0,
                    "risk_tier": "HIGH",
                    "risk_score": 68
                }
            },
            {
                "checkpoint_id": "CP-06",
                "sequence": 6,
                "name": "Luzon Strait / Ryukyu Outer Arc",
                "location_name": "East of Taiwan / Ryukyu Trench",
                "coordinates": {"lat": 22.80, "lon": 123.50},
                "category": "STORM_BYPASS_ZONE",
                "distance_covered_nm": 4310,
                "distance_remaining_nm": 860,
                "progress_percent": 83.4,
                "elapsed_days": 11.5,
                "eta_or_passed": "Nov 24, 2026 06:00 UTC (Estimated)",
                "status": "UPCOMING",
                "ship_telemetry": {
                    "speed_knots": 16.0,
                    "heading_deg": 35,
                    "engine_load_pct": 82,
                    "fuel_burn_mt_day": 58.0,
                    "draft_m": 14.6,
                    "safety_status": "SOUTHERN BYPASS APPLIED"
                },
                "forecast_conditions": {
                    "wave_height_m": 3.8,
                    "wind_speed_kmh": 52.0,
                    "wind_direction": "NE",
                    "sea_state": "Severe Typhoon Swell Periphery",
                    "visibility_nm": 4.5,
                    "risk_tier": "CRITICAL",
                    "risk_score": 88
                }
            },
            {
                "checkpoint_id": "CP-07",
                "sequence": 7,
                "name": "Port of Yokohama Berth Approach",
                "location_name": "Tokyo Bay / Yokohama Gateway",
                "coordinates": {"lat": 35.44, "lon": 139.64},
                "category": "PORT_ARRIVAL",
                "distance_covered_nm": 5170,
                "distance_remaining_nm": 0,
                "progress_percent": 100.0,
                "elapsed_days": 13.5,
                "eta_or_passed": "Nov 26, 2026 18:00 UTC (+4.2d Slip)",
                "status": "UPCOMING",
                "ship_telemetry": {
                    "speed_knots": 10.5,
                    "heading_deg": 15,
                    "engine_load_pct": 55,
                    "fuel_burn_mt_day": 34.0,
                    "draft_m": 14.5,
                    "safety_status": "BERTH DISCHARGE READY"
                },
                "forecast_conditions": {
                    "wave_height_m": 1.4,
                    "wind_speed_kmh": 20.0,
                    "wind_direction": "NNE",
                    "sea_state": "Moderate Harbor Swell",
                    "visibility_nm": 8.0,
                    "risk_tier": "MEDIUM",
                    "risk_score": 45
                }
            }
        ]
    }
}


@router.get("")
def list_voyages():
    """List all active fleet voyages with progress summaries."""
    return FLEET_VOYAGES


@router.get("/{voyage_id}")
def get_voyage(voyage_id: str):
    """Retrieve details for a specific voyage."""
    for v in FLEET_VOYAGES:
        if v["id"] == voyage_id:
            return v
    return FLEET_VOYAGES[0]


@router.get("/{voyage_id}/checkpoints")
def get_voyage_checkpoints(voyage_id: str):
    """
    Retrieve all checkpoints, progress metrics (covered/remaining),
    ship telemetry, and forecasted marine conditions along the voyage corridor.
    """
    if voyage_id in VOYAGE_CHECKPOINTS_DB:
        return VOYAGE_CHECKPOINTS_DB[voyage_id]
    
    # Return default corridor for SH-2049 if specific ID not found
    fallback = VOYAGE_CHECKPOINTS_DB["SH-2049"]
    fallback["voyage_id"] = voyage_id
    return fallback

