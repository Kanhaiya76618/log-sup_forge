"""Agent contracts. OWNER: P1. Each lane implements one of these ABCs.
Implementations return the shared contract types — the orchestrator depends
on these signatures, never on a concrete class, so internals can change freely."""
from abc import ABC, abstractmethod
from ..contracts import RawSignal, Event, Disruption, Plan, VerifierReport


class BaseAgent(ABC):
    name: str = "agent"


class Watcher(BaseAgent):          # IMPLEMENTED BY P2
    name = "watcher"

    @abstractmethod
    def scan(self, signals: list[RawSignal]) -> list[Event]:
        """Normalize signals to Events and flag anomalies (is_anomaly=True)."""


class Diagnoser(BaseAgent):        # IMPLEMENTED BY P2
    name = "diagnosis"

    @abstractmethod
    def diagnose(self, event: Event) -> Disruption:
        """Classify the anomaly, compute blast radius, score severity."""


class Planner(BaseAgent):          # IMPLEMENTED BY P3
    name = "planner"

    @abstractmethod
    def plan(self, disruption: Disruption) -> Plan:
        """Generate candidate PlanOptions (LLM reasons, solver computes)."""


class Verifier(BaseAgent):         # IMPLEMENTED BY P4
    name = "verifier"

    @abstractmethod
    def verify(self, plan: Plan, option_id: str) -> VerifierReport:
        """Red-team the chosen option; return pass/fail + confidence 0..1."""
