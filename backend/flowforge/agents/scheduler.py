"""Scheduler / capacity-planner agent. OWNER: P3 (manufacturing).
Implements the SAME Planner interface as the logistics planner, but for the
manufacturing domain: on machine downtime it reassigns jobs across the remaining
machines (job-shop scheduling via CP-SAT in solver/schedule.py), then hands the
options to the unchanged Verifier / Gate / Executor / audit pipeline.
Signature kept: plan(disruption) -> Plan."""
from ..interfaces import Planner
from ..contracts import Disruption, Plan
from ..solver.schedule import schedule_with_risk


class SchedulerPlanner(Planner):
    name = "scheduler"

    def plan(self, disruption: Disruption) -> Plan:
        options = schedule_with_risk(disruption)
        if not options:
            return Plan(disruption_id=disruption.id, options=[],
                        recommended_option_id=None, created_by="scheduler")
        # urgent lines favor the lowest-makespan option; otherwise the best score.
        if disruption.severity.value in ("high", "critical"):
            best = min(options, key=lambda o: o.est_time_min)
        else:
            best = max(options, key=lambda o: o.score)
        return Plan(disruption_id=disruption.id, options=options,
                    recommended_option_id=best.id, created_by="scheduler")
