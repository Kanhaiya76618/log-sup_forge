import { useApp } from "../context/AppContext";
import { recordStatus, RecordStatus, ResolutionRecord, Severity } from "../types";
import { AlertCircle, ShieldAlert, Clock, CheckCircle2 } from "lucide-react";

const STATUS_STYLE: Record<RecordStatus, { bg: string; label: string }> = {
  pending_human:  { bg: "bg-red/20 text-red border-red/40 animate-pulse", label: "Awaiting Approval" },
  auto_resolved:  { bg: "bg-emerald-500/20 text-emerald-600 border-emerald-500/40", label: "Auto-Resolved" },
  human_resolved: { bg: "bg-emerald-100/10 text-emerald-600 border-emerald-500/30", label: "Resolved (Operator)" },
  rejected:       { bg: "bg-gray-100/10 text-gray-400 border-gray-500/30", label: "Rejected" },
  failed:         { bg: "bg-red/10 text-red border-red/30", label: "Failed" },
};

function severityStyle(severity: Severity) {
  switch (severity) {
    case "critical": return { text: "text-red border-red/30 bg-red/5", icon: ShieldAlert };
    case "high":     return { text: "text-gold border-gold/30 bg-gold/5", icon: AlertCircle };
    default:         return { text: "text-ink-soft border-ink-soft/30 bg-ink-soft/5", icon: Clock };
  }
}

export default function DisruptionFeed() {
  const { state, dispatch } = useApp();

  return (
    <div className="glass rounded-2xl p-6 flex flex-col h-[600px]">
      <div className="flex items-center justify-between mb-4 border-b border-cream-deep pb-3">
        <h2 className="font-serif text-xl font-semibold text-ink flex items-center gap-2">
          Disruption Stream
          {state.records.length > 0 && (
            <span className="text-xs font-mono bg-red/10 text-red px-2 py-0.5 rounded-full">
              {state.records.length}
            </span>
          )}
        </h2>
        <span className="text-xs font-mono flex items-center gap-1.5 text-ink-soft">
          <span className={`w-2 h-2 rounded-full ${
            state.conn === "connected" ? "bg-emerald-400"
            : state.conn === "mock" ? "bg-indigo-400"
            : "bg-amber-400 animate-ping"
          }`} />
          {state.conn}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {state.records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-ink-soft text-sm gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            No disruptions detected. System operating normally.
          </div>
        ) : (
          state.records.map((record: ResolutionRecord) => {
            const d = record.disruption;
            const isSelected = state.selectedPlanId === record.plan.id;
            const status = STATUS_STYLE[recordStatus(record)];
            const sev = severityStyle(d.severity);
            const SevIcon = sev.icon;
            const blocked = Array.isArray(d.context.blocked) ? (d.context.blocked as string[]) : [];
            const provenance = typeof d.context.provenance === "string" ? d.context.provenance : null;

            return (
              <div
                key={record.plan.id}
                onClick={() => dispatch({ type: "SELECT_PLAN", payload: record.plan.id })}
                className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? "bg-white border-sakura shadow-lg scale-[1.01]"
                    : "bg-white/50 border-cream-deep hover:bg-white hover:border-sakura/40 shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-ink-soft">{d.id}</span>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${status.bg}`}>
                      {status.label}
                    </span>
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border flex items-center gap-1 ${sev.text}`}>
                      <SevIcon className="w-3 h-3" />
                      {d.severity.toUpperCase()}
                    </span>
                    {provenance && (
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                        provenance.startsWith("live")
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          : provenance === "synthetic_injected"
                          ? "bg-gray-100/10 text-gray-400 border-gray-400/30"
                          : "bg-indigo-500/10 text-indigo-500 border-indigo-500/30"
                      }`}>
                        {provenance.startsWith("live")
                          ? provenance.replace("_", " ").toUpperCase()
                          : provenance === "synthetic_injected"
                          ? "SIMULATED"
                          : "SYNTHETIC"}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm font-semibold text-ink line-clamp-2 mb-3 leading-relaxed">
                  {d.summary}
                </p>

                {blocked.length > 0 && (
                  <p className="text-[10px] font-mono text-red/80 mb-2">
                    avoiding: {blocked.join(", ")}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-2 bg-cream-deep/45 p-2 rounded-lg text-[11px] font-mono text-ink-soft">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-ink-soft/70">Orders</span>
                    <span className="font-bold text-ink">{d.blast_radius.affected_orders.length}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-ink-soft/70">SKUs</span>
                    <span className="font-bold text-ink">{d.blast_radius.affected_skus.length}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-ink-soft/70">Value Risk</span>
                    <span className="font-bold text-red">${d.blast_radius.value_at_risk.toLocaleString()}</span>
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
