import pytest
from fastapi.testclient import TestClient
from backend.flowforge.main import app
from backend.flowforge.models_ml.inference_service import disruption_ml_service
from backend.flowforge.solver.optimizer import route_optimizer
from backend.flowforge.solver.simulate import digital_twin_simulator
from backend.flowforge.agents.orchestrator import orchestrator

client = TestClient(app)


def test_ml_model_loaded():
    assert disruption_ml_service.is_loaded is True
    assert len(disruption_ml_service.features) >= 3


def test_ml_prediction():
    res = disruption_ml_service.predict(
        operational_stress=0.82,
        geo_port_risk=0.74,
        port_congestion_score=0.68
    )
    assert "disruption_probability" in res
    assert "disruption_probability_percent" in res
    assert res["prediction"] in ["DISRUPTION", "NO DISRUPTION"]
    assert res["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]


def test_route_optimizer():
    routes = route_optimizer.solve_pareto_routes(origin_code="BOM", dest_code="YOK")
    assert len(routes) == 3
    recommended = [r for r in routes if r["recommended"]]
    assert len(recommended) == 1
    assert recommended[0]["scenario_id"] == "SCENARIO_B"


def test_digital_twin_simulation():
    sim = digital_twin_simulator.run_simulation(
        base_delay_days=4.2,
        wave_height_m=2.8,
        port_dwell_hours=31.0,
        route_scenario="SCENARIO_B"
    )
    assert sim["samples_executed"] == 500
    assert "sla_confidence_percent" in sim
    assert len(sim["histogram_curve"]) > 0
    assert "p50_delay_days" in sim["percentiles"]


def test_orchestrator_pipeline():
    result = orchestrator.run_pipeline(
        operational_stress=0.82,
        geo_port_risk=0.74,
        port_congestion_score=0.68,
        wave_height_m=2.8,
        wind_speed_kmh=45.0
    )
    assert result["pipeline_status"] == "COMPLETED"
    assert result["agents_executed"] == 9
    assert len(result["agent_steps"]) == 9
    assert result["recommended_scenario"]["scenario_id"] == "SCENARIO_B"


def test_api_endpoints():
    r1 = client.get("/health")
    assert r1.status_code == 200
    assert r1.json()["status"] == "healthy"

    r2 = client.post("/api/v1/disruptions/diagnose", json={
        "operational_stress": 0.82,
        "geo_port_risk": 0.74,
        "port_congestion_score": 0.68
    })
    assert r2.status_code == 200
    assert "disruption_probability" in r2.json()

    r3 = client.post("/api/v1/agents/run", json={
        "operational_stress": 0.82,
        "geo_port_risk": 0.74,
        "port_congestion_score": 0.68
    })
    assert r3.status_code == 200
    assert r3.json()["agents_executed"] == 9

    r4 = client.post("/api/v1/simulations/monte-carlo", json={
        "base_delay_days": 4.2,
        "wave_height_m": 2.8,
        "port_dwell_hours": 31.0,
        "scenario_id": "SCENARIO_B"
    })
    assert r4.status_code == 200
    assert r4.json()["samples_executed"] == 500
