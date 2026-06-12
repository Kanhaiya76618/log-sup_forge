"""LIVE news watcher — keyless Google News RSS scanned for port disruptions.
OWNER: P2 (P3 assisted).

Structured feed only (RSS/XML via stdlib urllib + xml.etree): no HTML scraping,
no API key, no paid services. Gated behind FLOWFORGE_NEWS=1 in the live
connector and degrades SILENTLY — any network or parse failure yields zero
signals, so the weather + synthetic layers keep the demo alive.

A headline counts as a disruption only when it names a known port from the
route network AND contains a strong disruption keyword. Matched ports join the
same blocked-port UNION the weather layer feeds, so the solver routes around
storms and news events together.
"""
from __future__ import annotations
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from typing import Iterable

from ...contracts import RawSignal, Domain
from .live import PORTS, _ssl_context

_QUERY = '"port closure" OR "port closed" OR typhoon Japan'
_RSS = "https://news.google.com/rss/search?q={q}&hl=en-US&gl=US&ceid=US:en"

# Headline must contain a known port AND one of these to count as a disruption.
_STRONG = ("closure", "closed", "typhoon", "shut", "suspend",
           "halt", "storm", "evacuat", "disrupt", "delay")
# Subset that implies the port is actually unusable (vs. merely delayed).
_CRITICAL = ("typhoon", "closure", "closed", "shut")


def fetch_headlines(timeout: float = 8.0) -> list[str]:
    """Raises on network/parse failure (caller decides the fallback)."""
    url = _RSS.format(q=urllib.parse.quote(_QUERY))
    with urllib.request.urlopen(url, timeout=timeout, context=_ssl_context()) as r:
        root = ET.fromstring(r.read())
    return [t.text.strip() for t in root.iter("title") if t.text and t.text.strip()]


def headlines_to_signals(headlines: Iterable[str],
                         ports: Iterable[str] | None = None) -> list[RawSignal]:
    """Pure + unit-testable: keyword+port match -> one signal per matched port,
    each carrying the union of all news-matched ports in `blocked`."""
    ports = list(ports or PORTS)
    hits: dict[str, str] = {}            # port -> first matching headline
    for headline in headlines:
        low = headline.lower()
        if not any(k in low for k in _STRONG):
            continue
        for port in ports:
            if port.lower() in low and port not in hits:
                hits[port] = headline
    blocked = sorted(hits)
    signals: list[RawSignal] = []
    for port, headline in hits.items():
        critical = any(k in headline.lower() for k in _CRITICAL)
        signals.append(RawSignal(source="google-news-rss", domain=Domain.LOGISTICS, payload={
            "kind": "port_news", "provenance": "live_news",
            "port": port, "headline": headline, "anomaly": True,
            "type": "port_closure" if critical else "shipment_delay",
            "severity": "critical" if critical else "high",
            "summary": f"{port} flagged by live news: {headline}",
            "blocked": blocked,
            # Orders whose default lane traverses this port (demo order book)
            "orders": [f"ORD-{port[:3].upper()}-1", f"ORD-{port[:3].upper()}-2"],
            "value_at_risk": 12000.0 if critical else 6000.0,
        }))
    return signals


def fetch_news_signals() -> list[RawSignal]:
    """Silent degradation: any failure -> no signals, never an exception."""
    try:
        return headlines_to_signals(fetch_headlines())
    except Exception:
        return []
