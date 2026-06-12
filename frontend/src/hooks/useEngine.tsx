// Polls the real engine: POST /tick on an interval (each tick runs one full
// detect->diagnose->plan->verify->gate->execute cycle server-side), then
// refreshes records/audit/metrics. Replaces the old WebSocket hook — and unlike
// it, never fabricates client-side events: if the backend is down, the UI says so.
import { useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import * as api from "../api/client";
import { useApp } from "../context/AppContext";

const POLL_MS = 20000;

export function useEngine() {
  const { dispatch } = useApp();
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    const [records, audit, metrics] = await Promise.all([
      api.records(), api.audit(), api.metrics(),
    ]);
    dispatch({ type: "MERGE_RECORDS", payload: records });
    dispatch({ type: "SET_AUDIT", payload: audit });
    dispatch({ type: "SET_METRICS", payload: metrics });
    dispatch({ type: "SET_CONN", payload: api.USE_MOCK ? "mock" : "connected" });
  }, [dispatch]);

  const runTick = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const fresh = await api.tick();
      for (const r of fresh) {
        toast(`Disruption: ${r.disruption.summary}`, { icon: "🚨" });
      }
      await refresh();
    } catch {
      dispatch({ type: "SET_CONN", payload: "offline" });
    } finally {
      busy.current = false;
    }
  }, [refresh, dispatch]);

  useEffect(() => {
    runTick(); // immediate first scan, then steady cadence
    const t = setInterval(runTick, POLL_MS);
    return () => clearInterval(t);
  }, [runTick]);

  return { runTick, refresh };
}
