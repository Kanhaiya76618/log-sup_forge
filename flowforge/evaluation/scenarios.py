import pprint
from typing import Dict, Any, List, Tuple

from flowforge.data.generator import LogisticsDataGenerator
from flowforge.data.injector import DisruptionInjector
from flowforge.agents.watcher import WatcherAgent
from flowforge.agents.diagnosis import DiagnosisAgent
from flowforge.pipeline.pipeline import EventIngestionPipeline
from flowforge.data.schemas import LogisticsEvent, DiagnosisResult

def setup_scenario_baseline(seed: int = 42) -> Tuple[Dict[str, List], EventIngestionPipeline]:
    """Sets up a standardized baseline dataset and pipeline with fixed random seed."""
    generator = LogisticsDataGenerator(seed=seed)
    # Generate a small, trace-friendly dataset
    dataset = generator.generate_all(num_shipments=50, num_warehouses=3, num_suppliers=5)
    
    watcher = WatcherAgent()
    diagnosis_agent = DiagnosisAgent(dataset=dataset)
    pipeline = EventIngestionPipeline(watcher=watcher, diagnosis_agent=diagnosis_agent)
    
    return dataset, pipeline

def run_port_closure_scenario() -> Dict[str, Any]:
    """Scenario 1: Port Closure at a warehouse hub."""
    dataset, pipeline = setup_scenario_baseline()
    injector = DisruptionInjector(dataset)
    
    # Dynamically select the first warehouse to close
    target_wh = dataset["warehouses"][0]
    port_name = target_wh.name.split()[0] # e.g. "Los" or "Rotterdam"
    event = injector.inject_port_closure(port_name=port_name)
    diagnosis = pipeline.ingest_event(event)
    
    return {
        "name": f"Scenario 1: Port Closure ({target_wh.name})",
        "description": f"Port closure at {target_wh.name}, blocking routes and delaying inbound/outbound shipments.",
        "event": event,
        "diagnosis": diagnosis
    }

def run_shipment_delay_scenario() -> Dict[str, Any]:
    """Scenario 2: Single Shipment Delay (SH_00005)."""
    dataset, pipeline = setup_scenario_baseline()
    injector = DisruptionInjector(dataset)
    
    # Select first shipment
    shipment_id = dataset["shipments"][0].shipment_id
    event = injector.inject_shipment_delay(shipment_id=shipment_id, delay_hours=14.5)
    diagnosis = pipeline.ingest_event(event)
    
    return {
        "name": "Scenario 2: Shipment Delay",
        "description": f"Shipment {shipment_id} experiences a 14.5-hour delay on its active transit path.",
        "event": event,
        "diagnosis": diagnosis
    }

def run_inventory_shortage_scenario() -> Dict[str, Any]:
    """Scenario 3: Warehouse Inventory Shortage."""
    dataset, pipeline = setup_scenario_baseline()
    injector = DisruptionInjector(dataset)
    
    # Select first inventory record
    inv_record = dataset["inventory"][0]
    event = injector.inject_inventory_shortage(
        warehouse_id=inv_record.warehouse_id,
        item_id=inv_record.item_id
    )
    diagnosis = pipeline.ingest_event(event)
    
    return {
        "name": "Scenario 3: Inventory Shortage",
        "description": f"SKU {inv_record.item_id} quantity drained below safety stock at Warehouse {inv_record.warehouse_id}.",
        "event": event,
        "diagnosis": diagnosis
    }

def run_supplier_failure_scenario() -> Dict[str, Any]:
    """Scenario 4: Supplier Failure / Outage."""
    dataset, pipeline = setup_scenario_baseline()
    injector = DisruptionInjector(dataset)
    
    # Select first supplier
    supplier_id = dataset["suppliers"][0].supplier_id
    event = injector.inject_supplier_delay(supplier_id=supplier_id, delay_hours=36.0)
    diagnosis = pipeline.ingest_event(event)
    
    return {
        "name": "Scenario 4: Supplier Failure",
        "description": f"Supplier {supplier_id} experiences a critical failure leading to 36.0-hour delay on active shipments.",
        "event": event,
        "diagnosis": diagnosis
    }

def run_route_congestion_scenario() -> Dict[str, Any]:
    """Scenario 5: Route Congestion."""
    dataset, pipeline = setup_scenario_baseline()
    injector = DisruptionInjector(dataset)
    
    # Select first route
    route_id = dataset["routes"][0].route_id
    event = injector.inject_route_congestion(route_id=route_id, congestion_factor=2.5)
    diagnosis = pipeline.ingest_event(event)
    
    return {
        "name": "Scenario 5: Route Congestion",
        "description": f"Route {route_id} experiences a traffic increase, lengthening transit times by 2.5x.",
        "event": event,
        "diagnosis": diagnosis
    }

def run_all_scenarios() -> List[Dict[str, Any]]:
    """Runs all scenarios and collects results."""
    scenarios = [
        run_port_closure_scenario,
        run_shipment_delay_scenario,
        run_inventory_shortage_scenario,
        run_supplier_failure_scenario,
        run_route_congestion_scenario
    ]
    
    results = []
    for s_func in scenarios:
        res = s_func()
        results.append(res)
        
    return results

if __name__ == "__main__":
    print("=== RUNNING FLOWFORGE DEMO SCENARIOS ===")
    results = run_all_scenarios()
    for res in results:
        print("\n" + "=" * 50)
        print(f"Scenario: {res['name']}")
        print(f"Description: {res['description']}")
        print("-" * 50)
        print("Generated Event:")
        pprint.pprint(res["event"].model_dump(mode="json"))
        print("\nDiagnosis Result:")
        if res["diagnosis"]:
            pprint.pprint(res["diagnosis"].model_dump(mode="json"))
        else:
            print("No disruption diagnosed.")
