import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from flowforge.data.schemas import (
    Location,
    Supplier,
    Warehouse,
    Inventory,
    Route,
    RouteStatus,
    Shipment,
    ShipmentStatus,
    LogisticsEvent,
    DisruptionType
)

class DisruptionInjector:
    def __init__(self, dataset: Dict[str, List]):
        """
        Initializes the injector with a reference to the active dataset.
        Modifications to the dataset happen in-place.
        """
        self.dataset = dataset

    def _create_event(self, event_type: str, entity_id: str, properties: Dict) -> LogisticsEvent:
        """Helper to create a new LogisticsEvent."""
        return LogisticsEvent(
            event_id=f"EVT_{uuid.uuid4().hex[:8].upper()}",
            timestamp=datetime.utcnow(),
            event_type=event_type,
            entity_id=entity_id,
            properties=properties
        )

    def inject_shipment_delay(self, shipment_id: str, delay_hours: float) -> LogisticsEvent:
        """Injects a delay into a specific shipment and returns the event."""
        shipments = self.dataset.get("shipments", [])
        shipment = next((s for s in shipments if s.shipment_id == shipment_id), None)
        
        if not shipment:
            raise ValueError(f"Shipment {shipment_id} not found in dataset.")
            
        shipment.status = ShipmentStatus.DELAYED
        shipment.delay_hours += delay_hours
        shipment.expected_arrival += timedelta(hours=delay_hours)
        
        return self._create_event(
            event_type=DisruptionType.SHIPMENT_DELAY.value,
            entity_id=shipment_id,
            properties={
                "delay_hours": delay_hours,
                "expected_arrival": shipment.expected_arrival.isoformat(),
                "new_status": shipment.status.value,
                "value": shipment.value,
                "destination": shipment.destination.name
            }
        )

    def inject_port_closure(self, port_name: str) -> LogisticsEvent:
        """
        Closes a port/hub (warehouse or supplier location matching the name).
        Blocks all routes connected to this port and delays all shipments passing through it.
        """
        # Find matches in warehouses
        warehouses = self.dataset.get("warehouses", [])
        wh = next((w for w in warehouses if port_name.lower() in w.name.lower()), None)
        
        # Find matches in suppliers
        suppliers = self.dataset.get("suppliers", [])
        sup = next((s for s in suppliers if port_name.lower() in s.name.lower()), None)
        
        target_name = None
        target_loc = None
        entity_id = "PORT"
        
        if wh:
            target_name = wh.name
            target_loc = wh.location
            entity_id = wh.warehouse_id
        elif sup:
            target_name = sup.name
            target_loc = sup.location
            entity_id = sup.supplier_id
        else:
            raise ValueError(f"Port / Location matching '{port_name}' not found.")
            
        # Block routes
        routes = self.dataset.get("routes", [])
        affected_route_ids = []
        for route in routes:
            # Check if route starts or ends at target location
            if (route.origin.name == target_name) or (route.destination.name == target_name):
                route.status = RouteStatus.BLOCKED
                affected_route_ids.append(route.route_id)
                
        # Delay shipments destined for or currently at this location
        shipments = self.dataset.get("shipments", [])
        affected_shipment_ids = []
        delay_added = 48.0  # standard closure delay
        
        for shipment in shipments:
            if shipment.status != ShipmentStatus.DELIVERED:
                # If destined for this port, or originating from this port and still there
                if (shipment.destination.name == target_name) or (shipment.origin.name == target_name and shipment.delay_hours == 0):
                    shipment.status = ShipmentStatus.DELAYED
                    shipment.delay_hours += delay_added
                    shipment.expected_arrival += timedelta(hours=delay_added)
                    affected_shipment_ids.append(shipment.shipment_id)
                    
        return self._create_event(
            event_type=DisruptionType.PORT_CLOSURE.value,
            entity_id=entity_id,
            properties={
                "port_name": target_name,
                "location": target_loc.model_dump() if target_loc else {},
                "blocked_routes": affected_route_ids,
                "delayed_shipments": affected_shipment_ids,
                "delay_hours": delay_added
            }
        )

    def inject_vehicle_breakdown(self, shipment_id: str) -> LogisticsEvent:
        """Simulates vehicle breakdown for a shipment, stopping it and adding a delay."""
        shipments = self.dataset.get("shipments", [])
        shipment = next((s for s in shipments if s.shipment_id == shipment_id), None)
        
        if not shipment:
            raise ValueError(f"Shipment {shipment_id} not found in dataset.")
            
        if shipment.status == ShipmentStatus.DELIVERED:
            raise ValueError(f"Cannot break down shipment {shipment_id} as it is already delivered.")
            
        shipment.status = ShipmentStatus.BROKEN_DOWN
        delay_added = 12.0
        shipment.delay_hours += delay_added
        shipment.expected_arrival += timedelta(hours=delay_added)
        
        return self._create_event(
            event_type=DisruptionType.VEHICLE_BREAKDOWN.value,
            entity_id=shipment_id,
            properties={
                "breakdown_location": shipment.current_location.model_dump(),
                "delay_hours": delay_added,
                "expected_arrival": shipment.expected_arrival.isoformat(),
                "value": shipment.value,
                "destination": shipment.destination.name
            }
        )

    def inject_inventory_shortage(self, warehouse_id: str, item_id: str, drain_qty: Optional[int] = None) -> LogisticsEvent:
        """Drains inventory level of a SKU at a warehouse to trigger a shortage event."""
        inventory_records = self.dataset.get("inventory", [])
        record = next((inv for inv in inventory_records if inv.warehouse_id == warehouse_id and inv.item_id == item_id), None)
        
        if not record:
            raise ValueError(f"Inventory record for item {item_id} at warehouse {warehouse_id} not found.")
            
        old_quantity = record.quantity
        if drain_qty is None:
            # Drain below safety stock, to 10% of safety stock
            record.quantity = int(record.safety_stock * 0.1)
        else:
            record.quantity = max(0, record.quantity - drain_qty)
            
        return self._create_event(
            event_type=DisruptionType.INVENTORY_SHORTAGE.value,
            entity_id=record.inventory_id,
            properties={
                "warehouse_id": warehouse_id,
                "item_id": item_id,
                "old_quantity": old_quantity,
                "new_quantity": record.quantity,
                "safety_stock": record.safety_stock,
                "reorder_point": record.reorder_point
            }
        )

    def inject_supplier_delay(self, supplier_id: str, delay_hours: float) -> LogisticsEvent:
        """Delays all shipments originating from a specific supplier."""
        suppliers = self.dataset.get("suppliers", [])
        supplier = next((s for s in suppliers if s.supplier_id == supplier_id), None)
        
        if not supplier:
            raise ValueError(f"Supplier {supplier_id} not found in dataset.")
            
        # Adjust supplier reliability score down temporarily to reflect issue
        supplier.reliability_score = max(0.5, round(supplier.reliability_score - 0.15, 2))
        
        # Delay shipments from this supplier
        shipments = self.dataset.get("shipments", [])
        affected_shipment_ids = []
        for shipment in shipments:
            if shipment.status != ShipmentStatus.DELIVERED and shipment.origin.name == supplier.name:
                shipment.status = ShipmentStatus.DELAYED
                shipment.delay_hours += delay_hours
                shipment.expected_arrival += timedelta(hours=delay_hours)
                affected_shipment_ids.append(shipment.shipment_id)
                
        return self._create_event(
            event_type=DisruptionType.SUPPLIER_DELAY.value,
            entity_id=supplier_id,
            properties={
                "supplier_name": supplier.name,
                "delay_hours": delay_hours,
                "affected_shipments": affected_shipment_ids,
                "new_reliability_score": supplier.reliability_score
            }
        )

    def inject_route_congestion(self, route_id: str, congestion_factor: float = 2.0) -> LogisticsEvent:
        """Congests a route, lengthening estimated duration and delaying shipments on it."""
        routes = self.dataset.get("routes", [])
        route = next((r for r in routes if r.route_id == route_id), None)
        
        if not route:
            raise ValueError(f"Route {route_id} not found in dataset.")
            
        route.status = RouteStatus.CONGESTED
        old_duration = route.estimated_duration_hours
        route.estimated_duration_hours = round(route.estimated_duration_hours * congestion_factor, 1)
        
        # Calculate added travel time
        added_hours = route.estimated_duration_hours - old_duration
        
        # Delay active shipments using this route
        shipments = self.dataset.get("shipments", [])
        affected_shipment_ids = []
        for shipment in shipments:
            if shipment.status != ShipmentStatus.DELIVERED and shipment.route_id == route_id:
                shipment.status = ShipmentStatus.DELAYED
                shipment.delay_hours += added_hours
                shipment.expected_arrival += timedelta(hours=added_hours)
                affected_shipment_ids.append(shipment.shipment_id)
                
        return self._create_event(
            event_type=DisruptionType.ROUTE_CONGESTION.value,
            entity_id=route_id,
            properties={
                "route_id": route_id,
                "congestion_factor": congestion_factor,
                "old_duration_hours": old_duration,
                "new_duration_hours": route.estimated_duration_hours,
                "added_hours": added_hours,
                "affected_shipments": affected_shipment_ids
            }
        )
