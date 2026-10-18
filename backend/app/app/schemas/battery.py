from typing import Optional
from pydantic import BaseModel, Field


# =========================================================
# Existing Application Request
# =========================================================

class BatteryPredictionRequest(BaseModel):

    # ML inputs
    current_soh: float = Field(ge=0, le=100)
    battery_age_months: float = Field(ge=0)

    avg_voltage: float = Field(gt=0)
    avg_current: float
    avg_temperature: float

    avg_soc_change: float = Field(ge=0, le=100)
    avg_charge_duration: float = Field(gt=0)
    charging_sessions: float = Field(ge=0)

    # Behaviour inputs
    driving_style: str
    avg_daily_distance: str
    charging_frequency: str
    fast_charging_usage: str
    charging_habit: str
    temperature_exposure: str

    user_id: Optional[str] = "demo-user"


# =========================================================
# 3-Month ML Prediction Request
# 7 frontend-compatible features
# =========================================================

class Battery3MPredictionRequest(BaseModel):

    # 1. Current Battery Health (%)
    current_soh: float = Field(
        ge=0,
        le=100
    )

    # 2. Average Voltage (V)
    avg_voltage: float = Field(
        gt=0
    )

    # 3. Average Current (A)
    avg_current: float = Field(
        ge=0
    )

    # 4. Average Temperature (°C)
    avg_temperature: float

    # 5. Average SOC Change (%)
    avg_soc_change: float = Field(
        ge=0,
        le=100
    )

    # 6. Average Charging Duration (minutes)
    avg_charge_duration: float = Field(
        gt=0
    )

    # 7. Charging Sessions
    charging_sessions: float = Field(
        ge=0
    )

class BatterySOHPredictionRequest(BaseModel):

    current_soh: float = Field(
        ge=0,
        le=100
    )

    avg_voltage: float = Field(
        gt=0
    )

    avg_current: float = Field(
        ge=0
    )

    avg_temperature: float

    avg_soc_change: float = Field(
        ge=0,
        le=100
    )

    avg_charge_duration: float = Field(
        gt=0
    )

    charging_sessions: float = Field(
        ge=0
    )