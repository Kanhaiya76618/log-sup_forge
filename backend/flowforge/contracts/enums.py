"""Shared enums. OWNER: P1. Frozen early — import these everywhere."""
from enum import Enum


class Domain(str, Enum):
    LOGISTICS = "logistics"
    MANUFACTURING = "manufacturing"


class DisruptionType(str, Enum):
    PORT_CLOSURE = "port_closure"
    SHIPMENT_DELAY = "shipment_delay"
    SUPPLY_SHORTAGE = "supply_shortage"
    MACHINE_DOWNTIME = "machine_downtime"
    DEMAND_SPIKE = "demand_spike"
    UNKNOWN = "unknown"


class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ActionType(str, Enum):
    REROUTE = "reroute"
    RESCHEDULE = "reschedule"
    REPLENISH = "replenish"
    UPDATE_ERP = "update_erp"
    ISSUE_PO = "issue_po"
    NOTIFY = "notify"


class Decision(str, Enum):
    AUTO_APPROVED = "auto_approved"
    ESCALATED = "escalated"
    REJECTED = "rejected"
    EXECUTED = "executed"
    FAILED = "failed"
