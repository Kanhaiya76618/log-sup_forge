// Immutable ledger view of the engine's real audit log: every stage of every
// resolution (watcher, diagnosis, planner, verifier, gate, executor) as the
// orchestrator wrote it.
import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { FileSpreadsheet, Search, Filter } from "lucide-react";

const STAGE_BADGE: Record<string, string> = {
  watcher:   "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  diagnosis: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  planner:   "bg-amber-100/20 text-amber-600 border-amber-500/20",
  verifier:  "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  gate:      "bg-gold/10 text-gold border-gold/20",
  executor:  "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

export default function AuditTrail() {
  const { state } = useApp();
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("ALL");

  const stages = useMemo(
    () => [...new Set(state.audit.map((e) => e.stage))].sort(),
    [state.audit]
  );

  const filtered = state.audit.filter((e) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q || e.ref_id.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q);
    const matchesStage = stageFilter === "ALL" || e.stage === stageFilter;
    return matchesQuery && matchesStage;
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
            Every pipeline stage writes here — {state.audit.length} entries this session.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/50 p-4 rounded-2xl border border-cream-deep/60">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-ink-soft/70" />
          <input
            type="text"
            placeholder="Filter by ref id or summary…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white border border-cream-deep rounded-xl pl-10 pr-4 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus:outline-none focus:ring-1 focus:ring-sakura focus:border-sakura"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-ink-soft/70 flex-shrink-0" />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="w-full bg-white border border-cream-deep rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-sakura focus:border-sakura"
          >
            <option value="ALL">All Stages</option>
            {stages.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto border border-cream-deep/60 rounded-xl bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-cream-deep/30 border-b border-cream-deep/50 text-[10px] uppercase font-mono tracking-wider text-ink-soft">
              <th className="p-4">Time</th>
              <th className="p-4">Stage</th>
              <th className="p-4">Ref</th>
              <th className="p-4">Summary</th>
              <th className="p-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-deep/40 text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-ink-soft italic">
                  No matching ledger entries found.
                </td>
              </tr>
            ) : (
              [...filtered].reverse().map((e) => (
                <tr key={e.id} className="hover:bg-cream/10 transition-colors">
                  <td className="p-4 font-mono text-ink-soft whitespace-nowrap">
                    {new Date(e.ts).toLocaleTimeString([], {
                      hour: "2-digit", minute: "2-digit", second: "2-digit",
                    })}
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                      STAGE_BADGE[e.stage] ?? "bg-gray-100/10 text-gray-500 border-gray-500/20"
                    }`}>
                      {e.stage}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-ink whitespace-nowrap">{e.ref_id}</td>
                  <td className="p-4 text-ink">{e.summary}</td>
                  <td className="p-4 font-mono text-[10px] text-ink-soft max-w-[280px] truncate"
                      title={JSON.stringify(e.payload)}>
                    {Object.entries(e.payload)
                      .filter(([, v]) => v !== null && v !== "" && !(Array.isArray(v) && v.length === 0))
                      .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join("|") : String(v)}`)
                      .join("  ") || "—"}
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
