from typing import Dict, List, Set
from flowforge.data.schemas import Disruption, BlastRadius, Shipment, Warehouse, Supplier, Inventory, RouteStatus

class BlastRadiusEngine:
    def __init__(self):
        pass

    def calculate_impact(self, disruption: Disruption, dataset: Dict[str, List]) -> BlastRadius:
        """
        Calculates the blast radius and downstream impact of a disruption.
        
        Args:
            disruption: The detected Disruption object.
            dataset: The active dataset dictionary containing shipments, warehouses, routes, suppliers, and inventory.
        """
        shipments: List[Shipment] = dataset.get("shipments", [])
        warehouses: List[Warehouse] = dataset.get("warehouses", [])
        suppliers: List[Supplier] = dataset.get("suppliers", [])
        inventory_records: List[Inventory] = dataset.get("inventory", [])
        
        dtype = disruption.event_type.value
        eid = disruption.entity_id
        details = disruption.details
        
        affected_shipment_ids: List[str] = []
        affected_warehouses: Set[str] = set()
        affected_suppliers: Set[str] = set()
        affected_orders_count = 0
        affected_customers_count = 0
        financial_risk = 0.0
        
        if dtype in ["SHIPMENT_DELAY", "VEHICLE_BREAKDOWN"]:
            # Direct impact on a single shipment
            shipment = next((s for s in shipments if s.shipment_id == eid), None)
            if shipment:
                affected_shipment_ids.append(shipment.shipment_id)
                financial_risk = shipment.value
                
                # Trace warehouse destination
                dest_wh = next((w for w in warehouses if w.location.name == shipment.destination.name), None)
                if dest_wh:
                    affected_warehouses.add(dest_wh.warehouse_id)
                
                # Trace origin supplier
                orig_sup = next((s for s in suppliers if s.location.name == shipment.origin.name), None)
                if orig_sup:
                    affected_suppliers.add(orig_sup.supplier_id)
                    
                # Orders and customers waiting for these goods
                affected_orders_count = max(1, sum(shipment.items.values()) // 10)
                affected_customers_count = max(1, len(shipment.items))

        elif dtype == "PORT_CLOSURE":
            # Direct impact on a port location
            port_name = details.get("port_name", "")
            
            # Find the closed entity (warehouse or supplier)
            wh = next((w for w in warehouses if port_name.lower() in w.name.lower()), None)
            sup = next((s for s in suppliers if port_name.lower() in s.name.lower()), None)
            
            if wh:
                affected_warehouses.add(wh.warehouse_id)
            if sup:
                affected_suppliers.add(sup.supplier_id)
                
            # Shipments going through/to/from this port
            for s in shipments:
                if s.status != "DELIVERED":
                    if (s.destination.name == port_name) or (s.origin.name == port_name):
                        affected_shipment_ids.append(s.shipment_id)
                        financial_risk += s.value
                        
                        # Find destination warehouse of delayed shipments
                        ship_dest_wh = next((w for w in warehouses if w.location.name == s.destination.name), None)
                        if ship_dest_wh:
                            affected_warehouses.add(ship_dest_wh.warehouse_id)
                            
                        # Find origin supplier of delayed shipments
                        ship_orig_sup = next((sup_ent for sup_ent in suppliers if sup_ent.location.name == s.origin.name), None)
                        if ship_orig_sup:
                            affected_suppliers.add(ship_orig_sup.supplier_id)
                            
                        affected_orders_count += max(1, sum(s.items.values()) // 10)
                        affected_customers_count += max(1, len(s.items))

        elif dtype == "ROUTE_CONGESTION":
            route_id = eid
            # Shipments traveling on this route
            for s in shipments:
                if s.status != "DELIVERED" and s.route_id == route_id:
                    affected_shipment_ids.append(s.shipment_id)
                    financial_risk += s.value
                    
                    # Trace endpoints
                    wh_dest = next((w for w in warehouses if w.location.name == s.destination.name), None)
                    if wh_dest:
                        affected_warehouses.add(wh_dest.warehouse_id)
                    
                    sup_orig = next((sup_ent for sup_ent in suppliers if sup_ent.location.name == s.origin.name), None)
                    if sup_orig:
                        affected_suppliers.add(sup_orig.supplier_id)
                        
                    affected_orders_count += max(1, sum(s.items.values()) // 10)
                    affected_customers_count += max(1, len(s.items))

        elif dtype == "INVENTORY_SHORTAGE":
            # Direct impact on warehouse SKU
            inv_id = eid
            record = next((r for r in inventory_records if r.inventory_id == inv_id), None)
            if record:
                affected_warehouses.add(record.warehouse_id)
                affected_suppliers.add(record.supplier_id)
                
                deficit = max(0, record.safety_stock - record.quantity)
                financial_risk = deficit * record.unit_cost
                
                # Check for incoming shipments carrying this SKU to this warehouse
                wh_name = next((w.name for w in warehouses if w.warehouse_id == record.warehouse_id), None)
                if wh_name:
                    for s in shipments:
                        if s.status != "DELIVERED" and s.destination.name == wh_name and record.item_id in s.items:
                            affected_shipment_ids.append(s.shipment_id)
                            
                # Orders and customers affected by safety stock deficit
                affected_orders_count = max(1, deficit // 5)
                affected_customers_count = affected_orders_count

        elif dtype == "SUPPLIER_DELAY":
            supplier_id = eid
            supplier = next((s for s in suppliers if s.supplier_id == supplier_id), None)
            if supplier:
                affected_suppliers.add(supplier_id)
                
                # Shipments from this supplier
                for s in shipments:
                    if s.status != "DELIVERED" and s.origin.name == supplier.name:
                        affected_shipment_ids.append(s.shipment_id)
                        financial_risk += s.value
                        
                        # Find destination warehouse
                        wh_dest = next((w for w in warehouses if w.location.name == s.destination.name), None)
                        if wh_dest:
                            affected_warehouses.add(wh_dest.warehouse_id)
                            
                        affected_orders_count += max(1, sum(s.items.values()) // 10)
                        affected_customers_count += max(1, len(s.items))
                        
        return BlastRadius(
            affected_orders_count=affected_orders_count,
            affected_customers_count=affected_customers_count,
            affected_warehouses_count=len(affected_warehouses),
            affected_suppliers_count=len(affected_suppliers),
            affected_shipments=affected_shipment_ids,
            financial_risk=round(financial_risk, 2)
        )
