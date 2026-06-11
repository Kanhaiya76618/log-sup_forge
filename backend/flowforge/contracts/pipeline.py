from pydantic import BaseModel
from typing import List, Optional
from .disruption import Disruption
from .plan import PlanOption
from .verification import VerifierReport
from .enums import Decision
from .execution import ExecutionResult

class PipelineRecord(BaseModel):
    disruption: Disruption
    plans: List[PlanOption] = []
    verification: Optional[VerifierReport] = None
    decision: Optional[Decision] = None
    results: List[ExecutionResult] = []

    @property
    def gate(self):
        class GateState:
            def __init__(self, decision: Optional[Decision]):
                self.decision = decision
        return GateState(self.decision)

    @property
    def plan(self):
        class PlanState:
            def __init__(self, plans: List[PlanOption]):
                self.plans = plans
            def recommended(self) -> Optional[PlanOption]:
                return PlanOption.recommended(self.plans)
        return PlanState(self.plans)
