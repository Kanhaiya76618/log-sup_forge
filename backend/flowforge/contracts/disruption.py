from pydantic import BaseModel
from typing import List
from .enums import DisruptionType, Severity

class BlastRadius(BaseModel):
    affected_orders: List[str]
    affected_skus: List[str]
    value_at_risk: float

class Disruption(BaseModel):
    id: str
    type: DisruptionType
    severity: Severity
    summary: str
    blast_radius: BlastRadius
    status: str = "pending"
