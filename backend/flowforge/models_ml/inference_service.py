"""
backend/flowforge/models_ml/inference_service.py
High-Performance ML Inference Service for FlowForge Maritime Disruption OS.

Supports both:
1. FlowForge Maritime Disruption Pipeline (flowforge_maritime_disruption_model.joblib)
   - 23 features including Origin/Dest ports, Weather conditions, Lead times, Interaction terms.
   - LogisticRegression pipeline with ColumnTransformer.
2. Fast ExtraTrees Disruption Model (disruption_model.pkl)
   - 3 core features: Operational_Stress, Geo_Port_Risk, Port_Congestion_Score.
"""

import sys
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
import json
import warnings
import pandas as pd
import joblib

warnings.filterwarnings("ignore", category=UserWarning)

# Scikit-learn unpickler backward-compatibility shim
import sklearn.compose._column_transformer
if not hasattr(sklearn.compose._column_transformer, "_RemainderColsList"):
    class _RemainderColsList(list): pass
    sklearn.compose._column_transformer._RemainderColsList = _RemainderColsList

from sklearn.impute import SimpleImputer

logger = logging.getLogger("flowforge.models_ml.inference")

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent.parent.parent

MARITIME_MODEL_DIR = ROOT_DIR / "flowforge_maritime_model"
MARITIME_MODEL_PATH = MARITIME_MODEL_DIR / "flowforge_maritime_disruption_model.joblib"
MARITIME_CONFIG_PATH = MARITIME_MODEL_DIR / "model_config.json"
MARITIME_THRESH_PATH = MARITIME_MODEL_DIR / "threshold_config.json"

LEGACY_MODEL_PATH = BASE_DIR / "disruption_model.pkl"
LEGACY_FEATURES_PATH = BASE_DIR / "features.pkl"


def _patch_imputers(step):
    """Ensures SimpleImputer compatibility across sklearn versions."""
    if hasattr(step, "transformers_"):
        for _, trans, _ in step.transformers_:
            _patch_imputers(trans)
    elif hasattr(step, "steps"):
        for _, sub_step in step.steps:
            _patch_imputers(sub_step)
    elif isinstance(step, SimpleImputer):
        if not hasattr(step, "_fill_dtype") and hasattr(step, "_fit_dtype"):
            step._fill_dtype = step._fit_dtype


class DisruptionInferenceService:
    """Production ML inference engine for FlowForge maritime disruption models."""

    def __init__(self):
        self.maritime_model = None
        self.maritime_config: Dict[str, Any] = {}
        self.maritime_threshold: float = 0.53
        self.is_maritime_loaded: bool = False

        self.legacy_model = None
        self.legacy_features: List[str] = ["Operational_Stress", "Geo_Port_Risk", "Port_Congestion_Score"]
        self.is_legacy_loaded: bool = False

        self.load_all_models()

    @property
    def is_loaded(self) -> bool:
        return self.is_maritime_loaded or self.is_legacy_loaded

    @property
    def model(self):
        return self.maritime_model if self.maritime_model is not None else self.legacy_model

    @property
    def features(self) -> List[str]:
        if self.maritime_config and "features" in self.maritime_config:
            return self.maritime_config["features"]
        return self.legacy_features

    @property
    def threshold(self) -> float:
        return self.maritime_threshold

    def load_all_models(self) -> None:
        """Loads both the new Maritime Pipeline model and the legacy model."""
        # 1. Load New FlowForge Maritime Model
        if MARITIME_MODEL_PATH.exists():
            try:
                self.maritime_model = joblib.load(MARITIME_MODEL_PATH)
                _patch_imputers(self.maritime_model)

                if MARITIME_CONFIG_PATH.exists():
                    with open(MARITIME_CONFIG_PATH, "r") as f:
                        self.maritime_config = json.load(f)
                
                if MARITIME_THRESH_PATH.exists():
                    with open(MARITIME_THRESH_PATH, "r") as f:
                        thresh_cfg = json.load(f)
                        self.maritime_threshold = thresh_cfg.get("default_threshold", 0.53)

                self.is_maritime_loaded = True
                logger.info(f"Loaded FlowForge Maritime Pipeline Model from {MARITIME_MODEL_PATH}")
            except Exception as e:
                logger.error(f"Failed to load maritime pipeline model: {e}")

        # 2. Load Legacy ExtraTrees Model as alternate/fallback
        if LEGACY_MODEL_PATH.exists():
            try:
                self.legacy_model = joblib.load(LEGACY_MODEL_PATH)
                if LEGACY_FEATURES_PATH.exists():
                    self.legacy_features = joblib.load(LEGACY_FEATURES_PATH)
                self.is_legacy_loaded = True
                logger.info(f"Loaded Legacy ExtraTrees Model from {LEGACY_MODEL_PATH}")
            except Exception as e:
                logger.error(f"Failed to load legacy disruption model: {e}")

    def predict_maritime_detailed(
        self,
        origin_port: str = "Mumbai",
        destination_port: str = "Yokohama",
        transport_mode: str = "Ocean",
        product_category: str = "Automotive",
        weather_condition: str = "Clear",
        distance_km: float = 6850.0,
        weight_mt: float = 240.0,
        fuel_price_index: float = 2.79,
        geopolitical_risk_score: float = 5.1,
        carrier_reliability_score: float = 0.75,
        lead_time_days: float = 13.0,
        operational_stress: float = 0.43,
        threshold: Optional[float] = None
    ) -> Dict[str, Any]:
        """Runs inference using the full 23-feature Maritime Disruption Pipeline."""
        thresh = threshold if threshold is not None else self.maritime_threshold

        # Derive normalized terms
        weather_n_map = {"Clear": 0.1, "Rain": 0.35, "Fog": 0.55, "Storm": 0.85, "Hurricane": 1.0}
        weather_n = weather_n_map.get(weather_condition, 0.35)
        geo_n = geopolitical_risk_score / 10.0
        carrier_risk_n = 1.0 - carrier_reliability_score
        distance_n = min(1.0, distance_km / 20000.0)
        fuel_n = min(1.0, fuel_price_index / 5.0)
        lead_n = min(1.0, lead_time_days / 30.0)

        feature_dict = {
            "Origin_Port": origin_port,
            "Destination_Port": destination_port,
            "Transport_Mode": transport_mode,
            "Product_Category": product_category,
            "Distance_km": distance_km,
            "Weight_MT": weight_mt,
            "Fuel_Price_Index": fuel_price_index,
            "Geopolitical_Risk_Score": geopolitical_risk_score,
            "Weather_Condition": weather_condition,
            "Carrier_Reliability_Score": carrier_reliability_score,
            "Lead_Time_Days": lead_time_days,
            "Weather_N": weather_n,
            "Geo_N": geo_n,
            "Carrier_Risk_N": carrier_risk_n,
            "Distance_N": distance_n,
            "Fuel_N": fuel_n,
            "Lead_N": lead_n,
            "Weather_Distance": weather_n * distance_n,
            "Weather_Carrier": weather_n * carrier_risk_n,
            "Weather_Geo": weather_n * geo_n,
            "Geo_Carrier": geo_n * carrier_risk_n,
            "Geo_Distance": geo_n * distance_n,
            "Operational_Stress": operational_stress
        }

        if self.is_maritime_loaded and self.maritime_model is not None:
            input_df = pd.DataFrame([feature_dict])
            prob_arr = self.maritime_model.predict_proba(input_df)[0]
            prob = float(prob_arr[1])
            model_name = "FlowForge Maritime Disruption Model (v1.0.0 Pipeline)"
        else:
            # Fallback heuristic
            prob = (operational_stress * 0.4) + (geo_n * 0.35) + (weather_n * 0.25)
            model_name = "Calibrated Heuristic Fallback"

        prediction = "DISRUPTION" if prob >= thresh else "NO DISRUPTION"

        if prob >= 0.70:
            risk_level = "CRITICAL"
        elif prob >= 0.45:
            risk_level = "HIGH"
        elif prob >= 0.30:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        return {
            "disruption_probability": round(prob, 4),
            "disruption_probability_percent": round(prob * 100.0, 2),
            "prediction": prediction,
            "risk_level": risk_level,
            "threshold": thresh,
            "model": model_name,
            "features_used": self.features,
            "inputs": {
                "Operational_Stress": operational_stress,
                "Geo_Port_Risk": geopolitical_risk_score / 10.0,
                "Port_Congestion_Score": 1.0 - carrier_reliability_score
            }
        }

    def predict(
        self,
        operational_stress: float,
        geo_port_risk: float,
        port_congestion_score: float,
        threshold: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Unified predictor supporting standard slider inputs.
        Routes to the new Maritime Disruption Pipeline model.
        """
        # If operational stress or geo risk is high, infer weather and lead times
        weather = "Storm" if operational_stress > 0.65 else ("Rain" if operational_stress > 0.35 else "Clear")
        geo_score = (geo_port_risk * 10.0) if geo_port_risk <= 1.0 else (geo_port_risk / 10.0)
        fuel_idx = 2.5 + (operational_stress * 2.0)
        carrier_rel = max(0.1, 1.0 - (port_congestion_score * 0.6))
        lead_days = 10.0 + (port_congestion_score * 15.0)

        return self.predict_maritime_detailed(
            origin_port="Mumbai",
            destination_port="Yokohama",
            weather_condition=weather,
            fuel_price_index=fuel_idx,
            geopolitical_risk_score=geo_score,
            carrier_reliability_score=carrier_rel,
            lead_time_days=lead_days,
            operational_stress=operational_stress,
            threshold=threshold
        )


disruption_ml_service = DisruptionInferenceService()
