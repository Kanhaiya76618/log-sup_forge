// Mock engine matching the contract so P5 can build/demo before the backend is
// ready (USE_MOCK in client.ts). It mimics the real engine's behavior — one new
// disruption per tick, a HITL queue, audit entries — and its metrics are computed
// from this state, never hardcoded.
import type {
  AuditEntry, ExecutionResult, Metrics, ResolutionRecord,
} from "../types";

let seq = 0;
const store = new Map<string, ResolutionRecord>();
const auditLog: AuditEntry[] = [];

function now(): string {
  return new Date().toISOString();
}

function entry(stage: string, refId: string, summary: string,
               payload: Record<string, unknown> = {}): AuditEntry {
  const e = { id: `aud_mock${auditLog.length}`, ts: now(), stage, ref_id: refId, summary, payload };
  auditLog.push(e);
  return e;
}

function makeRecord(i: number): ResolutionRecord {
  const n = 100 + i;
  const escalate = i % 3 === 2; // supply shortage -> irreversible PO -> HITL
  const disruptionId = `dsr_mock${n}`;
  const planId = `pln_mock${n}`;
  const optionId = `opt_mock${n}`;

  const disruption = escalate
    ? {
        id: disruptionId, domain: "logistics" as const, type: "supply_shortage" as const,
        severity: "critical" as const,
        summary: `Critical component shortfall from primary supplier (SKU-${n})`,
        blast_radius: { affected_orders: [], affected_skus: [`SKU-${n}`], value_at_risk: 4000 + i * 200 },
        context: {}, source_event_id: `evt_mock${n}`, detected_at: now(),
      }
    : {
        id: disruptionId, domain: "logistics" as const, type: "port_closure" as const,
        severity: "high" as const, summary: "Yokohama port closed 48h (typhoon)",
        blast_radius: { affected_orders: ["ORD-1041", "ORD-1042"], affected_skus: ["SKU-A", "SKU-B"], value_at_risk: 18000 },
        context: { blocked: ["Yokohama"] }, source_event_id: `evt_mock${n}`, detected_at: now(),
      };

  const options = escalate
    ? [{
        id: optionId,
        steps: [
          { action: "replenish" as const, target: "sup_intl", params: { qty: 96 }, est_cost: 912, reversible: true },
          { action: "issue_po" as const, target: "sup_intl", params: { qty: 96, unit_price: 9.5 }, est_cost: 912, reversible: false },
          { action: "update_erp" as const, target: "erp", params: { po: "sup_intl" }, est_cost: 0, reversible: true },
        ],
        total_cost: 912, est_time_min: 7200, score: 0.81,
        rationale: "Cover ~96-unit shortfall via sup_intl at 9.5/unit (lead 7200 min). PO commits funds, so human approval is required. | P(on-time) 100%, E[cost] 912, CVaR95 912",
      }]
    : [{
        id: optionId,
        steps: [
          { action: "reroute" as const, target: "ORD-1041", params: { route: "sea_kobe", via: ["Shanghai", "Kobe", "Tokyo_DC"] }, est_cost: 1600, reversible: true },
          { action: "reroute" as const, target: "ORD-1042", params: { route: "rail_busan", via: ["Busan", "Kobe", "Tokyo_DC"] }, est_cost: 2600, reversible: true },
          { action: "update_erp" as const, target: "erp", params: { status: "rerouted" }, est_cost: 0, reversible: true },
          { action: "notify" as const, target: "procurement", params: { channel: "email" }, est_cost: 0, reversible: true },
        ],
        total_cost: 4200, est_time_min: 3600, score: 0.42,
        rationale: "cost-optimal: reroute 2 shipment(s); cost 4200, max transit 3600 min. | P(on-time) 38%, E[cost] 4295, CVaR95 5235",
      }];

  const trail = [
    entry("watcher", `evt_mock${n}`, "anomaly detected", { kind: escalate ? "supply" : "port_status" }),
    entry("diagnosis", disruptionId, disruption.summary, { severity: disruption.severity }),
    entry("planner", planId, `${options.length} option(s)`, { recommended: optionId }),
    entry("verifier", planId, `passed=True conf=${escalate ? "0.55" : "0.88"}`,
          { risk_flags: escalate ? ["irreversible_action"] : [] }),
    entry("gate", planId, escalate ? "escalated" : "auto_approved",
          { reason: escalate ? "Plan contains an irreversible action" : "Confident, cheap, reversible" }),
  ];

  const results: ExecutionResult[] = escalate ? [] : options[0].steps.map((s) => ({
    action: s.action, target: s.target, success: true,
    detail: `applied ${s.action} to ${s.target}`, executed_at: now(),
  }));
  if (!escalate) {
    for (const s of options[0].steps) entry("executor", planId, `${s.action}->${s.target} ok=True`);
  }

  return {
    disruption,
    plan: { id: planId, disruption_id: disruptionId, options, recommended_option_id: optionId, created_by: "planner" },
    report: {
      plan_id: planId, option_id: optionId, passed: true,
      confidence: escalate ? 0.55 : 0.88,
      checks: [
        { name: "cost_ceiling", passed: true, detail: `cost=${options[0].total_cost}` },
        { name: "has_steps", passed: true, detail: "" },
        { name: "erp_sync", passed: true, detail: "plan must include an update_erp step" },
      ],
      risk_flags: escalate ? ["irreversible_action"] : [],
    },
    gate: escalate
      ? { decision: "escalated", reason: "Plan contains an irreversible action", requires_human: true }
      : { decision: "auto_approved", reason: "Confident, cheap, reversible", requires_human: false },
    results,
    audit_trail: trail,
    pending: escalate,
  };
}

export function mockTick(): ResolutionRecord[] {
  const r = makeRecord(seq++);
  store.set(r.plan.id, r);
  return [r];
}

export function mockRecords(): ResolutionRecord[] {
  return [...store.values()];
}

export function mockPending(): ResolutionRecord[] {
  return [...store.values()].filter((r) => r.pending);
}

export function mockApprove(planId: string): ResolutionRecord {
  const r = store.get(planId);
  if (!r || !r.pending) throw new Error(`No pending plan ${planId}`);
  r.pending = false;
  r.gate = { decision: "executed", reason: "Approved by human operator", requires_human: false };
  r.audit_trail.push(entry("gate", planId, "approved by human operator"));
  const opt = r.plan.options.find((o) => o.id === r.plan.recommended_option_id) ?? r.plan.options[0];
  r.results = opt.steps.map((s) => {
    r.audit_trail.push(entry("executor", planId, `${s.action}->${s.target} ok=True`));
    return { action: s.action, target: s.target, success: true,
             detail: `applied ${s.action} to ${s.target}`, executed_at: now() };
  });
  return r;
}

export function mockReject(planId: string): ResolutionRecord {
  const r = store.get(planId);
  if (!r || !r.pending) throw new Error(`No pending plan ${planId}`);
  r.pending = false;
  r.gate = { decision: "rejected", reason: "Rejected by human operator", requires_human: false };
  r.audit_trail.push(entry("gate", planId, "rejected by human operator"));
  return r;
}

export function mockAudit(): AuditEntry[] {
  return [...auditLog];
}

export function mockMetrics(): Metrics {
  const recs = [...store.values()];
  const auto = recs.filter((r) => r.gate.decision === "auto_approved").length;
  const pendingHuman = recs.filter((r) => r.pending).length;
  const humanApproved = recs.filter((r) => r.gate.decision === "executed").length;
  const rejected = recs.filter((r) => r.gate.decision === "rejected").length;
  const executed = recs.filter((r) => r.results.length > 0);
  const actions = executed.flatMap((r) => r.results);
  const planCost = executed.reduce((s, r) => {
    const opt = r.plan.options.find((o) => o.id === r.plan.recommended_option_id) ?? r.plan.options[0];
    return s + (opt?.total_cost ?? 0);
  }, 0);
  const valueProtected = executed.reduce((s, r) => s + r.disruption.blast_radius.value_at_risk, 0);
  return {
    disruptions: recs.length,
    autoApproved: auto,
    pendingHuman,
    humanApproved,
    rejected,
    humanLoadPct: recs.length ? Math.round(1000 * (pendingHuman + humanApproved + rejected) / recs.length) / 10 : 0,
    actionsExecuted: actions.length,
    actionSuccessPct: actions.length ? 100 : 0,
    valueProtected,
    planCost,
    costSaved: valueProtected - planCost,
    avgTickMs: 6.0,
  };
}
