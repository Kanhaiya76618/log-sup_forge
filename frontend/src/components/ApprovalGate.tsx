import { useState } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";
import { Decision } from "../types";
import { ShieldCheck, UserCheck, Check, X, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

interface ApprovalGateProps {
  selectedPlanIndex: number;
}

export default function ApprovalGate({ selectedPlanIndex }: ApprovalGateProps) {
  const { state, dispatch } = useApp();
  const [loading, setLoading] = useState(false);
  const [actionTaken, setActionTaken] = useState<"approved" | "rejected" | null>(null);

  const activeId = state.selectedDisruptionId;
  const activeDisruption = state.disruptions.find((d) => d.id === activeId);

  const handleDecision = async (decision: Decision) => {
    if (!activeId) return;
    setLoading(true);
    setActionTaken(decision === Decision.REJECTED ? "rejected" : "approved");

    const toastId = toast.loading("Processing decision…");
    try {
      const result = await api.submitApprovalDecision(activeId, decision, selectedPlanIndex);
      if (result.success) {
        dispatch({
          type: "UPDATE_DISRUPTION_STATUS",
          payload: {
            id: activeId,
            status: decision === Decision.REJECTED ? "rejected" : "resolved",
          },
        });
        toast.success(
          decision === Decision.REJECTED ? "Plan Rejected" : "Plan Approved & Dispatched",
          { id: toastId }
        );
        const auditLog = await api.fetchAuditLog();
        dispatch({ type: "SET_AUDIT_LOG", payload: auditLog });
      } else {
        throw new Error("Backend returned failure");
      }
    } catch {
      toast.error("Network error — decision reverted.", { id: toastId });
    } finally {
      setLoading(false);
      setActionTaken(null);
    }
  };

  if (!activeId || !activeDisruption) {
    return (
      <div className="glass rounded-2xl p-6 h-[220px] flex items-center justify-center text-ink-soft text-sm">
        Select an escalated disruption to use the HITL Gate.
      </div>
    );
  }

  // Auto-resolved / resolved case
  if (activeDisruption.status === "auto_approved" || activeDisruption.status === "resolved") {
    return (
      <div className="glass rounded-2xl p-6 bg-emerald-500/5 border border-emerald-500/20 flex flex-col justify-center items-center h-[220px] text-center gap-2">
        <ShieldCheck className="w-10 h-10 text-emerald-400 animate-bounce" />
        <h4 className="font-serif text-lg font-semibold text-emerald-800">
          Autonomous Resolution Complete
        </h4>
        <p className="text-xs text-ink-soft max-w-sm">
          FlowForge confidence exceeded the threshold. Plan verified and executed automatically — zero human load.
        </p>
      </div>
    );
  }

  // Rejected case
  if (activeDisruption.status === "rejected") {
    return (
      <div className="glass rounded-2xl p-6 bg-red/5 border border-red/20 flex flex-col justify-center items-center h-[220px] text-center gap-2">
        <X className="w-10 h-10 text-red" />
        <h4 className="font-serif text-lg font-semibold text-red">Plan Rejected</h4>
        <p className="text-xs text-ink-soft max-w-sm">
          The proposed plan was rejected by the operator. No irreversible actions were dispatched.
        </p>
      </div>
    );
  }

  // Escalated — needs human decision
  if (activeDisruption.status === "escalated") {
    return (
      <div className="glass rounded-2xl p-6 border border-gold/40 bg-gold/5 flex flex-col justify-between h-[220px]">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-8 h-8 text-gold flex-shrink-0 mt-0.5 animate-pulse" />
          <div>
            <h4 className="font-serif text-md font-semibold text-ink flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-gold" />
              HITL — Human In The Loop Gate
            </h4>
            <p className="text-xs text-ink-soft mt-1 leading-relaxed">
              Verifier flagged an <strong>irreversible PO action</strong> or low-confidence plan. Operator authorization required.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            disabled={loading}
            onClick={() => handleDecision(Decision.ESCALATED)}
            className={`py-3 px-4 rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all duration-200 border shadow-sm active:scale-95 disabled:opacity-50 ${
              actionTaken === "approved"
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600"
            }`}
          >
            {loading && actionTaken === "approved" ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Approve & Dispatch
          </button>

          <button
            disabled={loading}
            onClick={() => handleDecision(Decision.REJECTED)}
            className={`py-3 px-4 rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-2 transition-all duration-200 border shadow-sm active:scale-95 disabled:opacity-50 ${
              actionTaken === "rejected"
                ? "bg-red/10 text-red border-red/30 cursor-not-allowed"
                : "bg-white hover:bg-red/5 hover:text-red hover:border-red/40 text-ink border-cream-deep"
            }`}
          >
            {loading && actionTaken === "rejected" ? (
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

  // Default — still planning/verifying
  return (
    <div className="glass rounded-2xl p-6 h-[220px] flex flex-col justify-center items-center text-center gap-3">
      <span className="w-8 h-8 rounded-full border-2 border-sakura border-t-transparent animate-spin" />
      <h4 className="font-serif text-sm font-semibold text-ink">Agent Loop In Progress</h4>
      <p className="text-xs text-ink-soft max-w-xs">
        Awaiting Verifier output before the HITL gate becomes active.
      </p>
    </div>
  );
}
