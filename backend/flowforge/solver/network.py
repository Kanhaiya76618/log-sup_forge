"""Domain reference data for the optimizer. OWNER: P3.
Self-contained route graph, supplier list, and order book so the solver runs
without waiting on P2. Swap these lookups for live connector data later for realism.
The solver reads ONLY from here + the Disruption it's given — no LLM, no I/O."""
from __future__ import annotations
from dataclasses import dataclass
import hashlib


@dataclass(frozen=True)
class Route:
    id: str
    od: tuple[str, str]
    via: tuple[str, ...]      # ports/hubs traversed; used to test against a blockage
    cost: float
    transit_min: float
    capacity: float


@dataclass(frozen=True)
class Order:
    id: str
    origin: str
    dest: str
    demand: float
    due_min: float            # delivery deadline, minutes from now
    value: float


# One cheap sea lane through Yokohama + progressively pricier/faster alternatives.
ROUTES: list[Route] = [
    Route("sea_yokohama", ("CN", "JP"), ("Shanghai", "Yokohama", "Tokyo_DC"), 1200, 2880, 100),
    Route("sea_kobe",     ("CN", "JP"), ("Shanghai", "Kobe", "Tokyo_DC"),     1600, 3600, 80),
    Route("rail_busan",   ("CN", "JP"), ("Busan", "Kobe", "Tokyo_DC"),        2600, 2400, 40),
    Route("air_express",  ("CN", "JP"), ("PVG", "Narita", "Tokyo_DC"),        9000, 600,  20),
]

# (id, unit_price, capacity_units, lead_min)
SUPPLIERS: list[tuple[str, float, int, int]] = [
    ("sup_local", 14.0, 500, 1440),
    ("sup_intl",  9.5, 2000, 7200),
]

KNOWN_ORDERS: dict[str, Order] = {}


def lookup_order(order_id: str) -> Order:
    """Return a known order, or deterministically synthesize a plausible one from its id."""
    if order_id in KNOWN_ORDERS:
        return KNOWN_ORDERS[order_id]
    h = int(hashlib.sha1(order_id.encode()).hexdigest(), 16)
    return Order(order_id, "CN", "JP",
                 demand=float(10 + h % 40),
                 due_min=float(1200 + (h >> 4) % 2400),
                 value=float(2000 + (h >> 8) % 16000))


def candidate_routes(blocked: tuple[str, ...] = ()) -> list[Route]:
    """Routes that do NOT traverse any blocked port/hub."""
    blk = set(blocked)
    return [r for r in ROUTES if not (set(r.via) & blk)]