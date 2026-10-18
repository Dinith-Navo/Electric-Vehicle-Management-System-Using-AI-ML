import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from app.schemas.telemetry import TelemetryInput
from app.core.logging import logger

PARAM_BOUNDS = {
    "batteryVoltage": (200.0, 500.0),      # Standard EV pack voltage range
    "batteryCurrent": (-300.0, 350.0),    # Charging negative, discharge positive
    "batteryTemperature": (-20.0, 75.0),   # Deg C
    "motorTemperature": (-20.0, 120.0),    # Deg C
    "vehicleSpeed": (0.0, 250.0),          # km/h
    "acceleration": (-12.0, 12.0),         # m/s^2
    "powerConsumption": (-50.0, 250.0),    # kW
    "soc": (0.0, 100.0)                    # %
}

class TelemetryPreprocessor:
    @staticmethod
    def calculate_data_quality(telemetry: TelemetryInput) -> float:
        """
        Calculates a data quality score between 0.0 and 1.0 based on:
        - Out-of-range physical bounds check
        - Internal sensor correlation validity (e.g. non-zero power when moving)
        - Non-null parameter presence
        """
        score_components = []

        # 1. Parameter Bounds Compliance
        in_bounds_count = 0
        total_checked = len(PARAM_BOUNDS)
        
        telemetry_dict = telemetry.model_dump()
        for param, (min_val, max_val) in PARAM_BOUNDS.items():
            val = telemetry_dict.get(param)
            if val is not None and min_val <= val <= max_val:
                in_bounds_count += 1
        
        bounds_score = in_bounds_count / total_checked
        score_components.append(bounds_score * 0.50)

        # 2. Physics & Sensor Consistency
        consistency_score = 1.0
        
        # Check: If speed > 10 km/h, power consumption should not be drastically negative unless regen
        if telemetry.vehicleSpeed > 10.0 and telemetry.powerConsumption < -5.0 and telemetry.acceleration > 0:
            consistency_score -= 0.30

        # Check: Battery voltage must be positive
        if telemetry.batteryVoltage <= 0:
            consistency_score -= 0.50
            
        # Check: SOC vs Voltage rough consistency
        if telemetry.soc < 5.0 and telemetry.batteryVoltage > 420.0:
            consistency_score -= 0.30

        consistency_score = max(0.0, consistency_score)
        score_components.append(consistency_score * 0.30)

        # 3. Completeness (100% complete if model validation passed)
        completeness_score = 1.0
        score_components.append(completeness_score * 0.20)

        total_quality = sum(score_components)
        logger.debug(f"Data quality calculated: {total_quality:.3f}")
        return round(total_quality, 3)

    @staticmethod
    def sanitize(telemetry: TelemetryInput) -> Dict[str, float]:
        """
        Clamps values to physically realistic boundaries for downstream model stability.
        """
        sanitized = {}
        t_dict = telemetry.model_dump()
        for param, (min_val, max_val) in PARAM_BOUNDS.items():
            val = float(t_dict[param])
            sanitized[param] = float(np.clip(val, min_val, max_val))
            
        # Retain discrete fields
        sanitized["chargingStatus"] = telemetry.chargingStatus.value
        return sanitized
