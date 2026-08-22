"""Diagnosis agent. OWNER: P2.
REPLACE with real classification + blast-radius + severity (LLM + lookups).
KEEP the signature: Event -> Disruption."""
from ..interfaces import Diagnoser
from ..contracts import Event, Disruption, BlastRadius, DisruptionType, Severity


class StubDiagnoser(Diagnoser):
    def diagnose(self, event: Event) -> Disruption:
        d = event.data
        context = {"blocked": d.get("blocked", [])}
        if d.get("provenance"):
            context["provenance"] = d["provenance"]   # live / live_news / synthetic_*
        if d.get("country"):
            context["country"] = d["country"]
        # pass-through of domain-specific structured state (manufacturing job-shop,
        # etc.) so the matching Planner/Scheduler can act on it.
        for k in ("line", "machines", "down_machine", "jobs", "material"):
            if k in d:
                context[k] = d[k]
        return Disruption(
            domain=event.domain,
            type=DisruptionType(d.get("type", "shipment_delay")),
            severity=Severity(d.get("severity", "high")),
            summary=d.get("summary", "Disruption detected"),
            blast_radius=BlastRadius(
                affected_orders=d.get("orders", []),
                affected_skus=d.get("skus", []),
                value_at_risk=float(d.get("value_at_risk", 0.0)),
            ),
            context=context,
            source_event_id=event.id,
        )
