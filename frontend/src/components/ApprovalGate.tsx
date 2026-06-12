// The human-in-the-loop gate. Shows the REAL gate outcome (decision + reason +
// verifier confidence/risk flags) for the selected resolution. Approve fires
// POST /approve/{plan_id} (backend executes the recommended option); Reject
// fires POST /reject/{plan_id}. Both refresh records + audit from the server.
import { useState } from "react";
import { useApp, useSelectedRecord } from "../context/AppContext";
import * as api from "../api/client";
import { recordStatus } from "../types";
import { ShieldCheck, UserCheck, Check, X, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function ApprovalGate() {
  const { dispatch } = useApp();
  const record = useSelectedRecord();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const handle = async (kind: "approve" | "reject") => {
    if (!record) return;
    setLoading(kind);
    const toastId = toast.loading("Processing decision…");
    try {
      const updated = kind === "approve"
        ? await api.approve(record.plan.id)
        : await api.reject(record.plan.id);
      dispatch({ type: "MERGE_RECORDS", payload: [updated] });
      const [audit, metrics] = await Promise.all([api.audit(), api.metrics()]);
      dispatch({ type: "SET_AUDIT", payload: audit });
      dispatch({ type: "SET_METRICS", payload: metrics });
      toast.success(kind === "approve" ? "Plan approved & dispatched" : "Plan rejected", { id: toastId });
    } catch (e) {
      toast.error(`Decision failed: ${e instanceof Error ? e.message : "network error"}`, { id: toastId });
    } finally {
      setLoading(null);
    }
  };

  if (!record) {
    return (
      <div className="glass rounded-2xl p-6 h-[220px] flex items-center justify-center text-ink-soft text-sm">
        Select a disruption to use the HITL Gate.
      </div>
    );
  }

  const status = recordStatus(record);

  if (status === "auto_resolved" || status === "human_resolved") {
    const ok = record.results.every((r) => r.success);
    return (
      <div className="glass rounded-2xl p-6 bg-emerald-500/5 border border-emerald-500/20 flex flex-col justify-center items-center h-[220px] text-center gap-2">
        <ShieldCheck className="w-10 h-10 text-emerald-400" />
        <h4 className="font-serif text-lg font-semibold text-emerald-800">
          {status === "auto_resolved" ? "Autonomous Resolution Complete" : "Executed After Operator Approval"}
        </h4>
        <p className="text-xs text-ink-soft max-w-sm">
          {record.gate.reason}. {record.results.length} action(s) executed
          {ok ? ", all successful" : " — some failed, see audit"}.
        </p>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="glass rounded-2xl p-6 bg-red/5 border border-red/20 flex flex-col justify-center items-center h-[220px] text-center gap-2">
        <X className="w-10 h-10 text-red" />
        <h4 className="font-serif text-lg font-semibold text-red">Plan Rejected</h4>
        <p className="text-xs text-ink-soft max-w-sm">
          Rejected by the operator. No irreversible actions were dispatched.
        </p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="glass rounded-2xl p-6 bg-red/5 border border-red/20 flex flex-col justify-center items-center h-[220px] text-center gap-2">
        <X className="w-10 h-10 text-red" />
        <h4 className="font-serif text-lg font-semibold text-red">Verifier Rejected the Plan</h4>
        <p className="text-xs text-ink-soft max-w-sm">{record.gate.reason}</p>
      </div>
    );
  }

  // pending_human — operator decision required
  return (
    <div className="glass rounded-2xl p-6 border border-gold/40 bg-gold/5 flex flex-col justify-between min-h-[220px] gap-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-8 h-8 text-gold flex-shrink-0 mt-0.5 animate-pulse" />
        <div>
          <h4 className="font-serif text-md font-semibold text-ink flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-gold" />
            HITL — Human In The Loop Gate
          </h4>
          <p className="text-xs text-ink-soft mt-1 leading-relaxed">
            <strong>{record.gate.reason}</strong> · Verifier confidence{" "}
            {(record.report.confidence * 100).toFixed(0)}%
          </p>
          {record.report.risk_flags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {record.report.risk_flags.map((f) => (
                <span key={f} className="text-[10px] font-mono bg-red/10 text-red px-1.5 py-0.5 rounded border border-red/20">
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          disabled={loading !== null}
          onClick={() => handle("approve")}
          className="py-3 px-4 rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all duration-200 border shadow-sm active:scale-95 disabled:opacity-50 bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600"
        >
          {loading === "approve" ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Approve & Dispatch
        </button>

        <button
          disabled={loading !== null}
          onClick={() => handle("reject")}
          className="py-3 px-4 rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all duration-200 border shadow-sm active:scale-95 disabled:opacity-50 bg-white hover:bg-red/5 hover:text-red hover:border-red/40 text-ink border-cream-deep"
        >
          {loading === "reject" ? (
            <span className="w-4 h-4 border-2 border-red border-t-transparent rounded-full animate-spin" />
          ) : (
            <X className="w-4 h-4" />
          )}
          Reject Proposal
        </button>
      </div>
    </div>
  );
}
