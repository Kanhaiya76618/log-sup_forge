"""Eval-only connector. OWNER: P3.
Lets the harness drive a specific scenario's signals through the REAL engine by
overriding the registered logistics connector. Keeps eval self-contained in P3's lane."""
from ..interfaces import BaseConnector
from ..contracts import RawSignal, ActionRequest, ExecutionResult, Domain


class EvalConnector(BaseConnector):
    domain = Domain.LOGISTICS

    def __init__(self, signals: list[RawSignal]) -> None:
        self._signals = signals

    def fetch_signals(self) -> list[RawSignal]:
        return self._signals

    def apply_action(self, request: ActionRequest) -> ExecutionResult:
        return ExecutionResult(action=request.action, target=request.target,
                               success=True, detail="eval")
