"""
RouteAgent — independent backend service for vessel route analysis and hazard projection.

There is no single trained route_model.pkl for scoring; route optimization is a
heuristic forward-projection engine that samples weather conditions at projected
waypoints along the vessel's bearing.

Route scoring uses:
  - Real-time weather hazard at projected positions (via WeatherService → Open-Meteo)
  - Bearing + speed physics (haversine dead-reckoning projection)
  - HAZARD_RANK ladder to compare hazard levels across waypoints

Output:
  - candidate_routes: list of route options with computed scores
  - selected_route: best route chosen by minimum hazard score
  - route_score: numeric score [0-1] for the selected route (lower = safer)
  - worst_hazard: worst hazard level encountered along the projected path
  - alternative_routes: diversion options triggered when hazard >= HIGH

This agent:
  - Receives a validated RouteInput Pydantic model
  - Projects waypoints using dead-reckoning bearing equations
  - Queries WeatherService for live hazard at each waypoint
  - Returns a typed RouteOutput Pydantic model
  - Never loads model files, never touches API/frontend code
"""
import math
import logging
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

try:
    from app.services.weather_service import weather_service
    from app.utils.helpers import haversine_distance_km
except ImportError:
    from services.weather_service import weather_service
    from utils.helpers import haversine_distance_km

logger = logging.getLogger("flowforge.agents.route")

HAZARD_RANK: Dict[str, int] = {"LOW": 0, "MODERATE": 1, "HIGH": 2, "CRITICAL": 3}
HAZARD_SCORE: Dict[str, float] = {"LOW": 0.10, "MODERATE": 0.35, "HIGH": 0.70, "CRITICAL": 1.00}


# ── Structured Input Schema ────────────────────────────────────────────────────

class RouteInput(BaseModel):
    """Validated input for RouteAgent."""
    origin: str = Field("CNSHA", description="Origin port identifier")
    destination: str = Field("JPYOK", description="Destination port identifier")
    current_lat: float = Field(31.2304, description="Current vessel latitude")
    current_lon: float = Field(121.4737, description="Current vessel longitude")
    course_deg: float = Field(85.0, ge=0.0, lt=360.0, description="Vessel course bearing (degrees true)")
    speed_knots: float = Field(14.2, gt=0, description="Vessel speed in knots")
    lookahead_hours: List[float] = Field(
        default=[1.0, 3.0, 6.0],
        description="Time horizons (hours ahead) at which to sample weather"
    )


# ── Structured Output Sub-types ────────────────────────────────────────────────

class Waypoint(BaseModel):
    hours_ahead: float
    lat: float
    lon: float
    hazard: str
    wind_speed_kts: Optional[float]
    wave_height_m: Optional[float]
    cyclone_warning: bool
    hazard_score: float


class RouteOption(BaseModel):
    route_id: str
    description: str
    route_score: float = Field(description="Composite hazard score [0-1], lower = safer")
    extra_distance_nm: float
    extra_transit_hours: float
    recommendation: str
    safety_rating: str


class RouteOutput(BaseModel):
    """Structured output from RouteAgent."""
    agent: str
    corridor: str
    origin: str
    destination: str

    # Primary projection analysis
    sampled_waypoints: List[Waypoint]
    worst_hazard: str
    worst_hazard_score: float
    cyclone_on_path: bool

    # Route scoring
    current_route_score: float = Field(description="Hazard score of current route [0-1]")
    candidate_routes: List[RouteOption]
    selected_route: RouteOption = Field(description="Lowest-score (safest) route option")
    reroute_required: bool

    # Provenance
    hazard_source: str
    waypoint_count: int


# ── Agent Implementation ───────────────────────────────────────────────────────

class RouteAgent:
    """
    RouteAgent — projects vessel positions along bearing and samples live weather hazards.

    Dead-reckoning projection formula (matches training domain physics):
      dist_km = speed_knots × 1.852 × hours
      new_lat  = asin( sin(lat) × cos(d/R) + cos(lat) × sin(d/R) × cos(bearing) )
      new_lon  = lon + atan2( sin(bearing) × sin(d/R) × cos(lat),
                              cos(d/R) - sin(lat) × sin(new_lat) )

    Route scoring:
      route_score = average(HAZARD_SCORE[waypoint.hazard]) over all sampled waypoints
    """

    def __init__(self):
        self.name = "ROUTE_AGENT"

    def _project_position(
        self, lat: float, lon: float,
        course_deg: float, speed_knots: float, hours: float
    ):
        """Project vessel position using spherical dead-reckoning."""
        dist_km = speed_knots * 1.852 * hours
        bearing = math.radians(course_deg)
        R = 6371.0
        lat_r = math.radians(lat)
        lon_r = math.radians(lon)
        new_lat_r = math.asin(
            math.sin(lat_r) * math.cos(dist_km / R) +
            math.cos(lat_r) * math.sin(dist_km / R) * math.cos(bearing)
        )
        new_lon_r = lon_r + math.atan2(
            math.sin(bearing) * math.sin(dist_km / R) * math.cos(lat_r),
            math.cos(dist_km / R) - math.sin(lat_r) * math.sin(new_lat_r)
        )
        return math.degrees(new_lat_r), math.degrees(new_lon_r)

    def _score_route(self, waypoints: List[Waypoint]) -> float:
        """Compute composite route hazard score from sampled waypoints."""
        if not waypoints:
            return 0.0
        return round(sum(w.hazard_score for w in waypoints) / len(waypoints), 4)

    def predict(self, inp: RouteInput) -> RouteOutput:
        """
        Core route analysis method — pure business logic.

        1. Projects waypoints along course bearing using dead-reckoning
        2. Queries WeatherService for live hazard at each projected position
        3. Computes worst hazard and route score
        4. Constructs alternative diversion routes when hazard >= HIGH
        5. Selects safest candidate route
        6. Returns typed RouteOutput
        """
        sampled: List[Waypoint] = []
        worst_hazard = "LOW"
        cyclone_on_path = False

        for hours in inp.lookahead_hours:
            proj_lat, proj_lon = self._project_position(
                inp.current_lat, inp.current_lon,
                inp.course_deg, inp.speed_knots, hours
            )
            weather = weather_service.get_weather_normalized(proj_lat, proj_lon)
            hazard = weather.get("hazard", "LOW")
            cyclone = bool(weather.get("cyclone_warning", False))

            if HAZARD_RANK.get(hazard, 0) > HAZARD_RANK.get(worst_hazard, 0):
                worst_hazard = hazard
            if cyclone:
                cyclone_on_path = True

            sampled.append(Waypoint(
                hours_ahead=hours,
                lat=round(proj_lat, 4),
                lon=round(proj_lon, 4),
                hazard=hazard,
                wind_speed_kts=weather.get("wind_speed"),
                wave_height_m=weather.get("wave_height"),
                cyclone_warning=cyclone,
                hazard_score=HAZARD_SCORE.get(hazard, 0.10)
            ))

        current_route_score = self._score_route(sampled)
        worst_hazard_score = HAZARD_SCORE.get(worst_hazard, 0.10)

        # Build current route option
        current_route = RouteOption(
            route_id="DIRECT-00",
            description=f"Direct route: {inp.origin} → {inp.destination}",
            route_score=current_route_score,
            extra_distance_nm=0.0,
            extra_transit_hours=0.0,
            recommendation="MAINTAIN CURRENT COURSE",
            safety_rating="HIGH" if current_route_score < 0.35 else "MEDIUM" if current_route_score < 0.70 else "LOW"
        )

        candidate_routes: List[RouteOption] = [current_route]

        # Add alternative diversion routes when hazard is elevated
        if worst_hazard in ["HIGH", "CRITICAL"] or cyclone_on_path:
            kobe_score = max(0.05, current_route_score * 0.45)  # diversion avoids high-hazard zone
            nagoya_score = max(0.10, current_route_score * 0.60)
            candidate_routes.append(RouteOption(
                route_id="ALT-KOBE-01",
                description="Diversion via Kii Channel → Port of Kobe (JPUKB)",
                route_score=kobe_score,
                extra_distance_nm=180.0,
                extra_transit_hours=round(180.0 / (inp.speed_knots * 1.0), 1),
                recommendation="DIVERT VIA KII CHANNEL TO KOBE — avoids cyclone corridor",
                safety_rating="HIGH"
            ))
            candidate_routes.append(RouteOption(
                route_id="ALT-NAGOYA-02",
                description="Diversion via Ise Bay → Port of Nagoya (JPNGO)",
                route_score=nagoya_score,
                extra_distance_nm=110.0,
                extra_transit_hours=round(110.0 / (inp.speed_knots * 1.0), 1),
                recommendation="DIVERT VIA ISE BAY TO NAGOYA — partial hazard avoidance",
                safety_rating="MEDIUM"
            ))
        elif worst_hazard == "MODERATE":
            nagoya_score = max(0.10, current_route_score * 0.65)
            candidate_routes.append(RouteOption(
                route_id="ALT-NAGOYA-02",
                description="Diversion via Ise Bay → Port of Nagoya (JPNGO)",
                route_score=nagoya_score,
                extra_distance_nm=110.0,
                extra_transit_hours=round(110.0 / (inp.speed_knots * 1.0), 1),
                recommendation="OPTIONAL DIVERT VIA NAGOYA — moderate weather reduction",
                safety_rating="MEDIUM"
            ))

        # Select lowest-score (safest) route
        selected_route = min(candidate_routes, key=lambda r: r.route_score)
        reroute_required = selected_route.route_id != "DIRECT-00"

        return RouteOutput(
            agent=self.name,
            corridor=f"{inp.origin} → {inp.destination}",
            origin=inp.origin,
            destination=inp.destination,
            sampled_waypoints=sampled,
            worst_hazard=worst_hazard,
            worst_hazard_score=worst_hazard_score,
            cyclone_on_path=cyclone_on_path,
            current_route_score=current_route_score,
            candidate_routes=candidate_routes,
            selected_route=selected_route,
            reroute_required=reroute_required,
            hazard_source="LIVE_OPEN_METEO",
            waypoint_count=len(sampled)
        )

    def analyze_route(
        self,
        current_lat: float,
        current_lon: float,
        course_deg: float,
        speed_knots: float,
        origin: str = "CNSHA",
        destination: str = "JPYOK",
        lookahead_hours: List[float] = [1.0, 3.0, 6.0]
    ) -> Dict[str, Any]:
        """
        Backward-compatible orchestrator interface.
        Builds RouteInput, calls predict(), returns dict.
        """
        inp = RouteInput(
            origin=origin,
            destination=destination,
            current_lat=current_lat,
            current_lon=current_lon,
            course_deg=course_deg,
            speed_knots=speed_knots,
            lookahead_hours=lookahead_hours
        )
        result = self.predict(inp)
        return {
            "agent": result.agent,
            "corridor": result.corridor,
            "worst_hazard_ahead": result.worst_hazard,
            "worst_hazard_score": result.worst_hazard_score,
            "cyclone_on_path": result.cyclone_on_path,
            "current_route_score": result.current_route_score,
            "sampled_waypoints": [w.model_dump() for w in result.sampled_waypoints],
            "candidate_routes": [r.model_dump() for r in result.candidate_routes],
            "selected_route": result.selected_route.model_dump(),
            "alternative_routes": [r.model_dump() for r in result.candidate_routes if r.route_id != "DIRECT-00"],
            "reroute_required": result.reroute_required,
            "hazard_source": result.hazard_source
        }


route_agent = RouteAgent()
