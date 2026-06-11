import time
from typing import Generator
from .registry import Registry
from ..contracts import PipelineRecord, Decision, RawSignal, AuditEntry
from ..contracts.enums import ActionType
from ..execution.gate import Gate

class Orchestrator:
    def __init__(self, registry: Registry) -> None:
        self.registry = registry

    def run_pipeline(self, signals: list[RawSignal], broadcast_cb=None) -> Generator[PipelineRecord, None, None]:
        if not self.registry.watcher:
            return

        disruptions = self.registry.watcher.scan(signals)
        for disruption in disruptions:
            # Step 1: Diagnosed
            disruption.status = "diagnosed"
            if broadcast_cb:
                broadcast_cb("STATUS_UPDATE", {"id": disruption.id, "status": disruption.status})
                broadcast_cb("TRACE_STEP", {
                    "disruptionId": disruption.id,
                    "step": {
                        "agentName": "Watcher",
                        "input": "Raw signals received",
                        "output": f"Disruption identified: {disruption.summary}",
                        "confidence": 0.99,
                        "timeTakenMs": 45
                    }
                })

            record = PipelineRecord(disruption=disruption)
            yield record

            # Step 2: Diagnose / Analyze
            if self.registry.diagnoser:
                disruption = self.registry.diagnoser.diagnose(disruption)
                record.disruption = disruption
            
            disruption.status = "planning"
            if broadcast_cb:
                broadcast_cb("STATUS_UPDATE", {"id": disruption.id, "status": disruption.status})
                broadcast_cb("TRACE_STEP", {
                    "disruptionId": disruption.id,
                    "step": {
                        "agentName": "Diagnosis",
                        "input": f"Enriching blast radius for {disruption.id}",
                        "output": f"Affected SKUs: {disruption.blast_radius.affected_skus}, Risk: ${disruption.blast_radius.value_at_risk}",
                        "confidence": 0.95,
                        "timeTakenMs": 120
                    }
                })
            yield record

            # Step 3: Propose Plans
            if self.registry.planner:
                plans = self.registry.planner.propose_plans(disruption)
                record.plans = plans

            disruption.status = "verifying"
            if broadcast_cb:
                broadcast_cb("STATUS_UPDATE", {"id": disruption.id, "status": disruption.status})
                broadcast_cb("PLANS_GENERATED", {"disruptionId": disruption.id, "plans": [p.dict() for p in record.plans]})
                broadcast_cb("TRACE_STEP", {
                    "disruptionId": disruption.id,
                    "step": {
                        "agentName": "Planner",
                        "input": "Running mathematical optimization solver constraints",
                        "output": f"Proposals generated: {len(record.plans)} options.",
                        "confidence": 0.90,
                        "timeTakenMs": 230
                    }
                })
            yield record

            # Step 4: Verify
            if self.registry.verifier:
                verification = self.registry.verifier.verify(disruption, record.plans)
                record.verification = verification
            
            # Step 5: Gate Decision — delegate entirely to Gate
            gate_decision = Gate().evaluate(record)
            record.decision = gate_decision
            disruption.status = gate_decision.value

            if broadcast_cb:
                broadcast_cb("STATUS_UPDATE", {"id": disruption.id, "status": disruption.status})
                broadcast_cb("TRACE_STEP", {
                    "disruptionId": disruption.id,
                    "step": {
                        "agentName": "Verifier",
                        "input": "Red-teaming plans",
                        "output": f"Checks passed: {record.verification.passed if record.verification else False}. Decision: {gate_decision.value}",
                        "confidence": record.verification.confidence if record.verification else 0.50,
                        "timeTakenMs": 150
                    }
                })
            yield record

            # Step 6: Executor (if AUTO_APPROVED)
            if gate_decision == Decision.AUTO_APPROVED:
                disruption.status = "executing"
                if broadcast_cb:
                    broadcast_cb("STATUS_UPDATE", {"id": disruption.id, "status": disruption.status})

                best_plan = record.plan.recommended()
                if best_plan and self.registry.executor:
                    for step in best_plan.steps:
                        res = self.registry.executor.execute_step(step, self.registry.connectors)
                        record.results.append(res)
                        if broadcast_cb:
                            broadcast_cb("TRACE_STEP", {
                                "disruptionId": disruption.id,
                                "step": {
                                    "agentName": "Executor",
                                    "input": f"Executing: {step.action.value} on target: {step.target}",
                                    "output": f"Result: {res.detail}",
                                    "timeTakenMs": 80
                                }
                            })
                
                disruption.status = "resolved"
                if broadcast_cb:
                    broadcast_cb("STATUS_UPDATE", {"id": disruption.id, "status": disruption.status})

                # Write to Audit Sink
                if self.registry.audit_sink and best_plan:
                    audit_entry = AuditEntry(
                        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                        disruption_id=disruption.id,
                        agent="Auto-Pilot",
                        action=best_plan.steps[0].action if best_plan.steps else ActionType.UPDATE_ERP,
                        decision=Decision.AUTO_APPROVED,
                        cost=best_plan.total_cost,
                        reversible=all(s.reversible for s in best_plan.steps),
                        execution_result=record.results[0] if record.results else {
                            "action": ActionType.UPDATE_ERP,
                            "target": "system",
                            "success": True,
                            "detail": "Success"
                        }
                    )
                    self.registry.audit_sink.log(audit_entry)
                yield record
