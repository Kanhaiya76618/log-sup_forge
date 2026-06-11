from typing import List
from ..interfaces.agent import Watcher
from ..contracts import RawSignal, Disruption, BlastRadius
from ..contracts.enums import DisruptionType, Severity

class WatcherAgent(Watcher):
    @property
    def name(self) -> str:
        return "Watcher"

    def scan(self, signals: List[RawSignal]) -> List[Disruption]:
        disruptions = []
        for sig in signals:
            payload = sig.payload
            if payload.get("anomaly") is True:
                # Map or parse raw signal details to Disruption object
                dt_str = payload.get("type", "shipment_delay")
                dt = DisruptionType(dt_str)
                sev = Severity(payload.get("severity", "high"))
                
                # Setup base blast radius
                affected_orders = payload.get("orders", [])
                affected_skus = payload.get("skus", [])
                val = payload.get("value_at_risk", 1000.0)
                
                # Check for synthetic ID
                disruption_id = payload.get("id")
                if not disruption_id:
                    # Deterministic ID generation based on list length or summary hashing
                    disruption_id = f"DIS-{abs(hash(payload.get('summary', ''))) % 10000:04d}"

                disruptions.append(
                    Disruption(
                        id=disruption_id,
                        type=dt,
                        severity=sev,
                        summary=payload.get("summary", "Anomaly detected in logistics network feed."),
                        blast_radius=BlastRadius(
                            affected_orders=affected_orders,
                            affected_skus=affected_skus,
                            value_at_risk=val
                        ),
                        status="pending"
                    )
                )
        return disruptions
