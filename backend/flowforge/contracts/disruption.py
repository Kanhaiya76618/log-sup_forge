"""Diagnosis contracts. OWNER: P1 (filled by P2's Diagnoser)."""
from datetime import datetime, timezone
from uuid import uuid4
from pydantic import BaseModel, Field
from .enums import Domain, DisruptionType, Severity


class BlastRadius(BaseModel):
    affected_orders: list[str] = Field(default_factory=list)
    affected_skus: list[str] = Field(default_factory=list)
    value_at_risk: float = 0.0


class Disruption(BaseModel):
    id: str = Field(default_factory=lambda: f"dsr_{uuid4().hex[:8]}")
    domain: Domain
    type: DisruptionType
    severity: Severity
    summary: str
    blast_radius: BlastRadius = Field(default_factory=BlastRadius)
    context: dict = Field(default_factory=dict)   # structured specifics, e.g. {"blocked": ["Yokohama"]}
    source_event_id: str | None = None
    detected_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
