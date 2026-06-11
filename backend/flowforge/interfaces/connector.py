from abc import ABC, abstractmethod
from typing import List
from ..contracts import RawSignal, ActionRequest, ExecutionResult, Domain

class BaseConnector(ABC):
    @property
    @abstractmethod
    def domain(self) -> Domain:
        pass

    @abstractmethod
    def fetch_signals(self) -> List[RawSignal]:
        pass

    @abstractmethod
    def apply_action(self, request: ActionRequest) -> ExecutionResult:
        pass
