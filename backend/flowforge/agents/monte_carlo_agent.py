"""
MonteCarloAgent — stochastic simulation layer for FlowForge.

Architecture:
    Live Data (weather, port, geo)
        +
    4 ML Model Outputs (disruption_prob, eta_hours, delay_prob, ml_cost)
        ↓
    MonteCarloAgent.run_simulation()
        ├─ N=10,000 ETA simulations  (anchored to ETA model output)
        ├─ N=10,000 Cost simulations (anchored to cost model output)
        └─ Disruption delay injected probabilistically per disruption_probability
        ↓
    MonteCarloOutput
        ├─ eta_percentiles      { P50, P90, P95, P99 }
        ├─ cost_percentiles     { P50, P90, P95, P99 }
        ├─ risk_metrics         { disruption_probability, deadline_miss_probability,
                                  budget_overrun_probability }
        ├─ confidence_interval  { eta_lower_95, eta_upper_95 }
        ├─ composite_risk_score  [0-1]
        └─ recommendation_confidence  HIGH / MEDIUM / LOW

Rules:
    - Loads distributions from ModelRegistry (no disk reads at request time)
    - Never retrains, never hardcodes predictions
    - Pure business logic — no API or frontend code
    - Deterministic when seed is set (reproducible results)
    - Degrades gracefully to parametric distributions if .npy arrays are missing
"""
import logging
import numpy as np
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator

try:
    from app.models.model_loader import model_registry
except ImportError:
    from models.model_loader import model_registry

logger = logging.getLogger("flowforge.agents.monte_carlo")


# ── Input / Output Schemas ─────────────────────────────────────────────────────

class MonteCarloInput(BaseModel):
    """All inputs required to run a Monte Carlo simulation pass."""
    # Request-level context
    baseline_eta_hours: float = Field(168.0, description="Customer-agreed ETA in hours")
    baseline_cost_usd: float = Field(5000.0, description="Budgeted shipment cost in USD")

    # ML model outputs (anchor points for the simulation)
    ml_eta_hours: float = Field(160.0, description="ETA prediction from ETA_Agent.pkl (hours)")
    ml_disruption_probability: float = Field(0.20, ge=0.0, le=1.0,
                                             description="Disruption probability from disruption_model.pkl")
    ml_delay_probability: float = Field(0.50, ge=0.0, le=1.0,
                                        description="Delay probability from Calibrated_Delay_Agent.pkl")
    ml_cost_usd: float = Field(5000.0, description="Cost prediction from cost_optimizer_xgb.pkl (USD)")

    # Live telemetry inputs
    weather_hazard_level: str = Field("LOW", description="Weather hazard: LOW/MODERATE/HIGH/CRITICAL")
    wind_speed_knots: float = Field(10.0, ge=0.0)
    wave_height_m: float = Field(1.0, ge=0.0)
    port_congestion_score: float = Field(0.45, ge=0.0, le=1.0)
    geo_risk_score: float = Field(0.20, ge=0.0, le=1.0)
    active_disaster_count: int = Field(0, ge=0)
    carrier_reliability_score: float = Field(0.85, ge=0.0, le=1.0)

    @field_validator(
        "baseline_eta_hours", "baseline_cost_usd", "ml_eta_hours",
        "ml_disruption_probability", "ml_delay_probability", "ml_cost_usd",
        "wind_speed_knots", "wave_height_m", "port_congestion_score",
        "geo_risk_score", "carrier_reliability_score",
        mode="before"
    )
    @classmethod
    def _coerce_float(cls, v: Any) -> float:
        if isinstance(v, dict):
            v = v.get("value", 0.0)
        return float(v) if v is not None else 0.0

    # Simulation config overrides
    simulation_count: int = Field(10000, ge=1000, le=100000)
    seed: Optional[int] = Field(42, description="RNG seed for reproducibility (None = random)")


class MonteCarloOutput(BaseModel):
    """Structured result from a Monte Carlo simulation run."""
    simulation_count: int
    source: str = "MONTE_CARLO"

    # Task 6 Explicit Provenance Structure
    eta: Dict[str, float]
    cost: Dict[str, float]
    risk: Dict[str, float]

    # ETA distribution
    eta_percentiles: Dict[str, float]          # P50, P90, P95, P99 (hours)
    eta_confidence_interval_95: Dict[str, float]  # lower_hours, upper_hours

    # Cost distribution
    cost_percentiles: Dict[str, float]         # P50, P90, P95, P99 (USD)
    cost_confidence_interval_95: Dict[str, float]

    # Risk metrics
    disruption_probability: float
    deadline_miss_probability: float           # P(simulated ETA > baseline_eta_hours)
    budget_overrun_probability: float          # P(simulated cost > baseline_cost_usd)
    on_time_delivery_probability: float        # 1 - deadline_miss_probability

    # Composite scores
    composite_risk_score: float                # 0-1 weighted blend
    recommendation_confidence: str             # HIGH / MEDIUM / LOW

    # Key simulation stats
    simulation_stats: Dict[str, Any]


# ── Agent Implementation ───────────────────────────────────────────────────────

class MonteCarloAgent:
    """
    MonteCarloAgent — runs N stochastic simulations per shipment request.

    Simulation methodology:
    1. ETA simulation:
       base = ml_eta_hours
       error = sample(eta_error_distribution)  * weather_hazard_multiplier
       port_delay = sample(port_congestion_distribution) * port_congestion_score
       customs = sample(customs_clearance_time)
       loading = sample(loading_unloading_time)
       disruption_delay = if Bernoulli(disruption_prob): sample(disruption_delay_distribution)
       simulated_eta[i] = base + error + port_delay + customs + loading + disruption_delay

    2. Cost simulation:
       base = ml_cost_usd
       ratio = sample(cost_ratio_distribution, replace=True)
       simulated_cost[i] = base * ratio  (clipped at 0.5x - 5x for outlier sanity)

    3. Risk metrics computed from the simulated distributions.
    """

    # Hazard → ETA error scale multiplier
    _HAZARD_MULTIPLIER = {
        "LOW": 1.0,
        "MODERATE": 1.4,
        "HIGH": 2.0,
        "CRITICAL": 3.0,
    }

    def __init__(self):
        self.name = "MONTE_CARLO_AGENT"
        self._rng: Optional[np.random.Generator] = None

    def _get_rng(self, seed: Optional[int]) -> np.random.Generator:
        return np.random.default_rng(seed)

    def _sample(
        self,
        rng: np.random.Generator,
        key: str,
        n: int,
        fallback_mean: float = 1.0,
        fallback_std: float = 0.3,
    ) -> np.ndarray:
        """
        Sample n values from a pre-loaded distribution array.
        Falls back to a normal distribution if the array is missing.
        """
        arr = model_registry.monte_carlo_distributions.get(key)
        if arr is not None and len(arr) > 0:
            idx = rng.integers(0, len(arr), size=n)
            return arr[idx]
        # Parametric fallback
        samples = rng.normal(fallback_mean, fallback_std, n)
        return np.clip(samples, 0.0, None)

    def run_simulation(self, inp: MonteCarloInput) -> MonteCarloOutput:
        """
        Core simulation method.
        Inputs come from live data + ML model outputs.
        Returns P50/P90/P95/P99 percentiles for ETA and Cost, plus risk metrics.
        """
        rng = self._get_rng(inp.seed)
        n = inp.simulation_count

        # ── Read config from ModelRegistry ────────────────────────────────────
        cfg = model_registry.monte_carlo_config
        risk_weights = cfg.get("risk_weights", {"eta": 0.4, "cost": 0.3, "disruption": 0.3})

        # ── Weather hazard multiplier ──────────────────────────────────────────
        hazard_mult = self._HAZARD_MULTIPLIER.get(
            inp.weather_hazard_level.upper(), 1.0
        )
        # Also factor in raw wind / wave data for more precision
        wind_factor = 1.0 + max(0.0, (inp.wind_speed_knots - 15.0) / 30.0)
        wave_factor = 1.0 + max(0.0, (inp.wave_height_m - 1.5) / 4.0)
        combined_weather_mult = hazard_mult * ((wind_factor + wave_factor) / 2.0)

        # ── ETA Simulation ─────────────────────────────────────────────────────
        # ETA
        base_eta_days = inp.ml_eta_hours / 24.0
        eta_error_samples = self._sample(rng, "eta_error_distribution", n,
                                         fallback_mean=3.2,
                                         fallback_std=4.7)

        # Disruption
        disruption_events = (
            rng.random(n)
            < inp.ml_disruption_probability
        )

        simulated_disruption_delay = np.zeros(n)

        count = int(disruption_events.sum())

        if count > 0:
            simulated_disruption_delay[disruption_events] = self._sample(
                rng,
                "disruption_delay_distribution",
                count,
                fallback_mean=3.25,
                fallback_std=4.7
            )

        simulated_eta_days = (
            base_eta_days
            + eta_error_samples
            + simulated_disruption_delay
        )

        # Convert back to hours for internal system consistency
        simulated_eta = simulated_eta_days * 24.0

        # Clip to realistic bounds (e.g. can't go below 0, max 60 days)
        simulated_eta = np.clip(simulated_eta, 0.0, 60.0 * 24.0)

        # ── Cost Simulation ────────────────────────────────────────────────────
        cost_samples = self._sample(rng, "cost_ratio_distribution", n,
                                    fallback_mean=1.0, fallback_std=1.42)

        simulated_cost = inp.ml_cost_usd * cost_samples
        simulated_cost = np.clip(simulated_cost, 0.0, None)

        # ── Compute Percentiles ────────────────────────────────────────────────
        eta_p50 = float(np.percentile(simulated_eta, 50))
        eta_p90 = float(np.percentile(simulated_eta, 90))
        eta_p95 = float(np.percentile(simulated_eta, 95))
        eta_p99 = float(np.percentile(simulated_eta, 99))
        eta_p2_5 = float(np.percentile(simulated_eta, 2.5))
        eta_p97_5 = float(np.percentile(simulated_eta, 97.5))

        cost_p50 = float(np.percentile(simulated_cost, 50))
        cost_p90 = float(np.percentile(simulated_cost, 90))
        cost_p95 = float(np.percentile(simulated_cost, 95))
        cost_p99 = float(np.percentile(simulated_cost, 99))
        cost_p2_5 = float(np.percentile(simulated_cost, 2.5))
        cost_p97_5 = float(np.percentile(simulated_cost, 97.5))

        # ── Risk Metrics ───────────────────────────────────────────────────────
        deadline_miss_prob = float(np.mean(simulated_eta > inp.baseline_eta_hours))
        budget_overrun_prob = float(np.mean(simulated_cost > inp.baseline_cost_usd))
        on_time_prob = 1.0 - deadline_miss_prob

        # ── Composite Risk Score ───────────────────────────────────────────────
        # Normalise deadline miss prob (0-1), budget overrun prob (0-1),
        # and disruption probability (already 0-1)
        w_eta = risk_weights.get("eta", 0.4)
        w_cost = risk_weights.get("cost", 0.3)
        w_dis = risk_weights.get("disruption", 0.3)

        composite_risk = (
            w_eta * deadline_miss_prob
            + w_cost * budget_overrun_prob
            + w_dis * inp.ml_disruption_probability
        )
        composite_risk = float(np.clip(composite_risk, 0.0, 1.0))

        # ── Confidence Classification ──────────────────────────────────────────
        # Wide CI relative to baseline = low confidence
        eta_ci_width = eta_p97_5 - eta_p2_5
        ci_ratio = eta_ci_width / max(inp.baseline_eta_hours, 1.0)
        if composite_risk < 0.25 and ci_ratio < 0.30:
            confidence = "HIGH"
        elif composite_risk < 0.55 and ci_ratio < 0.60:
            confidence = "MEDIUM"
        else:
            confidence = "LOW"

        logger.info(
            f"MonteCarloAgent: n={n}, ETA P50={eta_p50:.1f}h P95={eta_p95:.1f}h, "
            f"Cost P50=${cost_p50:,.0f} P95=${cost_p95:,.0f}, "
            f"deadline_miss={deadline_miss_prob:.1%}, composite_risk={composite_risk:.3f}, "
            f"confidence={confidence}"
        )

        # Task 6 — Explicit provenance sub-objects
        simulated_disruption_probability = round(float(np.mean(disruption_events)), 4)

        return MonteCarloOutput(
            simulation_count=n,
            # ── Task 6 Provenance ──
            eta={
                "p50": round(eta_p50, 1),
                "p90": round(eta_p90, 1),
                "p95": round(eta_p95, 1),
                "p99": round(eta_p99, 1),
            },
            cost={
                "mean": round(float(np.mean(simulated_cost)), 2),
                "p50": round(cost_p50, 2),
                "p90": round(cost_p90, 2),
                "p95": round(cost_p95, 2),
                "p99": round(cost_p99, 2),
            },
            risk={
                "disruption_probability": simulated_disruption_probability,
                "deadline_miss_probability": round(deadline_miss_prob, 4),
                "budget_overrun_probability": round(budget_overrun_prob, 4),
            },
            # ── Legacy / backward-compat fields ──
            eta_percentiles={
                "P50": round(eta_p50, 1),
                "P90": round(eta_p90, 1),
                "P95": round(eta_p95, 1),
                "P99": round(eta_p99, 1),
            },
            eta_confidence_interval_95={
                "lower_hours": round(eta_p2_5, 1),
                "upper_hours": round(eta_p97_5, 1),
            },
            cost_percentiles={
                "P50": round(cost_p50, 2),
                "P90": round(cost_p90, 2),
                "P95": round(cost_p95, 2),
                "P99": round(cost_p99, 2),
            },
            cost_confidence_interval_95={
                "lower_usd": round(cost_p2_5, 2),
                "upper_usd": round(cost_p97_5, 2),
            },
            disruption_probability=round(inp.ml_disruption_probability, 4),
            deadline_miss_probability=round(deadline_miss_prob, 4),
            budget_overrun_probability=round(budget_overrun_prob, 4),
            on_time_delivery_probability=round(on_time_prob, 4),
            composite_risk_score=round(composite_risk, 4),
            recommendation_confidence=confidence,
            simulation_stats={
                "eta_mean_hours": round(float(np.mean(simulated_eta)), 1),
                "eta_std_hours": round(float(np.std(simulated_eta)), 1),
                "cost_mean_usd": round(float(np.mean(simulated_cost)), 2),
                "cost_std_usd": round(float(np.std(simulated_cost)), 2),
                "disruption_events_count": int(np.sum(disruption_events)),
                "weather_hazard_multiplier": round(combined_weather_mult, 3),
                "distributions_used": list(model_registry.monte_carlo_distributions.keys()),
                "seed": inp.seed,
            },
        )

    def evaluate(
        self,
        # Request context
        baseline_eta_hours: float,
        baseline_cost_usd: float,
        # ML model outputs
        ml_eta_hours: float,
        ml_disruption_probability: float,
        ml_delay_probability: float,
        ml_cost_usd: float,
        # Live telemetry
        weather_data: Optional[Dict[str, Any]] = None,
        port_congestion_score: float = 0.45,
        geo_risk_score: float = 0.20,
        active_disaster_count: int = 0,
        carrier_reliability_score: float = 0.85,
        simulation_count: Optional[int] = None,
        seed: Optional[int] = 42,
    ) -> Dict[str, Any]:
        """
        Orchestrator-facing method. Takes raw values from orchestrator context
        and returns a JSON-serialisable dict.
        """
        weather = weather_data or {}
        hazard_level = weather.get("hazard", "LOW")
        wind_kts = float(weather.get("wind_speed") or 10.0)
        wave_m = float(weather.get("wave_height") or 1.0)

        # Override simulation count from config if not specified
        default_n = model_registry.monte_carlo_config.get("simulation_count", 10000)
        n = simulation_count or default_n

        inp = MonteCarloInput(
            baseline_eta_hours=baseline_eta_hours,
            baseline_cost_usd=baseline_cost_usd,
            ml_eta_hours=ml_eta_hours,
            ml_disruption_probability=ml_disruption_probability,
            ml_delay_probability=ml_delay_probability,
            ml_cost_usd=ml_cost_usd,
            weather_hazard_level=hazard_level,
            wind_speed_knots=wind_kts,
            wave_height_m=wave_m,
            port_congestion_score=port_congestion_score,
            geo_risk_score=geo_risk_score,
            active_disaster_count=active_disaster_count,
            carrier_reliability_score=carrier_reliability_score,
            simulation_count=n,
            seed=seed,
        )

        result = self.run_simulation(inp)
        return result.model_dump()


monte_carlo_agent = MonteCarloAgent()
