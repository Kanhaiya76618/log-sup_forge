"""
DisruptionAgent — independent backend service for port/route disruption prediction.

Model: disruption_model.pkl (ExtraTreesClassifier)
Features: Operational_Stress, Geo_Port_Risk, Port_Congestion_Score  (3 numeric)
Prediction method: predict_proba()[:, 1]  → float in [0, 1]
Target: disruption_probability

This agent:
  - Receives a validated DisruptionInput Pydantic model
  - Prepares the exact 3-feature vector from live telemetry inputs
  - Calls model_registry.predict_disruption() (no model loading here)
  - Returns a DisruptionOutput Pydantic model
  - Never retrains, never loads model files, never touches API/frontend code
"""
import logging
import numpy as np
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

try:
    from app.models.model_loader import model_registry
except ImportError:
    from models.model_loader import model_registry

logger = logging.getLogger("flowforge.agents.disruption")


# ── Structured Input Schema ────────────────────────────────────────────────────

class DisruptionInput(BaseModel):
    """
    Validated input contract for DisruptionAgent.
    All three fields map 1-to-1 to the training feature vector:
    [Operational_Stress, Geo_Port_Risk, Port_Congestion_Score]
    """
    port_name: str = Field("JPYOK", description="Target port identifier (UN/LOCODE or name)")
    # Raw telemetry — used to derive the 3 model features
    wind_speed_knots: float = Field(20.0, ge=0.0, description="Wind speed in knots at port/route")
    wave_height_meters: float = Field(2.0, ge=0.0, description="Significant wave height in meters")
    hazard_level: str = Field("LOW", description="Weather hazard classification: LOW/MODERATE/HIGH/CRITICAL")
    active_typhoons: List[Dict[str, Any]] = Field(default_factory=list, description="Active typhoon/cyclone events")
    active_disasters: List[Dict[str, Any]] = Field(default_factory=list, description="All active GDACS disaster events")
    geo_risk_score: float = Field(0.20, ge=0.0, le=1.0, description="Geopolitical risk score (0-1)")
    port_congestion_score: float = Field(0.45, ge=0.0, le=1.0, description="Port congestion index (0-1)")


# ── Structured Output Schema ───────────────────────────────────────────────────

class DisruptionOutput(BaseModel):
    """
    Structured output from DisruptionAgent.
    Only contains fields that can actually be calculated from the model and telemetry.
    """
    agent: str
    target_port: str
    # Primary prediction — sourced from trained model
    disruption_probability: float = Field(description="Raw model probability in [0, 1]")
    disruption_probability_percent: float = Field(description="Probability as percentage")
    disruption_class: str = Field(description="Binary class: DISRUPTED | STABLE")
    risk_level: str = Field(description="CRITICAL_ALERT | ELEVATED | STABLE")
    decision_threshold: float
    # Provenance
    prediction_source: str = Field(description="TRAINED_MODEL | DERIVED_CALCULATION")
    model_file: Optional[str]
    ml_model_active: bool
    # Contributing features — the exact values sent to the model
    contributing_features: Dict[str, Any] = Field(
        description="Exact feature values used in prediction with their derivation source"
    )
    # Context
    active_disasters_count: int
    active_typhoons_count: int
    hazard_level: str


# ── Agent Implementation ───────────────────────────────────────────────────────

class DisruptionAgent:
    """
    DisruptionAgent — wraps disruption_model.pkl (ExtraTreesClassifier).

    Feature engineering pipeline (mirrors training preprocessing):
      Operational_Stress    = clip(wind_knots/40.0 + wave_m/5.0, 0, 1)
      Geo_Port_Risk         = geo_risk_score  (passed directly from live service)
      Port_Congestion_Score = port_congestion_score  (passed from port registry)

    Prediction: model.predict_proba([[op_stress, geo_port_risk, congestion]])[:, 1]
    Threshold:  model_registry.threshold (0.53)
    """

    def __init__(self):
        self.name = "DISRUPTION_AGENT"

    def _derive_features(self, inp: DisruptionInput) -> np.ndarray:
        """
        Construct the exact 3-element feature vector used during training.
        Returns shape (1, 3): [[Operational_Stress, Geo_Port_Risk, Port_Congestion_Score]]
        """
        operational_stress = min(1.0, (inp.wind_speed_knots / 40.0) + (inp.wave_height_meters / 5.0))
        geo_port_risk = inp.geo_risk_score
        port_congestion_score = inp.port_congestion_score
        return np.array([[operational_stress, geo_port_risk, port_congestion_score]])

    async def evaluate_disruption(
        self,
        port_name: Optional[str] = "JPYOK",
        weather_data: Optional[Dict[str, Any]] = None,
        disasters: Optional[List[Dict[str, Any]]] = None,
        geo_risk_score: float = 0.20,
        port_congestion_score: float = 0.45
    ) -> Dict[str, Any]:
        """
        Primary evaluation method — called by orchestrator with live telemetry.
        Internally builds a DisruptionInput and calls predict().
        """
        weather = weather_data or {}
        disasters_list = disasters or []
        typhoons = [d for d in disasters_list if d.get("type") in ["TYPHOON", "CYCLONE"]]

        inp = DisruptionInput(
            port_name=port_name or "JPYOK",
            wind_speed_knots=float(weather.get("wind_speed") or 20.0),
            wave_height_meters=float(weather.get("wave_height") or 2.0),
            hazard_level=weather.get("hazard", "LOW"),
            active_typhoons=typhoons,
            active_disasters=disasters_list,
            geo_risk_score=geo_risk_score,
            port_congestion_score=port_congestion_score
        )

        result = self.predict(inp)
        # Return as dict for backward-compatibility with orchestrator
        return result.model_dump()

    def predict(self, inp: DisruptionInput) -> DisruptionOutput:
        """
        Core prediction method — pure business logic, no API code.

        1. Derives 3-feature vector from telemetry inputs
        2. Calls model_registry.predict_disruption() — the single ModelRegistry gate
        3. Applies decision threshold to produce disruption_class and risk_level
        4. Returns typed DisruptionOutput
        """
        feature_vec = self._derive_features(inp)
        op_stress = float(feature_vec[0][0])
        geo_port_risk = float(feature_vec[0][1])
        congestion = float(feature_vec[0][2])

        disruption_prob = 0.0
        prediction_source = "DERIVED_CALCULATION"
        model_file = None

        if model_registry.disruption_model is not None:
            try:
                disruption_prob = model_registry.predict_disruption(feature_vec)
                prediction_source = "TRAINED_MODEL"
                model_file = "disruption_model.pkl"
            except Exception as e:
                logger.warning(f"DisruptionModel prediction failed ({e}), using heuristic fallback")
                disruption_prob = max(op_stress, geo_port_risk)
                prediction_source = "DERIVED_CALCULATION"
        else:
            # Heuristic fallback — not a trained model output
            hazard = inp.hazard_level.upper()
            if hazard == "CRITICAL" or inp.active_typhoons:
                disruption_prob = 0.85
            elif hazard == "HIGH" or inp.wind_speed_knots > 25.0:
                disruption_prob = 0.65
            elif hazard == "MODERATE":
                disruption_prob = 0.40
            else:
                disruption_prob = max(op_stress, geo_port_risk)
            prediction_source = "DERIVED_CALCULATION"

        threshold = model_registry.threshold  # 0.53
        disruption_class = "DISRUPTED" if disruption_prob >= threshold else "STABLE"
        if disruption_prob >= threshold:
            risk_level = "CRITICAL_ALERT"
        elif disruption_prob >= threshold - 0.15:
            risk_level = "ELEVATED"
        else:
            risk_level = "STABLE"

        return DisruptionOutput(
            agent=self.name,
            target_port=inp.port_name,
            disruption_probability=round(disruption_prob, 4),
            disruption_probability_percent=round(disruption_prob * 100, 2),
            disruption_class=disruption_class,
            risk_level=risk_level,
            decision_threshold=threshold,
            prediction_source=prediction_source,
            model_file=model_file,
            ml_model_active=model_registry.disruption_model is not None,
            contributing_features={
                "Operational_Stress": round(op_stress, 4),
                "Geo_Port_Risk": round(geo_port_risk, 4),
                "Port_Congestion_Score": round(congestion, 4),
                "derivation": {
                    "Operational_Stress": "clip(wind_knots/40 + wave_m/5, 0, 1)",
                    "Geo_Port_Risk": "live geopolitical risk score [0-1]",
                    "Port_Congestion_Score": "port registry congestion index [0-1]",
                    "source": "LIVE_DATA_DERIVED"
                }
            },
            active_disasters_count=len(inp.active_disasters),
            active_typhoons_count=len(inp.active_typhoons),
            hazard_level=inp.hazard_level
        )


disruption_agent = DisruptionAgent()
