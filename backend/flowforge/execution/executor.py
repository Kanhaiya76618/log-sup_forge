from ..interfaces.executor import BaseExecutor
from ..interfaces.connector import BaseConnector
from ..contracts import PlanStep, ExecutionResult, ActionRequest

class StubExecutor(BaseExecutor):
    def execute_step(self, step: PlanStep, connectors: dict[str, BaseConnector]) -> ExecutionResult:
        # Resolve target connector by domain or name
        connector = connectors.get("logistics")
        if not connector:
            # Fallback to direct lookup
            connector = connectors.get("LogisticsConnector")
            
        if connector:
            req = ActionRequest(action=step.action, target=step.target, params=step.params)
            return connector.apply_action(req)
        
        return ExecutionResult(
            action=step.action,
            target=step.target,
            success=True,
            detail=f"Executed {step.action.value} on {step.target} via generic execution handler."
        )
