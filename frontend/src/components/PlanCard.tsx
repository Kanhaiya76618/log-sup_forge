// Solver plan options for the selected disruption — real numbers only:
// cost, risk-adjusted score, and the Monte-Carlo risk profile (P(on-time),
// E[cost], CVaR95) that the backend embeds in each option's rationale.
import { useSelectedRecord } from "../context/AppContext";
import { parseRisk } from "../types";
import { TrendingUp, ShieldCheck } from "lucide-react";

function ParamsTable({ params }: { params: Record<string, unknown> }) {
  const keys = Object.keys(params);
  if (keys.length === 0) {
    return <span className="text-ink-soft italic text-[11px]">None</span>;
  }
  return (
    <table className="w-full text-[10px] font-mono border border-cream-deep/60 rounded overflow-hidden">
      <tbody>
        {keys.map((k) => (
          <tr key={k} className="border-b border-cream-deep/40 bg-cream/30">
            <td className="px-2 py-1 font-bold text-ink-soft border-r border-cream-deep/40 bg-cream-deep/10 w-20 capitalize">
              {k.replace(/_/g, " ")}
            </td>
            <td className="px-2 py-1 text-ink break-all">
              {Array.isArray(params[k]) ? (params[k] as unknown[]).join(" → ") : String(params[k])}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function PlanCard() {
  const record = useSelectedRecord();

  if (!record) {
    return (
      <div className="glass rounded-2xl p-6 h-[200px] flex items-center justify-center text-ink-soft text-sm">
        Select a disruption to view solver optimization options.
      </div>
    );
  }

  const { plan } = record;
  if (plan.options.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 h-[200px] flex items-center justify-center text-ink-soft text-sm">
        No feasible plan options were generated for this disruption.
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 flex flex-col space-y-4">
      <div className="border-b border-cream-deep pb-3">
        <h3 className="font-serif text-xl font-semibold text-ink flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gold" />
          Solver Optimization Plans
        </h3>
        <p className="text-xs text-ink-soft">
          OR-Tools CP-SAT alternatives, stress-tested by Monte-Carlo simulation.
          The recommended option is the one executed on approval.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plan.options.map((opt, idx) => {
          const isRecommended = plan.recommended_option_id === opt.id;
          const risk = parseRisk(opt.rationale);
          const optionLabel = String.fromCharCode(65 + idx); // A, B, C …
          return (
            <div
              key={opt.id}
              className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                isRecommended
                  ? "bg-white border-sakura shadow-md ring-2 ring-sakura/20"
                  : "bg-white/50 border-cream-deep shadow-sm"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-sm text-ink">Option {optionLabel}</h4>
                    <span className="text-[10px] font-mono text-ink-soft block mt-0.5">
                      Risk-adj. score:{" "}
                      <strong className="text-emerald-600">{(opt.score * 100).toFixed(0)}%</strong>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-md text-red font-mono">
                      ${opt.total_cost.toLocaleString()}
                    </span>
                    <span className="block text-[10px] text-ink-soft font-mono">
                      Est. {opt.est_time_min.toLocaleString()} min
                    </span>
                  </div>
                </div>

                {(risk.pOnTime !== null || risk.cvar95 !== null) && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {risk.pOnTime !== null && (
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        risk.pOnTime >= 60
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-red/10 text-red border-red/20"
                      }`}>
                        P(on-time) {risk.pOnTime}%
                      </span>
                    )}
                    {risk.expCost !== null && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-cream text-ink-soft border-cream-deep">
                        E[cost] ${risk.expCost.toLocaleString()}
                      </span>
                    )}
                    {risk.cvar95 !== null && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-gold/10 text-gold border-gold/20">
                        CVaR95 ${risk.cvar95.toLocaleString()}
                      </span>
                    )}
                  </div>
                )}

                <p className="text-xs text-ink-soft leading-relaxed italic mb-4 bg-cream/40 p-2 rounded-lg border border-cream-deep/30">
                  "{opt.rationale}"
                </p>

                <div className="space-y-3">
                  <h5 className="font-mono text-[9px] uppercase tracking-wider text-ink-soft/75 border-b border-cream-deep/40 pb-1">
                    Action Pipeline
                  </h5>
                  {opt.steps.map((step, sIdx) => (
                    <div key={sIdx} className="space-y-1 bg-cream-deep/20 p-2.5 rounded-xl border border-cream-deep/20">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-ink capitalize flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${step.reversible ? "bg-emerald-400" : "bg-red"}`} />
                          {step.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] font-mono text-ink-soft">{step.target}</span>
                      </div>
                      <div className="mt-1.5"><ParamsTable params={step.params} /></div>
                      <div className="flex justify-between text-[9px] font-mono text-ink-soft/80 mt-1">
                        <span>Cost: ${step.est_cost.toLocaleString()}</span>
                        <span className={step.reversible ? "text-emerald-600" : "text-red font-bold"}>
                          {step.reversible ? "Reversible" : "Irreversible (commits funds)"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {isRecommended && (
                <div className="mt-4 pt-3 border-t border-cream-deep/50 flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
                  <ShieldCheck className="w-4 h-4" /> Recommended by Planner
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
