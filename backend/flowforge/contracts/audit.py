from pydantic import BaseModel
from .enums import ActionType, Decision
from .execution import ExecutionResult

class AuditEntry(BaseModel):
    timestamp: str
    disruption_id: str
    agent: str
    action: ActionType
    decision: Decision
    cost: float
    reversible: bool
    execution_result: ExecutionResult
