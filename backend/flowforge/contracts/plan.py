from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from .enums import ActionType

class PlanStep(BaseModel):
    action: ActionType
    target: str
    params: Dict[str, Any]
    est_cost: float = 0.0
    reversible: bool

class PlanOption(BaseModel):
    steps: List[PlanStep]
    total_cost: float
    est_time_min: float
    score: float
    rationale: str

    @classmethod
    def recommended(cls, options: List["PlanOption"]) -> Optional["PlanOption"]:
        if not options:
            return None
        return max(options, key=lambda o: o.score)
