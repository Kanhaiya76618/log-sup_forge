from typing import Dict, Optional
from flowforge.data.schemas import SeverityLevel

class SeverityEngine:
    def __init__(self, weights: Optional[Dict[str, float]] = None, normalizers: Optional[Dict[str, float]] = None):
        """
        Initializes the SeverityEngine with customizable weights and normalization scales.
        """
        # Default weights must sum to 1.0
        self.weights = weights or {
            "delay": 0.4,
            "orders": 0.3,
            "inventory": 0.3
        }
        
        # Scaling factors to map raw numbers to a 0.0 - 10.0 scale
        self.normalizers = normalizers or {
            "delay_max_hours": 24.0,   # 24 hours of delay is considered maximum impact
            "orders_max_count": 100.0, # 100 affected orders is considered maximum impact
            "inventory_max_risk": 1.0  # 1.0 (100% safety stock deficit) is maximum risk
        }

    def calculate_score(self, delay_hours: float, affected_orders: int, inventory_risk_factor: float) -> float:
        """
        Calculates a consolidated severity score between 0.0 and 10.0.
        
        Args:
            delay_hours: The delay introduced in hours.
            affected_orders: Number of downstream customer orders impacted.
            inventory_risk_factor: Safety stock depletion factor (0.0 = safe, 1.0 = stockout).
        """
        # Normalize individual components to [0.0, 10.0]
        norm_delay = min(10.0, (delay_hours / self.normalizers["delay_max_hours"]) * 10.0)
        norm_orders = min(10.0, (affected_orders / self.normalizers["orders_max_count"]) * 10.0)
        norm_inventory = min(10.0, (inventory_risk_factor / self.normalizers["inventory_max_risk"]) * 10.0)
        
        # Weighted score
        score = (
            self.weights["delay"] * norm_delay +
            self.weights["orders"] * norm_orders +
            self.weights["inventory"] * norm_inventory
        )
        
        return round(score, 2)

    def map_score_to_level(self, score: float) -> SeverityLevel:
        """Maps a numeric score (0.0 to 10.0) to a qualitative severity level."""
        if score < 2.5:
            return SeverityLevel.LOW
        elif score < 5.0:
            return SeverityLevel.MEDIUM
        elif score < 7.5:
            return SeverityLevel.HIGH
        else:
            return SeverityLevel.CRITICAL

    def evaluate_severity(self, delay_hours: float, affected_orders: int, inventory_risk_factor: float) -> tuple[float, SeverityLevel]:
        """Convenience method to return both the raw score and mapped level."""
        score = self.calculate_score(delay_hours, affected_orders, inventory_risk_factor)
        level = self.map_score_to_level(score)
        return score, level
