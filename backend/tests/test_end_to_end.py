import pytest
import asyncio
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.requests import ShipmentAnalysisRequest
from app.agents.orchestrator import orchestrator
from app.models.model_loader import model_registry

client = TestClient(app)

def test_request_schema_validation_success():
    """1. Request validation passes with valid parameters."""
    req = ShipmentAnalysisRequest(
        origin_unlocode="CNSHA",
        destination_unlocode="JPYOK",
        cargo_weight_mt=15.0,
        cargo_value_usd=50000.0,
        cargo_quantity=100,
        shipment_mode="Ocean",
        carrier_code="MAERSK",
        shipment_date="2026-08-25",
        baseline_eta_hours=168.0
    )
    assert req.origin_unlocode == "CNSHA"
    assert req.destination_unlocode == "JPYOK"
    assert req.cargo_weight_mt == 15.0

def test_request_schema_validation_invalid_mode():
    """Verify invalid shipment mode raises clear validation error."""
    with pytest.raises(ValueError, match="Unsupported shipment mode"):
        ShipmentAnalysisRequest(
            origin_unlocode="CNSHA",
            destination_unlocode="JPYOK",
            cargo_weight_mt=15.0,
            shipment_mode="Submarine",
            shipment_date="2026-08-25"
        )

def test_request_schema_validation_invalid_weight():
    """Verify non-positive cargo weight raises validation error."""
    with pytest.raises(ValueError):
        ShipmentAnalysisRequest(
            origin_unlocode="CNSHA",
            destination_unlocode="JPYOK",
            cargo_weight_mt=-5.0,
            shipment_date="2026-08-25"
        )

def test_post_analyze_endpoint_success():
    """Test POST /api/v1/analyze end-to-end endpoint with valid payload."""
    payload = {
        "origin_unlocode": "CNSHA",
        "destination_unlocode": "JPYOK",
        "cargo_weight_mt": 12.5,
        "cargo_value_usd": 75000.0,
        "cargo_quantity": 150,
        "shipment_mode": "Ocean",
        "carrier_code": "MAERSK",
        "shipment_date": "2026-08-25",
        "baseline_eta_hours": 144.0,
        "vendor": "VendorA",
        "fulfill_via": "Direct",
        "vendor_inco_term": "FOB"
    }

    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    res = response.json()

    # 10. Final response validity
    assert "analysis_id" in res
    assert "timestamp" in res
    assert "shipment" in res
    assert "live_conditions" in res
    assert "agents" in res
    assert "decision" in res
    assert "telemetry_provenance" in res
    assert "model_provenance" in res

    # 4. Disruption model executed
    assert res["agents"]["disruption"]["ml_model_active"] is True
    assert res["agents"]["disruption"]["disruption_probability"]["source"] == "TRAINED_MODEL"

    # 5. Route engine executed
    assert res["agents"]["route"]["agent"] == "ROUTE_AGENT"
    assert len(res["agents"]["route"]["sampled_waypoints"]) > 0

    # 6 & 7. ETA & Delay models executed
    assert res["agents"]["eta"]["ml_models_active"] is True
    assert "predicted_total_hours" in res["agents"]["eta"]

    # 8. Cost model executed
    assert res["agents"]["cost"]["ml_predicted_shipment_cost"]["source"] == "TRAINED_MODEL"

    # 9. Decision engine executed
    assert "recommended_route" in res["decision"]
    assert "recommendation_score" in res["decision"]

    # 11. Provenance metadata present
    assert "fuel_price_index" in res["telemetry_provenance"]
    assert "carrier_risk" in res["telemetry_provenance"]
    assert "geopolitical_risk" in res["telemetry_provenance"]

    # 13. No API keys appear in response text
    response_text = response.text
    assert "e9db0f9828d550c986d58f1ac85b514cf391e251" not in response_text
    assert "0e83ad5d93214e04abf37c970c32b641" not in response_text

def test_post_analyze_demo_endpoint_success():
    """Test POST /api/v1/analyze/demo deterministic endpoint."""
    response = client.post("/api/v1/analyze/demo")
    assert response.status_code == 200
    res = response.json()
    assert res["shipment"]["origin_unlocode"] == "CNSHA"
    assert res["shipment"]["destination_unlocode"] == "JPYOK"
    assert res["agents"]["disruption"]["ml_model_active"] is True

def test_controlled_fallback_on_api_failure():
    """14. Test controlled fallback behavior when external live API fails."""
    with patch("requests.get", side_effect=Exception("Connection Refused")):
        response = client.post("/api/v1/analyze/demo")
        assert response.status_code == 200
        res = response.json()
        assert res["telemetry_provenance"]["geopolitical_risk"]["status"] == "FALLBACK"
        assert res["telemetry_provenance"]["fuel_price_index"]["status"] in ["FALLBACK", "DEFAULT_FALLBACK"]
