import { useApp } from "../context/AppContext";
import { Disruption, Severity } from "../types";
import { AlertCircle, ShieldAlert, Clock, CheckCircle2 } from "lucide-react";

export default function DisruptionFeed() {
  const { state, dispatch } = useApp();

  const getStatusStyle = (status: Disruption["status"]) => {
    switch (status) {
      case "pending":      return { bg: "bg-blue-100/10 text-blue-400 border-blue-500/30",      label: "Pending" };
      case "diagnosed":   return { bg: "bg-purple-100/10 text-purple-400 border-purple-500/30", label: "Diagnosed" };
      case "planning":    return { bg: "bg-amber-100/10 text-amber-400 border-amber-500/30",     label: "Planning" };
      case "verifying":   return { bg: "bg-indigo-100/10 text-indigo-400 border-indigo-500/30",  label: "Verifying" };
      case "auto_approved": return { bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40", label: "Auto Approved" };
      case "escalated":   return { bg: "bg-red/20 text-red border-red/40 animate-pulse",          label: "Escalated" };
      case "executing":   return { bg: "bg-cyan-100/10 text-cyan-400 border-cyan-500/30",         label: "Executing" };
      case "resolved":    return { bg: "bg-emerald-100/10 text-emerald-400 border-emerald-500/30",label: "Resolved" };
      case "rejected":    return { bg: "bg-gray-100/10 text-gray-400 border-gray-500/30",         label: "Rejected" };
      default:            return { bg: "bg-gray-100/10 text-gray-400 border-gray-500/30",         label: status };
    }
  };

  const getSeverityStyle = (severity: Severity) => {
    switch (severity) {
      case Severity.CRITICAL: return { text: "text-red border-red/30 bg-red/5",           icon: ShieldAlert };
      case Severity.HIGH:     return { text: "text-gold border-gold/30 bg-gold/5",         icon: AlertCircle };
      default:                return { text: "text-ink-soft border-ink-soft/30 bg-ink-soft/5", icon: Clock };
    }
  };

  return (
    <div className="glass rounded-2xl p-6 flex flex-col h-[600px]">
      <div className="flex items-center justify-between mb-4 border-b border-cream-deep pb-3">
        <h2 className="font-serif text-xl font-semibold text-ink flex items-center gap-2">
          Disruption Stream
          {state.disruptions.length > 0 && (
            <span className="text-xs font-mono bg-red/10 text-red px-2 py-0.5 rounded-full">
              {state.disruptions.length}
            </span>
          )}
        </h2>
        <span className="text-xs font-mono flex items-center gap-1.5 text-ink-soft">
          <span className={`w-2 h-2 rounded-full ${state.wsStatus === "connected" ? "bg-emerald-400" : "bg-amber-400 animate-ping"}`} />
          {state.wsStatus}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {state.disruptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-ink-soft text-sm gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            No disruptions detected. System operating normally.
          </div>
        ) : (
          state.disruptions.map((disruption) => {
            const isSelected = state.selectedDisruptionId === disruption.id;
            const statusStyle = getStatusStyle(disruption.status);
            const sevStyle = getSeverityStyle(disruption.severity);
            const SevIcon = sevStyle.icon;

            return (
              <div
                key={disruption.id}
                onClick={() =>
                  dispatch({ type: "SET_SELECTED_DISRUPTION", payload: disruption.id })
                }
                className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? "bg-white border-sakura shadow-lg scale-[1.01]"
                    : "bg-white/50 border-cream-deep hover:bg-white hover:border-sakura/40 shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-ink-soft">{disruption.id}</span>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${statusStyle.bg}`}>
                      {statusStyle.label}
                    </span>
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border flex items-center gap-1 ${sevStyle.text}`}>
                      <SevIcon className="w-3 h-3" />
                      {disruption.severity.toUpperCase()}
                    </span>
                  </div>
                </div>

                <p className="text-sm font-semibold text-ink line-clamp-2 mb-3 leading-relaxed">
                  {disruption.summary}
                </p>

                <div className="grid grid-cols-3 gap-2 bg-cream-deep/45 p-2 rounded-lg text-[11px] font-mono text-ink-soft">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-ink-soft/70">Orders</span>
                    <span className="font-bold text-ink">{disruption.blast_radius.affected_orders.length}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-ink-soft/70">SKUs</span>
                    <span className="font-bold text-ink">{disruption.blast_radius.affected_skus.length}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-ink-soft/70">Value Risk</span>
                    <span className="font-bold text-red">${disruption.blast_radius.value_at_risk.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
