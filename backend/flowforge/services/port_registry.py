import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger("flowforge.services.port_registry")

# Initial UN/LOCODE Port Database
DEFAULT_PORT_REGISTRY: Dict[str, Dict[str, Any]] = {
    # India UN/LOCODE Ports
    "INNSA": {
        "unlocode": "INNSA",
        "name": "Nhava Sheva (JNPT)",
        "city": "Navi Mumbai",
        "country": "India",
        "latitude": 18.9435,
        "longitude": 72.9290,
        "berths": 12,
        "occupied_berths": 9,
        "congestion_index": 0.75
    },
    "INMUN": {
        "unlocode": "INMUN",
        "name": "Mundra Port",
        "city": "Kutch",
        "country": "India",
        "latitude": 22.7594,
        "longitude": 69.7096,
        "berths": 24,
        "occupied_berths": 14,
        "congestion_index": 0.58
    },
    "INMAA": {
        "unlocode": "INMAA",
        "name": "Chennai Port",
        "city": "Chennai",
        "country": "India",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "berths": 16,
        "occupied_berths": 11,
        "congestion_index": 0.68
    },
    "INKAT": {
        "unlocode": "INKAT",
        "name": "Kattupalli Port",
        "city": "Tiruvallur",
        "country": "India",
        "latitude": 13.3167,
        "longitude": 80.3333,
        "berths": 8,
        "occupied_berths": 4,
        "congestion_index": 0.40
    },
    "INPAV": {
        "unlocode": "INPAV",
        "name": "Pipavav Port",
        "city": "Amreli",
        "country": "India",
        "latitude": 20.9142,
        "longitude": 71.5033,
        "berths": 10,
        "occupied_berths": 5,
        "congestion_index": 0.45
    },
    "INVTZ": {
        "unlocode": "INVTZ",
        "name": "Visakhapatnam Port",
        "city": "Visakhapatnam",
        "country": "India",
        "latitude": 17.6868,
        "longitude": 83.2185,
        "berths": 18,
        "occupied_berths": 12,
        "congestion_index": 0.62
    },
    "INKOL": {
        "unlocode": "INKOL",
        "name": "Kolkata Port",
        "city": "Kolkata",
        "country": "India",
        "latitude": 22.5411,
        "longitude": 88.3186,
        "berths": 14,
        "occupied_berths": 10,
        "congestion_index": 0.65
    },

    # Japan UN/LOCODE Ports
    "JPYOK": {
        "unlocode": "JPYOK",
        "name": "Port of Yokohama",
        "city": "Yokohama",
        "country": "Japan",
        "latitude": 35.4437,
        "longitude": 139.6380,
        "berths": 32,
        "occupied_berths": 28,
        "congestion_index": 0.88
    },
    "JPUKB": {
        "unlocode": "JPUKB",
        "name": "Port of Kobe",
        "city": "Kobe",
        "country": "Japan",
        "latitude": 34.6901,
        "longitude": 135.1955,
        "berths": 28,
        "occupied_berths": 12,
        "congestion_index": 0.42
    },
    "JPOSA": {
        "unlocode": "JPOSA",
        "name": "Port of Osaka",
        "city": "Osaka",
        "country": "Japan",
        "latitude": 34.6547,
        "longitude": 135.4336,
        "berths": 22,
        "occupied_berths": 10,
        "congestion_index": 0.45
    },
    "JPNGO": {
        "unlocode": "JPNGO",
        "name": "Port of Nagoya",
        "city": "Nagoya",
        "country": "Japan",
        "latitude": 35.0564,
        "longitude": 136.8823,
        "berths": 30,
        "occupied_berths": 16,
        "congestion_index": 0.53
    },
    "JPTYO": {
        "unlocode": "JPTYO",
        "name": "Port of Tokyo",
        "city": "Tokyo",
        "country": "Japan",
        "latitude": 35.6191,
        "longitude": 139.7753,
        "berths": 26,
        "occupied_berths": 21,
        "congestion_index": 0.78
    }
}

# Mapping common names to UN/LOCODE
NAME_TO_UNLOCODE: Dict[str, str] = {
    "YOKOHAMA": "JPYOK",
    "KOBE": "JPUKB",
    "OSAKA": "JPOSA",
    "NAGOYA": "JPNGO",
    "TOKYO": "JPTYO",
    "JNPT": "INNSA",
    "NHAVA SHEVA": "INNSA",
    "MUNDRA": "INMUN",
    "CHENNAI": "INMAA",
    "KATTUPALLI": "INKAT",
    "PIPAVAV": "INPAV",
    "VISAKHAPATNAM": "INVTZ",
    "KOLKATA": "INKOL",
    "SINGAPORE": "SGSIN",
    "SHANGHAI": "CNSHA"
}

class UNLOCODEPortRegistry:
    """Configurable UN/LOCODE-based Port Registry."""

    def __init__(self):
        self.ports = DEFAULT_PORT_REGISTRY
        self.name_map = NAME_TO_UNLOCODE

    def lookup_unlocode(self, query: str) -> Optional[str]:
        if not query:
            return None
        q = query.upper().strip()
        if q in self.ports:
            return q
        if q in self.name_map:
            return self.name_map[q]
        for name, code in self.name_map.items():
            if name in q:
                return code
        return None

    def get_port_coords(self, port_identifier: str) -> Optional[Tuple[float, float]]:
        code = self.lookup_unlocode(port_identifier)
        if code and code in self.ports:
            p = self.ports[code]
            return (p["latitude"], p["longitude"])
        return None

    def get_port(self, port_identifier: str) -> Optional[Dict[str, Any]]:
        code = self.lookup_unlocode(port_identifier)
        if code and code in self.ports:
            return self.ports[code]
        return None

    def list_ports_by_country(self, country: str) -> List[Dict[str, Any]]:
        c_lower = country.lower().strip()
        return [p for p in self.ports.values() if p["country"].lower() == c_lower]

port_registry = UNLOCODEPortRegistry()
