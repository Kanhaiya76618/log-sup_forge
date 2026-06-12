"""Audit contract. OWNER: P1 (written by every stage; sink impl by P4)."""
from datetime import datetime, timezone
from uuid import uuid4
from pydantic import BaseModel, Field


class AuditEntry(BaseModel):
    id: str = Field(default_factory=lambda: f"aud_{uuid4().hex[:8]}")
    ts: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    stage: str
    ref_id: str
    summary: str
    payload: dict = Field(default_factory=dict)
