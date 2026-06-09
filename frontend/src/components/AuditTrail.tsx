import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";
import { Decision } from "../types";
import { FileSpreadsheet, Search, RefreshCw, Filter } from "lucide-react";

export default function AuditTrail() {
  const { state, dispatch } = useApp();
  const [disruptionFilter, setDisruptionFilter] = useState("");
  const [decisionFilter, setDecisionFilter] = useState<Decision | "ALL">("ALL");
  const [refreshing, setRefreshing] = useState(false);

  const fetchAuditData = async () => {
    setRefreshing(true);
    try {
      const logs = await api.fetchAuditLog();
      dispatch({ type: "SET_AUDIT_LOG", payload: logs });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  const filteredLogs = state.auditLog.filter((log) => {
    const matchesId = log.disruption_id.toLowerCase().includes(disruptionFilter.toLowerCase());
    const matchesDecision = decisionFilter === "ALL" || log.decision === decisionFilter;
    return matchesId && matchesDecision;
  });

  return (
    <div className="glass rounded-2xl p-6 flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cream-deep pb-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-ink flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-red" />
            Immutable Audit Ledger
          </h2>
          <p className="text-xs text-ink-soft">
            Read-only system activity log. No edit or delete operations permitted.
          </p>
        </div>

        <button
          disabled={refreshing}
          onClick={fetchAuditData}
          className="self-start md:self-auto font-mono text-xs font-bold text-ink border border-cream-deep bg-white hover:bg-cream/40 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all duration-200 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Ledger
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/50 p-4 rounded-2xl border border-cream-deep/60">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-ink-soft/70" />
          <input
            type="text"
            placeholder="Filter by disruption ID…"
            value={disruptionFilter}
            onChange={(e) => setDisruptionFilter(e.target.value)}
            className="w-full bg-white border border-cream-deep rounded-xl pl-10 pr-4 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus:outline-none focus:ring-1 focus:ring-sakura focus:border-sakura"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-ink-soft/70 flex-shrink-0" />
          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value as Decision | "ALL")}
            className="w-full bg-white border border-cream-deep rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-sakura focus:border-sakura"
          >
            <option value="ALL">All Decision Pathways</option>
            <option value={Decision.AUTO_APPROVED}>Auto Approved (Autonomous)</option>
            <option value={Decision.ESCALATED}>Escalated (Operator Gate)</option>
            <option value={Decision.REJECTED}>Rejected (Gate Veto)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-cream-deep/60 rounded-xl bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-cream-deep/30 border-b border-cream-deep/50 text-[10px] uppercase font-mono tracking-wider text-ink-soft">
              <th className="p-4">Timestamp</th>
              <th className="p-4">Disruption ID</th>
              <th className="p-4">Actuator Agent</th>
              <th className="p-4">Action</th>
              <th className="p-4">Decision</th>
              <th className="p-4">Cost</th>
              <th className="p-4">Type</th>
              <th className="p-4">Execution Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-deep/40 text-xs">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-ink-soft italic">
                  No matching ledger entries found.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-cream/10 transition-colors">
                  <td className="p-4 font-mono text-ink-soft whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="p-4 font-mono font-bold text-ink">{log.disruption_id}</td>
                  <td className="p-4 font-semibold text-ink">{log.agent}</td>
                  <td className="p-4 capitalize text-ink-soft">
                    {log.action.replace(/_/g, " ")}
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                        log.decision === Decision.AUTO_APPROVED
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : log.decision === Decision.ESCALATED
                          ? "bg-amber-100/20 text-amber-500 border-amber-500/20"
                          : "bg-red/10 text-red border-red/20"
                      }`}
                    >
                      {log.decision.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-ink">${log.cost}</td>
                  <td className="p-4">
                    <span
                      className={`text-[10px] font-mono font-semibold ${
                        log.reversible ? "text-emerald-600" : "text-red"
                      }`}
                    >
                      {log.reversible ? "Reversible" : "Irreversible"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="max-w-[260px]">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          log.execution_result.success
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-red/10 text-red"
                        }`}
                      >
                        {log.execution_result.success ? "SUCCESS" : "FAILED"}
                      </span>
                      <span
                        className="block text-[11px] text-ink-soft truncate mt-1"
                        title={log.execution_result.detail}
                      >
                        {log.execution_result.detail}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
