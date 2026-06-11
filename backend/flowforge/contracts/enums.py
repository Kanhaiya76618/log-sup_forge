from enum import Enum

class Severity(str, Enum):
    LOW = "low"
    HIGH = "high"
    CRITICAL = "critical"

class DisruptionType(str, Enum):
    PORT_CLOSURE = "port_closure"
    SHIPMENT_DELAY = "shipment_delay"
    SUPPLY_SHORTAGE = "supply_shortage"

class ActionType(str, Enum):
    REROUTE = "reroute"
    REPLENISH = "replenish"
    UPDATE_ERP = "update_erp"
    NOTIFY = "notify"
    ISSUE_PO = "issue_po"

class Decision(str, Enum):
    AUTO_APPROVED = "auto_approved"
    ESCALATED = "escalated"
    REJECTED = "rejected"

class Domain(str, Enum):
    LOGISTICS = "logistics"
    MANUFACTURING = "manufacturing"
