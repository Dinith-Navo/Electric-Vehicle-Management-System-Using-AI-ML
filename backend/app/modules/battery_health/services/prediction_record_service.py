from typing import Any, Dict
from firebase_admin import firestore
from app.modules.battery_health.schemas import NEW_FEATURES

COLLECTION_NAME = "frontend_form_tests"


def save_prediction_record(
    request_data: Dict[str, Any],
    prediction_data: Dict[str, Any],
    recommendations: list,
    health_status: str,
    risk_level: str,
) -> str:
    """
    Save one successful frontend analysis to Firestore.
    Preserves existing collection schema while recording all 15 new ML features.
    """
    doc_id = None
    try:
        db = firestore.client()
        doc_ref = db.collection(COLLECTION_NAME).document()
        doc_id = doc_ref.id
    except Exception:
        import uuid
        doc_id = f"local_rec_{uuid.uuid4().hex[:8]}"
        doc_ref = None


    form_data = {
        "vehicle_model": request_data.get("vehicle_model"),
        "soh_estimated_pct": request_data.get("soh_estimated_pct", request_data.get("current_soh")),
        "battery_age_years": request_data.get("battery_age_years"),
        "battery_age_months": request_data.get("battery_age_months"),
        "odometer_km": request_data.get("odometer_km"),
        "battery_nominal_capacity_kwh": request_data.get("battery_nominal_capacity_kwh"),
        "battery_nominal_voltage_v": request_data.get("battery_nominal_voltage_v"),
        "weekly_driving_distance_km": request_data.get("weekly_driving_distance_km"),
        "weekly_charge_sessions": request_data.get("weekly_charge_sessions"),
        "weekly_fast_charge_fraction": request_data.get("weekly_fast_charge_fraction"),
        "weekly_avg_soc_start_pct": request_data.get("weekly_avg_soc_start_pct"),
        "weekly_avg_soc_end_pct": request_data.get("weekly_avg_soc_end_pct"),
        "weekly_energy_consumption_kwh_per_100km": request_data.get("weekly_energy_consumption_kwh_per_100km"),
        "weekly_avg_charge_duration_min": request_data.get("weekly_avg_charge_duration_min"),
        "battery_temperature_c": request_data.get("battery_temperature_c"),
        "battery_pack_voltage_v": request_data.get("battery_pack_voltage_v"),
        "avg_charging_current_a": request_data.get("avg_charging_current_a"),

        "driving_style": request_data.get("driving_style"),
        "charging_habit": request_data.get("charging_habit"),
    }

    model_input = {
        feature: request_data.get(feature)
        for feature in NEW_FEATURES
    }

    prediction = {
        "current_soh": prediction_data.get("current_soh"),
        "soh_3m": prediction_data.get("soh_3m"),
        "soh_6m": prediction_data.get("soh_6m"),
        "soh_12m": prediction_data.get("soh_12m"),
        "degradation_3m": prediction_data.get("degradation_3m"),
        "degradation_6m": prediction_data.get("degradation_6m"),
        "degradation_12m": prediction_data.get("degradation_12m"),
        "model_3m": prediction_data.get("model_3m"),
        "model_6m": prediction_data.get("model_6m"),
        "model_12m": prediction_data.get("model_12m"),
        "feature_count": prediction_data.get("feature_count", len(NEW_FEATURES))
    }

    record = {
        "record_id": doc_id,
        "created_at": firestore.SERVER_TIMESTAMP if doc_ref else None,
        "form_data": form_data,
        "model_input": model_input,
        "prediction": prediction,
        "health_status": health_status,
        "risk_level": risk_level,
        "recommendations": recommendations,
    }

    if doc_ref:
        try:
            doc_ref.set(record)
        except Exception as err:
            print(f"Warning: could not write to Firestore: {err}")

    return doc_id
