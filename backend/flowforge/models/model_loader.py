import os
import json
import time
import pickle
import joblib
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

# Apply scikit-learn version compatibility patch for unpickling ColumnTransformers & SimpleImputers across versions
import sys
import sklearn
import sklearn.compose._column_transformer
if not hasattr(sklearn.compose._column_transformer, '_RemainderColsList'):
    class _RemainderColsList(list):
        pass
    sklearn.compose._column_transformer._RemainderColsList = _RemainderColsList

def patch_sk_pipeline(obj):
    if hasattr(obj, 'transformers_'):
        for name, trans, cols in obj.transformers_:
            patch_sk_pipeline(trans)
    if hasattr(obj, 'named_steps'):
        for s_name, s_obj in obj.named_steps.items():
            patch_sk_pipeline(s_obj)
    if hasattr(obj, 'statistics_'):
        if not hasattr(obj, '_fill_dtype'):
            obj._fill_dtype = obj.statistics_.dtype
        if not hasattr(obj, '_fit_dtype'):
            obj._fit_dtype = obj.statistics_.dtype

logger = logging.getLogger("flowforge.models.loader")

MODELS_DIR = Path(__file__).resolve().parent

class ModelRegistry:
    """
    Centralized ModelRegistry — loads each trained ML model and preprocessing object
    exactly ONCE during application startup.

    Provides a clean, unified prediction interface for all four agents:
    1. Disruption Model (disruption_model.pkl)
    2. ETA Model (ETA_Agent.pkl)
    3. Delay Model (Calibrated_Delay_Agent.pkl)
    4. Cost Optimizer Model (flowforge_cost_optimizer_xgb.pkl)
    """

    def __init__(self, raise_on_missing: bool = False):
        self.disruption_model = None
        self.maritime_disruption_model = None
        self.eta_regressor = None
        self.delay_classifier = None
        self.cost_optimizer_model = None
        self.preprocessing_objects: Dict[str, Any] = {}

        # Monte Carlo distributions (loaded once at startup)
        self.monte_carlo_distributions: Dict[str, np.ndarray] = {}
        self.monte_carlo_config: Dict[str, Any] = {}
        self.monte_carlo_loaded: bool = False

        self.disruption_features = ["Operational_Stress", "Geo_Port_Risk", "Port_Congestion_Score"]
        self.eta_features = [
            "Distance_km", "Weight_MT", "Weather_Risk", "Carrier_Risk", "Geo_Risk",
            "Port_Congestion", "Operational_Stress", "Route_Risk", "Geo_Port_Risk",
            "Weather_Port_Risk", "Geo_Weather_Risk", "Weather_Carrier_Risk", "Port_Carrier_Risk"
        ]
        self.delay_features = [
            "Distance_km", "Weight_MT", "Fuel_Price_Index", "Baseline_ETA_hours",
            "Weather_Risk", "Carrier_Risk", "Geo_Risk", "Geopolitical_Risk_Score",
            "Port_Congestion", "Operational_Stress", "Route_Risk", "Geo_Port_Risk",
            "Weather_Port_Risk", "Geo_Weather_Risk", "Weather_Carrier_Risk", "Port_Carrier_Risk"
        ]
        self.cost_features = [
            "line_item_quantity", "line_item_value", "pack_price", "unit_price",
            "weight_kilograms", "line_item_insurance_usd", "shipment_mode",
            "country", "vendor", "fulfill_via", "vendor_inco_term"
        ]

        self.threshold = 0.53
        self.model_metadata: Dict[str, Dict[str, Any]] = {}
        self.raise_on_missing = raise_on_missing
        self.load_all_models()
        self.load_monte_carlo_distributions()

    def load_all_models(self):
        logger.info("Initializing FlowForge Centralized ModelRegistry...")
        loaded_count = 0

        # 1. Disruption Model (disruption_model.pkl)
        feat_path = MODELS_DIR / "features.pkl"
        if feat_path.exists() and feat_path.stat().st_size > 0:
            try:
                with open(feat_path, "rb") as f:
                    self.disruption_features = pickle.load(f)
                    self.preprocessing_objects["features.pkl"] = self.disruption_features
            except Exception as e:
                logger.warning(f"Could not load features.pkl: {e}")

        disruption_path = MODELS_DIR / "disruption_model.pkl"
        if disruption_path.exists() and disruption_path.stat().st_size > 0:
            try:
                self.disruption_model = joblib.load(disruption_path)
                patch_sk_pipeline(self.disruption_model)
                loaded_count += 1
                self.model_metadata["disruption_model.pkl"] = {
                    "status": "LOADED",
                    "file": "disruption_model.pkl",
                    "model_type": type(self.disruption_model).__name__,
                    "prediction_source": "TRAINED_MODEL",
                    "expected_features": self.disruption_features,
                    "feature_count": len(self.disruption_features),
                    "target_variable": "disruption_probability",
                    "prediction_method": "predict_proba()[:, 1]",
                    "version": getattr(sklearn, "__version__", "1.6.1")
                }
            except Exception as e:
                msg = f"Failed to load disruption_model.pkl: {e}"
                logger.error(msg)
                self.model_metadata["disruption_model.pkl"] = {"status": "ERROR", "file": "disruption_model.pkl", "error": str(e)}
                if self.raise_on_missing:
                    raise RuntimeError(msg)
        else:
            msg = f"Required model file missing or empty: {disruption_path}"
            logger.error(msg)
            self.model_metadata["disruption_model.pkl"] = {"status": "MISSING", "file": "disruption_model.pkl"}
            if self.raise_on_missing:
                raise FileNotFoundError(msg)

        # 2. ETA Regressor (ETA_Agent.pkl)
        eta_path = MODELS_DIR / "ETA_Agent.pkl"
        if eta_path.exists() and eta_path.stat().st_size > 0:
            try:
                self.eta_regressor = joblib.load(eta_path)
                if hasattr(self.eta_regressor, "feature_names_in_"):
                    self.eta_features = list(self.eta_regressor.feature_names_in_)
                loaded_count += 1
                self.model_metadata["eta_model.pkl"] = {
                    "status": "LOADED",
                    "file": "ETA_Agent.pkl",
                    "model_type": type(self.eta_regressor).__name__,
                    "prediction_source": "TRAINED_MODEL",
                    "expected_features": list(self.eta_features),
                    "feature_count": len(self.eta_features),
                    "target_variable": "Predicted_ETA_days",
                    "prediction_method": "predict()",
                    "version": "XGBoost 2.1.0"
                }
            except Exception as e:
                msg = f"Failed to load ETA_Agent.pkl: {e}"
                logger.error(msg)
                self.model_metadata["eta_model.pkl"] = {"status": "ERROR", "file": "ETA_Agent.pkl", "error": str(e)}
                if self.raise_on_missing:
                    raise RuntimeError(msg)
        else:
            msg = f"Required model file missing or empty: {eta_path}"
            logger.error(msg)
            self.model_metadata["eta_model.pkl"] = {"status": "MISSING", "file": "ETA_Agent.pkl"}
            if self.raise_on_missing:
                raise FileNotFoundError(msg)

        # 3. Delay Classifier (Calibrated_Delay_Agent.pkl / Delay_Agent.pkl)
        calibrated_delay_path = MODELS_DIR / "Calibrated_Delay_Agent.pkl"
        standard_delay_path = MODELS_DIR / "Delay_Agent.pkl"
        target_delay_path = calibrated_delay_path if calibrated_delay_path.exists() else standard_delay_path

        if target_delay_path.exists() and target_delay_path.stat().st_size > 0:
            try:
                self.delay_classifier = joblib.load(target_delay_path)
                if hasattr(self.delay_classifier, "feature_names_in_"):
                    self.delay_features = list(self.delay_classifier.feature_names_in_)
                loaded_count += 1
                self.model_metadata["delay_model.pkl"] = {
                    "status": "LOADED",
                    "file": target_delay_path.name,
                    "model_type": type(self.delay_classifier).__name__,
                    "prediction_source": "TRAINED_MODEL",
                    "expected_features": list(self.delay_features),
                    "feature_count": len(self.delay_features),
                    "target_variable": "Delay_Probability",
                    "prediction_method": "predict_proba()[:, 1]",
                    "version": getattr(sklearn, "__version__", "1.6.1")
                }
            except Exception as e:
                msg = f"Failed to load delay model: {e}"
                logger.error(msg)
                self.model_metadata["delay_model.pkl"] = {"status": "ERROR", "file": target_delay_path.name, "error": str(e)}
                if self.raise_on_missing:
                    raise RuntimeError(msg)
        else:
            msg = f"Required delay model file missing: {target_delay_path}"
            logger.error(msg)
            self.model_metadata["delay_model.pkl"] = {"status": "MISSING", "file": "Calibrated_Delay_Agent.pkl"}
            if self.raise_on_missing:
                raise FileNotFoundError(msg)

        # 4. Cost Optimizer Model (flowforge_cost_optimizer_xgb.pkl)
        cost_path = MODELS_DIR / "flowforge_cost_optimizer_xgb.pkl"
        if cost_path.exists() and cost_path.stat().st_size > 0:
            try:
                self.cost_optimizer_model = joblib.load(cost_path)
                patch_sk_pipeline(self.cost_optimizer_model)
                if hasattr(self.cost_optimizer_model, "feature_names_in_"):
                    self.cost_features = list(self.cost_optimizer_model.feature_names_in_)
                loaded_count += 1
                self.model_metadata["cost_model.pkl"] = {
                    "status": "LOADED",
                    "file": "flowforge_cost_optimizer_xgb.pkl",
                    "model_type": type(self.cost_optimizer_model).__name__,
                    "prediction_source": "TRAINED_MODEL",
                    "expected_features": list(self.cost_features),
                    "feature_count": len(self.cost_features),
                    "target_variable": "optimized_logistics_cost_usd",
                    "prediction_method": "predict()",
                    "version": "XGBoost Pipeline 2.1.0"
                }
            except Exception as e:
                msg = f"Failed to load flowforge_cost_optimizer_xgb.pkl: {e}"
                logger.error(msg)
                self.model_metadata["cost_model.pkl"] = {"status": "ERROR", "file": "flowforge_cost_optimizer_xgb.pkl", "error": str(e)}
                if self.raise_on_missing:
                    raise RuntimeError(msg)
        else:
            msg = f"Required cost model missing: {cost_path}"
            logger.error(msg)
            self.model_metadata["cost_model.pkl"] = {"status": "MISSING", "file": "flowforge_cost_optimizer_xgb.pkl"}
            if self.raise_on_missing:
                raise FileNotFoundError(msg)

        logger.info(f"FlowForge ModelRegistry initialization complete. Loaded {loaded_count}/4 primary ML models.")

    # ── Monte Carlo Distribution Loader ───────────────────────────────────────
    _MONTE_CARLO_ARRAYS = [
        "cost_ratio_distribution",
        "customs_clearance_time",
        "customs_delay_distribution",
        "delay_probability",
        "delivery_time_deviation",
        "disruption_delay_distribution",
        "disruption_likelihood_score",
        "eta_error_distribution",
        "eta_variation_hours",
        "lead_time_days",
        "loading_unloading_time",
        "port_congestion_level",
    ]

    def load_monte_carlo_distributions(self) -> None:
        """
        Load all Monte Carlo .npy distribution arrays and config pickle once at startup.
        Falls back gracefully if files are missing — the agent will use heuristic distributions.
        """
        mc_dir = MODELS_DIR / "monte_carlo" / "models"
        if not mc_dir.exists():
            logger.warning(f"Monte Carlo model directory not found: {mc_dir}")
            self.model_metadata["monte_carlo"] = {"status": "MISSING", "reason": "directory not found"}
            return

        loaded = 0
        missing = []

        # Load .npy distribution arrays
        for name in self._MONTE_CARLO_ARRAYS:
            path = mc_dir / f"{name}.npy"
            if path.exists() and path.stat().st_size > 0:
                try:
                    self.monte_carlo_distributions[name] = np.load(path)
                    loaded += 1
                except Exception as e:
                    logger.warning(f"Could not load {name}.npy: {e}")
                    missing.append(name)
            else:
                missing.append(name)

        # Load config pickle
        cfg_path = mc_dir / "monte_carlo_config.pkl"
        if cfg_path.exists() and cfg_path.stat().st_size > 0:
            try:
                with open(cfg_path, "rb") as f:
                    self.monte_carlo_config = pickle.load(f)
                loaded += 1
            except Exception as e:
                logger.warning(f"Could not load monte_carlo_config.pkl: {e}")
                self.monte_carlo_config = {
                    "simulation_count": 10000, "seed": 42,
                    "risk_weights": {"eta": 0.4, "cost": 0.3, "disruption": 0.3}
                }
        else:
            self.monte_carlo_config = {
                "simulation_count": 10000, "seed": 42,
                "risk_weights": {"eta": 0.4, "cost": 0.3, "disruption": 0.3}
            }

        self.monte_carlo_loaded = loaded > 0
        if missing:
            logger.warning(f"Monte Carlo: {len(missing)} arrays not found: {missing}")
        logger.info(
            f"Monte Carlo distributions loaded: {len(self.monte_carlo_distributions)}/{len(self._MONTE_CARLO_ARRAYS)} "
            f"arrays. Config: {bool(self.monte_carlo_config)}. Missing: {missing or 'none'}"
        )
        self.model_metadata["monte_carlo"] = {
            "status": "LOADED" if self.monte_carlo_loaded else "PARTIAL",
            "arrays_loaded": list(self.monte_carlo_distributions.keys()),
            "simulation_count": self.monte_carlo_config.get("simulation_count", 10000),
            "seed": self.monte_carlo_config.get("seed", 42),
            "missing_arrays": missing,
        }

    # Unified Prediction Interface
    def predict_disruption(self, input_features: Any) -> float:
        """Prediction interface for Disruption Model."""
        if self.disruption_model is None:
            raise RuntimeError("disruption_model.pkl is not loaded")
        if isinstance(input_features, dict):
            input_features = np.array([[input_features.get(f, 0.0) for f in self.disruption_features]])
        if hasattr(self.disruption_model, "predict_proba"):
            return float(self.disruption_model.predict_proba(input_features)[0][1])
        return float(self.disruption_model.predict(input_features)[0])

    def predict_eta(self, input_df: pd.DataFrame) -> float:
        """Prediction interface for ETA Model."""
        if self.eta_regressor is None:
            raise RuntimeError("ETA_Agent.pkl is not loaded")
        features_to_use = [f for f in self.eta_features if f in input_df.columns]
        return float(self.eta_regressor.predict(input_df[features_to_use])[0])

    def predict_delay(self, input_df: pd.DataFrame) -> float:
        """Prediction interface for Delay Model."""
        if self.delay_classifier is None:
            raise RuntimeError("Calibrated_Delay_Agent.pkl is not loaded")
        features_to_use = [f for f in self.delay_features if f in input_df.columns]
        if hasattr(self.delay_classifier, "predict_proba"):
            return float(self.delay_classifier.predict_proba(input_df[features_to_use])[:, 1][0])
        return float(self.delay_classifier.predict(input_df[features_to_use])[0])

    def predict_cost(self, input_df: pd.DataFrame) -> float:
        """Prediction interface for Cost Optimizer Model."""
        if self.cost_optimizer_model is None:
            raise RuntimeError("flowforge_cost_optimizer_xgb.pkl is not loaded")
        return float(self.cost_optimizer_model.predict(input_df)[0])

    def get_status(self) -> Dict[str, Any]:
        return {
            "registry_status": "ACTIVE",
            "loaded_models_count": sum(1 for m in self.model_metadata.values() if m.get("status") == "LOADED"),
            "models_loaded": {
                "disruption_model": self.disruption_model is not None,
                "eta_model": self.eta_regressor is not None,
                "route_model": True,  # Heuristic forward-projection engine
                "cost_model": self.cost_optimizer_model is not None,
                "monte_carlo": self.monte_carlo_loaded,
            },
            "monte_carlo": {
                "loaded": self.monte_carlo_loaded,
                "distributions_count": len(self.monte_carlo_distributions),
                "simulation_count": self.monte_carlo_config.get("simulation_count", 10000),
            },
            "preprocessing_objects_loaded": len(self.preprocessing_objects) > 0,
            "models": self.model_metadata
        }

    def run_diagnostics(self) -> Dict[str, Any]:
        results = {}

        if self.disruption_model is not None:
            t0 = time.perf_counter()
            try:
                prob = self.predict_disruption({"Operational_Stress": 0.25, "Geo_Port_Risk": 0.50, "Port_Congestion_Score": 0.45})
                results["disruption_model.pkl"] = {
                    "status": "PASS",
                    "latency_ms": round((time.perf_counter() - t0) * 1000, 2),
                    "sample_prediction": round(prob, 4),
                    "prediction_source": "TRAINED_MODEL",
                    "model_file": "disruption_model.pkl"
                }
            except Exception as e:
                results["disruption_model.pkl"] = {"status": "FAIL", "error": str(e)}

        if self.eta_regressor is not None:
            t0 = time.perf_counter()
            try:
                sample_df = pd.DataFrame([{f: 1.0 for f in self.eta_features}])
                pred_days = self.predict_eta(sample_df)
                results["eta_model.pkl"] = {
                    "status": "PASS",
                    "latency_ms": round((time.perf_counter() - t0) * 1000, 2),
                    "sample_prediction_days": round(pred_days, 2),
                    "prediction_source": "TRAINED_MODEL",
                    "model_file": "ETA_Agent.pkl"
                }
            except Exception as e:
                results["eta_model.pkl"] = {"status": "FAIL", "error": str(e)}

        if self.delay_classifier is not None:
            t0 = time.perf_counter()
            try:
                sample_df = pd.DataFrame([{f: 1.0 for f in self.delay_features}])
                delay_prob = self.predict_delay(sample_df)
                results["delay_model.pkl"] = {
                    "status": "PASS",
                    "latency_ms": round((time.perf_counter() - t0) * 1000, 2),
                    "sample_delay_probability": round(delay_prob, 4),
                    "prediction_source": "TRAINED_MODEL",
                    "model_file": "Calibrated_Delay_Agent.pkl"
                }
            except Exception as e:
                results["delay_model.pkl"] = {"status": "FAIL", "error": str(e)}

        if self.cost_optimizer_model is not None:
            t0 = time.perf_counter()
            try:
                sample_cost_df = pd.DataFrame([{
                    "line_item_quantity": 100, "line_item_value": 5000.0, "pack_price": 50.0,
                    "unit_price": 50.0, "weight_kilograms": 1200.0, "line_item_insurance_usd": 150.0,
                    "shipment_mode": "Ocean", "country": "Japan", "vendor": "VendorA",
                    "fulfill_via": "Direct", "vendor_inco_term": "FOB"
                }])
                pred_cost = self.predict_cost(sample_cost_df)
                results["cost_model.pkl"] = {
                    "status": "PASS",
                    "latency_ms": round((time.perf_counter() - t0) * 1000, 2),
                    "sample_predicted_cost_usd": round(pred_cost, 2),
                    "prediction_source": "TRAINED_MODEL",
                    "model_file": "flowforge_cost_optimizer_xgb.pkl"
                }
            except Exception as e:
                results["cost_model.pkl"] = {"status": "FAIL", "error": str(e)}

        return {
            "diagnostic_status": "ALL_PASSED" if all(r.get("status") == "PASS" for r in results.values()) else "ATTENTION_REQUIRED",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "diagnostics": results
        }

model_registry = ModelRegistry()
