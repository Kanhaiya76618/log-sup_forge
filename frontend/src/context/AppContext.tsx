import { createContext, useReducer, useContext, ReactNode } from "react";
import { Disruption, AgentTraceStep, PlanOption, AuditEntry } from "../types";

export interface AppState {
  disruptions: Disruption[];
  selectedDisruptionId: string | null;
  traces: Record<string, AgentTraceStep[]>;
  plans: Record<string, PlanOption[]>;
  auditLog: AuditEntry[];
  metrics: {
    successRate: number;
    avgTimeMs: number;
    costSaved: number;
    catchRate: number;
    autoCount: number;
    escCount: number;
  };
  wsStatus: "connecting" | "connected" | "disconnected";
}

const initialState: AppState = {
  disruptions: [],
  selectedDisruptionId: null,
  traces: {},
  plans: {},
  auditLog: [],
  metrics: {
    successRate: 0,
    avgTimeMs: 0,
    costSaved: 0,
    catchRate: 0,
    autoCount: 0,
    escCount: 0,
  },
  wsStatus: "disconnected",
};

type Action =
  | { type: "SET_DISRUPTIONS"; payload: Disruption[] }
  | { type: "ADD_DISRUPTION"; payload: Disruption }
  | { type: "UPDATE_DISRUPTION_STATUS"; payload: { id: string; status: Disruption["status"] } }
  | { type: "SET_SELECTED_DISRUPTION"; payload: string | null }
  | { type: "ADD_TRACE_STEP"; payload: { disruptionId: string; step: AgentTraceStep } }
  | { type: "SET_PLANS"; payload: { disruptionId: string; plans: PlanOption[] } }
  | { type: "SET_AUDIT_LOG"; payload: AuditEntry[] }
  | { type: "ADD_AUDIT_ENTRY"; payload: AuditEntry }
  | { type: "SET_METRICS"; payload: AppState["metrics"] }
  | { type: "SET_WS_STATUS"; payload: AppState["wsStatus"] };

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_DISRUPTIONS":
      return { ...state, disruptions: action.payload };
    case "ADD_DISRUPTION":
      if (state.disruptions.some((d) => d.id === action.payload.id)) {
        return {
          ...state,
          disruptions: state.disruptions.map((d) =>
            d.id === action.payload.id ? action.payload : d
          ),
        };
      }
      return { ...state, disruptions: [action.payload, ...state.disruptions] };
    case "UPDATE_DISRUPTION_STATUS":
      return {
        ...state,
        disruptions: state.disruptions.map((d) =>
          d.id === action.payload.id ? { ...d, status: action.payload.status } : d
        ),
      };
    case "SET_SELECTED_DISRUPTION":
      return { ...state, selectedDisruptionId: action.payload };
    case "ADD_TRACE_STEP": {
      const currentSteps = state.traces[action.payload.disruptionId] || [];
      if (currentSteps.some((s) => s.agentName === action.payload.step.agentName)) {
        return state;
      }
      return {
        ...state,
        traces: {
          ...state.traces,
          [action.payload.disruptionId]: [...currentSteps, action.payload.step],
        },
      };
    }
    case "SET_PLANS":
      return {
        ...state,
        plans: {
          ...state.plans,
          [action.payload.disruptionId]: action.payload.plans,
        },
      };
    case "SET_AUDIT_LOG":
      return { ...state, auditLog: action.payload };
    case "ADD_AUDIT_ENTRY":
      return { ...state, auditLog: [action.payload, ...state.auditLog] };
    case "SET_METRICS":
      return { ...state, metrics: action.payload };
    case "SET_WS_STATUS":
      return { ...state, wsStatus: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
