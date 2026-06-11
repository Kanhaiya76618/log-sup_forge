from ...interfaces.connector import BaseConnector
from ...contracts import RawSignal, ActionRequest, ExecutionResult, Domain

class ManufacturingConnector(BaseConnector):
    @property
    def domain(self) -> Domain:
        return Domain.MANUFACTURING

    def fetch_signals(self) -> list[RawSignal]:
        return []

    def apply_action(self, request: ActionRequest) -> ExecutionResult:
        return ExecutionResult(
            action=request.action,
            target=request.target,
            success=True,
            detail=f"Manufacturing action applied: {request.action.value} on {request.target}."
        )
