"""Manufacturing connector — proof the engine generalizes beyond routing.
OWNER: P3/P4. Same BaseConnector interface, different domain: a production line
emits machine_downtime / material_shortage events carrying the live job-shop
state the Scheduler agent needs.

No free real-time factory feed exists, so signals are SYNTHETIC but never
hardcoded: the line state is derived from the current clock so every tick
differs (which machine trips, how loaded it is, how urgent). Provenance is
labeled "synthetic" honestly. Always succeeds — no network, so it doubles as the
engine's fall-through work when logistics is calm."""
from __future__ import annotations
import time

from ...interfaces import BaseConnector
from ...contracts import RawSignal, ActionRequest, ExecutionResult, Domain

LINE = "LINE-A"
MACHINES = ["M1", "M2", "M3", "M4"]
SKUS = ["SKU-7700", "SKU-7701", "SKU-7702", "SKU-7703", "SKU-7704", "SKU-7705"]


def _line_state(now: float | None = None) -> dict:
    """Deterministic-but-time-varying snapshot of the line. Each minute rotates
    which machine is at risk and reshuffles the job book, so the demo is live
    (changes every tick) without inventing a fake data source."""
    t = int(now if now is not None else time.time())
    minute = t // 60
    down = MACHINES[minute % len(MACHINES)]            # the at-risk machine rotates
    n_jobs = 6 + (minute % 4)                          # 6..9 jobs in flight
    jobs = []
    for i in range(n_jobs):
        seed = (minute * 7 + i * 13)
        machine = MACHINES[(minute + i) % len(MACHINES)]
        proc = 60 + (seed % 6) * 30                    # 60..210 min
        due = 240 + ((seed * 3) % 8) * 60              # 240..660 min from now
        jobs.append({"id": f"J{i+1}", "machine": machine,
                     "proc_min": proc, "due_min": due,
                     "sku": SKUS[(seed) % len(SKUS)]})
    return {"line": LINE, "machines": list(MACHINES), "down_machine": down, "jobs": jobs}


class ManufacturingConnector(BaseConnector):
    domain = Domain.MANUFACTURING

    def fetch_signals(self) -> list[RawSignal]:
        st = _line_state()
        moved = [j for j in st["jobs"] if j["machine"] == st["down_machine"]]
        # urgency = how many of the displaced jobs are tight against their due time
        urgent = sum(1 for j in moved if j["due_min"] <= 360)
        severity = "critical" if urgent >= 2 else "high"
        value = round(sum(j["proc_min"] for j in moved) * 45.0, 2)  # idle-minute cost
        payload = {
            "kind": "machine_downtime", "provenance": "synthetic",
            "anomaly": bool(moved), "type": "machine_downtime", "severity": severity,
            "summary": (f"{st['down_machine']} on {st['line']} down — "
                        f"{len(moved)} job(s) need reassignment across "
                        f"{len(st['machines']) - 1} machines"),
            "line": st["line"], "machines": st["machines"],
            "down_machine": st["down_machine"], "jobs": st["jobs"],
            "skus": sorted({j["sku"] for j in moved}),
            "value_at_risk": value,
        }
        return [RawSignal(source="line-telemetry", domain=Domain.MANUFACTURING,
                          payload=payload)]

    def apply_action(self, request: ActionRequest) -> ExecutionResult:
        return ExecutionResult(action=request.action, target=request.target,
                               success=True,
                               detail=f"applied {request.action} to {request.target}")
