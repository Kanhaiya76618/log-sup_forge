import { useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { Disruption, PlanOption, Decision, ActionType, Severity, DisruptionType } from "../types";
import toast from "react-hot-toast";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws";

export function useWebSocket() {
  const { dispatch } = useApp();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const mockCountRef = useRef(100);

  useEffect(() => {
    let active = true;

    function connect() {
      dispatch({ type: "SET_WS_STATUS", payload: "connecting" });
      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        if (!active) return;
        dispatch({ type: "SET_WS_STATUS", payload: "connected" });
        reconnectCountRef.current = 0;
        toast.success("FlowForge Agent Core Connected", { id: "ws-status" });
      };

      socket.onmessage = (event) => {
        if (!active) return;
        try {
          const data = JSON.parse(event.data);
          handleWsMessage(data);
        } catch (err) {
          console.error("WS Parse Err:", err);
        }
      };

      socket.onclose = () => {
        if (!active) return;
        dispatch({ type: "SET_WS_STATUS", payload: "disconnected" });
        socketRef.current = null;
        const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 30000);
        reconnectCountRef.current += 1;
        toast.error(`Agent Core Offline. Reconnecting in ${(delay / 1000).toFixed(0)}s...`, {
          id: "ws-status",
        });
        reconnectTimerRef.current = window.setTimeout(() => {
          if (active) connect();
        }, delay);
      };

      socket.onerror = () => { socket.close(); };
    }

    connect();

    // Backup offline mock generator — fires when WS isn't open
    const interval = setInterval(() => {
      if (socketRef.current?.readyState !== WebSocket.OPEN) {
        generateMockEvent();
      }
    }, 12000);

    return () => {
      active = false;
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      clearInterval(interval);
    };
  }, [dispatch]);

  function handleWsMessage(data: { type: string; payload: any }) {
    switch (data.type) {
      case "NEW_DISRUPTION":
        dispatch({ type: "ADD_DISRUPTION", payload: data.payload as Disruption });
        toast(`New disruption: ${(data.payload as Disruption).summary}`, { icon: "🚨" });
        break;
      case "TRACE_STEP":
        dispatch({ type: "ADD_TRACE_STEP", payload: data.payload });
        if (data.payload.step?.agentName === "Executor") {
          toast.success(`Executor: ${data.payload.step.output}`);
        }
        break;
      case "STATUS_UPDATE":
        dispatch({ type: "UPDATE_DISRUPTION_STATUS", payload: data.payload });
        break;
      case "PLANS_GENERATED":
        dispatch({ type: "SET_PLANS", payload: data.payload });
        break;
    }
  }

  function generateMockEvent() {
    mockCountRef.current += 1;
    const n = mockCountRef.current;
    const id = `DIS-${n}`;
    const types: DisruptionType[] = [
      DisruptionType.PORT_CLOSURE,
      DisruptionType.SHIPMENT_DELAY,
      DisruptionType.SUPPLY_SHORTAGE,
    ];
    const severities: Severity[] = [Severity.LOW, Severity.HIGH, Severity.CRITICAL];
    const type = types[n % 3];
    const severity = severities[n % 3];

    const summaries: Record<DisruptionType, string> = {
      [DisruptionType.PORT_CLOSURE]: `Storm surge closes Kobe port gates — incident #${n}`,
      [DisruptionType.SHIPMENT_DELAY]: `Customs hold at Shanghai Hub for container #${n}`,
      [DisruptionType.SUPPLY_SHORTAGE]: `Critical parts shortage from primary supplier — SKU-${n}`,
    };

    const newDisruption: Disruption = {
      id,
      type,
      severity,
      summary: summaries[type],
      blast_radius: {
        affected_orders: [`ORD-${n}A`, `ORD-${n}B`],
        affected_skus: [`SKU-M${n}`],
        value_at_risk: Math.round(2000 + Math.random() * 8000),
      },
      status: "pending",
    };

    dispatch({ type: "ADD_DISRUPTION", payload: newDisruption });
    toast(`Disruption detected: ${newDisruption.summary}`, { icon: "⚠️" });

    // Watcher → 1.5 s
    setTimeout(() => {
      dispatch({ type: "UPDATE_DISRUPTION_STATUS", payload: { id, status: "diagnosed" } });
      dispatch({
        type: "ADD_TRACE_STEP",
        payload: {
          disruptionId: id,
          step: {
            agentName: "Watcher",
            input: "Raw API feeds & event buffers",
            output: `Anomaly matched: ${type}`,
            confidence: 0.98,
            timeTakenMs: 140,
          },
        },
      });
    }, 1500);

    // Diagnosis → 3 s
    setTimeout(() => {
      dispatch({ type: "UPDATE_DISRUPTION_STATUS", payload: { id, status: "planning" } });
      dispatch({
        type: "ADD_TRACE_STEP",
        payload: {
          disruptionId: id,
          step: {
            agentName: "Diagnosis",
            input: `Disruption context for ${id}`,
            output: `Severity: ${severity}. Value at risk: $${newDisruption.blast_radius.value_at_risk}`,
            confidence: 0.95,
            timeTakenMs: 250,
          },
        },
      });
    }, 3000);

    // Planner → 4.5 s
    setTimeout(() => {
      const plans: PlanOption[] = [
        {
          steps: [
            {
              action: type === DisruptionType.SUPPLY_SHORTAGE ? ActionType.REPLENISH : ActionType.REROUTE,
              target: `PO-${n}`,
              params: { qty: 250, route: "sea_kobe" },
              est_cost: 1500,
              reversible: true,
            },
            {
              action: ActionType.UPDATE_ERP,
              target: "erp",
              params: { updated: true },
              est_cost: 0,
              reversible: true,
            },
          ],
          total_cost: 1500,
          est_time_min: 1440,
          score: 0.91,
          rationale: "Cost-optimal reroute via Kobe harbour lane.",
        },
      ];
      dispatch({ type: "SET_PLANS", payload: { disruptionId: id, plans } });
      dispatch({ type: "UPDATE_DISRUPTION_STATUS", payload: { id, status: "verifying" } });
      dispatch({
        type: "ADD_TRACE_STEP",
        payload: {
          disruptionId: id,
          step: {
            agentName: "Planner",
            input: "Solver constraints & network graph",
            output: "Cost-optimal rerouting proposal generated.",
            confidence: 0.91,
            timeTakenMs: 420,
          },
        },
      });
    }, 4500);

    // Verifier → 6 s
    setTimeout(() => {
      const isCritical = severity === Severity.CRITICAL;
      const nextStatus = isCritical ? "escalated" : "auto_approved";
      dispatch({ type: "UPDATE_DISRUPTION_STATUS", payload: { id, status: nextStatus } });
      dispatch({
        type: "ADD_TRACE_STEP",
        payload: {
          disruptionId: id,
          step: {
            agentName: "Verifier",
            input: "Proposed plans & cost ceilings",
            output: isCritical
              ? "Critical severity — irreversible PO required. Escalating to HITL."
              : "All policy checks passed. Auto-executing.",
            confidence: 0.88,
            timeTakenMs: 310,
          },
        },
      });

      if (!isCritical) {
        // Executor → 8 s
        setTimeout(() => {
          dispatch({ type: "UPDATE_DISRUPTION_STATUS", payload: { id, status: "executing" } });
          dispatch({
            type: "ADD_TRACE_STEP",
            payload: {
              disruptionId: id,
              step: {
                agentName: "Executor",
                input: "Approved plan steps",
                output: "ERP updated, notifications dispatched. Disruption resolved.",
                timeTakenMs: 180,
              },
            },
          });
          dispatch({ type: "UPDATE_DISRUPTION_STATUS", payload: { id, status: "resolved" } });
          dispatch({
            type: "ADD_AUDIT_ENTRY",
            payload: {
              timestamp: new Date().toISOString(),
              disruption_id: id,
              agent: "Auto-Pilot",
              action: ActionType.REROUTE,
              decision: Decision.AUTO_APPROVED,
              cost: 1500,
              reversible: true,
              execution_result: {
                action: ActionType.REROUTE,
                target: `PO-${n}`,
                success: true,
                detail: "Auto-pilot resolution complete.",
              },
            },
          });
          toast.success(`Executor: ${id} auto-resolved.`);
        }, 2000);
      }
    }, 6000);
  }
}
