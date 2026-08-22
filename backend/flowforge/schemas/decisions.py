"""
Pydantic schemas for Step 2 — Decision Data Model, Human Decisions, and Preference Learning.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field, field_validator


# ── Step 2 Core Decision Data Models ──────────────────────────────────────────

ALLOWED_DECISION_STATUSES = {"accepted", "paused", "abandoned"}

ALLOWED_ABANDONMENT_REASONS = {
    "cost",
    "eta",
    "risk",
    "customer_preference",
    "port_constraint",
    "carrier_constraint",
    "capacity",
    "regulatory",
    "route_preference",
    "other",
}


class DecisionRequest(BaseModel):
    """
    Step 2 Decision Data Model input payload.
    """
    shipment_id: str = Field(..., description="Unique identifier for the shipment / analysis (e.g., SHIP-001 or ANALYSIS-XXX)")

    recommended_route: str = Field(..., description="Name / path of the recommended route")

    recommended_cost: float = Field(..., ge=0.0, description="Estimated total cost in USD")
    recommended_eta: float = Field(..., ge=0.0, description="Estimated ETA in days or hours")
    recommended_risk: float = Field(..., ge=0.0, le=1.0, description="Predicted risk / disruption probability [0, 1]")

    decision_status: str = Field(..., description="Human action: 'accepted' | 'paused' | 'abandoned'")

    abandonment_reason: Optional[str] = Field(
        None,
        description=(
            "Structured abandonment reason category: "
            "'cost' | 'eta' | 'risk' | 'customer_preference' | 'port_constraint' | "
            "'carrier_constraint' | 'capacity' | 'regulatory' | 'route_preference' | 'other'"
        )
    )

    abandonment_reason_text: Optional[str] = Field(None, description="Optional free-text explanation / custom notes")

    alternative_route: Optional[str] = Field(None, description="Selected alternative route if abandoned/rerouted")

    profile_key: str = Field("GLOBAL", description="User / Vendor / Carrier profile identifier for preference learning")
    user_id: Optional[str] = Field("ANONYMOUS_OPERATOR", description="ID of human decision maker")

    @field_validator("decision_status")
    @classmethod
    def _validate_status(cls, v: str) -> str:
        v_norm = v.lower().strip()
        if v_norm not in ALLOWED_DECISION_STATUSES:
            raise ValueError(f"decision_status must be one of {sorted(ALLOWED_DECISION_STATUSES)}, got '{v}'")
        return v_norm

    @field_validator("abandonment_reason")
    @classmethod
    def _validate_reason(cls, v: Optional[str]) -> Optional[str]:
        if v is None or not v.strip():
            return None
        v_norm = v.lower().strip()
        # Map legacy / uppercase strings if needed
        legacy_map = {
            "cost_too_high": "cost",
            "eta_too_long": "eta",
            "risk_too_high": "risk",
            "carrier_untrusted": "carrier_constraint",
        }
        v_norm = legacy_map.get(v_norm, v_norm)

        if v_norm not in ALLOWED_ABANDONMENT_REASONS:
            raise ValueError(
                f"abandonment_reason must be one of {sorted(ALLOWED_ABANDONMENT_REASONS)}, got '{v}'"
            )
        return v_norm


class Decision(BaseModel):
    """
    Step 2 Decision Data Model representation.
    """
    decision_id: str = Field(..., description="Unique ID for this decision event")
    shipment_id: str = Field(..., description="ID of the shipment evaluated")

    recommended_route: str
    recommended_cost: float
    recommended_eta: float
    recommended_risk: float

    decision_status: str
    abandonment_reason: Optional[str] = None
    abandonment_reason_text: Optional[str] = None
    alternative_route: Optional[str] = None

    profile_key: str = "GLOBAL"
    decision_timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ── Legacy / Orchestrator Compatibility Alias Schemas ──────────────────────────

class HumanDecisionRequest(BaseModel):
    """
    Backward-compatible wrapper mapping to DecisionRequest.
    """
    analysis_id: str
    action: str
    abandonment_reason: Optional[str] = None
    custom_notes: Optional[str] = None
    profile_key: str = "GLOBAL"
    user_id: Optional[str] = "ANONYMOUS_OPERATOR"


class HumanDecisionResponse(BaseModel):
    """Response returned after processing a human decision."""
    decision_id: str
    shipment_id: str
    profile_key: str
    decision_status: str
    abandonment_reason: Optional[str]
    status: str = "PROCESSED"
    learned_weights: Dict[str, float]
    weight_deltas: Dict[str, float]
    message: str
    decision_timestamp: str


class PreferenceProfileResponse(BaseModel):
    """Response showing current active preference weights for a profile."""
    profile_key: str
    risk_weight: float
    eta_weight: float
    cost_weight: float
    update_count: int
    last_updated: str


class DecisionHistoryResponse(BaseModel):
    """Response listing past decisions."""
    total_decisions: int
    profile_key: Optional[str]
    decisions: List[Dict[str, Any]]
