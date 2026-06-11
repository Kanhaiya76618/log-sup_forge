import os
from typing import Generator
from .config import Settings
from .registry import Registry
from .orchestrator import Orchestrator
from ..contracts import PipelineRecord, RawSignal

class Engine:
    def __init__(self, registry: Registry, settings: Settings) -> None:
        self.registry = registry
        self.settings = settings
        self.orchestrator = Orchestrator(registry)
        
        # Inject config values into registry for gate access
        self.registry.auto_approve_confidence = settings.AUTO_APPROVE_CONFIDENCE
        self.registry.max_auto_cost = settings.MAX_AUTO_COST

    def tick(self, signals: list[RawSignal] = None, broadcast_cb=None) -> Generator[PipelineRecord, None, None]:
        # If signals is None, query connectors
        if signals is None:
            signals = []
            for connector in self.registry.connectors.values():
                signals.extend(connector.fetch_signals())
        
        yield from self.orchestrator.run_pipeline(signals, broadcast_cb)

def build_engine() -> Engine:
    # Build default engine with default configs
    settings = Settings()
    registry = Registry()
    
    # Import locally to avoid circular dependencies
    from ..agents.watcher import WatcherAgent
    from ..agents.diagnosis import DiagnosisAgent
    from ..agents.planner import PlannerAgent
    from ..agents.verifier import VerifierAgent
    from ..execution.executor import StubExecutor
    from ..execution.audit import SQLiteAuditSink
    
    registry.watcher = WatcherAgent()
    registry.diagnoser = DiagnosisAgent()
    registry.planner = PlannerAgent()
    registry.verifier = VerifierAgent()
    registry.executor = StubExecutor()
    registry.audit_sink = SQLiteAuditSink(settings.DATABASE_URL)
    
    return Engine(registry, settings)
