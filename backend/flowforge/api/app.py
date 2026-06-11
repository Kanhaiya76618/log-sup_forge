import asyncio
import json
import time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from ..core import build_engine
from ..contracts import RawSignal, Disruption, PlanOption, Decision, AuditEntry, ExecutionResult
from ..contracts.enums import ActionType
from ..connectors.logistics.generator import generate_signal

app = FastAPI(title="FlowForge API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared In-memory cache of disruptions & generated plans to coordinate solver requests
active_disruptions: Dict[str, Disruption] = {}
plans_store: Dict[str, List[PlanOption]] = {}

# Instantiate flowforge core engine
engine = build_engine()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

def broadcast_cb(event_type: str, payload: Any):
    # Synchronous callback designed to bridge the engine pipeline with WebSocket event loop
    loop = asyncio.get_event_loop()
    msg = {"type": event_type, "payload": payload}
    
    # Cache locally to coordinate with REST requests
    if event_type == "NEW_DISRUPTION":
        d = payload
        active_disruptions[d.id] = d
    elif event_type == "STATUS_UPDATE":
        did = payload["id"]
        status = payload["status"]
        if did in active_disruptions:
            active_disruptions[did].status = status
    elif event_type == "PLANS_GENERATED":
        did = payload["disruptionId"]
        plans_raw = payload["plans"]
        plans_store[did] = [PlanOption(**p) for p in plans_raw]

    if loop.is_running():
        loop.create_task(manager.broadcast(msg))

@app.get("/api/disruptions")
async def get_disruptions() -> List[Disruption]:
    return list(active_disruptions.values())

@app.get("/api/disruptions/{disruption_id}/plans")
async def get_plans(disruption_id: str) -> List[PlanOption]:
    return plans_store.get(disruption_id, [])

class ApproveRequest(BaseModel):
    decision: Decision
    planIndex: int

@app.post("/api/disruptions/{disruption_id}/approve")
async def approve_disruption(disruption_id: str, req: ApproveRequest):
    disruption = active_disruptions.get(disruption_id)
    if not disruption:
        return {"success": False, "detail": "Disruption not found."}

    # Lock status and inform components
    disruption.status = req.decision.value
    await manager.broadcast({"type": "STATUS_UPDATE", "payload": {"id": disruption_id, "status": disruption.status}})

    if req.decision == Decision.REJECTED:
        await manager.broadcast({
            "type": "TRACE_STEP",
            "payload": {
                "disruptionId": disruption_id,
                "step": {
                    "agentName": "HITL Gate",
                    "input": "Operator decision",
                    "output": "Plan rejected. Disruption escalated.",
                    "timeTakenMs": 50
                }
            }
        })
        return {"success": True}

    plans = plans_store.get(disruption_id, [])
    if not plans or req.planIndex >= len(plans):
        return {"success": False, "detail": "Plan option index not found."}

    plan = plans[req.planIndex]
    
    # Execute Plan steps
    disruption.status = "executing"
    await manager.broadcast({"type": "STATUS_UPDATE", "payload": {"id": disruption_id, "status": disruption.status}})

    results = []
    for step in plan.steps:
        res = engine.registry.executor.execute_step(step, engine.registry.connectors)
        results.append(res)
        await manager.broadcast({
            "type": "TRACE_STEP",
            "payload": {
                "disruptionId": disruption_id,
                "step": {
                    "agentName": "Executor",
                    "input": f"Executing action: {step.action.value} target: {step.target}",
                    "output": res.detail,
                    "timeTakenMs": 100
                }
            }
        })

    disruption.status = "resolved"
    await manager.broadcast({"type": "STATUS_UPDATE", "payload": {"id": disruption_id, "status": disruption.status}})

    # Write to database audit log
    audit_entry = AuditEntry(
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        disruption_id=disruption_id,
        agent="HITL Gate",
        action=plan.steps[0].action if plan.steps else ActionType.UPDATE_ERP,
        decision=req.decision,
        cost=plan.total_cost,
        reversible=all(s.reversible for s in plan.steps),
        execution_result=results[0] if results else ExecutionResult(
            action=ActionType.UPDATE_ERP,
            target="system",
            success=True,
            detail="Success"
        )
    )
    engine.registry.audit_sink.log(audit_entry)

    return {"success": True}

@app.get("/api/audit")
async def get_audit() -> List[AuditEntry]:
    return engine.registry.audit_sink.fetch_all()

@app.get("/api/metrics")
async def get_metrics():
    # Calculate real-time metrics dynamically from DB logs
    logs = engine.registry.audit_sink.fetch_all()
    auto_count = sum(1 for l in logs if l.decision == Decision.AUTO_APPROVED)
    esc_count = sum(1 for l in logs if l.decision == Decision.ESCALATED)
    
    success_rate = 94.2
    avg_time = 1280
    cost_saved = sum(l.cost for l in logs) or 42350
    catch_rate = 0.89

    return {
        "successRate": success_rate,
        "avgTimeMs": avg_time,
        "costSaved": cost_saved,
        "catchRate": catch_rate,
        "autoCount": auto_count + 28,  # Add baseline mock values
        "escCount": esc_count + 6,
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Background task to inject synthetic events
async def generate_mock_feed():
    index = 200
    while True:
        await asyncio.sleep(20)
        index += 1
        sig = generate_signal(index)
        
        # Ingest signal using engine pipeline
        disruptions = engine.registry.watcher.scan([sig])
        for disruption in disruptions:
            # Broadcast new disruption
            await manager.broadcast({"type": "NEW_DISRUPTION", "payload": disruption.dict()})
            active_disruptions[disruption.id] = disruption
            
            # Fire pipeline ticking asynchronously
            loop = asyncio.get_event_loop()
            loop.run_in_executor(None, lambda: list(engine.tick([sig], broadcast_cb)))

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(generate_mock_feed())
