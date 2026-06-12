import random
import math
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

from flowforge.data.schemas import (
    Location,
    Supplier,
    Warehouse,
    Inventory,
    Route,
    RouteStatus,
    Shipment,
    ShipmentStatus
)

# Geographic data for realistic hubs
SUPPLIER_HUBS = [
    ("Shenzhen Tech Park", 22.5431, 114.0579),
    ("Tokyo Industrial Zone", 35.6762, 139.6503),
    ("Munich Component Hub", 48.1351, 11.5820),
    ("Detroit Auto Parts", 42.3314, -83.0458),
    ("Seoul Electronics Zone", 37.5665, 126.9780),
    ("Taipei Semiconductor Area", 25.0330, 121.5654),
    ("Guadalajara Assembly", 20.6597, -103.3496),
    ("Bangalore Tech Corridor", 12.9716, 77.5946),
    ("Rotterdam Supplier Port", 51.9244, 4.4777),
    ("Sao Paulo Industrial Sector", -23.5505, -46.6333)
]

WAREHOUSE_HUBS = [
    ("Los Angeles Logistics Center", 34.0522, -118.2437),
    ("Chicago Distribution Hub", 41.8781, -87.6298),
    ("Memphis Fulfillment Center", 35.1495, -90.0490),
    ("Rotterdam Import Port", 51.9244, 4.4777),
    ("Singapore Global Hub", 1.3521, 103.8198),
    ("Hamburg Logistics Center", 53.5511, 9.9937),
    ("Sydney Distribution Center", -33.8688, 151.2093),
    ("Shanghai Regional Depot", 31.2304, 121.4737),
    ("Dubai Trade Hub", 25.2048, 55.2708),
    ("Dallas Sorting Facility", 32.7767, -96.7970)
]

SKU_ITEMS = [
    ("CPU-X100", 250.0),
    ("GPU-Y200", 600.0),
    ("MEM-DDR5", 80.0),
    ("SSD-2TB", 120.0),
    ("MOTHERBOARD-M5", 180.0),
    ("POWER-SUPPLY-850W", 95.0),
    ("COOLING-FAN-120", 25.0),
    ("CASE-MID-TOWER", 70.0),
]

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in kilometers."""
    R = 6371.0  # Earth's radius in km
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat / 2) ** 2 + 
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

class LogisticsDataGenerator:
    def __init__(self, seed: Optional[int] = None):
        if seed is not None:
            self.rng = random.Random(seed)
        else:
            self.rng = random.Random()
            
    def generate_suppliers(self, num_suppliers: int = 10) -> List[Supplier]:
        """Generate a list of suppliers from predefined geographical hubs."""
        suppliers = []
        num_to_gen = min(num_suppliers, len(SUPPLIER_HUBS))
        hubs = self.rng.sample(SUPPLIER_HUBS, num_to_gen)
        
        for i, (name, lat, lon) in enumerate(hubs):
            supplier_id = f"SUP_{i+1:03d}"
            reliability = round(self.rng.uniform(0.75, 0.99), 2)
            loc = Location(name=name, latitude=lat, longitude=lon)
            suppliers.append(Supplier(
                supplier_id=supplier_id,
                name=name,
                location=loc,
                reliability_score=reliability
            ))
        return suppliers

    def generate_warehouses(self, num_warehouses: int = 5) -> List[Warehouse]:
        """Generate a list of warehouses from predefined geographical hubs."""
        warehouses = []
        num_to_gen = min(num_warehouses, len(WAREHOUSE_HUBS))
        hubs = self.rng.sample(WAREHOUSE_HUBS, num_to_gen)
        
        for i, (name, lat, lon) in enumerate(hubs):
            warehouse_id = f"WH_{i+1:03d}"
            capacity = self.rng.choice([100000, 250000, 500000, 1000000])
            loc = Location(name=name, latitude=lat, longitude=lon)
            warehouses.append(Warehouse(
                warehouse_id=warehouse_id,
                name=name,
                location=loc,
                capacity=capacity
            ))
        return warehouses

    def generate_routes(self, warehouses: List[Warehouse], suppliers: List[Supplier]) -> List[Route]:
        """Generate routes connecting suppliers to warehouses, and warehouses to other warehouses."""
        routes = []
        route_index = 1
        
        # Connect suppliers to warehouses
        for supplier in suppliers:
            # Connect to 2 random warehouses to provide alternatives
            destinations = self.rng.sample(warehouses, min(2, len(warehouses)))
            for wh in destinations:
                dist = max(1.0, haversine_distance(
                    supplier.location.latitude, supplier.location.longitude,
                    wh.location.latitude, wh.location.longitude
                ))
                # Assume avg speed is 80 km/h for travel estimates
                duration = max(0.1, round(dist / 80.0, 1))
                
                routes.append(Route(
                    route_id=f"R_{route_index:03d}",
                    origin=supplier.location,
                    destination=wh.location,
                    distance_km=round(dist, 1),
                    estimated_duration_hours=duration,
                    status=RouteStatus.NORMAL
                ))
                route_index += 1
                
        # Connect warehouses to other warehouses
        for i, wh_src in enumerate(warehouses):
            for j, wh_dst in enumerate(warehouses):
                if i != j:
                    # Provide routes between warehouse pairs with 50% probability
                    if self.rng.random() < 0.5:
                        dist = max(1.0, haversine_distance(
                            wh_src.location.latitude, wh_src.location.longitude,
                            wh_dst.location.latitude, wh_dst.location.longitude
                        ))
                        duration = max(0.1, round(dist / 80.0, 1))
                        routes.append(Route(
                            route_id=f"R_{route_index:03d}",
                            origin=wh_src.location,
                            destination=wh_dst.location,
                            distance_km=round(dist, 1),
                            estimated_duration_hours=duration,
                            status=RouteStatus.NORMAL
                        ))
                        route_index += 1
                        
        return routes

    def generate_inventory(self, warehouses: List[Warehouse], suppliers: List[Supplier]) -> List[Inventory]:
        """Generate inventory items held at each warehouse."""
        inventories = []
        inv_index = 1
        
        for wh in warehouses:
            # Each warehouse keeps 4-8 different types of SKUs
            selected_skus = self.rng.sample(SKU_ITEMS, self.rng.randint(4, len(SKU_ITEMS)))
            for item_id, cost in selected_skus:
                supplier = self.rng.choice(suppliers)
                safety = self.rng.choice([100, 500, 1000])
                reorder = safety + self.rng.choice([200, 500, 1000])
                quantity = reorder + self.rng.randint(200, 5000)
                
                inventories.append(Inventory(
                    inventory_id=f"INV_{inv_index:04d}",
                    item_id=item_id,
                    warehouse_id=wh.warehouse_id,
                    quantity=quantity,
                    reorder_point=reorder,
                    safety_stock=safety,
                    supplier_id=supplier.supplier_id,
                    unit_cost=cost
                ))
                inv_index += 1
                
        return inventories

    def generate_shipments(self, num_shipments: int, routes: List[Route]) -> List[Shipment]:
        """Generate a specified number of shipments randomly routed along the generated routes."""
        shipments = []
        base_time = datetime.utcnow()
        
        for i in range(num_shipments):
            shipment_id = f"SH_{i+1:05d}"
            route = self.rng.choice(routes)
            
            # Select random items
            num_items = self.rng.randint(1, 3)
            items = {}
            total_value = 0.0
            for item_id, cost in self.rng.sample(SKU_ITEMS, num_items):
                quantity = self.rng.randint(10, 500)
                items[item_id] = quantity
                total_value += quantity * cost
                
            # Random status
            status = self.rng.choice([ShipmentStatus.IN_TRANSIT, ShipmentStatus.DELIVERED])
            delay = 0.0
            if status == ShipmentStatus.DELIVERED:
                # Arrived sometime in the past 24 hours
                expected_arrival = base_time - timedelta(hours=self.rng.uniform(1, 24))
            else:
                # Arriving in the future based on estimated route duration
                expected_arrival = base_time + timedelta(hours=self.rng.uniform(1, route.estimated_duration_hours))
                # 5% chance of being delayed in initial generation
                if self.rng.random() < 0.05:
                    status = ShipmentStatus.DELAYED
                    delay = round(self.rng.uniform(2, 12), 1)
                    expected_arrival += timedelta(hours=delay)
                    
            # Current location: interpolate based on route
            pct = self.rng.random() if status != ShipmentStatus.DELIVERED else 1.0
            curr_lat = route.origin.latitude + pct * (route.destination.latitude - route.origin.latitude)
            curr_lon = route.origin.longitude + pct * (route.destination.longitude - route.origin.longitude)
            curr_name = f"In transit: {route.origin.name} -> {route.destination.name}" if pct < 1.0 else route.destination.name
            
            curr_loc = Location(
                name=curr_name,
                latitude=curr_lat,
                longitude=curr_lon
            )
            
            shipments.append(Shipment(
                shipment_id=shipment_id,
                origin=route.origin,
                destination=route.destination,
                current_location=curr_loc,
                route_id=route.route_id,
                status=status,
                expected_arrival=expected_arrival,
                delay_hours=delay,
                items=items,
                value=round(total_value, 2)
            ))
            
        return shipments

    def generate_all(self, num_shipments: int = 500, num_warehouses: int = 5, num_suppliers: int = 10) -> Dict[str, List]:
        """Convenience method to generate a full integrated dataset."""
        suppliers = self.generate_suppliers(num_suppliers)
        warehouses = self.generate_warehouses(num_warehouses)
        routes = self.generate_routes(warehouses, suppliers)
        inventories = self.generate_inventory(warehouses, suppliers)
        shipments = self.generate_shipments(num_shipments, routes)
        
        return {
            "suppliers": suppliers,
            "warehouses": warehouses,
            "routes": routes,
            "inventory": inventories,
            "shipments": shipments
        }
