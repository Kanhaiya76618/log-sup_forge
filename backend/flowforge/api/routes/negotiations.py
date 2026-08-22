"""
backend/flowforge/api/routes/negotiations.py
Negotiation Support — Abandonment Reason Log.

Captures a structured audit trail of decisions made by stakeholders when
voyage actions (reroutes, waypoints, checkpoint holds) are abandoned, paused,
or skipped. Multiple parties can propose, counter-propose, and record final
outcomes, forming an immutable negotiation ledger per voyage.

Endpoints:
  POST /api/v1/negotiations/{voyage_id}/decisions      — Log a new decision event
  GET  /api/v1/negotiations/{voyage_id}/decisions      — List all decisions for a voyage
  GET  /api/v1/negotiations/{voyage_id}/decisions/{id} — Retrieve a single decision
  PATCH /api/v1/negotiations/{voyage_id}/decisions/{id}/override — Override / escalate
  GET  /api/v1/negotiations/summary                    — Cross-voyage summary stats
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/negotiations", tags=["Negotiations"])

# ---------------------------------------------------------------------------
# In-memory store — structured for a 1:1 swap with MongoDB later
# Key: voyage_id -> list of DecisionRecord dicts
# ---------------------------------------------------------------------------
_DECISION_LOG: Dict[str, List[Dict[str, Any]]] = {}


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

ActionType = Literal["ABANDONED", "PAUSED", "SKIPPED"]
OutcomeType = Literal["PENDING", "OVERRIDDEN", "ACCEPTED", "ESCALATED"]


class DecisionRequest(BaseModel):
    """Payload sent by a stakeholder to log a decision event."""

    action_type: ActionType = Field(
        ...,
        description="Type of decision: ABANDONED (reroute rejected), PAUSED (checkpoint held), SKIPPED (waypoint bypassed).",
        examples=["ABANDONED"]
    )
    target: str = Field(
        ...,
        description="The item being decided upon, e.g. 'Reroute SH-2049 via Sunda Strait', 'Checkpoint CP-04 hold', 'Singapore hub stop'.",
        examples=["Dynamic reroute via Sunda Strait bypass"]
    )
    reason: str = Field(
        ...,
        min_length=10,
        description="Mandatory human-readable justification for the decision (min 10 chars).",
        examples=["Port authority denied entry due to cargo manifest discrepancy in Yokohama customs."]
    )
    decided_by: str = Field(
        ...,
        description="Identity of the stakeholder recording this decision (role, name, or system ID).",
        examples=["Capt. Anand Mehta — CSCL Globe Supermax"]
    )
    checkpoint_id: Optional[str] = Field(
        None,
        description="Optional: the checkpoint ID this decision applies to.",
        examples=["CP-04"]
    )
    proposed_alternative: Optional[str] = Field(
        None,
        description="Optional: alternative action proposed in place of the abandoned one.",
        examples=["Hold at Singapore anchorage until manifest cleared — ETA +18h"]
    )
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = Field(
        "MEDIUM",
        description="Impact severity of this abandonment on the voyage."
    )


class OverrideRequest(BaseModel):
    """Payload for overriding / escalating an existing decision."""

    override_by: str = Field(
        ...,
        description="Identity of the person overriding the decision.",
        examples=["Ops Director — FlowForge Command Center"]
    )
    override_reason: str = Field(
        ...,
        min_length=10,
        description="Justification for the override.",
        examples=["Customs clearance received. Reinstating original Yokohama direct route."]
    )
    new_outcome: OutcomeType = Field(
        "OVERRIDDEN",
        description="Updated outcome status after override."
    )


class DecisionRecord(BaseModel):
    """Full persisted record of a negotiation decision event."""

    id: str
    voyage_id: str
    action_type: ActionType
    target: str
    reason: str
    decided_by: str
    checkpoint_id: Optional[str]
    proposed_alternative: Optional[str]
    severity: str
    outcome: OutcomeType
    timestamp_utc: str
    # Override fields — only populated after PATCH /override
    override_by: Optional[str] = None
    override_reason: Optional[str] = None
    override_timestamp_utc: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _now_utc() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _get_log(voyage_id: str) -> List[Dict[str, Any]]:
    return _DECISION_LOG.setdefault(voyage_id, [])


def _find_decision(voyage_id: str, decision_id: str) -> Dict[str, Any]:
    for record in _get_log(voyage_id):
        if record["id"] == decision_id:
            return record
    raise HTTPException(
        status_code=404,
        detail=f"Decision '{decision_id}' not found for voyage '{voyage_id}'."
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/{voyage_id}/decisions", response_model=DecisionRecord, status_code=201)
def log_decision(voyage_id: str, payload: DecisionRequest):
    """
    Log a new abandonment/pause/skip decision for a voyage.

    Called when a stakeholder (captain, ops manager, port authority agent)
    decides to abandon a proposed reroute, pause at a checkpoint, or skip
    a planned waypoint stop — and must record a traceable reason.
    """
    record: Dict[str, Any] = {
        "id": f"DEC-{uuid.uuid4().hex[:8].upper()}",
        "voyage_id": voyage_id,
        "action_type": payload.action_type,
        "target": payload.target,
        "reason": payload.reason,
        "decided_by": payload.decided_by,
        "checkpoint_id": payload.checkpoint_id,
        "proposed_alternative": payload.proposed_alternative,
        "severity": payload.severity,
        "outcome": "PENDING",
        "timestamp_utc": _now_utc(),
        "override_by": None,
        "override_reason": None,
        "override_timestamp_utc": None,
    }
    _get_log(voyage_id).append(record)
    return record


@router.get("/{voyage_id}/decisions", response_model=List[DecisionRecord])
def list_decisions(
    voyage_id: str,
    action_type: Optional[ActionType] = None,
    outcome: Optional[OutcomeType] = None,
    severity: Optional[str] = None,
):
    """
    List all negotiation decision records for a voyage, with optional filters.

    Supports filtering by action_type, outcome, and severity for dashboard views.
    """
    log = _get_log(voyage_id)
    results = log

    if action_type:
        results = [r for r in results if r["action_type"] == action_type]
    if outcome:
        results = [r for r in results if r["outcome"] == outcome]
    if severity:
        results = [r for r in results if r["severity"] == severity.upper()]

    # Newest first
    return sorted(results, key=lambda r: r["timestamp_utc"], reverse=True)


@router.get("/{voyage_id}/decisions/{decision_id}", response_model=DecisionRecord)
def get_decision(voyage_id: str, decision_id: str):
    """Retrieve a single decision record by ID."""
    return _find_decision(voyage_id, decision_id)


@router.patch("/{voyage_id}/decisions/{decision_id}/override", response_model=DecisionRecord)
def override_decision(voyage_id: str, decision_id: str, payload: OverrideRequest):
    """
    Override or escalate an existing decision.

    Used when a higher-authority stakeholder reverses a field-level abandonment
    (e.g., ops director reinstates a reroute after port clearance is granted).
    Creates an auditable override trail without deleting the original decision.
    """
    record = _find_decision(voyage_id, decision_id)
    record["outcome"] = payload.new_outcome
    record["override_by"] = payload.override_by
    record["override_reason"] = payload.override_reason
    record["override_timestamp_utc"] = _now_utc()
    return record


@router.get("/summary")
def negotiation_summary():
    """
    Cross-voyage summary of all negotiation decisions in the current session.

    Returns aggregate counts by action_type, outcome, and severity, useful
    for the command center dashboard to understand abandonment patterns.
    """
    all_records = [r for records in _DECISION_LOG.values() for r in records]

    if not all_records:
        return {
            "total_decisions": 0,
            "by_action_type": {"ABANDONED": 0, "PAUSED": 0, "SKIPPED": 0},
            "by_outcome": {"PENDING": 0, "OVERRIDDEN": 0, "ACCEPTED": 0, "ESCALATED": 0},
            "by_severity": {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0},
            "voyages_with_decisions": 0,
            "most_common_reason_keywords": [],
        }

    by_action: Dict[str, int] = {"ABANDONED": 0, "PAUSED": 0, "SKIPPED": 0}
    by_outcome: Dict[str, int] = {"PENDING": 0, "OVERRIDDEN": 0, "ACCEPTED": 0, "ESCALATED": 0}
    by_severity: Dict[str, int] = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}

    for r in all_records:
        by_action[r["action_type"]] = by_action.get(r["action_type"], 0) + 1
        by_outcome[r["outcome"]] = by_outcome.get(r["outcome"], 0) + 1
        by_severity[r["severity"]] = by_severity.get(r["severity"], 0) + 1

    # Simple keyword frequency from reason texts
    all_reasons = " ".join(r["reason"].lower() for r in all_records)
    stop_words = {"the", "a", "an", "to", "due", "for", "in", "at", "of", "and", "is", "was", "has"}
    word_freq: Dict[str, int] = {}
    for word in all_reasons.split():
        clean = word.strip(".,;:()\"'")
        if len(clean) > 4 and clean not in stop_words:
            word_freq[clean] = word_freq.get(clean, 0) + 1
    top_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:5]

    return {
        "total_decisions": len(all_records),
        "by_action_type": by_action,
        "by_outcome": by_outcome,
        "by_severity": by_severity,
        "voyages_with_decisions": len(_DECISION_LOG),
        "most_common_reason_keywords": [kw for kw, _ in top_keywords],
    }
