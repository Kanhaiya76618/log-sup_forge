from typing import Dict, Optional
from ..interfaces.agent import Watcher, Diagnoser, Planner, Verifier
from ..interfaces.connector import BaseConnector
from ..interfaces.executor import BaseExecutor, BaseAuditSink

class Registry:
    def __init__(self) -> None:
        self._connectors: Dict[str, BaseConnector] = {}
        self.watcher: Optional[Watcher] = None
        self.diagnoser: Optional[Diagnoser] = None
        self.planner: Optional[Planner] = None
        self.verifier: Optional[Verifier] = None
        self.executor: Optional[BaseExecutor] = None
        self.audit_sink: Optional[BaseAuditSink] = None

    def register_connector(self, connector: BaseConnector) -> None:
        # Register connector under its class name, domain name, or custom string
        self._connectors[connector.domain.value] = connector
        # Support fallback registration
        self._connectors[connector.__class__.__name__] = connector

    def get_connector(self, name: str) -> Optional[BaseConnector]:
        return self._connectors.get(name)

    @property
    def connectors(self) -> Dict[str, BaseConnector]:
        return self._connectors
