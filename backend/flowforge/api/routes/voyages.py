"""
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
