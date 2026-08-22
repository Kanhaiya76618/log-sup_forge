import math
from typing import Tuple, Optional, Dict

# Known Port Registry Coordinates (lat, lon)
PORT_REGISTRY: Dict[str, Tuple[float, float]] = {
    "YOKOHAMA":  (35.4437, 139.6380),
    "KOBE":      (34.6901, 135.1955),
    "TOKYO":     (35.6191, 139.7753),
    "OSAKA":     (34.6547, 135.4336),
    "NAGOYA":    (35.0564, 136.8823),
    "HAKATA":    (33.5993, 130.3810),
    "JNPT":      (18.9435, 72.9290),
    "MUMBAI":    (18.9220, 72.8347),
    "MUNDRA":    (22.7594, 69.7096),
    "CHENNAI":   (13.0827, 80.2707),
    "COCHIN":    (9.9312, 76.2673),
    "NHAVA SHEVA": (18.9435, 72.9290),
    "SINGAPORE": (1.2966, 103.7764),
    "SHANGHAI":  (31.2304, 121.4737),
    "HONG KONG": (22.3964, 114.1095),
    "COLOMBO":   (6.9271, 79.8612),
}

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on Earth in km."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lam = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def haversine_distance_nm(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in nautical miles (1 NM = 1.852 km)."""
    return haversine_distance_km(lat1, lon1, lat2, lon2) / 1.852

def resolve_port_coords(port_name: Optional[str]) -> Optional[Tuple[float, float]]:
    """Look up port coordinates by name."""
    if not port_name:
        return None
    name_upper = port_name.upper().strip()
    if name_upper in PORT_REGISTRY:
        return PORT_REGISTRY[name_upper]
    for key, coords in PORT_REGISTRY.items():
        if key in name_upper:
            return coords
    return None
