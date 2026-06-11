from abc import ABC, abstractmethod
from typing import Optional, List, Dict
from ..contracts import RawSignal, Disruption, PlanOption, VerifierReport

class BaseAgent(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        pass

class Watcher(BaseAgent):
    @abstractmethod
    def scan(self, signals: List[RawSignal]) -> List[Disruption]:
        pass

class Diagnoser(BaseAgent):
    @abstractmethod
    def diagnose(self, disruption: Disruption) -> Disruption:
        pass

class Planner(BaseAgent):
    @abstractmethod
    def propose_plans(self, disruption: Disruption) -> List[PlanOption]:
        pass

class Verifier(BaseAgent):
    @abstractmethod
    def verify(self, disruption: Disruption, plans: List[PlanOption]) -> VerifierReport:
        pass
