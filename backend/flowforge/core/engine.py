"""Default engine factory. OWNER: P1.
Assembles the stub implementations + the logistics connector so `tick()` runs
end-to-end on Day 1. Each lane later swaps its stub for the real class here."""
from .config import Settings, env_flag
from .registry import Registry
from .gate import Gate
from .orchestrator import Orchestrator
from ..agents.watcher import StubWatcher          # P2 replaces
from ..agents.diagnosis import StubDiagnoser       # P2 replaces
from ..agents.planner import StubPlanner           # P3 — logistics routing planner
from ..agents.scheduler import SchedulerPlanner    # P3 — manufacturing scheduler
from ..agents.verifier import StubVerifier         # P4 replaces
from ..execution.executor import StubExecutor      # P4 replaces
from ..execution.audit import InMemoryAuditSink    # P4 replaces (DB-backed)
from ..connectors.logistics.connector import LogisticsConnector  # P2
from ..connectors.logistics.live import LiveLogisticsConnector    # P2 — live weather
from ..connectors.manufacturing.connector import ManufacturingConnector  # P3
from ..contracts import Domain


def build_engine(settings: Settings | None = None) -> Orchestrator:
    settings = settings or Settings()
    registry = Registry()
    if env_flag("FLOWFORGE_LIVE"):
        registry.register_connector(LiveLogisticsConnector())
    else:
        registry.register_connector(LogisticsConnector())
    registry.register_connector(ManufacturingConnector())
    # Per-domain planners: logistics routes, manufacturing schedules.
    registry.register_planner(Domain.LOGISTICS, StubPlanner())
    registry.register_planner(Domain.MANUFACTURING, SchedulerPlanner())
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
