// Live Port Status strip — polls GET /signals every 60s and shows the raw
// per-port weather readings (including calm ones), with their provenance.
import { useEffect, useState } from "react";
import { signals } from "../api/client";
import type { RawSignal } from "../types";

const POLL_MS = 60000;

export default function PortStatusStrip() {
  const [ports, setPorts] = useState<RawSignal[]>([]);

  useEffect(() => {
    let active = true;
    const load = () =>
      signals()
        .then((s) => {
          if (active) setPorts(s.filter((x) => x.payload.kind === "port_weather"));
        })
        .catch(() => {});
    load();
    const t = setInterval(load, POLL_MS);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  if (ports.length === 0) return null;

  return (
    <div className="glass rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3">
      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-soft/75 font-bold">
        Live Port Status
      </span>
      {ports.map((s) => {
        const p = s.payload;
        const live = String(p.provenance ?? "").startsWith("live");
        return (
          <div
            key={String(p.port)}
            className={`flex items-center gap-2 bg-white/70 border rounded-xl px-3 py-1.5 text-xs font-mono ${
              p.anomaly ? "border-red/40" : "border-cream-deep"
            }`}
          >
            <span className="font-bold text-ink">{String(p.port)}</span>
            <span className="text-ink-soft">{Number(p.wind_gusts_kmh ?? 0).toFixed(0)} km/h</span>
            <span className="text-ink-soft">{Number(p.precip_mm ?? 0).toFixed(1)} mm</span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                live
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                  : "bg-gray-100/10 text-gray-400 border-gray-400/30"
              }`}
            >
              {live ? "LIVE" : "SIM"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
