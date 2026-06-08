"""Eval scenario set. OWNER: P3 (P2 can enrich realism later).
Deliberately spread across cost and reversibility so the auto-vs-escalate metric
is believable: most are cheap reversible reroutes (auto), some need a PO
(irreversible -> escalate), a few are critical multi-port closures (pricey)."""
from ..contracts import RawSignal, Domain


def scenario_batch(n: int = 20) -> list[list[RawSignal]]:
    batches = []
    for i in range(n):
        if i % 7 == 0:                       # ~14%: shortfall needing a committed PO
            p = {"kind": "supply", "anomaly": True, "type": "supply_shortage",
                 "severity": "high", "summary": f"Component shortfall #{i}",
                 "skus": [f"SKU-{i}"], "value_at_risk": 4000.0 + i * 200}
        elif i % 11 == 0:                    # rare: critical closure, two orders, pricey
            p = {"kind": "port_status", "anomaly": True, "type": "port_closure",
                 "severity": "critical", "summary": f"Multi-port closure #{i}",
                 "orders": [f"ORD-{i}", f"ORD-{i}b"], "value_at_risk": 9000.0 + i * 300}
        else:                                # common: high-severity single delay (auto)
            p = {"kind": "shipment_update", "anomaly": True, "type": "shipment_delay",
                 "severity": "high", "summary": f"Shipment delay #{i}",
                 "orders": [f"ORD-{i}"], "value_at_risk": 1500.0 + i * 150}
        batches.append([RawSignal(source="feed", domain=Domain.LOGISTICS, payload=p)])
    return batches