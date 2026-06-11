from ..interfaces.agent import Diagnoser
from ..contracts import Disruption, BlastRadius

class DiagnosisAgent(Diagnoser):
    @property
    def name(self) -> str:
        return "Diagnosis"

    def diagnose(self, disruption: Disruption) -> Disruption:
        # Enriches the disruption details, matching order/SKU indices
        orders = disruption.blast_radius.affected_orders or [f"ORD-{disruption.id}"]
        skus = disruption.blast_radius.affected_skus
        if not skus:
            # Deterministic SKU association for demo purposes
            skus = [f"SKU-{orders[0].split('-')[-1]}"] if orders else ["SKU-LOCAL"]

        disruption.blast_radius = BlastRadius(
            affected_orders=orders,
            affected_skus=skus,
            value_at_risk=disruption.blast_radius.value_at_risk
        )
        return disruption
