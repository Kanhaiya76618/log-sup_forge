import { useEffect } from "react";
import { useApp } from "../context/AppContext";
import { api } from "../services/api";
import { BarChart3, TrendingUp, Zap, Clock, ShieldCheck } from "lucide-react";

export default function AnalyticsDashboard() {
  const { state, dispatch } = useApp();

  const fetchAnalytics = async () => {
    try {
      const data = await api.fetchMetrics();
      dispatch({ type: "SET_METRICS", payload: data });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 5000);
    return () => clearInterval(interval);
  }, []);

  const { successRate, avgTimeMs, costSaved, catchRate, autoCount, escCount } = state.metrics;
  const totalDecisions = autoCount + escCount;
  const autoPercent = totalDecisions > 0 ? Math.round((autoCount / totalDecisions) * 100) : 100;
  const escPercent = totalDecisions > 0 ? Math.round((escCount / totalDecisions) * 100) : 0;


  return (
    <div className="glass rounded-2xl p-6 flex flex-col space-y-6">
      <div className="border-b border-cream-deep pb-4">
        <h2 className="font-serif text-2xl font-bold text-ink flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-red" />
          Real-time Engine Observability
        </h2>
        <p className="text-xs text-ink-soft">
          Live logistics scaling performance metrics. Auto-refreshes every 5 s.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-cream-deep flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-red/10 text-red rounded-xl">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider font-mono text-ink-soft/75">
              Value Saved
            </span>
            <span className="text-xl font-bold text-ink font-mono">
              ${costSaved.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-cream-deep flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-gold/10 text-gold rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider font-mono text-ink-soft/75">
              Avg Latency
            </span>
            <span className="text-xl font-bold text-ink font-mono">{avgTimeMs} ms</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-cream-deep flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider font-mono text-ink-soft/75">
              Success Rate
            </span>
            <span className="text-xl font-bold text-ink font-mono">{successRate}%</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-cream-deep flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider font-mono text-ink-soft/75">
              Catch Rate
            </span>
            <span className="text-xl font-bold text-ink font-mono">
              {(catchRate * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ★ Scalability Money-Shot */}
        <div className="bg-white p-6 rounded-2xl border border-cream-deep flex flex-col gap-4 shadow-sm">
          <div>
            <h3 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red" />
              Human-Load Sublinearity
            </h3>
            <p className="text-xs text-ink-soft mt-0.5 leading-relaxed">
              A flat escalation ratio as event volume grows proves sublinear human load — the
              scalability money-shot.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
            {/* Donut */}
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

            <div className="space-y-3 font-mono text-xs w-full max-w-[200px]">
              <div className="flex justify-between items-center bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/15">
                <span className="flex items-center gap-2 font-bold text-emerald-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Auto-Pilot
                </span>
                <span className="text-ink font-bold">
                  {autoCount} ({autoPercent}%)
                </span>
              </div>
              <div className="flex justify-between items-center bg-red/5 p-2.5 rounded-lg border border-red/15">
                <span className="flex items-center gap-2 font-bold text-red">
                  <span className="w-2.5 h-2.5 rounded-full bg-red" />
                  Escalated
                </span>
                <span className="text-ink font-bold">
                  {escCount} ({escPercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Execution Health Rings */}
        <div className="bg-white p-6 rounded-2xl border border-cream-deep flex flex-col gap-4 shadow-sm">
          <div>
            <h3 className="font-serif text-lg font-bold text-ink">Autonomous Execution Health</h3>
            <p className="text-xs text-ink-soft mt-0.5 leading-relaxed">
              Overall precision ratings for automated decisions and verifier policy checks.
            </p>
          </div>

          <div className="flex justify-around gap-4 my-2">
            {[
              { value: successRate, label: "Success Rate", color: "stroke-red" },
              { value: catchRate * 100, label: "Verifier Catch", color: "stroke-ink" },
            ].map(({ value, label, color }) => {
              const r = 40;
              const circ = 2 * Math.PI * r;
              const offset = circ - (value / 100) * circ;
              return (
                <div key={label} className="text-center">
                  <div className="relative w-28 h-28 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="56" cy="56" r={r} className="stroke-cream fill-transparent" strokeWidth="8" />
                      <circle
                        cx="56" cy="56" r={r}
                        className={`${color} fill-transparent transition-all duration-1000`}
                        strokeWidth="8"
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                      />
                    </svg>
                    <span className="absolute font-mono font-bold text-md text-ink">
                      {value.toFixed(0)}%
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-ink-soft uppercase tracking-wider">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
