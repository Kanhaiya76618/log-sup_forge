"""Audit sink. OWNER: P4.
REPLACE InMemoryAuditSink with a DB-backed sink (Postgres/SQLite) for an
immutable, queryable trail. KEEP the BaseAuditSink interface."""
from ..interfaces import BaseAuditSink
from ..contracts import AuditEntry


class InMemoryAuditSink(BaseAuditSink):
    def __init__(self) -> None:
        self._entries: list[AuditEntry] = []

    def write(self, entry: AuditEntry) -> None:
        self._entries.append(entry)

    def all(self) -> list[AuditEntry]:
        return list(self._entries)
