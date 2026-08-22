"""Domain-adapter contract. OWNER: P1.
A Connector is how the engine talks to ONE domain: it produces signals and
applies actions. Adding a new domain = one new Connector subclass + one
registry line. This is the scalability/pluggability backbone."""
from abc import ABC, abstractmethod
from ..contracts import RawSignal, ActionRequest, ExecutionResult, Domain


class BaseConnector(ABC):
    domain: Domain

    @abstractmethod
    def fetch_signals(self) -> list[RawSignal]:
        """Pull the latest raw signals from this domain's data source."""

    @abstractmethod
    def apply_action(self, request: ActionRequest) -> ExecutionResult:
        """Carry out one deterministic action in this domain (the 'RPA bot')."""
