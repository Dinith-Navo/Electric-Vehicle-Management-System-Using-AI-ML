from typing import Optional, List
from pydantic import BaseModel, Field, model_validator


NEW_FEATURES: List[str] = [
    "soh_estimated_pct",
    "battery_age_years",
    "odometer_km",
    "battery_nominal_capacity_kwh",
    "weekly_driving_distance_km",
    "weekly_charge_sessions",
    "weekly_fast_charge_fraction",
    "weekly_avg_soc_start_pct",
    "weekly_avg_soc_end_pct",
    "weekly_energy_consumption_kwh_per_100km",
    "weekly_avg_charge_duration_min",
    "battery_temperature_c",
    "battery_pack_voltage_v",
    "battery_nominal_voltage_v",
    "avg_charging_current_a",
]


class BatteryPredictionRequest(BaseModel):
    
    soh_estimated_pct: float = Field(
        ge=60,
        le=100,
        description="Current estimated battery state of health in percentage (60-100%)."
    )
    battery_age_years: float = Field(
        ge=0,
        le=10,
        description="Battery age in years (0 to 10 years)."
    )
    odometer_km: float = Field(
        ge=0,
        le=1_500_000,
        description="Total odometer reading in kilometers."
    )
    battery_nominal_capacity_kwh: float = Field(
        ge=10,
        le=300,
        description="Nominal battery pack capacity in kWh."
    )
    weekly_driving_distance_km: float = Field(
        ge=0,
        le=10_000,
        description="Average weekly driving distance in kilometers."
    )
    weekly_charge_sessions: float = Field(
        ge=0,
        le=70,
        description="Number of charging sessions per week."
    )
    weekly_fast_charge_fraction: float = Field(
        ge=0.0,
        le=1.0,
        description="Fraction of charging that is DC fast charging (0.0 to 1.0)."
    )
    weekly_avg_soc_start_pct: float = Field(
        ge=0,
        le=100,
        description="Average State of Charge (%) at start of charging."
    )
    weekly_avg_soc_end_pct: float = Field(
        ge=0,
        le=100,
        description="Average State of Charge (%) at end of charging."
    )
    weekly_energy_consumption_kwh_per_100km: float = Field(
        ge=5,
        le=60,
        description="Average weekly energy consumption in kWh per 100 km."
    )
    weekly_avg_charge_duration_min: float = Field(
        ge=1,
        le=1440,
        description="Average duration of a charging session in minutes."
    )
    battery_temperature_c: float = Field(
        ge=-20,
        le=60,
        description="Battery operating/pack temperature in degrees Celsius (-20 to 60°C)."
    )
    battery_pack_voltage_v: float = Field(
        ge=100,
        le=1100,
        description="Measured battery pack voltage in Volts (100 to 1100 V)."
    )
    battery_nominal_voltage_v: float = Field(
        ge=100,
        le=1000,
        description="Nominal battery system voltage in Volts (100 to 1000 V)."
    )
    avg_charging_current_a: float = Field(
        ge=0,
        le=1000,
        description="Average charging current magnitude in Amperes."
    )

    vehicle_model: Optional[str] = None
    battery_age_months: Optional[float] = None
    current_soh: Optional[float] = None
    charging_sessions_per_week: Optional[float] = None
    dc_fast_charging_sessions: Optional[float] = None

    driving_mode: Optional[str] = None
    driving_style: Optional[str] = None
    avg_daily_distance: Optional[str] = None
    charging_frequency: Optional[str] = None
    fast_charging_usage: Optional[str] = None
    charging_habit: Optional[str] = None
    temperature_exposure: Optional[str] = None

    user_id: Optional[str] = "demo-user"

    avg_voltage: Optional[float] = None
    avg_current: Optional[float] = None
    avg_temperature: Optional[float] = None
    avg_soc_change: Optional[float] = None
    avg_charge_duration: Optional[float] = None
    charging_sessions: Optional[float] = None

    @model_validator(mode="before")
    @classmethod
    def populate_and_normalize_features(cls, data: dict):
        if not isinstance(data, dict):
            return data

        
        if "soh_estimated_pct" not in data or data["soh_estimated_pct"] is None:
            if "current_soh" in data and data["current_soh"] is not None:
                data["soh_estimated_pct"] = float(data["current_soh"])
        if "current_soh" not in data or data["current_soh"] is None:
            if "soh_estimated_pct" in data and data["soh_estimated_pct"] is not None:
                data["current_soh"] = float(data["soh_estimated_pct"])

        
        if "battery_age_years" not in data or data["battery_age_years"] is None:
            if "battery_age_months" in data and data["battery_age_months"] is not None:
                data["battery_age_years"] = float(data["battery_age_months"]) / 12.0
            else:
                data["battery_age_years"] = 2.0
        if "battery_age_months" not in data or data["battery_age_months"] is None:
            if "battery_age_years" in data and data["battery_age_years"] is not None:
                data["battery_age_months"] = float(data["battery_age_years"]) * 12.0

        if "battery_pack_voltage_v" not in data or data["battery_pack_voltage_v"] is None:
            data["battery_pack_voltage_v"] = float(data.get("avg_voltage", 400.0))

        if "battery_nominal_voltage_v" not in data or data["battery_nominal_voltage_v"] is None:
            data["battery_nominal_voltage_v"] = float(data.get("battery_pack_voltage_v", 400.0))

        if "avg_charging_current_a" not in data or data["avg_charging_current_a"] is None:
            data["avg_charging_current_a"] = float(data.get("avg_current", 32.0))

        if "battery_temperature_c" not in data or data["battery_temperature_c"] is None:
            data["battery_temperature_c"] = float(data.get("avg_temperature", 28.0))

        if "weekly_avg_charge_duration_min" not in data or data["weekly_avg_charge_duration_min"] is None:
            data["weekly_avg_charge_duration_min"] = float(data.get("avg_charge_duration", 45.0))

        if "weekly_charge_sessions" not in data or data["weekly_charge_sessions"] is None:
            if "charging_sessions_per_week" in data and data["charging_sessions_per_week"] is not None:
                data["weekly_charge_sessions"] = float(data["charging_sessions_per_week"])
            elif "charging_sessions" in data and data["charging_sessions"] is not None:
                
                cs = float(data["charging_sessions"])
                data["weekly_charge_sessions"] = cs * 7.0 if cs <= 5.0 else cs
            else:
                data["weekly_charge_sessions"] = 4.0

        if "weekly_avg_soc_start_pct" not in data or data["weekly_avg_soc_start_pct"] is None:
            data["weekly_avg_soc_start_pct"] = 20.0

        if "weekly_avg_soc_end_pct" not in data or data["weekly_avg_soc_end_pct"] is None:
            if "avg_soc_change" in data and data["avg_soc_change"] is not None:
                start = float(data.get("weekly_avg_soc_start_pct", 20.0))
                data["weekly_avg_soc_end_pct"] = min(100.0, start + float(data["avg_soc_change"]))
            else:
                data["weekly_avg_soc_end_pct"] = 80.0

        if "odometer_km" not in data or data["odometer_km"] is None:
            data["odometer_km"] = 35000.0

        if "battery_nominal_capacity_kwh" not in data or data["battery_nominal_capacity_kwh"] is None:
            data["battery_nominal_capacity_kwh"] = 64.0

        if "weekly_driving_distance_km" not in data or data["weekly_driving_distance_km"] is None:
            data["weekly_driving_distance_km"] = 250.0

        if "weekly_fast_charge_fraction" not in data or data["weekly_fast_charge_fraction"] is None:
            data["weekly_fast_charge_fraction"] = 0.20

        if "weekly_energy_consumption_kwh_per_100km" not in data or data["weekly_energy_consumption_kwh_per_100km"] is None:
            data["weekly_energy_consumption_kwh_per_100km"] = 16.5

        if "driving_mode" in data and data["driving_mode"] is not None:
            dm = str(data["driving_mode"]).strip()
            if "driving_style" not in data or data["driving_style"] is None:
                data["driving_style"] = dm
        elif "driving_style" in data and data["driving_style"] is not None:
            ds = str(data["driving_style"]).strip()
            if "driving_mode" not in data or data["driving_mode"] is None:
                data["driving_mode"] = ds

        total_sessions = float(data.get("weekly_charge_sessions", 0))
        if "dc_fast_charging_sessions" in data and data["dc_fast_charging_sessions"] is not None:
            dc_sessions = float(data["dc_fast_charging_sessions"])
            if dc_sessions > total_sessions:
                raise ValueError("DC fast charging sessions cannot exceed total charging sessions.")
            if total_sessions > 0:
                data["weekly_fast_charge_fraction"] = dc_sessions / total_sessions
            else:
                data["weekly_fast_charge_fraction"] = 0.0

        soc_start = float(data.get("weekly_avg_soc_start_pct", 0))
        soc_end = float(data.get("weekly_avg_soc_end_pct", 0))
        if total_sessions > 0 and soc_end <= soc_start:
            raise ValueError("Weekly Average SOC at End of Charge must be greater than Weekly Average SOC at Start of Charge when charging sessions are recorded.")

        return data


class Battery3MPredictionRequest(BatteryPredictionRequest):
    pass


class BatterySOHPredictionRequest(BatteryPredictionRequest):
    pass
