"""
Unit tests for MonteCarloAgent and Monte Carlo integration into FlowForge backend.
"""
import pytest
import numpy as np
from app.agents.monte_carlo_agent import monte_carlo_agent, MonteCarloInput, MonteCarloOutput
from app.models.model_loader import model_registry
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_model_registry_monte_carlo_loaded():
    """Verify Monte Carlo distributions and config are loaded in ModelRegistry."""
    status = model_registry.get_status()
    assert "monte_carlo" in status
    assert status["monte_carlo"]["loaded"] is True
    assert status["monte_carlo"]["distributions_count"] >= 3
    assert len(model_registry.monte_carlo_distributions) >= 3


def test_monte_carlo_agent_direct_simulation():
    """Test direct MonteCarloAgent.run_simulation() with explicit input."""
    inp = MonteCarloInput(
        baseline_eta_hours=168.0,
        baseline_cost_usd=5000.0,
        ml_eta_hours=147.5,
        ml_disruption_probability=0.20,
        ml_delay_probability=0.03,
        ml_cost_usd=4800.0,
        weather_hazard_level="LOW",
        wind_speed_knots=12.0,
        wave_height_m=1.2,
        port_congestion_score=0.45,
        geo_risk_score=0.20,
        simulation_count=1000,
        seed=42
    )

    out = monte_carlo_agent.run_simulation(inp)
    assert isinstance(out, MonteCarloOutput)
    assert out.simulation_count == 1000
    assert out.source == "MONTE_CARLO"
    # Legacy fields
    assert "P50" in out.eta_percentiles
    assert "P95" in out.eta_percentiles
    assert out.eta_percentiles["P50"] <= out.eta_percentiles["P95"]
    assert "P50" in out.cost_percentiles
    assert "P95" in out.cost_percentiles
    # Task 6 provenance sub-objects
    assert "p50" in out.eta and "p90" in out.eta and "p95" in out.eta and "p99" in out.eta
    assert out.eta["p50"] <= out.eta["p95"] <= out.eta["p99"]
    assert "mean" in out.cost and "p50" in out.cost and "p95" in out.cost
    assert "disruption_probability" in out.risk
    assert "deadline_miss_probability" in out.risk
    assert "budget_overrun_probability" in out.risk
    assert 0.0 <= out.deadline_miss_probability <= 1.0
    assert 0.0 <= out.budget_overrun_probability <= 1.0
    assert 0.0 <= out.composite_risk_score <= 1.0
    assert out.recommendation_confidence in ["HIGH", "MEDIUM", "LOW"]


def test_monte_carlo_agent_evaluate_helper():
    """Test evaluate helper method called by orchestrator."""
    res = monte_carlo_agent.evaluate(
        baseline_eta_hours=168.0,
        baseline_cost_usd=5000.0,
        ml_eta_hours=150.0,
        ml_disruption_probability=0.25,
        ml_delay_probability=0.05,
        ml_cost_usd=5200.0,
        weather_data={"hazard": "MODERATE", "wind_speed": 22.0, "wave_height": 2.5},
        port_congestion_score=0.50,
        geo_risk_score=0.30,
        simulation_count=1000,
        seed=42
    )

    assert "eta_percentiles" in res
    assert "cost_percentiles" in res
    assert "deadline_miss_probability" in res
    assert "budget_overrun_probability" in res
    assert "composite_risk_score" in res
    assert "recommendation_confidence" in res
    assert res["simulation_count"] == 1000


def test_post_analyze_includes_monte_carlo():
    """Test that POST /api/v1/analyze includes Monte Carlo output in response."""
    payload = {
        "origin_unlocode": "CNSHA",
        "destination_unlocode": "JPYOK",
        "cargo_weight_mt": 15.0,
        "cargo_value_usd": 120000.0,
        "cargo_quantity": 250,
        "shipment_mode": "Ocean",
        "carrier_code": "MAERSK",
        "baseline_eta_hours": 168.0,
        "vessel_speed_knots": 14.2
    }

    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "monte_carlo" in data
    mc = data["monte_carlo"]
    assert "eta_percentiles" in mc
    assert "cost_percentiles" in mc
    assert "deadline_miss_probability" in mc
    assert "budget_overrun_probability" in mc
    assert "composite_risk_score" in mc
    assert "recommendation_confidence" in mc

    # Also present in agents dict
    assert "monte_carlo" in data["agents"]
    assert data["agents"]["monte_carlo"]["source"] == "MONTE_CARLO"
    # Task 6 provenance sub-objects present in response
    assert "eta" in mc and "p50" in mc["eta"]
    assert "cost" in mc and "mean" in mc["cost"]
    assert "risk" in mc and "disruption_probability" in mc["risk"]
