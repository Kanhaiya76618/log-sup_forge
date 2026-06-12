"""One-command demo. Run:  python scripts/demo.py
Live run:  FLOWFORGE_LIVE=1 python scripts/demo.py
           (prints real Open-Meteo readings per port, or the clearly-labeled
            synthetic fallback; add FLOWFORGE_NEWS=1 for the RSS news watcher,
            DEMO_SENSITIVITY=0.3 to trip thresholds on calm days)"""
import os
from flowforge.core import build_engine

engine = build_engine()

if os.environ.get("FLOWFORGE_LIVE") == "1":
    # Show what the live connector sees BEFORE resolving, so the run proves its
    # data source: real per-port readings, or the synthetic fallback provenance.
    from flowforge.contracts import Domain
    for s in engine.registry.connector(Domain.LOGISTICS).fetch_signals():
        p = s.payload
        if p.get("kind") == "port_weather":
            print(f"SIGNAL    : [{p['provenance']}] {p['port']:<9} "
                  f"gusts {p['wind_gusts_kmh']:.0f} km/h, rain {p['precip_mm']:.1f} mm"
                  + (f"  -> ANOMALY ({p['severity']})" if p.get("anomaly") else ""))
        else:
            print(f"SIGNAL    : [{p.get('provenance', 'synthetic')}] "
                  f"{p.get('summary', p.get('kind', 'signal'))}")
    print()

records = engine.tick()
for r in records:
    print("DISRUPTION:", r.disruption.summary, f"[{r.disruption.severity.value}]")
    opt = r.plan.recommended()
    print("PLAN      :", opt.rationale if opt else "—",
          f"(cost {opt.total_cost:.0f}, score {opt.score})" if opt else "")
    print("VERIFIER  :", f"passed={r.report.passed} confidence={r.report.confidence:.2f}")
    print("GATE      :", r.gate.decision.value, "-", r.gate.reason)
    print("ACTIONS   :", [f"{x.action.value}:{'ok' if x.success else 'fail'}" for x in r.results]
          or "ESCALATED — awaiting human")
    print("AUDIT     :", len(r.audit_trail), "entries")
    print()
print("Pending HITL approvals:", [r.plan.id for r in engine.pending()])
