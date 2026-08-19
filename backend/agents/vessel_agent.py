import logging
from typing import Dict, Any, List

logger = logging.getLogger("flowforge.agents.vessel")

class VesselAgent:
    """Agent tracking vessel speed, ETA deviations, and cargo exposure risks."""

    def __init__(self):
        self.name = "VESSEL_AGENT"

    async def analyze_vessels(self, vessels: List[Dict[str, Any]]) -> Dict[str, Any]:
        high_risk_vessels = []
        total_cargo_at_risk = 0.0

        for vessel in vessels:
            speed = vessel.get("speed_knots", 15.0)
            cargo_val = vessel.get("cargo_value_usd", 0.0)
            if speed < 15.0 or vessel.get("risk_level") in ["MODERATE", "HIGH"]:
                high_risk_vessels.append(vessel.get("name"))
                total_cargo_at_risk += cargo_val

        return {
            "agent": self.name,
            "monitored_vessels_count": len(vessels),
            "high_risk_vessels": high_risk_vessels,
            "cargo_at_risk_usd": total_cargo_at_risk,
            "status": "ACTIVE_MONITORING"
        }

vessel_agent = VesselAgent()
