// FlowForge landing page — renders before the Command Center (App gates on an
// `entered` flag). Brand palette only (navy ink / red / sakura / cream / gold),
// existing fonts. CSS-first motion lives in index.css; this file wires the
// mouse-tilt, scroll-reveal observer, and reduced-motion guard.
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Activity, Cpu, Workflow, Dices, ShieldCheck, ScrollText,
  Presentation, Network,
} from "lucide-react";

// ---- PLACEHOLDERS — replace the {{...}} tokens with real copy/links ----
const TAGLINE = "When the supply chain breaks, the fix is already in motion.";
const SUBLINE = "FlowForge watches the world's ports in real time, reasons through every disruption with a team of autonomous agents, computes the optimal reroute or reschedule with OR-Tools, stress-tests it across a thousand futures — and acts. A human is asked only when confidence runs thin.";
const DECK_URL = "{{DECK_URL}}";
const ARCH_URL = "{{ARCH_URL}}";
const METRICS = [
  "{{HUMAN_LOAD}}% human load",
  "${{COST_SAVED}} protected",
  "{{AUTO_RATE}}% auto-resolved",
  "4 live ports", // PLACEHOLDER — adjust if you monitor more
  "{{P_ON_TIME}}% P(on-time)",
  "{{DISRUPTIONS}} disruptions handled",
];

const CAPABILITIES = [
  { icon: Activity, title: "Live Monitoring", span: "md:col-span-2",
    body: "Real Open-Meteo weather, 3-day forecasts, and news signals across global ports — keyless, with honest provenance tags." },
  { icon: Cpu, title: "Multi-Agent Reasoning",
    body: "Watcher → Diagnosis → Planner → Verifier agents, each step streamed to a transparent reasoning trace." },
  { icon: Workflow, title: "OR-Tools Optimization",
    body: "CP-SAT routing and job-shop scheduling compute the numbers — the LLM frames, the solver decides." },
  { icon: Dices, title: "Risk Simulation",
    body: "Monte-Carlo stress-tests every plan for P(on-time), expected cost, and CVaR tail risk." },
  { icon: ShieldCheck, title: "HITL Gate", span: "md:col-span-2",
    body: "Confident, cheap, reversible actions auto-execute; everything uncertain escalates to a human — so human load stays sublinear as volume grows." },
  { icon: ScrollText, title: "Audit Trail",
    body: "Every stage writes an immutable, queryable ledger entry — full provenance from signal to action." },
];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function EnterButton({ onEnter, variant = "solid" }: { onEnter: () => void; variant?: "solid" | "ghost" }) {
  return (
    <button
      onClick={onEnter}
      className={`group inline-flex items-center gap-2 rounded-xl px-5 py-3 font-mono text-xs font-bold transition-all duration-200 active:scale-95 shadow-sm ${
        variant === "solid"
          ? "bg-ink text-cream hover:bg-ink-soft"
          : "glass text-ink hover:border-sakura"
      }`}
    >
      Enter Command Center
      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
    </button>
  );
}

function TiltCard() {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ rx: 0, ry: 0 });
  const reduced = typeof window !== "undefined"
    && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const onMove = (e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setT({ rx: -py * 8, ry: px * 10 });
  };

  return (
    <div className="tilt-perspective">
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={() => setT({ rx: 0, ry: 0 })}
        style={{ transform: `rotateX(${t.rx}deg) rotateY(${t.ry}deg)` }}
        className="tilt-card glass rounded-3xl p-8 md:p-10 shadow-xl"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-red text-white px-2 py-1 rounded font-bold font-serif text-sm select-none">FF</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
            Autonomous Supply-Chain Resolution
          </span>
        </div>
        <h1 className="font-serif text-4xl md:text-6xl font-bold text-ink leading-[1.05]">
          Flow<span className="text-red">Forge</span>
        </h1>
        <p className="mt-4 font-serif text-xl md:text-2xl text-ink italic">{TAGLINE}</p>
        <p className="mt-3 text-sm md:text-base text-ink-soft max-w-xl leading-relaxed">{SUBLINE}</p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <span className="font-mono text-[11px] text-ink-soft">
            Live · OR-Tools · Monte-Carlo · HITL
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Landing({ onEnter }: { onEnter: () => void }) {
  useReveal();

  return (
    <div className="landing min-h-screen relative overflow-hidden">
      {/* Brand mesh gradient + Fuji/sakura motif (recognizable, slowly drifting) */}
      <div className="mesh-bg" aria-hidden />
      <div className="absolute top-0 right-0 w-[34rem] h-[34rem] opacity-[0.12] pointer-events-none select-none">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="78" cy="34" r="26" fill="#d62828" />
          <path d="M6 92 L46 30 L92 92 Z" fill="#16224a" />
          <path d="M30 64 L46 40 L62 64 Z" fill="#faf4ec" />
        </svg>
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6">
        {/* top bar */}
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2">
            <span className="bg-red text-white p-1 rounded font-bold font-serif text-sm">FF</span>
            <span className="font-serif text-lg font-bold text-ink">FlowForge</span>
          </div>
          <EnterButton onEnter={onEnter} variant="ghost" />
        </div>

        {/* 1. HERO */}
        <section className="grid lg:grid-cols-2 gap-10 items-center py-10 md:py-16">
          <TiltCard />
          <div className="reveal">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-ink leading-tight">
              The autonomous spine for{" "}
              <em className="text-red not-italic">just-in-time</em> supply chains.
            </h2>
            <p className="mt-4 text-ink-soft leading-relaxed">{SUBLINE}</p>
            <div className="mt-8">
              <EnterButton onEnter={onEnter} />
            </div>
          </div>
        </section>

        {/* 2. USP BENTO GRID */}
        <section className="py-10">
          <h3 className="reveal font-serif text-2xl font-bold text-ink mb-6">
            Built like an operations command center.
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[1fr]">
            {CAPABILITIES.map(({ icon: Icon, title, body, span }, i) => (
              <div
                key={title}
                style={{ transitionDelay: `${i * 60}ms` }}
                className={`reveal glass rounded-2xl p-6 border border-cream-deep/60 hover:border-sakura/60 transition-colors ${span ?? ""}`}
              >
                <div className="inline-flex p-2.5 rounded-xl bg-red/10 text-red mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-serif text-lg font-bold text-ink">{title}</h4>
                <p className="mt-1.5 text-sm text-ink-soft leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. SOCIAL PROOF MARQUEE (placeholder metrics) */}
        <section className="py-8 reveal">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft/70 mb-3 text-center">
            Measured by the honest eval harness · placeholder values
          </p>
          <div className="marquee glass rounded-2xl py-4 border border-cream-deep/60">
            <div className="marquee-track">
              {[...METRICS, ...METRICS].map((m, i) => (
                <span
                  key={i}
                  className="mx-4 inline-flex items-center gap-2 font-mono text-sm font-bold text-ink whitespace-nowrap"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red" />
                  {m}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* 4. PRESENTATION / ARCHITECTURE */}
        <section className="grid md:grid-cols-2 gap-4 py-8">
          <a
            href={DECK_URL}
            target="_blank"
            rel="noreferrer"
            className="reveal glass rounded-2xl p-6 border border-cream-deep/60 hover:border-sakura/60 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="inline-flex p-2.5 rounded-xl bg-gold/10 text-gold">
                <Presentation className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-ink-soft transition-transform group-hover:translate-x-1" />
            </div>
            <h4 className="mt-3 font-serif text-lg font-bold text-ink">View Presentation</h4>
            <p className="mt-1 text-sm text-ink-soft">The pitch deck and demo walkthrough.</p>
          </a>
          <a
            href={ARCH_URL}
            target="_blank"
            rel="noreferrer"
            className="reveal glass rounded-2xl p-6 border border-cream-deep/60 hover:border-sakura/60 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="inline-flex p-2.5 rounded-xl bg-ink/10 text-ink">
                <Network className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-ink-soft transition-transform group-hover:translate-x-1" />
            </div>
            <h4 className="mt-3 font-serif text-lg font-bold text-ink">View Architecture</h4>
            <p className="mt-1 text-sm text-ink-soft">Typed contracts, agents, solver, and connectors.</p>
          </a>
        </section>

        {/* 5. CTA FOOTER */}
        <section className="reveal text-center py-16">
          <h3 className="font-serif text-2xl md:text-3xl font-bold text-ink">
            See the agents resolve a live disruption.
          </h3>
          <p className="mt-2 text-ink-soft text-sm">{TAGLINE}</p>
          <div className="mt-6 flex justify-center">
            <EnterButton onEnter={onEnter} />
          </div>
          <p className="mt-10 font-mono text-[10px] text-ink-soft/60">
            FlowForge · FAR AWAY 2026 · Agentic &amp; Autonomous Systems
          </p>
        </section>
      </div>
    </div>
  );
}
