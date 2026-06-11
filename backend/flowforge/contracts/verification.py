from pydantic import BaseModel
from typing import Dict

class VerifierReport(BaseModel):
    confidence: float
    passed: bool
    policy_checks: Dict[str, bool]
    reason: str
