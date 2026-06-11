from ..interfaces.agent import Planner
from ..contracts import Disruption, PlanOption
from ..solver.optimizer import optimize

class PlannerAgent(Planner):
    @property
    def name(self) -> str:
        return "Planner"

    def propose_plans(self, disruption: Disruption) -> list[PlanOption]:
        # Triggers P3's CP-SAT / replenishment routing MILP solver directly
        plans = optimize(disruption)
        return plans
