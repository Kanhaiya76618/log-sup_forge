"""Logistics connector. OWNER: P2 (data) + P4 (actions).
Connector #1 — the reference adapter. KEEP the BaseConnector interface."""
from ...interfaces import BaseConnector
from ...contracts import RawSignal, ActionRequest, ExecutionResult, Domain
from .generator import generate_signals


class LogisticsConnector(BaseConnector):
    domain = Domain.LOGISTICS

    def fetch_signals(self) -> list[RawSignal]:
        return generate_signals(inject_disruption=True)

    def apply_action(self, request: ActionRequest) -> ExecutionResult:
        # Stub: simulate the ERP/route/notify side-effect deterministically.
        return ExecutionResult(action=request.action, target=request.target,
                               success=True, detail=f"applied {request.action} to {request.target}")
