"""Watcher agent. OWNER: P2.
REPLACE the body with real anomaly detection (rules + LLM). KEEP the signature.
Until then this stub flags any signal whose payload says anomaly=True."""
from ..interfaces import Watcher
from ..contracts import RawSignal, Event


class StubWatcher(Watcher):
    def scan(self, signals: list[RawSignal]) -> list[Event]:
        events = []
        for s in signals:
            events.append(Event(
                domain=s.domain,
                kind=s.payload.get("kind", "signal"),
                data=s.payload,
                is_anomaly=bool(s.payload.get("anomaly", False)),
            ))
        return events
