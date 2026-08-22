"""
backend/tests/test_cargo_journey_risk.py
Comprehensive Unit Test Suite for Predictive Cargo Journey Risk & Decision Support System.
"""

import pytest
from fastapi.testclient import TestClient
from backend.flowforge.main import app
from backend.flowforge.cargo_risk.early_warning import early_warning_engine
from backend.flowforge.cargo_risk.transshipment import transshipment_engine
from backend.flowforge.cargo_risk.security_anomaly import security_anomaly_engine
from backend.flowforge.cargo_risk.dynamic_routing import dynamic_routing_engine
from backend.flowforge.cargo_risk.cascading_disruption import cascading_disruption_engine
from backend.flowforge.cargo_risk.cargo_eta import cargo_eta_engine
from backend.flowforge.cargo_risk.unified_journey_risk import unified_journey_risk_engine

client = TestClient(app)


# ---------------------------------------------------------
# 1. Early Delay Warning Engine Tests
# ---------------------------------------------------------
def test_early_delay_warning_normal():
    res = early_warning_engine.predict_early_warning(
        current_speed_knots=18.0,
        historical_speed_knots=18.0,
        scheduled_eta_hours=120.0,
        port_congestion_score=0.20,
        port_waiting_time_hours=4.0,
        weather_severity=0.15,
        distance_remaining_km=2400.0,
        strait_bottleneck_score=0.20
    )
    assert res["early_warning_level"] in ["LOW", "MEDIUM"]
    assert res["predicted_delay_hours"] >= 0.0
    assert len(res["contributing_factors"]) > 0


def test_early_delay_warning_critical_signals():
    res = early_warning_engine.predict_early_warning(
        current_speed_knots=11.0,
        historical_speed_knots=18.0,  # 39% speed loss
        scheduled_eta_hours=120.0,
        port_congestion_score=0.88,
        port_waiting_time_hours=36.0,
        weather_severity=0.85,
        distance_remaining_km=3500.0,
        strait_bottleneck_score=0.80
    )
    assert res["early_warning_level"] in ["HIGH", "CRITICAL"]
    assert res["delay_probability"] >= 0.50
    assert any("speed" in f.lower() for f in res["contributing_factors"])
    assert any("congestion" in f.lower() for f in res["contributing_factors"])


# ---------------------------------------------------------
# 2. Transshipment Connection Failure Tests
# ---------------------------------------------------------
def test_transshipment_safe_buffer():
    res = transshipment_engine.evaluate_transshipment_risk(
        predicted_inbound_arrival_hours=24.0,
        connecting_vessel_departure_hours=48.0,
        port_congestion_score=0.25,
        terminal_handling_hours=6.0,
        customs_dwell_hours=2.0
    )
    assert res["connection_status"] == "SAFE"
    assert res["buffer_hours"] >= 12.0
    assert res["transshipment_risk"] < 0.30


def test_transshipment_missed_connection():
    res = transshipment_engine.evaluate_transshipment_risk(
        predicted_inbound_arrival_hours=44.0,
        connecting_vessel_departure_hours=48.0,
        port_congestion_score=0.85,
        terminal_handling_hours=8.0,
        customs_dwell_hours=2.0
    )
    assert res["connection_status"] in ["LIKELY_TO_MISS", "MISSED"]
    assert res["buffer_hours"] < 2.0
    assert res["transshipment_risk"] >= 0.60


# ---------------------------------------------------------
# 3. Cargo Security Anomaly Tests
# ---------------------------------------------------------
def test_cargo_security_normal():
    res = security_anomaly_engine.evaluate_security_risk(
        route_deviation_km=5.0,
        unscheduled_stops=0,
        ais_gap_hours=0.0,
        dwell_time_hours=6.0,
        high_risk_zone=False,
        manifest_weight_discrepancy_pct=0.1
    )
    assert res["risk_level"] == "NORMAL"
    assert res["cargo_security_risk"] <= 0.30


def test_cargo_security_anomaly_detected():
    res = security_anomaly_engine.evaluate_security_risk(
        route_deviation_km=85.0,
        unscheduled_stops=2,
        ais_gap_hours=6.5,
        dwell_time_hours=28.0,
        high_risk_zone=True,
        manifest_weight_discrepancy_pct=8.2,
        cargo_value_usd=45000000.0
    )
    assert res["risk_level"] in ["ANOMALOUS", "HIGH_RISK"]
    assert res["cargo_security_risk"] >= 0.65
    assert len(res["anomalies"]) >= 3


# ---------------------------------------------------------
# 4. Dynamic Route Selection Tests
# ---------------------------------------------------------
def test_dynamic_route_selection():
    res = dynamic_routing_engine.recommend_routes(
        origin="Mumbai (IN)",
        destination="Yokohama (JP)"
    )
    assert "recommended_route_id" in res
    assert len(res["ranked_routes"]) == 3
    assert res["recommended_route_id"] == "ROUTE_B"
    assert len(res["selection_rationale"]) > 0


# ---------------------------------------------------------
# 5. Cascading Disruption Graph Tests
# ---------------------------------------------------------
def test_cascading_disruption_graph():
    res = cascading_disruption_engine.predict_cascade(
        initial_disruption="Destination port congestion",
        initial_delay_hours=14.0,
        destination_congestion=0.78,
        has_transshipment=True
    )
    assert res["cascade_probability"] >= 0.50
    assert len(res["affected_nodes"]) >= 4
    assert res["estimated_final_delay_hours"] >= 14.0
    assert len(res["propagation_graph"]) > 0


# ---------------------------------------------------------
# 6. Cargo-Level ETA Tests
# ---------------------------------------------------------
def test_cargo_level_eta():
    res = cargo_eta_engine.predict_cargo_eta(
        transit_duration_hours=168.0,
        port_waiting_hours=14.0,
        berth_handling_hours=8.0,
        customs_inspection_hours=4.5,
        inland_transit_hours=12.0,
        disruption_delay_hours=18.0
    )
    # Cargo arrival must be chronologically after vessel berth
    assert res["final_delivery_eta_hours"] > res["container_available_eta_hours"]
    assert res["container_available_eta_hours"] > res["vessel_eta_hours"]
    assert res["vessel_eta_hours"] > res["port_eta_hours"]
    # P90 >= P80 >= P50
    intervals = res["prediction_intervals"]
    assert intervals["p90_hours"] >= intervals["p80_hours"] >= intervals["p50_hours"]


# ---------------------------------------------------------
# 7. Unified Cargo Journey Risk Tests
# ---------------------------------------------------------
def test_unified_journey_risk_engine():
    res = unified_journey_risk_engine.evaluate_full_journey(
        shipment_id="SH-9921",
        origin="Mumbai JNPT (IN)",
        destination="Port of Yokohama (JP)",
        transshipment_port="Singapore Tuas (SG)",
        port_congestion_score=0.74,
        weather_severity=0.68
    )
    assert 0.0 <= res["overall_risk"] <= 1.0
    assert "port_congestion_risk" in res
    assert "hidden_delay_risk" in res
    assert "transshipment_risk" in res
    assert "cargo_security_risk" in res
    assert "cascade_risk" in res
    assert len(res["journey_timeline"]) == 6
    assert len(res["key_risks"]) > 0
    assert len(res["recommended_actions"]) > 0


# ---------------------------------------------------------
# 8. API Endpoint Validation Tests
# ---------------------------------------------------------
def test_all_journey_risk_endpoints():
    # 1. /predict/delay
    r1 = client.post("/api/v1/predict/delay", json={
        "current_speed_knots": 13.5,
        "historical_speed_knots": 18.0,
        "port_congestion_score": 0.74,
        "port_waiting_time_hours": 18.5,
        "weather_severity": 0.65,
        "distance_remaining_km": 2400.0
    })
    assert r1.status_code == 200
    assert "early_warning_level" in r1.json()

    # 2. /predict/transshipment
    r2 = client.post("/api/v1/predict/transshipment", json={
        "origin_vessel": "MV Tokyo Express",
        "connecting_vessel": "CMA CGM Jacques Saadé",
        "intermediate_port": "Singapore Tuas (SG)",
        "predicted_inbound_arrival_hours": 36.0,
        "connecting_vessel_departure_hours": 52.0,
        "port_congestion_score": 0.68
    })
    assert r2.status_code == 200
    assert "connection_status" in r2.json()

    # 3. /predict/security
    r3 = client.post("/api/v1/predict/security", json={
        "route_deviation_km": 45.0,
        "unscheduled_stops": 0,
        "ais_gap_hours": 0.0,
        "dwell_time_hours": 14.0
    })
    assert r3.status_code == 200
    assert "risk_level" in r3.json()

    # 4. /route/recommend
    r4 = client.post("/api/v1/route/recommend", json={
        "origin": "Mumbai (IN)",
        "destination": "Yokohama (JP)"
    })
    assert r4.status_code == 200
    assert "recommended_route_id" in r4.json()

    # 5. /predict/cascade
    r5 = client.post("/api/v1/predict/cascade", json={
        "initial_disruption": "Destination port congestion",
        "initial_delay_hours": 16.0,
        "destination_congestion": 0.74
    })
    assert r5.status_code == 200
    assert "cascade_probability" in r5.json()

    # 6. /predict/eta
    r6 = client.post("/api/v1/predict/eta", json={
        "transit_duration_hours": 168.0,
        "port_waiting_hours": 14.0,
        "berth_handling_hours": 8.0,
        "customs_inspection_hours": 4.5,
        "inland_transit_hours": 12.0,
        "disruption_delay_hours": 18.0
    })
    assert r6.status_code == 200
    assert "final_delivery_eta_hours" in r6.json()

    # 7. /shipment/risk
    r7 = client.post("/api/v1/shipment/risk", json={
        "shipment_id": "SH-4092",
        "origin": "Mumbai JNPT (IN)",
        "destination": "Port of Yokohama (JP)",
        "port_congestion_score": 0.74,
        "weather_severity": 0.68
    })
    assert r7.status_code == 200
    assert "overall_risk" in r7.json()
