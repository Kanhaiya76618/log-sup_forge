import logging

from ..interfaces.executor import BaseExecutor
from ..interfaces.connector import BaseConnector
from ..contracts import PlanStep, ExecutionResult, ActionRequest

logger = logging.getLogger(__name__)


class StubExecutor(BaseExecutor):
    def execute_step(self, step: PlanStep, connectors: dict[str, BaseConnector]) -> ExecutionResult:
        # Resolve target connector by domain or name
        connector = connectors.get("logistics") or connectors.get("LogisticsConnector")

        try:
            if connector:
                req = ActionRequest(action=step.action, target=step.target, params=step.params)
                result = connector.apply_action(req)
            else:
                result = ExecutionResult(
                    action=step.action,
                    target=step.target,
                    success=True,
                    detail=f"Executed {step.action.value} on {step.target} via generic execution handler.",
                )

            # If the step failed and is irreversible, log a rollback signal
            if not result.success and not step.reversible:
                logger.error(
                    "[ROLLBACK REQUIRED] Step '%s' on target '%s' failed and is irreversible. "
                    "Manual intervention needed.",
                    step.action.value,
                    step.target,
                )
                return ExecutionResult(
                    action=step.action,
                    target=step.target,
                    success=False,
                    detail=(
                        f"ROLLBACK REQUIRED: '{step.action.value}' on '{step.target}' failed "
                        f"and cannot be automatically reversed. Reason: {result.detail}"
                    ),
                )

            return result

        except Exception as exc:  # noqa: BLE001
            logger.exception("Unexpected error executing step '%s': %s", step.action.value, exc)
            if not step.reversible:
                logger.error(
                    "[ROLLBACK REQUIRED] Exception during irreversible step '%s' on '%s'.",
                    step.action.value,
                    step.target,
                )
            return ExecutionResult(
                action=step.action,
                target=step.target,
                success=False,
                detail=f"Exception during execution: {exc}",
            )

