"""Verification contracts. OWNER: P1 (filled by P4's Verifier)."""
from pydantic import BaseModel, Field


class Check(BaseModel):
    name: str
    passed: bool
    detail: str = ""


class VerifierReport(BaseModel):
    plan_id: str
    option_id: str
    passed: bool
    confidence: float = Field(ge=0.0, le=1.0)
    checks: list[Check] = Field(default_factory=list)
    risk_flags: list[str] = Field(default_factory=list)
