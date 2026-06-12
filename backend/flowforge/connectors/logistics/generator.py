"""Synthetic data + disruption injector. OWNER: P2.
Rotates through realistic disruption shapes (port closure, shipment delay,
supply shortage) so repeated ticks produce a varied feed instead of the same
incident. Deterministic sequence — no randomness — and KEEPS returning
list[RawSignal]."""
from itertools import count
from ...contracts import RawSignal, Domain

_seq = count()


def _scenario(i: int) -> dict:
    if i % 3 == 0:
        return {
            "kind": "port_status", "anomaly": True, "type": "port_closure",
            "severity": "high", "summary": "Yokohama port closed 48h (typhoon)",
            "orders": ["ORD-1041", "ORD-1042"], "skus": ["SKU-A", "SKU-B"],
            "blocked": ["Yokohama"], "value_at_risk": 18000.0,
        }
    if i % 3 == 1:
        n = 100 + i
        return {
            "kind": "shipment_update", "anomaly": True, "type": "shipment_delay",
            "severity": "high", "summary": f"Customs hold at Shanghai delays container #{n}",
            "orders": [f"ORD-{n}"], "skus": [f"SKU-C{n}"],
            "value_at_risk": 1500.0 + i * 150,
        }
    n = 100 + i
    return {
        "kind": "supply", "anomaly": True, "type": "supply_shortage",
        "severity": "critical", "summary": f"Critical component shortfall from primary supplier (SKU-{n})",
        "skus": [f"SKU-{n}"], "value_at_risk": 4000.0 + i * 200,
    }


def generate_signals(inject_disruption: bool = True) -> list[RawSignal]:
    signals = [
        RawSignal(source="tms", domain=Domain.LOGISTICS,
                  payload={"kind": "shipment_update", "anomaly": False}),
    ]
    if inject_disruption:
        signals.append(RawSignal(source="port_feed", domain=Domain.LOGISTICS,
                                 payload=_scenario(next(_seq))))
    return signals
