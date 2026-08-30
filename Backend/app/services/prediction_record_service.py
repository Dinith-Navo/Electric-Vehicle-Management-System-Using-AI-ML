from typing import Any, Dict

from firebase_admin import firestore


# =========================================================
# FIRESTORE COLLECTION
# =========================================================
# Using your existing collection so new records appear
# together with the earlier frontend test records.
COLLECTION_NAME = "frontend_form_tests"


# =========================================================
# SAVE ONE COMPLETE ANALYSIS RECORD
# =========================================================

def save_prediction_record(
    request_data: Dict[str, Any],
    prediction_data: Dict[str, Any],
    recommendations: list,
    health_status: str,
    risk_level: str,
) -> str:
    """
    Save one successful frontend analysis to Firestore.

    This is save-only storage. There is no history page,
    no user-by-user separation, and no GET history endpoint
    required for the frontend.
    """

    db = firestore.client()

    doc_ref = (
        db.collection(COLLECTION_NAME)
        .document()
    )

    # -----------------------------------------------------
    # Original frontend/form values
    # -----------------------------------------------------

    sessions_per_week = request_data.get(
        "charging_sessions_per_week"
    )

    if sessions_per_week is None:
        sessions_per_week = (
            float(
                request_data.get(
                    "charging_sessions",
                    0
                )
            )
            * 7.0
        )

    form_data = {
        "vehicle_model":
            request_data.get(
                "vehicle_model"
            ),

        "battery_age_months":
            request_data.get(
                "battery_age_months"
            ),

        "current_soh":
            request_data.get(
                "current_soh"
            ),

        "avg_voltage":
            request_data.get(
                "avg_voltage"
            ),

        "avg_current":
            request_data.get(
                "avg_current"
            ),

        "avg_temperature":
            request_data.get(
                "avg_temperature"
            ),

        "avg_soc_change":
            request_data.get(
                "avg_soc_change"
            ),

        "avg_charge_duration":
            request_data.get(
                "avg_charge_duration"
            ),

        # Store what the user actually entered in the form.
        "charging_sessions_per_week":
            sessions_per_week,

        "driving_style":
            request_data.get(
                "driving_style"
            ),

        "avg_daily_distance":
            request_data.get(
                "avg_daily_distance"
            ),

        "charging_frequency":
            request_data.get(
                "charging_frequency"
            ),

        "fast_charging_usage":
            request_data.get(
                "fast_charging_usage"
            ),

        "charging_habit":
            request_data.get(
                "charging_habit"
            ),

        "temperature_exposure":
            request_data.get(
                "temperature_exposure"
            ),
    }

    # -----------------------------------------------------
    # Exact 7 values used by the ML models
    # -----------------------------------------------------

    model_input = {
        "current_soh":
            request_data.get(
                "current_soh"
            ),

        "avg_voltage":
            request_data.get(
                "avg_voltage"
            ),

        "avg_current":
            request_data.get(
                "avg_current"
            ),

        "avg_temperature":
            request_data.get(
                "avg_temperature"
            ),

        "avg_soc_change":
            request_data.get(
                "avg_soc_change"
            ),

        "avg_charge_duration":
            request_data.get(
                "avg_charge_duration"
            ),

        # Model receives average sessions/day.
        "charging_sessions":
            request_data.get(
                "charging_sessions"
            ),
    }

    # -----------------------------------------------------
    # Prediction output
    # -----------------------------------------------------

    prediction = {
        "soh_3m":
            prediction_data.get(
                "soh_3m"
            ),

        "soh_6m":
            prediction_data.get(
                "soh_6m"
            ),

        "soh_12m":
            prediction_data.get(
                "soh_12m"
            ),

        "degradation_3m":
            prediction_data.get(
                "degradation_3m"
            ),

        "degradation_6m":
            prediction_data.get(
                "degradation_6m"
            ),

        "degradation_12m":
            prediction_data.get(
                "degradation_12m"
            ),

        "model_3m":
            prediction_data.get(
                "model_3m"
            ),

        "model_6m":
            prediction_data.get(
                "model_6m"
            ),

        "model_12m":
            prediction_data.get(
                "model_12m"
            ),
    }

    record = {
        "record_id":
            doc_ref.id,

        "created_at":
            firestore.SERVER_TIMESTAMP,

        "form_data":
            form_data,

        "model_input":
            model_input,

        "prediction":
            prediction,

        "health_status":
            health_status,

        "risk_level":
            risk_level,

        "recommendations":
            recommendations,
    }

    doc_ref.set(
        record
    )

    return doc_ref.id
