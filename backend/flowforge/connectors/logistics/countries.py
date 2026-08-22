"""Country -> monitored ports. OWNER: P2.
Open-Meteo is global, so adding a country is just adding rows here — no code
change. Only Japan has a deep route graph in network.py; other countries get
live weather monitoring + a generic reroute on Japan's lane template."""
from __future__ import annotations

# country -> { port_name: (lat, lon) }.  Japan keeps the existing 4 so the
# route network's via-nodes stay monitored (and live.PORTS stays backward-compat).
COUNTRIES: dict[str, dict[str, tuple[float, float]]] = {
    "japan":     {"Yokohama": (35.45, 139.65), "Kobe": (34.69, 135.20),
                  "Shanghai": (31.23, 121.47), "Busan": (35.10, 129.04)},
    "india":     {"Mumbai": (18.96, 72.82), "Chennai": (13.08, 80.27),
                  "Mundra": (22.84, 69.72)},
    "us":        {"Los Angeles": (33.74, -118.27), "Long Beach": (33.75, -118.19),
                  "New York": (40.67, -74.04)},
    "australia": {"Sydney": (-33.86, 151.21), "Melbourne": (-37.84, 144.95),
                  "Brisbane": (-27.38, 153.17)},
    "china":     {"Shanghai": (31.23, 121.47), "Shenzhen": (22.54, 114.06),
                  "Ningbo": (29.87, 121.55)},
}

DEFAULT_COUNTRY = "japan"


def ports_for(country: str) -> dict[str, tuple[float, float]]:
    return COUNTRIES.get((country or "").lower(), COUNTRIES[DEFAULT_COUNTRY])
