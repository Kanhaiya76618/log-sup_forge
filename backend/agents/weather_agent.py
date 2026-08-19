import logging
from typing import Dict, Any

logger = logging.getLogger("flowforge.agents.weather")

class WeatherAgent:
    """Agent monitoring weather & marine atmospheric risks across sea routes."""

    def __init__(self):
        self.name = "WEATHER_AGENT"

    async def evaluate_route_risk(self, origin: str, destination: str, weather_data: Dict[str, Any]) -> Dict[str, Any]:
        wind_speed = weather_data.get("wind_speed_knots", 15.0)
        is_typhoon = weather_data.get("is_typhoon_warning", False) or wind_speed > 35.0

        if is_typhoon:
            risk_score = 0.88
            status = "CRITICAL_TYPHOON_WARNING"
            recommendation = "Reroute vessels via southern corridor to avoid swell center."
        elif wind_speed > 25.0:
            risk_score = 0.52
            status = "MODERATE_WIND_RISK"
            recommendation = "Reduce vessel speed by 2-3 knots to preserve structural integrity."
        else:
            risk_score = 0.12
            status = "CLEAR_NAVIGATION"
            recommendation = "Maintain scheduled transit speed."

        return {
            "agent": self.name,
            "origin": origin,
            "destination": destination,
            "wind_speed_knots": wind_speed,
            "risk_score": risk_score,
            "status": status,
            "recommendation": recommendation
        }

weather_agent = WeatherAgent()
