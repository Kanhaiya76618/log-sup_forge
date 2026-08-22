"""
ETAAgent — independent backend service for shipment ETA and delay probability prediction.

Models:
  ETA_Agent.pkl            (XGBRegressor) → predicts Predicted_ETA_days
  Calibrated_Delay_Agent.pkl (CalibratedClassifierCV over XGBClassifier) → predicts Delay_Probability

Feature vectors (from eta_config.json, verified against feature_names_in_):

  ETA model (13 features):
    Distance_km, Weight_MT, Weather_Risk, Carrier_Risk, Geo_Risk,
    Port_Congestion, Operational_Stress, Route_Risk,
    Geo_Port_Risk, Weather_Port_Risk, Geo_Weather_Risk, Weather_Carrier_Risk, Port_Carrier_Risk

  Delay model (16 features — superset of ETA features + 3 extra):
    Distance_km, Weight_MT, Fuel_Price_Index, Baseline_ETA_hours,
    Weather_Risk, Carrier_Risk, Geo_Risk, Geopolitical_Risk_Score,
    Port_Congestion, Operational_Stress, Route_Risk,
    Geo_Port_Risk, Weather_Port_Risk, Geo_Weather_Risk, Weather_Carrier_Risk, Port_Carrier_Risk

ETA model output: Predicted_ETA_days (continuous regression)
Delay model output: predict_proba()[:, 1] → delay probability in [0, 1]

This agent:
  - Receives a validated ETAInput Pydantic model
  - Computes all 16 feature values from telemetry and haversine distance
  - Delegates both model calls to model_registry (no model loading here)
  - Returns a typed ETAOutput Pydantic model
  - Never retrains, never loads pkl files, never touches API/frontend code
"""
import logging
import math
import pandas as pd
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

try:
    from app.models.model_loader import model_registry
    from app.services.carrier_service import carrier_service
    from app.services.fuel_service import fuel_service
    from app.services.port_registry import port_registry
    from app.services.geopolitical_service import geopolitical_service
    from app.utils.helpers import haversine_distance_km
except ImportError:
    from models.model_loader import model_registry
    from services.carrier_service import carrier_service
    from services.fuel_service import fuel_service
    from services.port_registry import port_registry
    from services.geopolitical_service import geopolitical_service
    from utils.helpers import haversine_distance_km

logger = logging.getLogger("flowforge.agents.eta")

HAZARD_WEATHER_RISK_MAP = {
    "LOW": 0.20,
    "MODERATE": 0.40,
    "HIGH": 0.60,
    "CRITICAL": 0.85,
}


# ── Structured Input Schema ────────────────────────────────────────────────────

class ETAInput(BaseModel):
    """
    Validated input for ETAAgent. Field names match the analysis request fields.
    All risk scores are pre-computed by services before being passed here.
    """
    # Position & routing
    vessel_lat: float = Field(33.85, description="Current vessel latitude")
    vessel_lon: float = Field(137.20, description="Current vessel longitude")
    destination_port: str = Field("JPYOK", description="Destination port UN/LOCODE")
    speed_knots: float = Field(14.2, gt=0, description="Vessel cruising speed in knots")

    # Live telemetry inputs (resolved before calling this agent)
    carrier_code: Optional[str] = Field("MAERSK", description="Carrier code for reliability lookup")
    carrier_risk: float = Field(0.35, ge=0.0, le=1.0, description="Carrier risk score [0-1]")
    fuel_price_index: float = Field(1.0, ge=0.0, description="Normalized fuel price index")
    geo_risk_score: float = Field(0.20, ge=0.0, le=1.0, description="Geopolitical risk score [0-1]")
    hazard_level: str = Field("LOW", description="Route weather hazard: LOW/MODERATE/HIGH/CRITICAL")
    wind_speed_knots: float = Field(20.0, ge=0.0, description="Wind speed in knots")
    wave_height_meters: float = Field(2.0, ge=0.0, description="Wave height in meters")
    port_congestion: float = Field(0.45, ge=0.0, le=1.0, description="Destination port congestion index [0-1]")

    # Cargo context
    cargo_weight_mt: float = Field(15.0, gt=0, description="Cargo weight in metric tons")
    baseline_eta_hours: float = Field(168.0, gt=0, description="Nominal baseline ETA in hours")


# ── Structured Output Schema ───────────────────────────────────────────────────

class ETAOutput(BaseModel):
    """
    Structured output from ETAAgent.
    Only contains fields that can actually be produced by the trained models or derived from them.
    """
    agent: str
    destination_port: str
    destination_unlocode: str

    # ETA predictions — sourced from ETA_Agent.pkl (XGBRegressor)
    predicted_eta_days: float = Field(description="Model output: Predicted_ETA_days (regression)")
    predicted_eta_hours: float = Field(description="predicted_eta_days × 24")
    baseline_eta_hours: float = Field(description="Input baseline (nominal sailing time)")
    estimated_delay_hours: float = Field(description="max(0, predicted_eta_hours - baseline_eta_hours)")
    estimated_delay_days: float = Field(description="estimated_delay_hours / 24")

    # Delay probability — sourced from Calibrated_Delay_Agent.pkl
    delay_probability: float = Field(description="predict_proba()[:, 1] in [0, 1]")
    delay_probability_percent: float = Field(description="Delay probability as percentage")
    delay_classification: str = Field(description="DELAYED | ON_TIME  (threshold = 0.4)")

    # Derived geometry
    distance_km: float
    distance_nm: float

    # Provenance
    eta_model_active: bool
    delay_model_active: bool
    eta_prediction_source: str
    delay_prediction_source: str
    eta_model_file: str
    delay_model_file: str

    # Feature values sent to models (for audit/transparency)
    model_features: Dict[str, Any]


# ── Agent Implementation ───────────────────────────────────────────────────────

class ETAAgent:
    """
    ETAAgent — wraps ETA_Agent.pkl and Calibrated_Delay_Agent.pkl.

    Feature engineering (mirrors training pipeline exactly):

    Base signals:
      Distance_km         = haversine(vessel_pos, dest_port_coords)
      Weight_MT           = cargo_weight_mt
      Weather_Risk        = HAZARD_WEATHER_RISK_MAP[hazard_level]
      Carrier_Risk        = carrier_risk (from CarrierService)
      Geo_Risk            = geo_risk_score (from GeopoliticalService)
      Geopolitical_Risk_Score = geo_risk_score (same source, separate column)
      Port_Congestion     = port_congestion
      Operational_Stress  = clip(wind_knots/40 + wave_m/5, 0, 1)
      Fuel_Price_Index    = fuel_price_index (from FuelService)
      Baseline_ETA_hours  = baseline_eta_hours

    Interaction features (matches training exactly):
      Route_Risk          = (Weather_Risk + Port_Congestion) / 2
      Geo_Port_Risk       = Geo_Risk × Port_Congestion
      Weather_Port_Risk   = Weather_Risk × Port_Congestion
      Geo_Weather_Risk    = Geo_Risk × Weather_Risk
      Weather_Carrier_Risk= Weather_Risk × Carrier_Risk
      Port_Carrier_Risk   = Port_Congestion × Carrier_Risk
    """

    def __init__(self):
        self.name = "ETA_AGENT"

    def _build_feature_row(self, inp: ETAInput, dist_km: float) -> Dict[str, float]:
        """Build the complete 16-feature row matching the training pipeline."""
        weather_risk = HAZARD_WEATHER_RISK_MAP.get(inp.hazard_level.upper(), 0.20)
        op_stress = min(1.0, (inp.wind_speed_knots / 40.0) + (inp.wave_height_meters / 5.0))

        route_risk = round((weather_risk + inp.port_congestion) / 2.0, 6)
        geo_port_risk = round(inp.geo_risk_score * inp.port_congestion, 6)
        weather_port_risk = round(weather_risk * inp.port_congestion, 6)
        geo_weather_risk = round(inp.geo_risk_score * weather_risk, 6)
        weather_carrier_risk = round(weather_risk * inp.carrier_risk, 6)
        port_carrier_risk = round(inp.port_congestion * inp.carrier_risk, 6)

        return {
            # ETA model features (13)
            "Distance_km": dist_km,
            "Weight_MT": inp.cargo_weight_mt,
            "Weather_Risk": weather_risk,
            "Carrier_Risk": inp.carrier_risk,
            "Geo_Risk": inp.geo_risk_score,
            "Port_Congestion": inp.port_congestion,
            "Operational_Stress": round(op_stress, 6),
            "Route_Risk": route_risk,
            "Geo_Port_Risk": geo_port_risk,
            "Weather_Port_Risk": weather_port_risk,
            "Geo_Weather_Risk": geo_weather_risk,
            "Weather_Carrier_Risk": weather_carrier_risk,
            "Port_Carrier_Risk": port_carrier_risk,
            # Extra for delay model (3 additional)
            "Fuel_Price_Index": inp.fuel_price_index,
            "Baseline_ETA_hours": inp.baseline_eta_hours,
            "Geopolitical_Risk_Score": inp.geo_risk_score,
        }

    def predict(self, inp: ETAInput) -> ETAOutput:
        """
        Core prediction method — pure business logic.

        1. Resolves destination port coordinates from port_registry
        2. Computes haversine distance
        3. Builds the 16-element feature row
        4. Calls model_registry.predict_eta() and model_registry.predict_delay()
        5. Returns typed ETAOutput
        """
        port_coords = port_registry.get_port_coords(inp.destination_port)
        port_info = port_registry.get_port(inp.destination_port)

        if port_coords:
            dist_km = haversine_distance_km(
                inp.vessel_lat, inp.vessel_lon,
                port_coords[0], port_coords[1]
            )
            dest_name = port_info["name"] if port_info else inp.destination_port
            dest_unlocode = port_info["unlocode"] if port_info else inp.destination_port
        else:
            # Fallback: estimate from baseline ETA + speed
            speed_kmh = inp.speed_knots * 1.852
            dist_km = speed_kmh * inp.baseline_eta_hours
            dest_name = inp.destination_port
            dest_unlocode = inp.destination_port
            logger.warning(f"Port coords not found for {inp.destination_port}, estimating dist={dist_km:.1f}km")

        feature_row = self._build_feature_row(inp, dist_km)
        input_df = pd.DataFrame([feature_row])

        # ETA prediction
        pred_eta_days = 0.0
        eta_source = "DERIVED_CALCULATION"
        eta_model_file = "ETA_Agent.pkl"
        eta_active = model_registry.eta_regressor is not None

        if eta_active:
            try:
                pred_eta_days = model_registry.predict_eta(input_df)
                eta_source = "TRAINED_MODEL"
            except Exception as e:
                logger.warning(f"ETA model prediction failed ({e}), falling back to heuristic")
                speed_kmh = inp.speed_knots * 1.852
                pred_eta_days = dist_km / speed_kmh / 24.0 if speed_kmh > 0 else inp.baseline_eta_hours / 24.0
                eta_source = "DERIVED_CALCULATION"
        else:
            speed_kmh = inp.speed_knots * 1.852
            pred_eta_days = dist_km / speed_kmh / 24.0 if speed_kmh > 0 else inp.baseline_eta_hours / 24.0
            eta_source = "DERIVED_CALCULATION"

        # Delay probability prediction
        delay_prob = 0.0
        delay_source = "DERIVED_CALCULATION"
        delay_model_file = "Calibrated_Delay_Agent.pkl"
        delay_active = model_registry.delay_classifier is not None

        if delay_active:
            try:
                delay_prob = model_registry.predict_delay(input_df)
                delay_source = "TRAINED_MODEL"
            except Exception as e:
                logger.warning(f"Delay model prediction failed ({e}), falling back to heuristic")
                delay_prob = min(0.95, feature_row["Weather_Risk"] * 0.4 + feature_row["Port_Congestion"] * 0.3)
                delay_source = "DERIVED_CALCULATION"
        else:
            delay_prob = min(0.95, feature_row["Weather_Risk"] * 0.4 + feature_row["Port_Congestion"] * 0.3)
            delay_source = "DERIVED_CALCULATION"

        pred_eta_hours = pred_eta_days * 24.0
        baseline = inp.baseline_eta_hours
        delay_hours = max(0.0, pred_eta_hours - baseline)

        DELAY_THRESHOLD = 0.4  # from eta_config.json
        delay_class = "DELAYED" if delay_prob >= DELAY_THRESHOLD else "ON_TIME"

        return ETAOutput(
            agent=self.name,
            destination_port=dest_name,
            destination_unlocode=dest_unlocode,
            predicted_eta_days=round(pred_eta_days, 4),
            predicted_eta_hours=round(pred_eta_hours, 2),
            baseline_eta_hours=round(baseline, 2),
            estimated_delay_hours=round(delay_hours, 2),
            estimated_delay_days=round(delay_hours / 24.0, 4),
            delay_probability=round(delay_prob, 4),
            delay_probability_percent=round(delay_prob * 100, 2),
            delay_classification=delay_class,
            distance_km=round(dist_km, 2),
            distance_nm=round(dist_km / 1.852, 2),
            eta_model_active=eta_active,
            delay_model_active=delay_active,
            eta_prediction_source=eta_source,
            delay_prediction_source=delay_source,
            eta_model_file=eta_model_file,
            delay_model_file=delay_model_file,
            model_features={k: round(v, 4) if isinstance(v, float) else v for k, v in feature_row.items()}
        )

    def predict_eta(
        self,
        vessel_lat: float,
        vessel_lon: float,
        destination_port: str,
        speed_knots: float = 14.2,
        carrier_code: Optional[str] = None,
        hazard_level: str = "LOW",
        wind_speed_knots: float = 20.0,
        wave_height_meters: float = 2.0,
        destination_port_congestion: float = 0.45
    ) -> Dict[str, Any]:
        """
        Backward-compatible orchestrator interface — resolves live service data
        then delegates to predict().
        """
        carrier_metrics = carrier_service.get_carrier_metrics(carrier_code)
        carrier_risk = float(carrier_metrics["carrier_risk"]["value"])

        fuel_metrics = fuel_service.get_fuel_price_index()
        fuel_price_index = float(fuel_metrics["value"])

        geo_metrics = geopolitical_service.get_geopolitical_risk_score()
        geo_risk = float(geo_metrics["value"])

        port_info = port_registry.get_port(destination_port)

        inp = ETAInput(
            vessel_lat=vessel_lat,
            vessel_lon=vessel_lon,
            destination_port=destination_port,
            speed_knots=speed_knots,
            carrier_code=carrier_code,
            carrier_risk=carrier_risk,
            fuel_price_index=fuel_price_index,
            geo_risk_score=geo_risk,
            hazard_level=hazard_level,
            wind_speed_knots=wind_speed_knots,
            wave_height_meters=wave_height_meters,
            port_congestion=destination_port_congestion,
            cargo_weight_mt=15.0,
            baseline_eta_hours=168.0
        )
        result = self.predict(inp)
        # Return dict for backward-compatibility with orchestrator
        return {
            "agent": result.agent,
            "destination_port": result.destination_port,
            "unlocode": result.destination_unlocode,
            "distance_km": result.distance_km,
            "distance_nm": result.distance_nm,
            "nominal_hours": result.baseline_eta_hours,
            "predicted_total_hours": result.predicted_eta_hours,
            "estimated_delay_hours": result.estimated_delay_hours,
            "predicted_delay_days": result.estimated_delay_days,
            "delay_probability_percent": result.delay_probability_percent,
            "delay_classification": result.delay_classification,
            "confidence": "HIGH" if result.eta_model_active and result.delay_model_active else "MEDIUM",
            "ml_models_active": result.eta_model_active,
            "eta_prediction_source": result.eta_prediction_source,
            "delay_prediction_source": result.delay_prediction_source,
            "model_features": result.model_features,
            "provenance": {
                "carrier_risk": carrier_metrics["carrier_risk"],
                "fuel_price_index": fuel_metrics,
                "geopolitical_risk": geo_metrics
            }
        }


eta_agent = ETAAgent()
