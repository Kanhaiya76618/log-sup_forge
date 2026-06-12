// Typed client against P1's FastAPI. OWNER: P5.
// Flip USE_MOCK=true to build and demo the whole UI offline against the same
// contract — this is how P5 never blocks on backend progress. The mock is
// clearly labeled in the UI (conn status "mock"), never silently substituted.
import type { AuditEntry, Metrics, RawSignal, ResolutionRecord } from "../types";

const BASE = import.meta.env.VITE_API ?? "http://localhost:8000";
export const USE_MOCK = false;

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${BASE}${path}`, init);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} on ${path}`);
  return r.json() as Promise<T>;
}

export async function tick(): Promise<ResolutionRecord[]> {
  if (USE_MOCK) return (await import("./mock")).mockTick();
  return http("/tick", { method: "POST" });
}

export async function records(): Promise<ResolutionRecord[]> {
  if (USE_MOCK) return (await import("./mock")).mockRecords();
  return http("/records");
}

export async function pending(): Promise<ResolutionRecord[]> {
  if (USE_MOCK) return (await import("./mock")).mockPending();
  return http("/pending");
}

export async function approve(planId: string): Promise<ResolutionRecord> {
  if (USE_MOCK) return (await import("./mock")).mockApprove(planId);
  return http(`/approve/${planId}`, { method: "POST" });
}

export async function reject(planId: string): Promise<ResolutionRecord> {
  if (USE_MOCK) return (await import("./mock")).mockReject(planId);
  return http(`/reject/${planId}`, { method: "POST" });
}

export async function signals(): Promise<RawSignal[]> {
  if (USE_MOCK) return [];
  return http("/signals");
}

export async function audit(): Promise<AuditEntry[]> {
  if (USE_MOCK) return (await import("./mock")).mockAudit();
  return http("/audit");
}

export async function metrics(): Promise<Metrics> {
  if (USE_MOCK) return (await import("./mock")).mockMetrics();
  return http("/metrics");
}
