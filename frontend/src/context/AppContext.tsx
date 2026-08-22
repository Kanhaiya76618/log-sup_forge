import { createContext, useContext, useReducer, ReactNode, Dispatch } from "react";
import { AuditEntry, Metrics, ResolutionRecord } from "../types";

export type ConnStatus = "connecting" | "connected" | "offline" | "mock";

export interface AppState {
  records: ResolutionRecord[]; // newest first, keyed by plan id
  selectedPlanId: string | null;
  audit: AuditEntry[];
  metrics: Metrics | null;
  conn: ConnStatus;
  country: string;             // active monitored country (logistics)
}

const initialState: AppState = {
  records: [],
  selectedPlanId: null,
  audit: [],
  metrics: null,
  conn: "connecting",
  country: "japan",
};

export type Action =
  | { type: "MERGE_RECORDS"; payload: ResolutionRecord[] }
  | { type: "SELECT_PLAN"; payload: string | null }
  | { type: "SET_AUDIT"; payload: AuditEntry[] }
  | { type: "SET_METRICS"; payload: Metrics }
  | { type: "SET_CONN"; payload: ConnStatus }
  | { type: "SET_COUNTRY"; payload: string };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "MERGE_RECORDS": {
      const byId = new Map(state.records.map((r) => [r.plan.id, r]));
      for (const r of action.payload) byId.set(r.plan.id, r);
      const records = [...byId.values()].sort((a, b) =>
        b.disruption.detected_at.localeCompare(a.disruption.detected_at)
      );
      // Keep the user's selection; otherwise focus the most urgent thing.
      let selectedPlanId = state.selectedPlanId;
      if (!selectedPlanId || !byId.has(selectedPlanId)) {
        selectedPlanId = (records.find((r) => r.pending) ?? records[0])?.plan.id ?? null;
      }
      return { ...state, records, selectedPlanId };
    }
    case "SELECT_PLAN":
      return { ...state, selectedPlanId: action.payload };
    case "SET_AUDIT":
      return { ...state, audit: action.payload };
    case "SET_METRICS":
      return { ...state, metrics: action.payload };
    case "SET_CONN":
      return { ...state, conn: action.payload };
    case "SET_COUNTRY":
      return { ...state, country: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{ state: AppState; dispatch: Dispatch<Action> } | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}

export function useSelectedRecord(): ResolutionRecord | null {
  const { state } = useApp();
  return state.records.find((r) => r.plan.id === state.selectedPlanId) ?? null;
}
