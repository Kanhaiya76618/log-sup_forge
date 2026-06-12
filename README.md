# FlowForge – P2: Data & Perception Layer

Welcome to the **Data & Perception Layer** (P2) of **FlowForge**, an Agentic Supply Chain Control Tower. P2 acts as the autonomous exception-monitoring and risk-diagnosis brain of the system, transforming raw supply chain events into high-fidelity actionable intelligence for downstream planners, solvers, and executors.

---

## Architecture Diagram & Flow

```
+------------------+     LogisticsEvent     +----------------+
|  Event Stream /  | ---------------------> |  Watcher Agent |
|  Data Injector   |                        +----------------+
+------------------+                                |
                                            Disruption Object
                                                    |
                                                    v
+------------------+                        +----------------+
|  DiagnosisResult | <--------------------- | Diagnosis Agent|
| (Target for P3)  |                        +----------------+
+------------------+                                |
                                            +-------+-------+
                                            v               v
                                     +------------+  +-------------+
                                     |  Severity  |  | Blast Radius|
                                     |   Engine   |  |   Engine    |
                                     +------------+  +-------------+
```

---

## Module Breakdown

### 1. Data Schemas (`flowforge/data/schemas.py`)
Provides strong-typed, validated Pydantic models mapping key entities of the logistics landscape:
*   **Supplier & Warehouse**: Geographical nodes with capacities and reliability scores.
*   **Route**: Edge connecting two nodes with distance, estimated travel duration, and congestion status.
*   **Shipment**: Mobile asset traveling along a route carrying specific quantities of SKUs.
*   **Inventory**: Stock levels tracking safety limits and unit costs.
*   **LogisticsEvent**: Raw incoming telemetry event from the field.
*   **Disruption**: Watcher-categorized anomaly alert containing observation details.
*   **BlastRadius**: Metrics summarizing total impacted orders, customers, and financial risk.
*   **DiagnosisResult**: Complete perception layer output, consumed directly by the P3 Optimization and Planning Agents.

### 2. Synthetic Data Generator (`flowforge/data/generator.py`)
Generates high-fidelity logistics datasets of arbitrary scale.
*   Uses a random seed to guarantee reproducibility.
*   Computes realistic distances between supplier and warehouse hubs (e.g., Shanghai, LA, Dubai, Rotterdam) using the **Haversine formula**.
*   Populates initial inventory balances, safety stocks, unit values, and shipment schedules.

### 3. Disruption Injector (`flowforge/data/injector.py`)
Simulates critical failure points in-place and emits representative raw `LogisticsEvent` streams:
1.  **Shipment Delay**: Delays active shipments, extending arrival schedules.
2.  **Port Closure**: Temporarily blocks warehouse/supplier hubs, blocking routes and delaying inbound freight.
3.  **Vehicle Breakdown**: Halts a shipment midway on its route, introducing an immediate delay.
4.  **Inventory Shortage**: Artificially drains stock balances below safety limits.
5.  **Supplier Delay**: Limits supplier throughput, delaying shipments originating from the supplier.
6.  **Route Congestion**: Multiplies transit durations, delaying shipments using the route.

### 4. Watcher Agent (`flowforge/agents/watcher.py`)
Filters and classifies the incoming event stream.
*   Applies deterministic rule thresholds to flag delays, stockouts, supplier failures, and congested corridors.
*   Uses a zero-dependency POST request to the **Gemini API** (if `GEMINI_API_KEY` is configured in env) to enrich the event telemetry with a natural language summary. Otherwise, falls back to formatted local templates.

### 5. Diagnosis Agent (`flowforge/agents/diagnosis.py`)
Integrates Severity and Blast Radius calculations to trace root causes.
*   Runs downstream topological dependency lookups.
*   Uses Gemini AI to compile a zero-shot multi-sentence diagnosis of the supply chain cascade effect (with automated template fallback).

### 6. Severity Engine (`flowforge/analysis/severity.py`)
Computes a normalized mathematical severity score out of 10:
$$\text{Severity} = 0.4 \times \text{Delay Score} + 0.3 \times \text{Order Impact Score} + 0.3 \times \text{Inventory Risk Score}$$
Maps scores to standard categories: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.

### 7. Blast Radius Engine (`flowforge/analysis/impact.py`)
Performs trace analysis on the supply chain graph to return:
*   Downstream affected order and customer counts.
*   Affected warehouses and suppliers.
*   Aggregated dollar-value financial risk (USD).

### 8. Event Ingestion Pipeline (`flowforge/pipeline/pipeline.py`)
Synchronous, queue-ready orchestration pipeline coupling Watcher and Diagnosis layers. Easily pluggable into Celery tasks or FastAPI router endpoints.

---

## Setup & Running Guide

### Installation
Ensure Python 3.11+ is installed. Clone the repository and install Pydantic:
```bash
pip install pydantic
```

### Run Demonstration Scenarios
To run the 5 predefined demo scenarios (Port Closure, Shipment Delay, Inventory Shortage, Supplier Failure, Route Congestion) and view simulated agent outputs:
```bash
python -m flowforge.evaluation.scenarios
```

### Run Evaluation Framework
To run a test suite of randomized trials, measure detection accuracy, diagnosis recall, severity classifications, and agent latency metrics:
```bash
python -m flowforge.evaluation.evaluation_runner
```

---

## Expected Output for P3

Downstream planner agents (P3) receive a validated `DiagnosisResult` object containing action-flags and detailed impact metadata:

```json
{
  "disruption_type": "PORT_CLOSURE",
  "root_cause": "Port closure detected at location 'Los Angeles Logistics Center'. All connecting routes are blocked and incoming shipments are delayed.",
  "severity": "CRITICAL",
  "affected_orders": 534,
  "affected_customers": 26,
  "blast_radius": 10,
  "confidence": 0.93,
  "recommended_context": {
    "reroute_required": true,
    "inventory_risk": false,
    "supplier_risk": false
  },
  "diagnosed_at": "2026-06-10T19:54:12.123456",
  "details": {
    "disruption_id": "DIS_A4F9A55C",
    "entity_id": "WH_001",
    "severity_score": 3.3,
    "financial_risk": 1204325.0,
    "impacted_warehouses_count": 1,
    "impacted_suppliers_count": 3,
    "impacted_shipments": ["SH_00001", "SH_00003", "SH_00004", "SH_00007", "SH_00010"]
  }
}
```
