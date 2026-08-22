"""
API endpoints for Step 2 Decision Data Model, Human Decisions, Abandonment Reasoning, and Adaptive Preference Learning.
"""
import uuid
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.decisions import (
    DecisionRequest,
    HumanDecisionRequest,
    HumanDecisionResponse,
    PreferenceProfileResponse,
    DecisionHistoryResponse,
    ALLOWED_DECISION_STATUSES,
    ALLOWED_ABANDONMENT_REASONS,
)
from app.database.decision_memory import decision_memory_store
from app.services.preference_learning import preference_learning_engine

logger = logging.getLogger("flowforge.api.decisions")

router = APIRouter(prefix="/api/v1", tags=["Step 2 Human Decisions & Adaptive Learning"])


@router.post(
    "/decisions",
    response_model=HumanDecisionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record Step 2 Decision (accepted/paused/abandoned) & update preference learning",
)
async def submit_human_decision(payload: DecisionRequest):
    """
    Submits a human operator decision on a recommended route.

    **decision_status**: `accepted` | `paused` | `abandoned`

    **abandonment_reason** (required if status is `abandoned`):
    `cost` | `eta` | `risk` | `customer_preference` | `port_constraint` |
    `carrier_constraint` | `capacity` | `regulatory` | `route_preference` | `other`

    Applies Adaptive Preference Learning to update weights (w_risk, w_eta, w_cost).
    """
    if payload.decision_status == "abandoned" and not payload.abandonment_reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "abandonment_reason is required when decision_status is 'abandoned'. Allowed reasons: "
                + str(sorted(ALLOWED_ABANDONMENT_REASONS))
            )
        )

    decision_id = f"DECISION-{uuid.uuid4().hex[:8].upper()}"

    # 1. Update preference weights based on decision status & abandonment reason
    learned_weights, deltas = preference_learning_engine.process_decision_feedback(
        profile_key=payload.profile_key,
        decision_status=payload.decision_status,
        abandonment_reason=payload.abandonment_reason,
    )

    # 2. Persist decision log in Decision Memory
    saved = decision_memory_store.save_decision(
        decision_id=decision_id,
        shipment_id=payload.shipment_id,
        recommended_route=payload.recommended_route,
        recommended_cost=payload.recommended_cost,
        recommended_eta=payload.recommended_eta,
        recommended_risk=payload.recommended_risk,
        decision_status=payload.decision_status,
        abandonment_reason=payload.abandonment_reason,
        abandonment_reason_text=payload.abandonment_reason_text,
        alternative_route=payload.alternative_route,
        profile_key=payload.profile_key,
        user_id=payload.user_id,
    )

    msg = (
        f"Recorded decision '{payload.decision_status}' for shipment '{payload.shipment_id}'. "
        f"Learned preference weights updated for profile '{payload.profile_key}'."
    )

    return HumanDecisionResponse(
        decision_id=decision_id,
        shipment_id=payload.shipment_id,
        profile_key=payload.profile_key,
        decision_status=payload.decision_status,
        abandonment_reason=payload.abandonment_reason,
        status="PROCESSED",
        learned_weights=learned_weights,
        weight_deltas=deltas,
        message=msg,
        decision_timestamp=saved["decision_timestamp"],
    )


@router.post(
    "/decisions/legacy",
    response_model=HumanDecisionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[Legacy] Record decision using HumanDecisionRequest schema",
    include_in_schema=False,
)
async def submit_human_decision_legacy(payload: HumanDecisionRequest):
    """Backward-compatible legacy endpoint mapping old schema to DecisionRequest."""
    decision_status = payload.action.lower().strip()
    if decision_status not in ALLOWED_DECISION_STATUSES:
        decision_status = "accepted"

    # Delegate to shared logic by constructing a DecisionRequest
    bridged = DecisionRequest(
        shipment_id=payload.analysis_id,
        recommended_route="Baseline Corridor",
        recommended_cost=0.0,
        recommended_eta=0.0,
        recommended_risk=0.0,
        decision_status=decision_status,
        abandonment_reason=payload.abandonment_reason,
        abandonment_reason_text=payload.custom_notes,
        profile_key=payload.profile_key,
        user_id=payload.user_id,
    )
    return await submit_human_decision(bridged)


@router.get(
    "/decisions/history",
    response_model=DecisionHistoryResponse,
    summary="Query human decision history log",
)
async def get_decision_history(
    profile_key: Optional[str] = Query(None, description="Filter by profile key (e.g. vendor ID or GLOBAL)"),
    limit: int = Query(50, ge=1, le=500),
):
    history = decision_memory_store.get_decision_history(profile_key=profile_key, limit=limit)
    return DecisionHistoryResponse(
        total_decisions=len(history),
        profile_key=profile_key,
        decisions=history,
    )


@router.post(
    "/decisions/clear",
    summary="Clear all human decision history records from SQLite decision memory",
)
@router.delete(
    "/decisions/history",
    summary="Delete human decision history records",
)
async def clear_decision_history(
    profile_key: Optional[str] = Query(None, description="Optional profile key to clear only specific profile decisions")
):
    count = decision_memory_store.clear_decision_history(profile_key=profile_key)
    return {
        "status": "SUCCESS",
        "deleted_count": count,
        "message": f"Cleared {count} human decision records from decision memory."
    }


@router.get(
    "/preferences",
    response_model=PreferenceProfileResponse,
    summary="Query active adaptive preference weights for a profile",
)
async def get_preference_weights(
    profile_key: str = Query("GLOBAL", description="Profile identifier (e.g. VendorA, CarrierX, or GLOBAL)")
):
    pref = decision_memory_store.get_preference_weights(profile_key)
    return PreferenceProfileResponse(
        profile_key=pref["profile_key"],
        risk_weight=pref["risk_weight"],
        eta_weight=pref["eta_weight"],
        cost_weight=pref["cost_weight"],
        update_count=pref["update_count"],
        last_updated=pref["last_updated"],
    )


@router.post(
    "/preferences/reset",
    response_model=PreferenceProfileResponse,
    summary="Reset adaptive preference weights to baseline default (35% Risk, 35% ETA, 30% Cost)",
)
async def reset_preference_weights(
    profile_key: str = Query("GLOBAL", description="Profile identifier to reset")
):
    preference_learning_engine.reset_preferences(profile_key)
    full_pref = decision_memory_store.get_preference_weights(profile_key)
    return PreferenceProfileResponse(
        profile_key=full_pref["profile_key"],
        risk_weight=full_pref["risk_weight"],
        eta_weight=full_pref["eta_weight"],
        cost_weight=full_pref["cost_weight"],
        update_count=full_pref["update_count"],
        last_updated=full_pref["last_updated"],
    )
