import { Disruption, AuditEntry, PlanOption, Decision, ActionType, Severity, DisruptionType } from "../types";

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/$/, "");

let mockDisruptions: Disruption[] = [
  {
    id: "DIS-001",
    type: DisruptionType.PORT_CLOSURE,
    severity: Severity.CRITICAL,
    summary: "Typhoon approaching Yokohama port — complete dock shutdown expected",
    blast_radius: {
      affected_orders: ["ORD-501", "ORD-502", "ORD-503"],
      affected_skus: ["SKU-A92", "SKU-B12"],
      value_at_risk: 15400,
    },
    status: "escalated",
  },
  {
    id: "DIS-002",
    type: DisruptionType.SHIPMENT_DELAY,
    severity: Severity.HIGH,
    summary: "Shanghai container congestion delays Sea Yokohama liner by 4 days",
    blast_radius: {
      affected_orders: ["ORD-610"],
      affected_skus: ["SKU-Z01"],
      value_at_risk: 4200,
    },
    status: "auto_approved",
  },
];

const mockPlans: Record<string, PlanOption[]> = {
  "DIS-001": [
    {
      steps: [
        {
          action: ActionType.REROUTE,
          target: "ORD-501",
          params: { route: "rail_busan", via: ["Busan", "Kobe", "Tokyo_DC"] },
          est_cost: 2600,
          reversible: true,
        },
        {
          action: ActionType.UPDATE_ERP,
          target: "erp",
          params: { status: "rerouted" },
          est_cost: 0,
          reversible: true,
        },
        {
          action: ActionType.NOTIFY,
          target: "procurement",
          params: { channel: "email" },
          est_cost: 0,
          reversible: true,
        },
      ],
      total_cost: 2600,
      est_time_min: 2400,
      score: 0.82,
      rationale: "Balanced: Reroute via Busan rail line, bypassing Yokohama. 2400 min transit, moderate cost.",
    },
    {
      steps: [
        {
          action: ActionType.REROUTE,
          target: "ORD-501",
          params: { route: "air_express", via: ["PVG", "Narita", "Tokyo_DC"] },
          est_cost: 9000,
          reversible: true,
        },
        {
          action: ActionType.UPDATE_ERP,
          target: "erp",
          params: { status: "express_air" },
          est_cost: 0,
          reversible: true,
        },
      ],
      total_cost: 9000,
      est_time_min: 600,
      score: 0.58,
      rationale: "Time-optimal: Express air freight to Narita. Ultra-fast (600 min) but expensive ($9000).",
    },
  ],
};

let mockAuditLog: AuditEntry[] = [
  {
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    disruption_id: "DIS-002",
    agent: "Executor",
    action: ActionType.REROUTE,
    decision: Decision.AUTO_APPROVED,
    cost: 1200,
    reversible: true,
    execution_result: {
      action: ActionType.REROUTE,
      target: "ORD-610",
      success: true,
      detail: "Rerouted to Yokohama sea route.",
    },
  },
];

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, opts);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const api = {
  async fetchDisruptions(): Promise<Disruption[]> {
    try {
      return await apiFetch<Disruption[]>("/disruptions");
    } catch {
      return [...mockDisruptions];
    }
  },

  async fetchPlans(disruptionId: string): Promise<PlanOption[]> {
    try {
      return await apiFetch<PlanOption[]>(`/disruptions/${disruptionId}/plans`);
    } catch {
      return mockPlans[disruptionId] ?? [];
    }
  },

  async submitApprovalDecision(
    disruptionId: string,
    decision: Decision,
    planIndex: number
  ): Promise<{ success: boolean }> {
    try {
      return await apiFetch<{ success: boolean }>(`/disruptions/${disruptionId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, planIndex }),
      });
    } catch {
      // Mock: mutate local state
      mockDisruptions = mockDisruptions.map((d) =>
        d.id === disruptionId
          ? { ...d, status: decision === Decision.REJECTED ? "rejected" : "resolved" }
          : d
      );
      const targetPlan = mockPlans[disruptionId]?.[planIndex];
      if (targetPlan) {
        mockAuditLog = [
          {
            timestamp: new Date().toISOString(),
            disruption_id: disruptionId,
            agent: "HITL Gate",
            action: targetPlan.steps[0]?.action ?? ActionType.UPDATE_ERP,
            decision,
            cost: targetPlan.total_cost,
            reversible: targetPlan.steps.every((s) => s.reversible),
            execution_result: {
              action: targetPlan.steps[0]?.action ?? ActionType.UPDATE_ERP,
              target: targetPlan.steps[0]?.target ?? "system",
              success: true,
              detail: `HITL ${decision}: ${targetPlan.rationale}`,
            },
          },
          ...mockAuditLog,
        ];
      }
      return { success: true };
    }
  },

  async fetchAuditLog(): Promise<AuditEntry[]> {
    try {
      return await apiFetch<AuditEntry[]>("/audit");
    } catch {
      return [...mockAuditLog];
    }
  },

  async fetchMetrics(): Promise<{
    successRate: number;
    avgTimeMs: number;
    costSaved: number;
    catchRate: number;
    autoCount: number;
    escCount: number;
  }> {
    try {
      return await apiFetch("/metrics");
    } catch {
      return {
        successRate: 94.2,
        avgTimeMs: 1280,
        costSaved: 42350,
        catchRate: 0.89,
        autoCount: 28,
        escCount: 6,
      };
    }
  },
};
