import { useApp } from "../context/AppContext";
import { Cpu, Clock, ShieldAlert } from "lucide-react";

export default function ReasoningTrace() {
  const { state } = useApp();
  const activeDisruptionId = state.selectedDisruptionId;
  const activeDisruption = state.disruptions.find((d) => d.id === activeDisruptionId);
  const steps = activeDisruptionId ? state.traces[activeDisruptionId] ?? [] : [];

  const chainTemplate = [
    { name: "Watcher",   label: "Anomaly Detection" },
    { name: "Diagnosis", label: "Severity & Blast Radius" },
    { name: "Planner",   label: "Constraint Solver" },
    { name: "Verifier",  label: "Policy & Red-Team" },
    { name: "Executor",  label: "ERP & PO Dispatch" },
  ];

  return (
    <div className="glass rounded-2xl p-6 flex flex-col h-[600px]">
      <div className="flex items-center justify-between mb-4 border-b border-cream-deep pb-3">
        <h2 className="font-serif text-xl font-semibold text-ink flex items-center gap-2">
          <Cpu className="w-5 h-5 text-red" />
          Agentic Reasoning Trace
        </h2>
        {activeDisruptionId && (
          <span className="font-mono text-xs text-ink-soft bg-cream px-2 py-0.5 rounded border border-cream-deep">
            {activeDisruptionId}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {!activeDisruptionId ? (
          <div className="flex items-center justify-center h-full text-ink-soft text-sm">
            Select a disruption to view the agent decision timeline.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-cream-deep">
            {chainTemplate.map((templateStep, index) => {
              const matchedStep = steps.find(
                (s) => s.agentName.toLowerCase() === templateStep.name.toLowerCase()
              );
              const isEscalated =
                activeDisruption?.status === "escalated" &&
                templateStep.name === "Executor";
              const isFuture = !matchedStep && !isEscalated;

              return (
                <div
                  key={index}
                  className={`relative transition-all duration-300 ${isFuture ? "opacity-40" : "opacity-100"}`}
                >
                  <span
                    className={`absolute -left-[20px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                      isFuture
                        ? "border-cream-deep"
                        : isEscalated
                        ? "border-red bg-red/10 animate-pulse"
                        : "border-sakura bg-sakura"
                    }`}
                  />

                  <div
                    className={`p-4 rounded-xl border ${
                      isFuture
                        ? "bg-cream/20 border-cream-deep/40"
                        : isEscalated
                        ? "bg-red/5 border-red/20 shadow-sm"
                        : "bg-white border-cream-deep shadow-sm"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-mono text-xs font-bold text-ink uppercase tracking-wider">
                        {templateStep.name}{" "}
                        <span className="text-[10px] font-normal text-ink-soft normal-case">
                          ({templateStep.label})
                        </span>
                      </h4>
                      {matchedStep && (
                        <div className="flex items-center gap-2 text-[10px] font-mono text-ink-soft">
                          {matchedStep.confidence !== undefined && (
                            <span className="bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded">
                              Conf: {(matchedStep.confidence * 100).toFixed(0)}%
                            </span>
                          )}
                          <span className="flex items-center gap-0.5 bg-cream px-1.5 py-0.5 rounded border border-cream-deep">
                            <Clock className="w-2.5 h-2.5" />
                            {matchedStep.timeTakenMs}ms
                          </span>
                        </div>
                      )}
                    </div>

                    {isEscalated ? (
                      <div className="mt-2 text-xs text-red font-semibold flex items-center gap-1.5 bg-red/5 p-2 rounded border border-red/10">
                        <ShieldAlert className="w-4 h-4" />
                        Execution halted — escalated to HITL Approval Gate.
                      </div>
                    ) : isFuture ? (
                      <p className="text-xs text-ink-soft italic">
                        Awaiting upstream step execution…
                      </p>
                    ) : matchedStep ? (
                      <div className="space-y-2 mt-2 text-xs">
                        <div>
                          <span className="block font-mono text-[9px] uppercase tracking-wider text-ink-soft/70 mb-0.5">
                            Input
                          </span>
                          <span className="text-ink font-mono bg-cream/60 p-1.5 rounded block whitespace-pre-wrap">
                            {matchedStep.input}
                          </span>
                        </div>
                        <div>
                          <span className="block font-mono text-[9px] uppercase tracking-wider text-ink-soft/70 mb-0.5">
                            Output
                          </span>
                          <span className="text-ink bg-cream-deep/30 p-1.5 rounded block whitespace-pre-wrap">
                            {matchedStep.output}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
