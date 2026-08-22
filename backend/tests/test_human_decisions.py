"""
Unit and integration tests for Step 2 Decision Data Model, Abandonment Feedback, and Preference Learning Engine.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.preference_learning import preference_learning_engine
from app.database.decision_memory import decision_memory_store

client = TestClient(app)


def test_step2_decision_model_accepted():
    """Test submitting an 'accepted' DecisionRequest."""
    payload = {
        "shipment_id": "SHIP-001",
        "recommended_route": "Mumbai → Singapore → Tokyo",
        "recommended_cost": 8600.0,
        "recommended_eta": 12.4,
        "recommended_risk": 0.11,
        "decision_status": "accepted",
        "profile_key": "TEST_STEP2_ACCEPT"
    }
    response = client.post("/api/v1/decisions", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "PROCESSED"
    assert data["decision_status"] == "accepted"
    assert data["shipment_id"] == "SHIP-001"
    assert "learned_weights" in data


def test_step2_decision_model_abandoned_with_structured_reason():
    """Test submitting an 'abandoned' DecisionRequest with structured abandonment reason."""
    payload = {
        "shipment_id": "SHIP-002",
        "recommended_route": "Mumbai → Colombo → Tokyo",
        "recommended_cost": 12500.0,
        "recommended_eta": 15.0,
        "recommended_risk": 0.45,
        "decision_status": "abandoned",
        "abandonment_reason": "cost",
        "abandonment_reason_text": "Exceeds ocean freight allocation budget",
        "alternative_route": "Mumbai → Direct → Tokyo",
        "profile_key": "TEST_STEP2_ABANDON_COST"
    }
    response = client.post("/api/v1/decisions", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["decision_status"] == "abandoned"
    assert data["abandonment_reason"] == "cost"
    assert data["learned_weights"]["cost_weight"] > 0.30


def test_step2_invalid_status_rejected():
    """Test that invalid decision_status values are rejected by Pydantic validation."""
    invalid_payload = {
        "shipment_id": "SHIP-003",
        "recommended_route": "Mumbai → Tokyo",
        "recommended_cost": 5000.0,
        "recommended_eta": 10.0,
        "recommended_risk": 0.20,
        "decision_status": "INVALID_STATUS"
    }
    response = client.post("/api/v1/decisions", json=invalid_payload)
    assert response.status_code == 422  # Validation error


def test_step2_invalid_abandonment_reason_rejected():
    """Test that invalid abandonment_reason categories are rejected."""
    invalid_payload = {
        "shipment_id": "SHIP-004",
        "recommended_route": "Mumbai → Tokyo",
        "recommended_cost": 5000.0,
        "recommended_eta": 10.0,
        "recommended_risk": 0.20,
        "decision_status": "abandoned",
        "abandonment_reason": "invalid_reason_category"
    }
    response = client.post("/api/v1/decisions", json=invalid_payload)
    assert response.status_code == 422  # Validation error


def test_step2_allowed_abandonment_reasons():
    """Test all allowed structured abandonment reasons."""
    reasons = [
        "cost", "eta", "risk", "customer_preference",
        "port_constraint", "carrier_constraint", "capacity",
        "regulatory", "route_preference", "other"
    ]
    for r in reasons:
        payload = {
            "shipment_id": f"SHIP-REASON-{r}",
            "recommended_route": "Mumbai → Tokyo",
            "recommended_cost": 7500.0,
            "recommended_eta": 11.0,
            "recommended_risk": 0.15,
            "decision_status": "abandoned",
            "abandonment_reason": r,
            "profile_key": "TEST_REASONS"
        }
        resp = client.post("/api/v1/decisions", json=payload)
        assert resp.status_code == 201, f"Failed for reason '{r}': {resp.text}"
        assert resp.json()["abandonment_reason"] == r


def test_decision_history_retrieval_step2():
    """Test querying decision history log with Step 2 fields."""
    response = client.get("/api/v1/decisions/history?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "decisions" in data
    assert data["total_decisions"] >= 1
    sample = data["decisions"][0]
    assert "shipment_id" in sample
    assert "decision_status" in sample
    assert "decision_timestamp" in sample
