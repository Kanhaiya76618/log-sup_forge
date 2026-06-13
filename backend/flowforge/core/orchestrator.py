"""The engine loop. OWNER: P1. Depends only on interfaces + contracts, so each
lane can swap its implementation without ever touching this file."""
from ..contracts import (Domain, Event, ActionRequest, AuditEntry, GateOutcome,
                         Decision, ResolutionRecord)
from ..interfaces import (Watcher, Diagnoser, Planner, Verifier,
                          BaseExecutor, BaseAuditSink)
from .registry import Registry
from .gate import Gate


class Orchestrator:
    def __init__(self, registry: Registry, watcher: Watcher, diagnoser: Diagnoser,
                 planner: Planner, verifier: Verifier, executor: BaseExecutor,
                 gate: Gate, audit: BaseAuditSink) -> None:
        self.registry, self.watcher, self.diagnoser = registry, watcher, diagnoser
        self.planner, self.verifier, self.executor = planner, verifier, executor
        self.gate, self.audit = gate, audit
        self._pending: dict[str, ResolutionRecord] = {}

    def _log(self, stage: str, ref_id: str, summary: str, **payload) -> AuditEntry:
        e = AuditEntry(stage=stage, ref_id=ref_id, summary=summary, payload=payload)
        self.audit.write(e)
        return e

    def tick(self, domain: Domain = Domain.LOGISTICS,
             country: str | None = None) -> list[ResolutionRecord]:
        connector = self.registry.connector(domain)
        if country is not None and hasattr(connector, "use_country"):
            connector.use_country(country)
        events = self.watcher.scan(connector.fetch_signals())
        out = [self._resolve(ev, domain) for ev in events if ev.is_anomaly]
        # Domain switch: when logistics is calm (no live disruption), fall through
        # to the manufacturing line so the agents are always doing real work.
        if not out and domain == Domain.LOGISTICS \
                and Domain.MANUFACTURING in self.registry.domains():
            mfg = self.registry.connector(Domain.MANUFACTURING)
            mevents = self.watcher.scan(mfg.fetch_signals())
            out = [self._resolve(ev, Domain.MANUFACTURING)
                   for ev in mevents if ev.is_anomaly]
        return out

    def _resolve(self, ev: Event, domain: Domain) -> ResolutionRecord:
        trail = [self._log("watcher", ev.id, "anomaly detected", kind=ev.kind)]
        disruption = self.diagnoser.diagnose(ev)
        trail.append(self._log("diagnosis", disruption.id, disruption.summary,
                               severity=disruption.severity))
        planner = self.registry.planner_for(domain) or self.planner
        plan = planner.plan(disruption)
        opt = plan.recommended() or (plan.options[0] if plan.options else None)
        trail.append(self._log("planner", plan.id,
                               f"{len(plan.options)} option(s)",
                               recommended=opt.id if opt else None))
        report = self.verifier.verify(plan, opt.id) if opt else None
        if report:
            trail.append(self._log("verifier", plan.id,
                                   f"passed={report.passed} conf={report.confidence:.2f}",
                                   risk_flags=report.risk_flags))
        gate = (self.gate.decide(report, opt) if report and opt
                else GateOutcome(decision=Decision.REJECTED, reason="No plan"))
        trail.append(self._log("gate", plan.id, gate.decision, reason=gate.reason))

        record = ResolutionRecord(disruption=disruption, plan=plan, report=report,
                                  gate=gate, audit_trail=trail,
                                  pending=gate.requires_human)
        if gate.decision == Decision.AUTO_APPROVED and opt:
            record.results = self._execute(plan, opt, domain, trail)
        elif gate.requires_human:
            self._pending[plan.id] = record
        return record

    def _execute(self, plan, opt, domain, trail):
        connector = self.registry.connector(domain)
        results = []
        for step in opt.steps:
            req = ActionRequest(plan_id=plan.id, option_id=opt.id,
                                action=step.action, target=step.target, params=step.params)
            res = self.executor.execute(req, connector)
            results.append(res)
            trail.append(self._log("executor", plan.id,
                                   f"{step.action.value}->{step.target} ok={res.success}"))
        return results

    # --- human-in-the-loop ---
    def pending(self) -> list[ResolutionRecord]:
        return list(self._pending.values())

    def approve(self, plan_id: str, domain: Domain = Domain.LOGISTICS) -> ResolutionRecord:
        rec = self._pending.pop(plan_id)
        opt = rec.plan.recommended() or rec.plan.options[0]
        rec.audit_trail.append(self._log("gate", plan_id, "approved by human operator"))
        rec.results = self._execute(rec.plan, opt, domain, rec.audit_trail)
        rec.pending = False
        rec.gate = GateOutcome(decision=Decision.EXECUTED,
                               reason="Approved by human operator", requires_human=False)
        return rec

    def reject(self, plan_id: str) -> ResolutionRecord:
        rec = self._pending.pop(plan_id)
        rec.pending = False
        rec.gate = GateOutcome(decision=Decision.REJECTED,
                               reason="Rejected by human operator", requires_human=False)
        rec.audit_trail.append(self._log("gate", plan_id, "rejected by human operator"))
        return rec
