import time
import random
from datetime import datetime
from typing import Dict, List, Any

from flowforge.data.generator import LogisticsDataGenerator
from flowforge.data.injector import DisruptionInjector
from flowforge.agents.watcher import WatcherAgent
from flowforge.agents.diagnosis import DiagnosisAgent
from flowforge.pipeline.pipeline import EventIngestionPipeline
from flowforge.data.schemas import LogisticsEvent, DisruptionType, SeverityLevel, RouteStatus, ShipmentStatus
from flowforge.evaluation.metrics import compute_evaluation_report

class EvaluationRunner:
    def __init__(self, seed: int = 100):
        self.rng = random.Random(seed)
        self.seed = seed

    def _get_random_entity(self, dataset: Dict[str, List], entity_type: str) -> Any:
        entities = dataset.get(entity_type, [])
        return self.rng.choice(entities) if entities else None

    def run_eval(self, num_trials: int = 30) -> Dict[str, Any]:
        """Runs a series of randomized trials to evaluate the perception layer performance."""
        trials = []
        
        # We re-generate the dataset every few trials to prevent total supply chain decay
        generator = LogisticsDataGenerator(seed=self.seed)
        dataset = generator.generate_all(num_shipments=100, num_warehouses=5, num_suppliers=8)
        injector = DisruptionInjector(dataset)
        
        watcher = WatcherAgent()
        diagnosis_agent = DiagnosisAgent(dataset=dataset)
        pipeline = EventIngestionPipeline(watcher=watcher, diagnosis_agent=diagnosis_agent)
        
        for i in range(num_trials):
            # Regenerate dataset every 10 trials to keep baseline clean
            if i > 0 and i % 10 == 0:
                dataset = generator.generate_all(num_shipments=100, num_warehouses=5, num_suppliers=8)
                injector = DisruptionInjector(dataset)
                diagnosis_agent.dataset = dataset
            
            injected = self.rng.random() < 0.8  # 80% chance of injecting a disruption
            
            event = None
            expected_type = "NONE"
            expected_severity = "LOW"
            
            if injected:
                dtype = self.rng.choice(list(DisruptionType))
                expected_type = dtype.value
                
                try:
                    if dtype == DisruptionType.SHIPMENT_DELAY:
                        shipment = self._get_random_entity(dataset, "shipments")
                        delay = round(self.rng.uniform(3.0, 20.0), 1)
                        event = injector.inject_shipment_delay(shipment.shipment_id, delay)
                        # Ground truth heuristic
                        expected_severity = "MEDIUM" if delay < 12.0 else "HIGH"
                        
                    elif dtype == DisruptionType.PORT_CLOSURE:
                        # Pick a port name that actually exists in warehouses/suppliers
                        entity = self.rng.choice(dataset.get("warehouses", []) + dataset.get("suppliers", []))
                        port_name = entity.name.split()[0]
                        event = injector.inject_port_closure(port_name)
                        expected_severity = "CRITICAL"
                        
                    elif dtype == DisruptionType.VEHICLE_BREAKDOWN:
                        # Pick a shipment that is IN_TRANSIT
                        transit_shipments = [s for s in dataset.get("shipments", []) if s.status == ShipmentStatus.IN_TRANSIT]
                        if transit_shipments:
                            shipment = self.rng.choice(transit_shipments)
                            event = injector.inject_vehicle_breakdown(shipment.shipment_id)
                            expected_severity = "MEDIUM"
                        else:
                            injected = False
                            
                    elif dtype == DisruptionType.INVENTORY_SHORTAGE:
                        record = self._get_random_entity(dataset, "inventory")
                        if record:
                            event = injector.inject_inventory_shortage(record.warehouse_id, record.item_id)
                            expected_severity = "HIGH"
                        else:
                            injected = False
                            
                    elif dtype == DisruptionType.SUPPLIER_DELAY:
                        supplier = self._get_random_entity(dataset, "suppliers")
                        if supplier:
                            delay = round(self.rng.uniform(12.0, 48.0), 1)
                            event = injector.inject_supplier_delay(supplier.supplier_id, delay)
                            expected_severity = "HIGH" if delay > 24 else "MEDIUM"
                        else:
                            injected = False
                            
                    elif dtype == DisruptionType.ROUTE_CONGESTION:
                        route = self._get_random_entity(dataset, "routes")
                        if route:
                            event = injector.inject_route_congestion(route.route_id, congestion_factor=2.0)
                            expected_severity = "MEDIUM"
                        else:
                            injected = False
                except Exception as e:
                    # In case of injection failure (e.g. no entities found), treat as non-injected
                    injected = False
                    
            if not injected or not event:
                # Normal operational update event
                shipment = self._get_random_entity(dataset, "shipments")
                if shipment:
                    event = LogisticsEvent(
                        event_id=f"EVT_OK_{i:03d}",
                        timestamp=datetime.utcnow(),
                        event_type="SHIPMENT_STATUS_UPDATE",
                        entity_id=shipment.shipment_id,
                        properties={
                            "status": shipment.status.value,
                            "current_location": shipment.current_location.model_dump(),
                            "delay_hours": shipment.delay_hours
                        }
                    )
                expected_type = "NONE"
                expected_severity = "LOW"
                injected = False

            # Run event ingestion and measure performance
            start_time = time.perf_counter()
            diagnosis = pipeline.ingest_event(event)
            end_time = time.perf_counter()
            
            latency_ms = (end_time - start_time) * 1000.0
            
            detected = diagnosis is not None
            diagnosed_type = diagnosis.disruption_type.value if diagnosis else "NONE"
            diagnosed_severity = diagnosis.severity.value if diagnosis else "LOW"
            
            trials.append({
                "injected": injected,
                "detected": detected,
                "expected_type": expected_type,
                "diagnosed_type": diagnosed_type,
                "expected_severity": expected_severity,
                "diagnosed_severity": diagnosed_severity,
                "latency_ms": latency_ms
            })
            
        return compute_evaluation_report(trials)

if __name__ == "__main__":
    print("=== RUNNING FLOWFORGE EVALUATION FRAMEWORK ===")
    runner = EvaluationRunner(seed=42)
    report = runner.run_eval(num_trials=40)
    
    print("\n" + "=" * 50)
    print("EVALUATION PERFORMANCE REPORT")
    print("=" * 50)
    for k, v in report.items():
        name = k.replace("_", " ").title()
        if "Accuracy" in name or "Precision" in name or "Recall" in name or "F1" in name:
            print(f"{name:<40}: {v*100:.2f}%")
        elif "Time" in name:
            print(f"{name:<40}: {v:.2f} ms")
        else:
            print(f"{name:<40}: {v}")
    print("=" * 50)
