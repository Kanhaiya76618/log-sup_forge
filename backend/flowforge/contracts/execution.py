from pydantic import BaseModel
from typing import Any
from .enums import ActionType

class ActionRequest(BaseModel):
    action: ActionType
    target: str
    params: dict[str, Any]

class ExecutionResult(BaseModel):
    action: ActionType
    target: str
    success: bool
    detail: str
