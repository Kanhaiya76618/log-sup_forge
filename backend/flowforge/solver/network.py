"""
backend/flowforge/solver/network.py
Geospatial Port Network and Haversine Distance Calculations.
"""

import math
from typing import Dict, Any, List, Tuple

GLOBAL_PORTS: Dict[str, Dict[str, Any]] = {
    "BOM": {"name": "Jawaharlal Nehru Port (Mumbai)", "country": "India", "lat": 18.95, "lon": 72.95, "code": "INBOM"},
    "YOK": {"name": "Port of Yokohama", "country": "Japan", "lat": 35.44, "lon": 139.64, "code": "JPYOK"},
    "SIN": {"name": "Port of Singapore (Tuas)", "country": "Singapore", "lat": 1.29, "lon": 103.85, "code": "SGSIN"},
    "SHA": {"name": "Port of Shanghai", "country": "China", "lat": 31.23, "lon": 121.47, "code": "CNSHA"},
    "ANR": {"name": "Port of Antwerp", "country": "Belgium", "lat": 51.22, "lon": 4.40, "code": "BEANR"},
    "RTM": {"name": "Port of Rotterdam", "country": "Netherlands", "lat": 51.92, "lon": 4.48, "code": "NLRTM"},
    "COL": {"name": "Port of Colombo", "country": "Sri Lanka", "lat": 6.94, "lon": 79.84, "code": "LKCMB"},
}

WAYPOINTS: Dict[str, Tuple[float, float]] = {
    "MALACCA_STRAIT": (2.50, 101.50),
    "SUNDA_STRAIT": (-5.95, 105.75),
    "LOMBOK_STRAIT": (-8.50, 115.75),
    "SOUTH_CHINA_SEA": (14.00, 113.00),
    "TAIWAN_STRAIT": (24.00, 119.50),
    "PACIFIC_EAST_PASS": (20.00, 130.00),
    "INDIAN_OCEAN_MID": (10.00, 85.00),
}


def haversine_distance_nm(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance in Nautical Miles (NM) between two coordinates."""
    r_nm = 3440.065
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(r_nm * c, 2)
