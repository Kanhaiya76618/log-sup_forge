"""Execution + gate contracts. OWNER: P1 (filled by P4's Executor + P1's Gate)."""
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from .enums import ActionType, Decision


class ActionRequest(BaseModel):
    plan_id: str
    option_id: str
    action: ActionType
    target: str
    params: dict = Field(default_factory=dict)


class ExecutionResult(BaseModel):
    action: ActionType
    target: str
    success: bool
    detail: str = ""
    executed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class GateOutcome(BaseModel):
    decision: Decision
    reason: str = ""
    requires_human: bool = False
