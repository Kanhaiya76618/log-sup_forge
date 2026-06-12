"""Manufacturing connector — Day-6 proof the engine generalizes. OWNER: P4/P3.
Same interface, different domain (machine_downtime -> reschedule + replenish).
Register it in core/engine.py to switch it on. Until then, left unimplemented."""
from ...interfaces import BaseConnector
from ...contracts import RawSignal, ActionRequest, ExecutionResult, Domain


class ManufacturingConnector(BaseConnector):
    domain = Domain.MANUFACTURING

    def fetch_signals(self) -> list[RawSignal]:
        raise NotImplementedError("P4/P3 — implement on Day 6 if logistics is solid")

    def apply_action(self, request: ActionRequest) -> ExecutionResult:
        raise NotImplementedError("P4/P3 — implement on Day 6 if logistics is solid")
