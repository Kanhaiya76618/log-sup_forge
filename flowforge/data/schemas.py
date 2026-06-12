from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

class ShipmentStatus(str, Enum):
    IN_TRANSIT = "IN_TRANSIT"
    DELAYED = "DELAYED"
    BROKEN_DOWN = "BROKEN_DOWN"
    DELIVERED = "DELIVERED"

class RouteStatus(str, Enum):
    NORMAL = "NORMAL"
    CONGESTED = "CONGESTED"
    BLOCKED = "BLOCKED"

class DisruptionType(str, Enum):
    PORT_CLOSURE = "PORT_CLOSURE"
    SHIPMENT_DELAY = "SHIPMENT_DELAY"
    VEHICLE_BREAKDOWN = "VEHICLE_BREAKDOWN"
    INVENTORY_SHORTAGE = "INVENTORY_SHORTAGE"
    SUPPLIER_DELAY = "SUPPLIER_DELAY"
    ROUTE_CONGESTION = "ROUTE_CONGESTION"

class SeverityLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Location(BaseModel):
    name: str = Field(..., description="Name of the location or hub")
    latitude: float = Field(..., description="Latitude coordinate")
    longitude: float = Field(..., description="Longitude coordinate")

class Supplier(BaseModel):
    supplier_id: str = Field(..., description="Unique supplier identifier")
    name: str = Field(..., description="Name of the supplier")
    location: Location = Field(..., description="Supplier's physical location")
    reliability_score: float = Field(..., description="Historical reliability score (0.0 to 1.0)", ge=0.0, le=1.0)

class Warehouse(BaseModel):
    warehouse_id: str = Field(..., description="Unique warehouse identifier")
    name: str = Field(..., description="Name of the warehouse")
    location: Location = Field(..., description="Warehouse location")
    capacity: int = Field(..., description="Maximum storage capacity in units", gt=0)

class Inventory(BaseModel):
    inventory_id: str = Field(..., description="Unique inventory record identifier")
    item_id: str = Field(..., description="SKU or item identifier")
    warehouse_id: str = Field(..., description="Warehouse identifier")
    quantity: int = Field(..., description="Current stock level", ge=0)
    reorder_point: int = Field(..., description="Stock level threshold to trigger reorder", ge=0)
    safety_stock: int = Field(..., description="Minimum safety stock level", ge=0)
    supplier_id: str = Field(..., description="Preferred supplier identifier")
    unit_cost: float = Field(..., description="Cost per unit", ge=0.0)

class Route(BaseModel):
    route_id: str = Field(..., description="Unique route identifier")
    origin: Location = Field(..., description="Origin location")
    destination: Location = Field(..., description="Destination location")
    distance_km: float = Field(..., description="Total route distance in kilometers", gt=0.0)
    estimated_duration_hours: float = Field(..., description="Estimated travel time in hours", gt=0.0)
    status: RouteStatus = Field(default=RouteStatus.NORMAL, description="Current status of the route")

class Shipment(BaseModel):
    shipment_id: str = Field(..., description="Unique shipment identifier")
    origin: Location = Field(..., description="Origin location")
    destination: Location = Field(..., description="Destination location")
    current_location: Location = Field(..., description="Current geographical location of the shipment")
    route_id: str = Field(..., description="Assigned route identifier")
    status: ShipmentStatus = Field(default=ShipmentStatus.IN_TRANSIT, description="Current shipment status")
    expected_arrival: datetime = Field(..., description="Target or calculated arrival timestamp")
    delay_hours: float = Field(default=0.0, description="Cumulative delay hours", ge=0.0)
    items: Dict[str, int] = Field(..., description="Items in shipment mapping ID to quantity")
    value: float = Field(..., description="Total cargo value in USD", ge=0.0)

class LogisticsEvent(BaseModel):
    event_id: str = Field(..., description="Unique event identifier")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp when the event occurred")
    event_type: str = Field(..., description="Type of logistics event (e.g., SHIPMENT_DELAY, PORT_CLOSURE)")
    entity_id: str = Field(..., description="ID of the entity that triggered the event")
    properties: Dict = Field(default_factory=dict, description="Metadata and context associated with the event")

class Disruption(BaseModel):
    disruption_id: str = Field(..., description="Unique disruption identifier")
    event_type: DisruptionType = Field(..., description="Categorized disruption type")
    entity_id: str = Field(..., description="Entity ID that is directly affected")
    confidence: float = Field(..., description="Watcher agent detection confidence score (0.0 to 1.0)", ge=0.0, le=1.0)
    details: Dict = Field(default_factory=dict, description="Detailed context collected by the watcher")
    detected_at: datetime = Field(default_factory=datetime.utcnow, description="Time of anomaly detection")

class BlastRadius(BaseModel):
    affected_orders_count: int = Field(default=0, description="Downstream orders impacted")
    affected_customers_count: int = Field(default=0, description="Downstream customers impacted")
    affected_warehouses_count: int = Field(default=0, description="Warehouses impacted")
    affected_suppliers_count: int = Field(default=0, description="Suppliers impacted")
    affected_shipments: List[str] = Field(default_factory=list, description="List of shipment IDs affected")
    financial_risk: float = Field(default=0.0, description="Aggregated risk in USD")

class DiagnosisResult(BaseModel):
    disruption_type: DisruptionType = Field(..., description="Diagnosed type of disruption")
    root_cause: str = Field(..., description="Identified root cause explanation")
    severity: SeverityLevel = Field(..., description="Assessed severity level")
    affected_orders: int = Field(..., description="Number of orders affected")
    affected_customers: int = Field(..., description="Number of customers affected")
    blast_radius: int = Field(..., description="Numerical score representing blast radius magnitude (e.g. 1-10)")
    confidence: float = Field(..., description="Diagnosis agent confidence score (0.0 to 1.0)", ge=0.0, le=1.0)
    recommended_context: Dict = Field(
        default_factory=dict, 
        description="Flags indicating actions needed (e.g. {'reroute_required': bool, 'inventory_risk': bool})"
    )
    diagnosed_at: datetime = Field(default_factory=datetime.utcnow, description="Time of diagnosis")
    details: Optional[Dict] = Field(default_factory=dict, description="Detailed reasoning and analysis context")
