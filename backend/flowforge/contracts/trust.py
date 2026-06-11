# File: backend/flowforge/contracts/trust.py

from pydantic import BaseModel, Field
from typing import Dict, Optional


class EntityTrust(BaseModel):
    """
    Represents the trust profile of a single entity (agent, user, connector).

    Attributes:
        entity_id:       Unique identifier for the entity.
        role:            Role label, e.g. "planner", "verifier", "connector".
        trust_score:     0.0 – 1.0 reliability score for this entity.
        failure_count:   Number of recorded failures this entity has caused.
        notes:           Optional free-text notes about this entity's history.
    """
    entity_id: str
    role: str
    trust_score: float = Field(default=1.0, ge=0.0, le=1.0)
    failure_count: int = Field(default=0, ge=0)
    notes: Optional[str] = None


class SystemTrustProfile(BaseModel):
    """
    Aggregated trust picture for the entire pipeline run.

    Attributes:
        entities:            Map of entity_id -> EntityTrust for all participants.
        historical_success:  Fraction of past pipeline runs that succeeded (0–1).
        risk_factor:         Operator-supplied risk multiplier (0–1, lower = riskier).
        min_threshold:       Minimum composite trust score required to pass auto-approval.
    """
    entities: Dict[str, EntityTrust] = Field(default_factory=dict)
    historical_success: float = Field(default=1.0, ge=0.0, le=1.0)
    risk_factor: float = Field(default=1.0, ge=0.0, le=1.0)
    min_threshold: float = Field(default=0.75, ge=0.0, le=1.0)

    @property
    def composite_score(self) -> float:
        """
        Weighted composite trust score combining:
          - Average entity trust (50%)
          - Historical success rate (30%)
          - Risk factor (20%)
        """
        if self.entities:
            avg_entity = sum(e.trust_score for e in self.entities.values()) / len(self.entities)
        else:
            avg_entity = 1.0

        return round(
            (avg_entity * 0.5)
            + (self.historical_success * 0.3)
            + (self.risk_factor * 0.2),
            4,
        )

    def is_trusted(self) -> bool:
        """Returns True if the composite score meets the minimum threshold."""
        return self.composite_score >= self.min_threshold
