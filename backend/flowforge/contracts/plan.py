"""Planning contracts. OWNER: P1 (filled by P3's Planner + solver)."""
from uuid import uuid4
from pydantic import BaseModel, Field
from .enums import ActionType


class PlanStep(BaseModel):
    action: ActionType
    target: str
    params: dict = Field(default_factory=dict)
    est_cost: float = 0.0
    reversible: bool = True


class PlanOption(BaseModel):
    id: str = Field(default_factory=lambda: f"opt_{uuid4().hex[:6]}")
    steps: list[PlanStep] = Field(default_factory=list)
    total_cost: float = 0.0
    est_time_min: float = 0.0
    score: float = 0.0
    rationale: str = ""


class Plan(BaseModel):
    id: str = Field(default_factory=lambda: f"pln_{uuid4().hex[:8]}")
    disruption_id: str
    options: list[PlanOption] = Field(default_factory=list)
    recommended_option_id: str | None = None
    created_by: str = "planner"

    def recommended(self) -> PlanOption | None:
        return next((o for o in self.options if o.id == self.recommended_option_id), None)
