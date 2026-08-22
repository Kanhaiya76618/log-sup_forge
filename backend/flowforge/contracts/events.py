"""Ingestion contracts. OWNER: P1."""
from datetime import datetime, timezone
from uuid import uuid4
from pydantic import BaseModel, Field
from .enums import Domain


def _now() -> datetime:
    return datetime.now(timezone.utc)


class RawSignal(BaseModel):
    """What a Connector emits from a domain data source. P2 produces these."""
    source: str
    domain: Domain
    payload: dict = Field(default_factory=dict)
    ts: datetime = Field(default_factory=_now)


class Event(BaseModel):
    """A normalized signal, possibly flagged as an anomaly by the Watcher (P2)."""
    id: str = Field(default_factory=lambda: f"evt_{uuid4().hex[:8]}")
    domain: Domain
    kind: str
    data: dict = Field(default_factory=dict)
    is_anomaly: bool = False
    ts: datetime = Field(default_factory=_now)
