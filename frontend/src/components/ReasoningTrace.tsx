// Renders the REAL audit trail of the selected resolution — every stage the
// orchestrator logged (watcher -> diagnosis -> planner -> verifier -> gate ->
// executor) with its actual summary and payload. No invented confidences.
import { useSelectedRecord } from "../context/AppContext";
import { Cpu } from "lucide-react";

const STAGE_LABEL: Record<string, string> = {
  watcher: "Anomaly Detection",
  diagnosis: "Severity & Blast Radius",
  planner: "LLM Framing + Solver",
  verifier: "Policy & Red-Team",
  gate: "HITL Gate",
  executor: "Deterministic Actions",
};

function fmtPayload(payload: Record<string, unknown>): string[] {
  return Object.entries(payload)
    .filter(([, v]) => v !== null && v !== "" && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`);
}

export default function ReasoningTrace() {
  const record = useSelectedRecord();
  const steps = record?.audit_trail ?? [];

  return (
    <div className="glass rounded-2xl p-6 flex flex-col h-[600px]">
      <div className="flex items-center justify-between mb-4 border-b border-cream-deep pb-3">
        <h2 className="font-serif text-xl font-semibold text-ink flex items-center gap-2">
          <Cpu className="w-5 h-5 text-red" />
          Agentic Reasoning Trace
        </h2>
        {record && (
          <span className="font-mono text-xs text-ink-soft bg-cream px-2 py-0.5 rounded border border-cream-deep">
            {record.plan.id}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {!record ? (
          <div className="flex items-center justify-center h-full text-ink-soft text-sm">
            Select a disruption to view the agent decision timeline.
          </div>
        ) : (
          <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-cream-deep">
            {steps.map((step) => {
              const isGate = step.stage === "gate";
              const details = fmtPayload(step.payload);
              return (
                <div key={step.id} className="relative">
                  <span
                    className={`absolute -left-[20px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white ${
                      isGate ? "border-gold bg-gold/20" : "border-sakura bg-sakura"
                    }`}
                  />
                  <div className={`p-4 rounded-xl border shadow-sm ${
                    isGate ? "bg-gold/5 border-gold/30" : "bg-white border-cream-deep"
                  }`}>
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-mono text-xs font-bold text-ink uppercase tracking-wider">
                        {step.stage}{" "}
                        <span className="text-[10px] font-normal text-ink-soft normal-case">
                          ({STAGE_LABEL[step.stage] ?? "stage"})
                        </span>
                      </h4>
                      <span className="text-[10px] font-mono text-ink-soft bg-cream px-1.5 py-0.5 rounded border border-cream-deep">
                        {new Date(step.ts).toLocaleTimeString([], {
                          hour: "2-digit", minute: "2-digit", second: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-ink bg-cream/60 p-1.5 rounded mt-2 whitespace-pre-wrap font-mono">
                      {step.summary}
                    </p>
                    {details.length > 0 && (
                      <div className="mt-1.5 space-y-0.5">
                        {details.map((line) => (
                          <p key={line} className="text-[10px] font-mono text-ink-soft">{line}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {record.pending && (
              <div className="relative">
                <span className="absolute -left-[20px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-red bg-red/10 animate-pulse" />
                <div className="p-4 rounded-xl border bg-red/5 border-red/20 shadow-sm text-xs text-red font-semibold">
                  Execution halted — escalated to the HITL Approval Gate.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
