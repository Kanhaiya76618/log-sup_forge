"""
app/risk_cost.py

Route Risk and Total Cost Formulas.
Computes multi-objective costs including demurrage, stockout, carbon tax, and risk scores.
"""

from typing import Dict, Any, List


def calculate_route_risk(
    base_risk_scores: List[float],
    weather_severity: float = 0.0,
    chokepoint_congestion: float = 0.0
) -> float:
    """
    Computes aggregate RouteRisk across traversed edges.
    """
    if not base_risk_scores:
        return round(weather_severity * 0.5 + chokepoint_congestion * 0.5, 3)
    avg_risk = sum(base_risk_scores) / len(base_risk_scores)
    total_risk = avg_risk * 0.6 + weather_severity * 0.25 + chokepoint_congestion * 0.15
    return round(min(1.0, max(0.0, total_risk)), 3)


def calculate_total_cost(
    distance_km: float,
    speed_knots: float = 16.0,
    fuel_cost_per_ton: float = 620.0,
    demurrage_rate_per_hour: float = 850.0,
    predicted_delay_hours: float = 0.0,
    carbon_tax_per_ton: float = 65.0
) -> Dict[str, float]:
    """
    Computes itemized and TotalCost for a route option.
    """
    # 1 Knot ≈ 1.852 km/h
    speed_kmh = max(1.0, speed_knots * 1.852)
    transit_hours = distance_km / speed_kmh
    
    # Fuel consumption model (Admiralty coefficient scaling)
    fuel_tons = (distance_km / 100.0) * (speed_knots / 16.0) ** 2 * 2.8
    fuel_cost = fuel_tons * fuel_cost_per_ton
    demurrage_cost = predicted_delay_hours * demurrage_rate_per_hour
    carbon_tax_cost = fuel_tons * 3.114 * (carbon_tax_per_ton / 100.0)
    total_cost = fuel_cost + demurrage_cost + carbon_tax_cost

    return {
        "transit_hours": round(transit_hours, 1),
        "fuel_cost_usd": round(fuel_cost, 2),
        "demurrage_cost_usd": round(demurrage_cost, 2),
        "carbon_tax_cost_usd": round(carbon_tax_cost, 2),
        "total_cost_usd": round(total_cost, 2)
    }
