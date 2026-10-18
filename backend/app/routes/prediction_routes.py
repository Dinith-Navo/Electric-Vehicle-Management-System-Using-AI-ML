from typing import Optional

from fastapi import (
    APIRouter,
    HTTPException
)

from pydantic import (
    BaseModel,
    Field
)

from app.services.prediction_service import (
    predict_soh_3m,
    predict_soh_6m,
    predict_soh_12m,
    predict_battery_soh,
    models_available
)

from app.services.recommendation_service import (
    generate_recommendations,
    get_health_status,
    get_risk_level
)

from app.services.prediction_record_service import (
    save_prediction_record
)


router = APIRouter(
    prefix="/api/battery",
    tags=["Battery Prediction"]
)


# =========================================================
# REQUEST MODEL
# =========================================================

class BatteryPredictionRequest(BaseModel):

    # -----------------------------------------------------
    # Frontend/profile data
    # -----------------------------------------------------

    vehicle_model: Optional[str] = None

    battery_age_months: float = Field(
        ge=0,
        le=240
    )

    # Frontend and backend both block prediction below 60%.
    current_soh: float = Field(
        ge=60,
        le=100
    )

    # -----------------------------------------------------
    # 7 MODEL FEATURES
    # -----------------------------------------------------

    avg_voltage: float = Field(
        ge=100,
        le=1000
    )

    avg_current: float = Field(
        ge=0,
        le=1000
    )

    avg_temperature: float = Field(
        ge=-20,
        le=80
    )

    avg_soc_change: float = Field(
        ge=1,
        le=100
    )

    avg_charge_duration: float = Field(
        ge=1,
        le=1000
    )

    # Average sessions/day.
    # Frontend converts weekly value by dividing by 7.
    charging_sessions: float = Field(
        ge=0,
        le=10
    )

    # Preserve the value entered by the user for Firestore.
    charging_sessions_per_week: Optional[float] = Field(
        default=None,
        ge=0,
        le=70
    )

    # -----------------------------------------------------
    # RECOMMENDATION INPUTS
    # -----------------------------------------------------

    driving_style: Optional[str] = None

    avg_daily_distance: Optional[str] = None

    charging_frequency: Optional[str] = None

    fast_charging_usage: Optional[str] = None

    charging_habit: Optional[str] = None

    temperature_exposure: Optional[str] = None


# =========================================================
# MODEL STATUS
# =========================================================

@router.get("/status")
def get_model_status():

    try:

        return {
            "status": "success",
            "models_available":
                models_available()
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# =========================================================
# 3M SWAGGER TEST
# =========================================================
# These individual endpoints are only for testing models.
# They do NOT save a Firestore record.
# =========================================================

@router.post("/predict/3m")
def predict_3_months(
    data: BatteryPredictionRequest
):

    try:

        return {
            "status": "success",
            **predict_soh_3m(
                data.model_dump()
            )
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# =========================================================
# 6M SWAGGER TEST
# =========================================================

@router.post("/predict/6m")
def predict_6_months(
    data: BatteryPredictionRequest
):

    try:

        return {
            "status": "success",
            **predict_soh_6m(
                data.model_dump()
            )
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# =========================================================
# 12M SWAGGER TEST
# =========================================================

@router.post("/predict/12m")
def predict_12_months(
    data: BatteryPredictionRequest
):

    try:

        return {
            "status": "success",
            **predict_soh_12m(
                data.model_dump()
            )
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# =========================================================
# MAIN FRONTEND ENDPOINT
# =========================================================
# Frontend calls only this endpoint.
#
# Flow:
#   frontend data
#       ->
#   3M + 6M + 12M prediction
#       ->
#   recommendations
#       ->
#   Firestore save
#       ->
#   return result to result page
# =========================================================

@router.post("/predict")
def predict_battery(
    data: BatteryPredictionRequest
):

    try:

        # -------------------------------------------------
        # 1. Request -> dict
        # -------------------------------------------------

        request_data = (
            data.model_dump()
        )

        # -------------------------------------------------
        # 2. Run all ML models
        # -------------------------------------------------

        prediction = (
            predict_battery_soh(
                request_data
            )
        )

        # -------------------------------------------------
        # 3. Health status
        # -------------------------------------------------

        current_soh = float(
            prediction.get(
                "current_soh",
                request_data[
                    "current_soh"
                ]
            )
        )

        health_status = (
            get_health_status(
                current_soh
            )
        )

        # -------------------------------------------------
        # 4. Risk level
        # -------------------------------------------------

        risk_level = (
            get_risk_level(
                prediction
            )
        )

        # -------------------------------------------------
        # 5. Recommendations
        # -------------------------------------------------

        recommendations = (
            generate_recommendations(
                request_data,
                prediction
            )
        )

        # -------------------------------------------------
        # 6. Save complete record to Firestore
        # -------------------------------------------------

        record_id = (
            save_prediction_record(
                request_data=request_data,
                prediction_data=prediction,
                recommendations=recommendations,
                health_status=health_status,
                risk_level=risk_level,
            )
        )

        print(
            "Prediction + recommendation "
            f"saved to Firestore: {record_id}"
        )

        # -------------------------------------------------
        # 7. Result returned to existing result page
        # -------------------------------------------------
        # record_id is returned for debugging only.
        # Your frontend does not need to display it.
        # -------------------------------------------------

        return {
            "status":
                "success",

            **prediction,

            "health_status":
                health_status,

            "risk_level":
                risk_level,

            "models_available":
                models_available(),

            "recommendations":
                recommendations,

            "record_id":
                record_id,
        }

    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except FileNotFoundError as error:

        raise HTTPException(
            status_code=503,
            detail=str(error)
        )

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )
