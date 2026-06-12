"""Default engine factory. OWNER: P1.
Assembles the stub implementations + the logistics connector so `tick()` runs
end-to-end on Day 1. Each lane later swaps its stub for the real class here."""
from .config import Settings, env_flag
from .registry import Registry
from .gate import Gate
from .orchestrator import Orchestrator
from ..agents.watcher import StubWatcher          # P2 replaces
from ..agents.diagnosis import StubDiagnoser       # P2 replaces
from ..agents.planner import StubPlanner           # P3 replaces
from ..agents.verifier import StubVerifier         # P4 replaces
from ..execution.executor import StubExecutor      # P4 replaces
from ..execution.audit import InMemoryAuditSink    # P4 replaces (DB-backed)
from ..connectors.logistics.connector import LogisticsConnector  # P2
from ..connectors.logistics.live import LiveLogisticsConnector    # P2 — live weather
import os


def build_engine(settings: Settings | None = None) -> Orchestrator:
    settings = settings or Settings()
    registry = Registry()
    if env_flag("FLOWFORGE_LIVE"):
        registry.register_connector(LiveLogisticsConnector())
    else:
        registry.register_connector(LogisticsConnector())
    # registry.register_connector(ManufacturingConnector())  # P4/P3 enable on Day 6
    return Orchestrator(
        registry=registry,
        watcher=StubWatcher(),
        diagnoser=StubDiagnoser(),
        planner=StubPlanner(),
        verifier=StubVerifier(),
        executor=StubExecutor(),
        gate=Gate(settings.gate),
        audit=InMemoryAuditSink(),
    )
