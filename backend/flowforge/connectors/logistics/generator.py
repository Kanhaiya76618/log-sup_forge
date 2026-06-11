import random
from ...contracts import RawSignal, Domain

def generate_signal(index: int) -> RawSignal:
    # Simulates shipment delays, port closures, and supply shortfalls deterministically
    if index % 7 == 0:
        p = {
            "kind": "supply",
            "anomaly": True,
            "type": "supply_shortage",
            "severity": "high",
            "summary": f"Component shortfall #{index}",
            "skus": [f"SKU-{index}"],
            "value_at_risk": 4000.0 + index * 200,
            "id": f"DIS-{index:03d}"
        }
    elif index % 11 == 0:
        p = {
            "kind": "port_status",
            "anomaly": True,
            "type": "port_closure",
            "severity": "critical",
            "summary": f"Multi-port closure #{index}",
            "orders": [f"ORD-{index}", f"ORD-{index}b"],
            "value_at_risk": 9000.0 + index * 300,
            "id": f"DIS-{index:03d}"
        }
    else:
        p = {
            "kind": "shipment_update",
            "anomaly": True,
            "type": "shipment_delay",
            "severity": "high",
            "summary": f"Shipment delay #{index}",
            "orders": [f"ORD-{index}"],
            "value_at_risk": 1500.0 + index * 150,
            "id": f"DIS-{index:03d}"
        }
    return RawSignal(source="feed", domain=Domain.LOGISTICS, payload=p)
