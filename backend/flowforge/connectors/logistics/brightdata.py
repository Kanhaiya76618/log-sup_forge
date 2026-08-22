"""LIVE Bright Data SERP source — Google results scanned for port disruptions.
OWNER: P2 (P3 assisted). OPTIONAL: only used when FLOWFORGE_BRIGHTDATA=1.

Uses Bright Data's SERP API (structured JSON via brd_json=1 — NOT HTML
scraping). Credentials come ONLY from env:
  BRIGHT_DATA_API_KEY   bearer token (required)
  BRIGHT_DATA_ZONE      SERP zone name (required)
  BRIGHT_DATA_SERP_URL  optional endpoint override
                        (default https://api.brightdata.com/request)

Degrades SILENTLY: missing credentials, network failure, or unexpected JSON
all yield zero signals — the weather/news/synthetic layers keep the demo
alive. Matched headlines reuse the same port+keyword matcher and feed the
same blocked-port union as the RSS watcher (provenance "live_serp")."""
from __future__ import annotations
import json
import os
import urllib.parse
import urllib.request

from ...contracts import RawSignal
from .live import _ssl_context
from .news import headlines_to_signals

_DEFAULT_ENDPOINT = "https://api.brightdata.com/request"
_QUERY = '"port closure" OR "port closed" OR typhoon Yokohama OR Kobe OR Shanghai OR Busan'


def fetch_serp_titles(timeout: float = 12.0) -> list[str]:
    """One SERP API call; returns result titles. Raises on any failure
    (caller decides the fallback). Returns [] without a request when
    credentials are absent."""
    key = os.environ.get("BRIGHT_DATA_API_KEY")
    zone = os.environ.get("BRIGHT_DATA_ZONE")
    if not key or not zone:
        return []
    endpoint = os.environ.get("BRIGHT_DATA_SERP_URL") or _DEFAULT_ENDPOINT
    search = ("https://www.google.com/search?q="
              + urllib.parse.quote(_QUERY) + "&brd_json=1")
    body = json.dumps({"zone": zone, "url": search, "format": "raw"}).encode()
    req = urllib.request.Request(
        endpoint, data=body,
        headers={"Authorization": f"Bearer {key}",
                 "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout, context=_ssl_context()) as r:
        data = json.loads(r.read().decode())
    return serp_json_to_titles(data)


def serp_json_to_titles(data: dict) -> list[str]:
    """Pure + unit-testable: pull titles/descriptions out of a parsed SERP blob
    (organic + news sections)."""
    titles: list[str] = []
    if not isinstance(data, dict):
        return titles
    for section in ("organic", "news", "top_stories"):
        for item in data.get(section) or []:
            if isinstance(item, dict):
                for field in ("title", "description"):
                    v = item.get(field)
                    if isinstance(v, str) and v.strip():
                        titles.append(v.strip())
    return titles


def fetch_serp_signals() -> list[RawSignal]:
    """Silent degradation: any failure -> no signals, never an exception."""
    try:
        return headlines_to_signals(fetch_serp_titles(),
                                    source="brightdata-serp",
                                    provenance="live_serp")
    except Exception:
        return []
