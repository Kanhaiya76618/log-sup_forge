// Mirror of backend/flowforge/contracts. OWNER: P5 (keep in sync with P1).
// Tip: you can auto-generate these from /openapi.json instead of hand-mirroring.

export type Domain = "logistics" | "manufacturing";
export type DisruptionType =
  | "port_closure" | "shipment_delay" | "supply_shortage"
  | "machine_downtime" | "demand_spike" | "unknown";
export type Severity = "low" | "medium" | "high" | "critical";
export type ActionType =
  | "reroute" | "reschedule" | "replenish" | "update_erp" | "issue_po" | "notify";
export type Decision = "auto_approved" | "escalated" | "rejected" | "executed" | "failed";

export interface RawSignal {
  source: string;
  domain: Domain;
  payload: Record<string, unknown>;
  ts: string;
}

export interface Event {
  id: string;
  domain: Domain;
  kind: string;
  data: Record<string, unknown>;
  is_anomaly: boolean;
  ts: string;
}

export interface BlastRadius {
  affected_orders: string[];
  affected_skus: string[];
  value_at_risk: number;
}

export interface Disruption {
  id: string;
  domain: Domain;
  type: DisruptionType;
  severity: Severity;
  summary: string;
  blast_radius: BlastRadius;
  context: Record<string, unknown>; // structured specifics, e.g. {"blocked": ["Yokohama"]}
  source_event_id: string | null;
  detected_at: string;
}

export interface PlanStep {
  action: ActionType;
  target: string;
  params: Record<string, unknown>;
  est_cost: number;
  reversible: boolean;
}

export interface PlanOption {
  id: string;
  steps: PlanStep[];
  total_cost: number;
  est_time_min: number;
  score: number;
  rationale: string; // carries risk numbers: "… | P(on-time) 62%, E[cost] 2860, CVaR95 3390"
}

export interface Plan {
  id: string;
  disruption_id: string;
  options: PlanOption[];
  recommended_option_id: string | null;
  created_by: string;
}

export interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

export interface VerifierReport {
  plan_id: string;
  option_id: string;
  passed: boolean;
  confidence: number;
  checks: Check[];
  risk_flags: string[];
}

export interface GateOutcome {
  decision: Decision;
  reason: string;
  requires_human: boolean;
}

export interface ExecutionResult {
  action: ActionType;
  target: string;
  success: boolean;
  detail: string;
  executed_at: string;
}

export interface AuditEntry {
  id: string;
  ts: string;
  stage: string;
  ref_id: string;
  summary: string;
  payload: Record<string, unknown>;
}

export interface ResolutionRecord {
  disruption: Disruption;
  plan: Plan;
  report: VerifierReport;
  gate: GateOutcome;
  results: ExecutionResult[];
  audit_trail: AuditEntry[];
  pending: boolean;
}

// GET /metrics — computed server-side from real session records (no baked-in numbers).
export interface Metrics {
  disruptions: number;
  autoApproved: number;
  pendingHuman: number;
  humanApproved: number;
  rejected: number;
  humanLoadPct: number;
  actionsExecuted: number;
  actionSuccessPct: number;
  valueProtected: number;
  planCost: number;
  costSaved: number;
  avgTickMs: number;
}

// ---- UI-only derivations -------------------------------------------------

export type RecordStatus =
  | "pending_human" | "auto_resolved" | "human_resolved" | "rejected" | "failed";

export function recordStatus(r: ResolutionRecord): RecordStatus {
  if (r.pending) return "pending_human";
  switch (r.gate.decision) {
    case "auto_approved": return "auto_resolved";
    case "executed":      return "human_resolved";
    case "rejected":      return "rejected";
    default:              return "failed";
  }
}

/** Pull the Monte-Carlo risk numbers the solver embeds in a rationale string. */
export function parseRisk(rationale: string): {
  pOnTime: number | null; expCost: number | null; cvar95: number | null;
} {
  const pOnTime = rationale.match(/P\(on-time\)\s*(\d+)%/);
  const expCost = rationale.match(/E\[cost\]\s*([\d.]+)/);
  const cvar95 = rationale.match(/CVaR95\s*([\d.]+)/);
  return {
    pOnTime: pOnTime ? Number(pOnTime[1]) : null,
    expCost: expCost ? Number(expCost[1]) : null,
    cvar95: cvar95 ? Number(cvar95[1]) : null,
  };
}
