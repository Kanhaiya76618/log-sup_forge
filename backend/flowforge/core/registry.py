"""Connector + agent registry. OWNER: P1.
Pluggability lives here: register a connector for a domain and the engine can
serve it. Adding manufacturing in Round 2 is ONE line, no edits elsewhere."""
from ..interfaces import BaseConnector, Planner
from ..contracts import Domain


class Registry:
    def __init__(self) -> None:
        self._connectors: dict[Domain, BaseConnector] = {}
        self._planners: dict[Domain, Planner] = {}

    def register_connector(self, connector: BaseConnector) -> None:
        self._connectors[connector.domain] = connector

    def connector(self, domain: Domain) -> BaseConnector:
        if domain not in self._connectors:
            raise KeyError(f"No connector registered for domain {domain}")
        return self._connectors[domain]

    def domains(self) -> list[Domain]:
        return list(self._connectors)

    # Per-domain planner: logistics routes, manufacturing schedules. The
    # orchestrator picks the right one without knowing the concrete classes.
    def register_planner(self, domain: Domain, planner: Planner) -> None:
        self._planners[domain] = planner

    def planner_for(self, domain: Domain) -> Planner | None:
        return self._planners.get(domain)
