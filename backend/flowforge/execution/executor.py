"""Executor. OWNER: P4.
REPLACE with real deterministic actions through the connector (ERP, PO, notify).
The LLM never reaches this layer — only verified, gated plans do.
KEEP the signature: (ActionRequest, connector) -> ExecutionResult."""
from ..interfaces import BaseExecutor, BaseConnector
from ..contracts import ActionRequest, ExecutionResult


class StubExecutor(BaseExecutor):
    def execute(self, request: ActionRequest, connector: BaseConnector) -> ExecutionResult:
        # Delegate the domain-specific effect to the connector.
        return connector.apply_action(request)
