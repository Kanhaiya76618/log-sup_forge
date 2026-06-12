"""Executor + audit-sink contracts. OWNER: P1. IMPLEMENTED BY P4."""
from abc import ABC, abstractmethod
from ..contracts import ActionRequest, ExecutionResult, AuditEntry
from .connector import BaseConnector


class BaseExecutor(ABC):
    @abstractmethod
    def execute(self, request: ActionRequest, connector: BaseConnector) -> ExecutionResult:
        """Perform one action through the domain connector. Deterministic only."""


class BaseAuditSink(ABC):
    @abstractmethod
    def write(self, entry: AuditEntry) -> None: ...

    @abstractmethod
    def all(self) -> list[AuditEntry]: ...
