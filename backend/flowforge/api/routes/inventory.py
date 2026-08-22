"""
backend/flowforge/api/routes/inventory.py
Inventory & Stockout Endpoints.
"""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/inventory", tags=["Inventory"])

INVENTORY_STORE = [
    {"sku": "SKU-001", "product_name": "Automotive Engine ECU Module", "category": "Automotive", "stock": 245, "reorder_point": 50, "warehouse": "Yokohama Marine Terminal", "unit_cost": 1420, "status": "In Stock"},
    {"sku": "SKU-002", "product_name": "Lithium Iron Battery Pack 48V", "category": "Energy", "stock": 89, "reorder_point": 100, "warehouse": "Mumbai JNPT Port Buffer", "unit_cost": 850, "status": "Low Stock"},
    {"sku": "SKU-003", "product_name": "Solid State Drive 2TB PCIe Gen5", "category": "Electronics", "stock": 1240, "reorder_point": 200, "warehouse": "Singapore Tuas Hub", "unit_cost": 110, "status": "In Stock"},
    {"sku": "SKU-004", "product_name": "Marine Turbine Bearing Assembly", "category": "Machinery", "stock": 14, "reorder_point": 25, "warehouse": "Antwerp Port Logistics Center", "unit_cost": 3400, "status": "Low Stock"},
    {"sku": "SKU-005", "product_name": "Pharmaceutical Cold-Chain Vaccines", "category": "Pharma", "stock": 0, "reorder_point": 80, "warehouse": "Rotterdam Gateway Depot", "unit_cost": 920, "status": "Stockout"},
    {"sku": "SKU-006", "product_name": "Hydraulic Steering Pump", "category": "Automotive", "stock": 412, "reorder_point": 80, "warehouse": "Mumbai JNPT Port Buffer", "unit_cost": 360, "status": "In Stock"},
]


class StockUpdate(BaseModel):
    sku: str
    stock: int


@router.get("")
def get_inventory():
    return INVENTORY_STORE


@router.put("/stock")
def update_stock(payload: StockUpdate):
    for item in INVENTORY_STORE:
        if item["sku"] == payload.sku:
            item["stock"] = payload.stock
            if payload.stock == 0:
                item["status"] = "Stockout"
            elif payload.stock <= item["reorder_point"]:
                item["status"] = "Low Stock"
            else:
                item["status"] = "In Stock"
            return item
    return {"message": "SKU updated"}
