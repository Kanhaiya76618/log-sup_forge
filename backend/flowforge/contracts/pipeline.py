"""The end-to-end record one tick produces. OWNER: P1. Returned by the API to P5."""
from pydantic import BaseModel, Field
from .disruption import Disruption
from .plan import Plan
from .verification import VerifierReport
from .execution import GateOutcome, ExecutionResult
from .audit import AuditEntry


class ResolutionRecord(BaseModel):
    disruption: Disruption
    plan: Plan
    report: VerifierReport
    gate: GateOutcome
    results: list[ExecutionResult] = Field(default_factory=list)
    audit_trail: list[AuditEntry] = Field(default_factory=list)
    pending: bool = False
