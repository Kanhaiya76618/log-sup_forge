"""Live-layer invariants that must survive any future merge:
provenance tags, synthetic fallback, concurrent-storm blocked-port UNION,
env switches (FLOWFORGE_LIVE / DEMO_SENSITIVITY / FLOWFORGE_FORCE_DEMO /
FLOWFORGE_NEWS), and the news watcher's silent degradation.
Run: PYTHONPATH=. pytest tests/test_live.py"""
from flowforge.connectors.logistics import live, news
from flowforge.connectors.logistics.live import (
    LiveLogisticsConnector, weather_to_signals,
)
from flowforge.connectors.logistics.news import (
    fetch_news_signals, headlines_to_signals,
)
from flowforge.core.engine import build_engine
from flowforge.contracts import Domain


def _calm(port):
    return {"port": port, "wind_gusts_10m": 1.0, "precipitation": 0.0}


def test_weather_provenance_and_blocked_union():
    current = [
        {"port": "Yokohama", "wind_gusts_10m": 95.0, "precipitation": 0.0},
        {"port": "Kobe", "wind_gusts_10m": 65.0, "precipitation": 0.0},
        _calm("Shanghai"), _calm("Busan"),
    ]
    signals = weather_to_signals(current, sensitivity=1.0)
    assert all(s.payload["provenance"] == "live" for s in signals)
    anomalies = [s for s in signals if s.payload["anomaly"]]
    assert {s.payload["port"] for s in anomalies} == {"Yokohama", "Kobe"}
    # concurrent storms: every anomalous signal carries the UNION of blocked ports
    for s in anomalies:
        assert set(s.payload["blocked"]) == {"Yokohama", "Kobe"}
    yoko = next(s for s in anomalies if s.payload["port"] == "Yokohama")
    assert yoko.payload["severity"] == "critical"   # 95 km/h >= critical threshold


def test_demo_sensitivity_scales_thresholds():
    current = [{"port": "Yokohama", "wind_gusts_10m": 20.0, "precipitation": 0.0}]
    assert not any(s.payload["anomaly"] for s in weather_to_signals(current, 1.0))
    assert all(s.payload["anomaly"] for s in weather_to_signals(current, 0.3))


def test_synthetic_fallback_on_network_failure(monkeypatch):
    def boom(timeout=8.0):
        raise OSError("no network")
    monkeypatch.setattr(live, "fetch_weather", boom)
    sigs = LiveLogisticsConnector().fetch_signals()
    assert sigs
    assert all(s.payload["provenance"].startswith("synthetic_fallback") for s in sigs)
    assert any(s.payload.get("anomaly") for s in sigs)   # demo still has a disruption


def test_force_demo_injects_clearly_labeled_synthetic(monkeypatch):
    monkeypatch.setattr(live, "fetch_weather",
                        lambda timeout=8.0: [_calm(p) for p in live.PORTS])
    monkeypatch.setenv("FLOWFORGE_FORECAST", "0")
    monkeypatch.setenv("FLOWFORGE_FORCE_DEMO", "1")
    monkeypatch.delenv("FLOWFORGE_NEWS", raising=False)
    sigs = LiveLogisticsConnector().fetch_signals()
    injected = [s for s in sigs if s.payload.get("provenance") == "synthetic_injected"]
    assert len(injected) == 1 and injected[0].payload["anomaly"]
    # the real (calm) readings are still present and still tagged live
    assert sum(s.payload.get("provenance") == "live" for s in sigs) == len(live.PORTS)


def test_flowforge_live_switch_selects_live_connector(monkeypatch):
    monkeypatch.setenv("FLOWFORGE_LIVE", "1")
    engine = build_engine()
    assert isinstance(engine.registry.connector(Domain.LOGISTICS), LiveLogisticsConnector)
    monkeypatch.delenv("FLOWFORGE_LIVE")
    engine = build_engine()
    assert not isinstance(engine.registry.connector(Domain.LOGISTICS), LiveLogisticsConnector)


def test_news_matcher_needs_port_and_strong_keyword():
    heads = [
        "Typhoon forces Yokohama port closure as ships divert",      # critical
        "Busan terminal operations suspended amid storm warnings",   # high
        "Tokyo stocks rise on weak yen",                             # no match
        "Yokohama mayor opens flower festival",                      # port, no keyword
    ]
    sigs = headlines_to_signals(heads, ports=["Yokohama", "Kobe", "Shanghai", "Busan"])
    assert {s.payload["port"] for s in sigs} == {"Yokohama", "Busan"}
    assert all(s.payload["provenance"] == "live_news" for s in sigs)
    for s in sigs:   # news hits share one blocked union too
        assert set(s.payload["blocked"]) == {"Busan", "Yokohama"}
    yoko = next(s for s in sigs if s.payload["port"] == "Yokohama")
    assert yoko.payload["severity"] == "critical"
    assert yoko.payload["type"] == "port_closure"
    busan = next(s for s in sigs if s.payload["port"] == "Busan")
    assert busan.payload["severity"] == "high"
    assert busan.payload["type"] == "shipment_delay"


def test_news_degrades_silently(monkeypatch):
    def boom(timeout=8.0):
        raise OSError("feed unreachable")
    monkeypatch.setattr(news, "fetch_headlines", boom)
    assert fetch_news_signals() == []


def test_news_union_merges_with_weather(monkeypatch):
    monkeypatch.setattr(live, "fetch_weather", lambda timeout=8.0: [
        {"port": "Kobe", "wind_gusts_10m": 70.0, "precipitation": 0.0},
        _calm("Shanghai"),
    ])
    monkeypatch.setattr(news, "fetch_headlines",
                        lambda timeout=8.0: ["Typhoon shuts Yokohama port"])
    monkeypatch.setenv("FLOWFORGE_FORECAST", "0")
    monkeypatch.setenv("FLOWFORGE_NEWS", "1")
    sigs = LiveLogisticsConnector().fetch_signals()
    anomalies = [s for s in sigs if s.payload.get("anomaly")]
    assert {s.payload["provenance"] for s in anomalies} == {"live", "live_news"}
    # weather-blocked Kobe and news-blocked Yokohama merge into ONE union
    for s in anomalies:
        assert set(s.payload["blocked"]) == {"Kobe", "Yokohama"}


def test_serp_titles_parser_and_matcher():
    from flowforge.connectors.logistics.brightdata import serp_json_to_titles
    blob = {
        "organic": [
            {"title": "Typhoon forces Yokohama port closure", "description": "Ships divert south"},
            {"title": "Unrelated result"},
        ],
        "news": [{"title": "Kobe terminal shut after storm surge"}],
        "general": {"ignored": True},
    }
    titles = serp_json_to_titles(blob)
    assert "Typhoon forces Yokohama port closure" in titles
    assert "Kobe terminal shut after storm surge" in titles
    sigs = headlines_to_signals(titles, source="brightdata-serp", provenance="live_serp")
    assert {s.payload["port"] for s in sigs} == {"Yokohama", "Kobe"}
    assert all(s.payload["provenance"] == "live_serp" for s in sigs)
    assert all(s.source == "brightdata-serp" for s in sigs)


def test_serp_degrades_silently_without_credentials(monkeypatch):
    from flowforge.connectors.logistics.brightdata import fetch_serp_signals
    monkeypatch.delenv("BRIGHT_DATA_API_KEY", raising=False)
    monkeypatch.delenv("BRIGHT_DATA_ZONE", raising=False)
    assert fetch_serp_signals() == []


def test_serp_union_and_dedup_with_news(monkeypatch):
    from flowforge.connectors.logistics import brightdata
    monkeypatch.setattr(live, "fetch_weather", lambda timeout=8.0: [
        {"port": "Shanghai", "wind_gusts_10m": 70.0, "precipitation": 0.0}])
    monkeypatch.setattr(news, "fetch_headlines",
                        lambda timeout=8.0: ["Typhoon shuts Yokohama port"])
    monkeypatch.setattr(brightdata, "fetch_serp_titles", lambda timeout=12.0: [
        "Typhoon shuts Yokohama port",            # duplicate of the news hit
        "Busan port closed amid evacuation"])     # new port
    monkeypatch.setenv("FLOWFORGE_NEWS", "1")
    monkeypatch.setenv("FLOWFORGE_FORECAST", "0")
    monkeypatch.setenv("FLOWFORGE_BRIGHTDATA", "1")
    sigs = LiveLogisticsConnector().fetch_signals()
    anomalies = [s for s in sigs if s.payload.get("anomaly")]
    # Yokohama appears once (news wins the dedup), Busan comes from SERP only
    yoko = [s for s in anomalies if s.payload.get("port") == "Yokohama"]
    assert len(yoko) == 1 and yoko[0].payload["provenance"] == "live_news"
    assert any(s.payload.get("provenance") == "live_serp"
               and s.payload.get("port") == "Busan" for s in anomalies)
    # one union across weather + news + serp
    for s in anomalies:
        assert set(s.payload["blocked"]) == {"Busan", "Shanghai", "Yokohama"}
