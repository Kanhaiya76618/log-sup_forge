"""Connector + agent registry. OWNER: P1.
Pluggability lives here: register a connector for a domain and the engine can
serve it. Adding manufacturing in Round 2 is ONE line, no edits elsewhere."""
from ..interfaces import BaseConnector
from ..contracts import Domain


class Registry:
    def __init__(self) -> None:
        self._connectors: dict[Domain, BaseConnector] = {}

    def register_connector(self, connector: BaseConnector) -> None:
        self._connectors[connector.domain] = connector

    def connector(self, domain: Domain) -> BaseConnector:
        if domain not in self._connectors:
            raise KeyError(f"No connector registered for domain {domain}")
        return self._connectors[domain]

    def domains(self) -> list[Domain]:
        return list(self._connectors)
