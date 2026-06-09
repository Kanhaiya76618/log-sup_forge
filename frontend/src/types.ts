export enum Severity {
  LOW = "low",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum DisruptionType {
  PORT_CLOSURE = "port_closure",
  SHIPMENT_DELAY = "shipment_delay",
  SUPPLY_SHORTAGE = "supply_shortage",
}

export enum ActionType {
  REROUTE = "reroute",
  REPLENISH = "replenish",
  UPDATE_ERP = "update_erp",
  NOTIFY = "notify",
  ISSUE_PO = "issue_po",
}

export enum Decision {
  AUTO_APPROVED = "auto_approved",
  ESCALATED = "escalated",
  REJECTED = "rejected",
}

export interface BlastRadius {
  affected_orders: string[];
  affected_skus: string[];
  value_at_risk: number;
}

export interface Disruption {
  id: string;
  type: DisruptionType;
  severity: Severity;
  summary: string;
  blast_radius: BlastRadius;
  status:
    | "pending"
    | "diagnosed"
    | "planning"
    | "verifying"
    | "auto_approved"
    | "escalated"
    | "executing"
    | "resolved"
    | "rejected";
}

export interface PlanStep {
  action: ActionType;
  target: string;
  params: Record<string, any>;
  est_cost: number;
  reversible: boolean;
}

export interface PlanOption {
  steps: PlanStep[];
  total_cost: number;
  est_time_min: number;
  score: number;
  rationale: string;
}

export interface VerifierReport {
  confidence: number;
  passed: boolean;
  policy_checks: Record<string, boolean>;
  reason: string;
}

export interface ExecutionResult {
  action: ActionType;
  target: string;
  success: boolean;
  detail: string;
}

export interface AuditEntry {
  timestamp: string;
  disruption_id: string;
  agent: string;
  action: ActionType;
  decision: Decision;
  cost: number;
  reversible: boolean;
  execution_result: ExecutionResult;
}

export interface AgentTraceStep {
  agentName: string;
  input: string;
  output: string;
  confidence?: number;
  timeTakenMs: number;
}

export interface AgentReasoning {
  disruptionId: string;
  steps: AgentTraceStep[];
}
