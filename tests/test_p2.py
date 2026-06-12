import pytest
from datetime import datetime, timedelta

from flowforge.data.schemas import (
    Location,
    Shipment,
    ShipmentStatus,
    DisruptionType,
    SeverityLevel,
    RouteStatus
)
from flowforge.data.generator import LogisticsDataGenerator
from flowforge.data.injector import DisruptionInjector
from flowforge.agents.watcher import WatcherAgent
from flowforge.agents.diagnosis import DiagnosisAgent
from flowforge.analysis.severity import SeverityEngine
from flowforge.analysis.impact import BlastRadiusEngine
from flowforge.pipeline.pipeline import EventIngestionPipeline

@pytest.fixture
def base_dataset():
    # Setup data generator with seed for repeatability
    gen = LogisticsDataGenerator(seed=42)
    return gen.generate_all(num_shipments=20, num_warehouses=2, num_suppliers=3)

def test_data_generation(base_dataset):
    assert len(base_dataset["suppliers"]) > 0
    assert len(base_dataset["warehouses"]) > 0
    assert len(base_dataset["routes"]) > 0
    assert len(base_dataset["inventory"]) > 0
    assert len(base_dataset["shipments"]) == 20
    
    # Check reproducibility
    gen1 = LogisticsDataGenerator(seed=123)
    data1 = gen1.generate_all(num_shipments=5)
    
    gen2 = LogisticsDataGenerator(seed=123)
    data2 = gen2.generate_all(num_shipments=5)
    
    assert data1["shipments"][0].shipment_id == data2["shipments"][0].shipment_id
    assert data1["shipments"][0].value == data2["shipments"][0].value

def test_inject_shipment_delay(base_dataset):
    injector = DisruptionInjector(base_dataset)
    shipment = base_dataset["shipments"][0]
    original_arrival = shipment.expected_arrival
    original_delay = shipment.delay_hours
    
    event = injector.inject_shipment_delay(shipment.shipment_id, 5.0)
    
    assert event.event_type == DisruptionType.SHIPMENT_DELAY.value
    assert event.entity_id == shipment.shipment_id
    assert shipment.status == ShipmentStatus.DELAYED
    assert shipment.delay_hours == original_delay + 5.0
    assert shipment.expected_arrival == original_arrival + timedelta(hours=5.0)

def test_inject_port_closure(base_dataset):
    injector = DisruptionInjector(base_dataset)
    warehouse_name = base_dataset["warehouses"][0].name
    
    event = injector.inject_port_closure(warehouse_name)
    
    assert event.event_type == DisruptionType.PORT_CLOSURE.value
    assert event.properties["port_name"] == warehouse_name
    assert len(event.properties["blocked_routes"]) > 0

def test_watcher_detection(base_dataset):
    injector = DisruptionInjector(base_dataset)
    watcher = WatcherAgent()
    
    shipment = base_dataset["shipments"][0]
    event = injector.inject_shipment_delay(shipment.shipment_id, 10.0)
    
    disruption = watcher.analyze_event(event)
    assert disruption is not None
    assert disruption.event_type == DisruptionType.SHIPMENT_DELAY
    assert disruption.entity_id == shipment.shipment_id
    assert disruption.details["delay_hours"] == 10.0
    assert "explanation" in disruption.details

def test_severity_engine():
    engine = SeverityEngine()
    
    # Low score
    score_low, level_low = engine.evaluate_severity(delay_hours=1.0, affected_orders=1, inventory_risk_factor=0.0)
    assert level_low == SeverityLevel.LOW
    
    # High score
    score_high, level_high = engine.evaluate_severity(delay_hours=24.0, affected_orders=100, inventory_risk_factor=1.0)
    assert level_high == SeverityLevel.CRITICAL

def test_blast_radius_engine(base_dataset):
    injector = DisruptionInjector(base_dataset)
    watcher = WatcherAgent()
    blast_engine = BlastRadiusEngine()
    
    shipment = base_dataset["shipments"][0]
    event = injector.inject_shipment_delay(shipment.shipment_id, 12.0)
    disruption = watcher.analyze_event(event)
    
    blast = blast_engine.calculate_impact(disruption, base_dataset)
    
    assert blast.financial_risk == shipment.value
    assert shipment.shipment_id in blast.affected_shipments
    assert blast.affected_orders_count >= 1

def test_pipeline_flow(base_dataset):
    watcher = WatcherAgent()
    diagnosis_agent = DiagnosisAgent(dataset=base_dataset)
    pipeline = EventIngestionPipeline(watcher=watcher, diagnosis_agent=diagnosis_agent)
    
    injector = DisruptionInjector(base_dataset)
    shipment = base_dataset["shipments"][0]
    
    event = injector.inject_shipment_delay(shipment.shipment_id, 15.0)
    diagnosis = pipeline.ingest_event(event)
    
    assert diagnosis is not None
    assert diagnosis.disruption_type == DisruptionType.SHIPMENT_DELAY
    assert diagnosis.affected_orders >= 1
    assert diagnosis.recommended_context["reroute_required"] is False
