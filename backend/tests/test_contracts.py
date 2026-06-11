import pytest
from flowforge.contracts.enums import Severity, DisruptionType, ActionType
from flowforge.contracts.disruption import Disruption, BlastRadius
from flowforge.contracts.plan import PlanStep, PlanOption

def test_blast_radius_contract():
    radius = BlastRadius(
        affected_orders=["ORD-101"],
        affected_skus=["SKU-A12"],
        value_at_risk=2500.0
    )
    assert radius.value_at_risk == 2500.0
    assert len(radius.affected_orders) == 1

def test_plan_recommended_empty():
    assert PlanOption.recommended([]) is None

def test_plan_recommended_highest_score():
    steps = [
        PlanStep(action=ActionType.REROUTE, target="ORD-101", params={}, est_cost=200, reversible=True)
    ]
    p1 = PlanOption(steps=steps, total_cost=200, est_time_min=500, score=0.6, rationale="Low score option")
    p2 = PlanOption(steps=steps, total_cost=200, est_time_min=500, score=0.9, rationale="High score option")
    
    assert PlanOption.recommended([p1, p2]) == p2
