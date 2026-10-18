from pathlib import Path
import json
import joblib
import numpy as np
import pandas as pd

from app.core.config import MODEL_DIR
from app.modules.battery_health.schemas import NEW_FEATURES


EXPECTED_FEATURES = NEW_FEATURES


BASE_MODEL_DIR = Path(MODEL_DIR)
BATTERY_MODEL_DIR = BASE_MODEL_DIR / "battery"

NCM_3M_PATH = BATTERY_MODEL_DIR / "NCM_3M_Ridge.joblib"
NCM_3M_FALLBACK_PATH = BASE_MODEL_DIR / "NCM_3M_Ridge.joblib"

NCM_6M_PATH = BATTERY_MODEL_DIR / "NCM_6M_Ridge.joblib"
NCM_6M_FALLBACK_PATH = BASE_MODEL_DIR / "NCM_6M_Ridge.joblib"

NCM_12M_PATH = BATTERY_MODEL_DIR / "NCM_12M_Ridge.joblib"
NCM_12M_FALLBACK_PATH = BASE_MODEL_DIR / "NCM_12M_Ridge.joblib"



_model_3m = None
_metadata_3m = None

_model_6m = None
_metadata_6m = None

_model_12m = None
_metadata_12m = None


def _convert_to_dict(data):
    if hasattr(data, "model_dump"):
        return data.model_dump()
    if isinstance(data, dict):
        return data
    raise TypeError("Prediction input must be a dictionary or Pydantic model.")


def _create_model_input(input_data, features):
    """
    Extracts the features in the exact specified order.
    Returns a 2D NumPy float array to prevent Scikit-learn feature name warnings.
    """
    missing_features = [f for f in features if f not in input_data or input_data[f] is None]
    if missing_features:
        resolved = dict(input_data)
        if "soh_estimated_pct" in missing_features and "current_soh" in resolved:
            resolved["soh_estimated_pct"] = resolved["current_soh"]
        if "battery_age_years" in missing_features and "battery_age_months" in resolved:
            resolved["battery_age_years"] = float(resolved["battery_age_months"]) / 12.0
        if "battery_pack_voltage_v" in missing_features and "avg_voltage" in resolved:
            resolved["battery_pack_voltage_v"] = resolved["avg_voltage"]
        if "battery_nominal_voltage_v" in missing_features:
            resolved["battery_nominal_voltage_v"] = resolved.get("battery_pack_voltage_v", 400.0)
        if "avg_charging_current_a" in missing_features and "avg_current" in resolved:
            resolved["avg_charging_current_a"] = resolved["avg_current"]
        if "battery_temperature_c" in missing_features and "avg_temperature" in resolved:
            resolved["battery_temperature_c"] = resolved["avg_temperature"]
        if "weekly_avg_charge_duration_min" in missing_features and "avg_charge_duration" in resolved:
            resolved["weekly_avg_charge_duration_min"] = resolved["avg_charge_duration"]
        if "weekly_charge_sessions" in missing_features:
            if "charging_sessions_per_week" in resolved:
                resolved["weekly_charge_sessions"] = resolved["charging_sessions_per_week"]
            elif "charging_sessions" in resolved:
                cs = float(resolved["charging_sessions"])
                resolved["weekly_charge_sessions"] = cs * 7.0 if cs <= 5.0 else cs

        still_missing = [f for f in features if f not in resolved or resolved[f] is None]
        if still_missing:
            raise ValueError("Missing required features: " + ", ".join(still_missing))
        input_data = resolved

    values = [float(input_data[f]) for f in features]
    return np.array([values], dtype=float)


def _load_ncm_ridge_model(primary_path: Path, fallback_path: Path, horizon: int):
    """
    Loads newly trained NCM Ridge joblib model package.
    Expects dict containing {'model': pipeline, 'features': [...], 'target': ...}
    """
    target_path = None
    if primary_path.exists():
        target_path = primary_path
    elif fallback_path.exists():
        target_path = fallback_path

    if not target_path:
        raise FileNotFoundError(f"Model file not found at {primary_path} or {fallback_path}")

    loaded = joblib.load(target_path)

    if isinstance(loaded, dict):
        model = loaded.get("model", loaded)
        metadata = {
            "model_name": f"NCM {horizon}M Ridge Regressor",
            "model_type": "RidgePipeline",
            "features": loaded.get("features", EXPECTED_FEATURES),
            "target": loaded.get("target", f"target_degradation_{horizon}m_pp"),
            "horizon_months": loaded.get("horizon_months", horizon),
            "training_source": loaded.get("training_source", "fully_synthetic_NCM_2017_2023"),
            "research_limitations": loaded.get("research_limitations", ""),
            "path": str(target_path)
        }
    else:
        
        model = loaded
        metadata = {
            "model_name": f"NCM {horizon}M Ridge Regressor",
            "model_type": type(loaded).__name__,
            "features": EXPECTED_FEATURES,
            "target": f"target_degradation_{horizon}m_pp",
            "horizon_months": horizon,
            "path": str(target_path)
        }
    if hasattr(model, "named_steps"):
        for step in model.named_steps.values():
            if not hasattr(step, "_fill_dtype") and hasattr(step, "statistics_"):
                step._fill_dtype = step.statistics_.dtype

    return model, metadata


def is_3m_model_available():
    return NCM_3M_PATH.exists() or NCM_3M_FALLBACK_PATH.exists()


def is_6m_model_available():
    return NCM_6M_PATH.exists() or NCM_6M_FALLBACK_PATH.exists()


def is_12m_model_available():
    return NCM_12M_PATH.exists() or NCM_12M_FALLBACK_PATH.exists()


def models_available():
    return {
        "3m": is_3m_model_available(),
        "6m": is_6m_model_available(),
        "12m": is_12m_model_available()
    }


def load_3m_model():
    global _model_3m, _metadata_3m
    if _model_3m is None or _metadata_3m is None:
        _model_3m, _metadata_3m = _load_ncm_ridge_model(NCM_3M_PATH, NCM_3M_FALLBACK_PATH, 3)
    return _model_3m, _metadata_3m


def load_6m_model():
    global _model_6m, _metadata_6m
    if _model_6m is None or _metadata_6m is None:
        _model_6m, _metadata_6m = _load_ncm_ridge_model(NCM_6M_PATH, NCM_6M_FALLBACK_PATH, 6)
    return _model_6m, _metadata_6m


def load_12m_model():
    global _model_12m, _metadata_12m
    if _model_12m is None or _metadata_12m is None:
        _model_12m, _metadata_12m = _load_ncm_ridge_model(NCM_12M_PATH, NCM_12M_FALLBACK_PATH, 12)
    return _model_12m, _metadata_12m



def _predict_degradation(data, model, metadata):
    input_data = _convert_to_dict(data)
    features = metadata.get("features", EXPECTED_FEATURES)

    model_input = _create_model_input(input_data, features)

    raw_pred = float(model.predict(model_input)[0])

    predicted_degradation = max(0.0, raw_pred)

    current_soh = float(
        input_data.get("soh_estimated_pct", input_data.get("current_soh", 100.0))
    )

    predicted_soh = current_soh - predicted_degradation
    
    predicted_soh = max(0.0, min(current_soh, predicted_soh))

    model_name = metadata.get("model_name", "NCM Ridge")

    return {
        "current_soh": current_soh,
        "predicted_soh": predicted_soh,
        "degradation": predicted_degradation,
        "model": model_name,
        "feature_count": len(features)
    }



def predict_soh_3m(data):
    model, metadata = load_3m_model()
    result = _predict_degradation(data, model, metadata)

    return {
        "current_soh": round(result["current_soh"], 2),
        "predicted_soh_3m": round(result["predicted_soh"], 2),
        "estimated_degradation_3m": round(result["degradation"], 4),
        "forecast_horizon": "3 months",
        "model": result["model"],
        "prediction_target": "degradation_3m",
        "feature_count": result["feature_count"]
    }



def predict_soh_6m(data):
    model, metadata = load_6m_model()
    result = _predict_degradation(data, model, metadata)

    return {
        "current_soh": round(result["current_soh"], 2),
        "predicted_soh_6m": round(result["predicted_soh"], 2),
        "estimated_degradation_6m": round(result["degradation"], 4),
        "forecast_horizon": "6 months",
        "model": result["model"],
        "prediction_target": "degradation_6m",
        "feature_count": result["feature_count"]
    }



def predict_soh_12m(data):
    model, metadata = load_12m_model()
    result = _predict_degradation(data, model, metadata)

    return {
        "current_soh": round(result["current_soh"], 2),
        "predicted_soh_12m": round(result["predicted_soh"], 2),
        "estimated_degradation_12m": round(result["degradation"], 4),
        "forecast_horizon": "12 months",
        "model": result["model"],
        "prediction_target": "degradation_12m",
        "feature_count": result["feature_count"]
    }



def predict_battery_soh(data):
    input_data = _convert_to_dict(data)
    current_soh = float(
        input_data.get("soh_estimated_pct", input_data.get("current_soh", 100.0))
    )

    result = {
        "current_soh": round(current_soh, 2),
        "soh_3m": None,
        "soh_6m": None,
        "soh_12m": None,
        "degradation_3m": None,
        "degradation_6m": None,
        "degradation_12m": None,
        "model_3m": None,
        "model_6m": None,
        "model_12m": None,
        "feature_count": len(EXPECTED_FEATURES)
    }

    if is_3m_model_available():
        res_3m = predict_soh_3m(data)
        result["soh_3m"] = res_3m["predicted_soh_3m"]
        result["degradation_3m"] = res_3m["estimated_degradation_3m"]
        result["model_3m"] = res_3m["model"]

    if is_6m_model_available():
        res_6m = predict_soh_6m(data)
        result["soh_6m"] = res_6m["predicted_soh_6m"]
        result["degradation_6m"] = res_6m["estimated_degradation_6m"]
        result["model_6m"] = res_6m["model"]

    if is_12m_model_available():
        res_12m = predict_soh_12m(data)
        result["soh_12m"] = res_12m["predicted_soh_12m"]
        result["degradation_12m"] = res_12m["estimated_degradation_12m"]
        result["model_12m"] = res_12m["model"]

    return result