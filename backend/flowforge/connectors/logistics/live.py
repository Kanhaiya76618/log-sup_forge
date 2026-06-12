"""LIVE logistics connector — real weather at real ports. OWNER: P2 (P3 assisted).

Pulls current conditions from Open-Meteo (free, no API key) for the ports in the
route network. When wind/rain crosses thresholds, that becomes a REAL disruption
flowing through the engine: diagnosis -> solver reroute around the blocked port.

Design rules:
  - stdlib urllib only (no new dependency)
  - NEVER breaks the demo: on any network error it falls back to the synthetic
    generator, and tags signals with their provenance ("live" vs "synthetic")
  - DEMO_SENSITIVITY env var scales thresholds down on calm days so the windiest
    real port still trips — honest, because the dashboard shows the real numbers.

Run live:   FLOWFORGE_LIVE=1 python scripts/demo.py
Sensitive:  FLOWFORGE_LIVE=1 DEMO_SENSITIVITY=0.3 python scripts/demo.py
"""
from __future__ import annotations
import json
import os
import ssl
import urllib.request

from ...core.config import env_flag
from ...interfaces import BaseConnector
from ...contracts import RawSignal, ActionRequest, ExecutionResult, Domain
from .generator import generate_signals

# Ports we monitor -> (lat, lon). Names MUST match network.py via-nodes so the
# solver can route around a blocked one.
PORTS: dict[str, tuple[float, float]] = {
    "Yokohama": (35.45, 139.65),
    "Kobe":     (34.69, 135.20),
    "Shanghai": (31.23, 121.47),
    "Busan":    (35.10, 129.04),
}

# Disruption thresholds (km/h gusts, mm/h precipitation)
GUST_HIGH, GUST_CRITICAL = 60.0, 90.0
RAIN_HIGH = 10.0

_API = ("https://api.open-meteo.com/v1/forecast"
        "?latitude={lats}&longitude={lons}"
        "&current=wind_speed_10m,wind_gusts_10m,precipitation"
        "&wind_speed_unit=kmh")


def _ssl_context() -> ssl.SSLContext:
    # Framework Python installs (notably macOS) often ship without local CA
    # certs; prefer certifi's bundle when present so live mode works there too.
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


def fetch_weather(timeout: float = 8.0) -> list[dict]:
    """One batched call for all ports. Returns Open-Meteo 'current' blocks in
    PORTS order. Raises on network failure (caller decides the fallback)."""
    names = list(PORTS)
    url = _API.format(lats=",".join(str(PORTS[n][0]) for n in names),
                      lons=",".join(str(PORTS[n][1]) for n in names))
    with urllib.request.urlopen(url, timeout=timeout, context=_ssl_context()) as r:
        data = json.loads(r.read().decode())
    blocks = data if isinstance(data, list) else [data]
    return [{"port": n, **b.get("current", {})} for n, b in zip(names, blocks)]


_FORECAST_API = ("https://api.open-meteo.com/v1/forecast"
                 "?latitude={lats}&longitude={lons}"
                 "&hourly=wind_gusts_10m,precipitation"
                 "&forecast_days=3&wind_speed_unit=kmh")


def fetch_forecast(timeout: float = 8.0) -> list[dict]:
    """3-day hourly forecast for all ports, one batched call. Returns 'hourly'
    blocks in PORTS order. Raises on failure (caller skips silently)."""
    names = list(PORTS)
    url = _FORECAST_API.format(lats=",".join(str(PORTS[n][0]) for n in names),
                               lons=",".join(str(PORTS[n][1]) for n in names))
    with urllib.request.urlopen(url, timeout=timeout, context=_ssl_context()) as r:
        data = json.loads(r.read().decode())
    blocks = data if isinstance(data, list) else [data]
    return [{"port": n, **b.get("hourly", {})} for n, b in zip(names, blocks)]


def forecast_to_signals(hourly: list[dict], sensitivity: float = 1.0) -> list[RawSignal]:
    """Pure: flag ports whose forecast peak gust/rain crosses the (scaled)
    thresholds — predictive disruptions for pre-planning, same blocked-union."""
    g_hi, g_cr, r_hi = (GUST_HIGH * sensitivity, GUST_CRITICAL * sensitivity,
                        RAIN_HIGH * sensitivity)
    hits = []
    for h in hourly:
        gusts = [float(x or 0.0) for x in h.get("wind_gusts_10m") or []]
        rains = [float(x or 0.0) for x in h.get("precipitation") or []]
        if not gusts:
            continue
        peak = max(gusts)
        peak_rain = max(rains) if rains else 0.0
        if peak >= g_hi or peak_rain >= r_hi:
            hits.append((h["port"], peak, gusts.index(peak), peak_rain))
    blocked = [p for p, *_ in hits]
    signals = []
    for port, peak, hrs, rain in hits:
        severity = "critical" if peak >= g_cr else "high"
        signals.append(RawSignal(source="open-meteo-forecast", domain=Domain.LOGISTICS, payload={
            "kind": "port_forecast", "provenance": "live_forecast",
            "port": port, "anomaly": True,
            "wind_gusts_kmh": peak, "precip_mm": rain,
            "type": "shipment_delay", "severity": severity,
            "summary": (f"{port}: {peak:.0f} km/h gusts forecast in {hrs}h — "
                        "pre-planning contingency"),
            "blocked": blocked,
            "orders": [f"ORD-{port[:3].upper()}-1", f"ORD-{port[:3].upper()}-2"],
            "value_at_risk": 12000.0 if severity == "critical" else 6000.0,
        }))
    return signals


def weather_to_signals(current: list[dict], sensitivity: float = 1.0) -> list[RawSignal]:
    """Pure + unit-testable: convert weather blocks to RawSignals, flagging
    anomalies where thresholds (scaled by sensitivity) are crossed."""
    signals: list[RawSignal] = []
    # First pass: which ports are anomalous right now (storms can be concurrent).
    g_hi, g_cr, r_hi = (GUST_HIGH * sensitivity, GUST_CRITICAL * sensitivity,
                        RAIN_HIGH * sensitivity)
    readings = []
    for c in current:
        gust = float(c.get("wind_gusts_10m") or 0.0)
        rain = float(c.get("precipitation") or 0.0)
        readings.append((c["port"], gust, rain, gust >= g_hi or rain >= r_hi))
    all_blocked = [p for p, _, _, a in readings if a]

    for port, gust, rain, anomaly in readings:
        severity = "critical" if gust >= g_cr else "high"
        payload = {
            "kind": "port_weather", "provenance": "live",
            "port": port, "wind_gusts_kmh": gust, "precip_mm": rain,
            "anomaly": anomaly,
        }
        if anomaly:
            payload.update({
                "type": "port_closure" if gust >= g_hi else "shipment_delay",
                "severity": severity,
                "summary": (f"{port} port disrupted — live weather: "
                            f"gusts {gust:.0f} km/h, rain {rain:.1f} mm"),
                "blocked": all_blocked,   # union: don't route into a concurrent storm
                # Orders whose default lane traverses this port (demo order book)
                "orders": [f"ORD-{port[:3].upper()}-1", f"ORD-{port[:3].upper()}-2"],
                "value_at_risk": 12000.0 if severity == "critical" else 6000.0,
            })
        signals.append(RawSignal(source="open-meteo", domain=Domain.LOGISTICS,
                                 payload=payload))
    return signals


class LiveLogisticsConnector(BaseConnector):
    """Live weather (+ optional news) signals; synthetic fallback so the demo
    can never die."""
    domain = Domain.LOGISTICS

    def fetch_signals(self) -> list[RawSignal]:
        sensitivity = float(os.environ.get("DEMO_SENSITIVITY", "1.0"))
        try:
            signals = weather_to_signals(fetch_weather(), sensitivity)
        except Exception as exc:                      # offline / API hiccup
            fallback = generate_signals(inject_disruption=True)
            for s in fallback:
                s.payload["provenance"] = f"synthetic_fallback ({type(exc).__name__})"
            return fallback
        # Extra live sources (each degrades silently to []), folded into ONE
        # blocked-port union with the weather anomalies so the solver never
        # routes into a storm, a news-flagged, or a SERP-flagged port.
        extra: list[RawSignal] = []
        if env_flag("FLOWFORGE_NEWS"):
            from .news import fetch_news_signals
            extra.extend(fetch_news_signals())
        if env_flag("FLOWFORGE_BRIGHTDATA"):
            from .brightdata import fetch_serp_signals
            flagged = {s.payload.get("port") for s in extra}
            extra.extend(s for s in fetch_serp_signals()
                         if s.payload.get("port") not in flagged)
        # Predictive layer: 3-day forecast peaks (default ON; FLOWFORGE_FORECAST=0
        # disables). Skips ports already flagged now; fails silently.
        if env_flag("FLOWFORGE_FORECAST") or "FLOWFORGE_FORECAST" not in os.environ:
            try:
                flagged = ({s.payload.get("port") for s in extra}
                           | {s.payload.get("port") for s in signals
                              if s.payload.get("anomaly")})
                extra.extend(f for f in forecast_to_signals(fetch_forecast(), sensitivity)
                             if f.payload.get("port") not in flagged)
            except Exception:
                pass
        if extra:
            signals.extend(extra)
            union = sorted({p for s in signals if s.payload.get("anomaly")
                            for p in s.payload.get("blocked", [])})
            for s in signals:
                if s.payload.get("anomaly"):
                    s.payload["blocked"] = union
        if not any(s.payload.get("anomaly") for s in signals) \
                and env_flag("FLOWFORGE_FORCE_DEMO"):
            # calm seas everywhere + a demo to run: add one injected disruption,
            # clearly labeled synthetic, alongside the real readings.
            inject = generate_signals(inject_disruption=True)[-1]
            inject.payload["provenance"] = "synthetic_injected"
            signals.append(inject)
        return signals

    def apply_action(self, request: ActionRequest) -> ExecutionResult:
        return ExecutionResult(action=request.action, target=request.target,
                               success=True,
                               detail=f"applied {request.action} to {request.target}")
