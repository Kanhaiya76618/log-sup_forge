from abc import ABC, abstractmethod
from typing import Dict, List
from ..contracts import PlanStep, ExecutionResult, AuditEntry
from .connector import BaseConnector

class BaseExecutor(ABC):
    @abstractmethod
    def execute_step(self, step: PlanStep, connectors: Dict[str, BaseConnector]) -> ExecutionResult:
        pass

class BaseAuditSink(ABC):
    @abstractmethod
    def log(self, entry: AuditEntry) -> None:
        pass

    @abstractmethod
    def fetch_all(self) -> List[AuditEntry]:
        pass
