// Engine observability — every number here comes from GET /metrics, which the
// backend computes from this session's real resolution records. Nothing baked in.
import { useApp } from "../context/AppContext";
import { BarChart3, TrendingUp, Zap, Clock, ShieldCheck, Landmark } from "lucide-react";

export default function AnalyticsDashboard() {
  const { state } = useApp();
  const m = state.metrics;

  if (!m) {
    return (
      <div className="glass rounded-2xl p-6 h-[200px] flex items-center justify-center text-ink-soft text-sm">
        No metrics yet — waiting for the first engine tick.
      </div>
    );
  }

  const humanInvolved = m.pendingHuman + m.humanApproved + m.rejected;
  const total = m.autoApproved + humanInvolved;
  const autoPercent = total > 0 ? Math.round((m.autoApproved / total) * 100) : 0;

  const kpis = [
    { label: "Cost Saved (vs do-nothing)", value: `$${m.costSaved.toLocaleString()}`, icon: Zap, chip: "bg-red/10 text-red" },
    { label: "Value Protected", value: `$${m.valueProtected.toLocaleString()}`, icon: Landmark, chip: "bg-gold/10 text-gold" },
    { label: "Avg Tick Latency", value: `${m.avgTickMs} ms`, icon: Clock, chip: "bg-indigo-500/10 text-indigo-500" },
    { label: "Action Success", value: `${m.actionSuccessPct}%`, icon: ShieldCheck, chip: "bg-emerald-500/10 text-emerald-600" },
  ];

  return (
    <div className="glass rounded-2xl p-6 flex flex-col space-y-6">
      <div className="border-b border-cream-deep pb-4">
        <h2 className="font-serif text-2xl font-bold text-ink flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-red" />
          Real-time Engine Observability
        </h2>
        <p className="text-xs text-ink-soft">
          Computed live from {m.disruptions} resolution(s) this session.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, chip }) => (
          <div key={label} className="bg-white p-4 rounded-xl border border-cream-deep flex items-center gap-4 shadow-sm">
            <div className={`p-3 rounded-xl ${chip}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider font-mono text-ink-soft/75">
                {label}
              </span>
              <span className="text-xl font-bold text-ink font-mono">{value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-cream-deep flex flex-col gap-4 shadow-sm">
          <div>
            <h3 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red" />
              Human-Load Sublinearity
            </h3>
            <p className="text-xs text-ink-soft mt-0.5 leading-relaxed">
              The gate auto-handles confident, cheap, reversible cases and escalates only
              the uncertain ones — human load stays sublinear as volume grows.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
            <div className="relative w-36 h-36 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="72" cy="72" r="54" className="stroke-cream-deep fill-transparent" strokeWidth="16" />
                <circle
                  cx="72" cy="72" r="54"
                  className="stroke-emerald-500 fill-transparent transition-all duration-1000"
                  strokeWidth="16"
                  strokeDasharray={2 * Math.PI * 54}
                  strokeDashoffset={2 * Math.PI * 54 - (autoPercent / 100) * 2 * Math.PI * 54}
                />
              </svg>
              <div className="absolute text-center">
                <span className="block text-2xl font-bold font-mono text-ink">{autoPercent}%</span>
                <span className="text-[9px] uppercase font-mono tracking-wider text-ink-soft/75">
                  Autonomous
                </span>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs w-full max-w-[220px]">
              <div className="flex justify-between items-center bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/15">
                <span className="flex items-center gap-2 font-bold text-emerald-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Auto-Pilot
                </span>
                <span className="text-ink font-bold">{m.autoApproved}</span>
              </div>
              <div className="flex justify-between items-center bg-gold/5 p-2.5 rounded-lg border border-gold/15">
                <span className="flex items-center gap-2 font-bold text-gold">
                  <span className="w-2.5 h-2.5 rounded-full bg-gold" />
                  Awaiting Human
                </span>
                <span className="text-ink font-bold">{m.pendingHuman}</span>
              </div>
              <div className="flex justify-between items-center bg-red/5 p-2.5 rounded-lg border border-red/15">
                <span className="flex items-center gap-2 font-bold text-red">
                  <span className="w-2.5 h-2.5 rounded-full bg-red" />
                  Human Decided
                </span>
                <span className="text-ink font-bold">{m.humanApproved + m.rejected}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-cream-deep flex flex-col gap-4 shadow-sm">
          <div>
            <h3 className="font-serif text-lg font-bold text-ink">Session Throughput</h3>
            <p className="text-xs text-ink-soft mt-0.5 leading-relaxed">
              Deterministic actions executed through domain connectors after verification.
            </p>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4 content-center font-mono">
            <div className="text-center bg-cream/40 rounded-xl p-4 border border-cream-deep/40">
              <span className="block text-3xl font-bold text-ink">{m.actionsExecuted}</span>
              <span className="text-[10px] uppercase tracking-wider text-ink-soft">Actions Executed</span>
            </div>
            <div className="text-center bg-cream/40 rounded-xl p-4 border border-cream-deep/40">
              <span className="block text-3xl font-bold text-ink">{m.humanLoadPct}%</span>
              <span className="text-[10px] uppercase tracking-wider text-ink-soft">Human Load</span>
            </div>
            <div className="text-center bg-cream/40 rounded-xl p-4 border border-cream-deep/40 col-span-2">
              <span className="block text-3xl font-bold text-ink">${m.planCost.toLocaleString()}</span>
              <span className="text-[10px] uppercase tracking-wider text-ink-soft">
                Total Plan Cost (vs ${m.valueProtected.toLocaleString()} at risk)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
