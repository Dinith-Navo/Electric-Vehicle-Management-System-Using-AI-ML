import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional

FEATURE_NAMES = [
    # Raw features (9)
    "batteryVoltage", "batteryCurrent", "batteryTemperature", "motorTemperature",
    "vehicleSpeed", "acceleration", "powerConsumption", "soc", "isCharging",
    # Engineered primary features (16)
    "batteryPower", "temperatureDifference", "motorBatteryTemperatureDifference",
    "powerToSpeedRatio", "currentToSOCratio", "voltageChange", "currentChange",
    "batteryTemperatureChange", "motorTemperatureChange", "powerChange",
    "speedChange", "accelerationChange", "thermalLoadIndicator",
    "electricalLoadIndicator", "chargingLoadIndicator", "operationalLoadIndicator"
]

class FeatureEngineer:
    @staticmethod
    def extract_features(
        current_data: Dict[str, Any],
        history_buffer: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, float]:
        """
        Extracts 25 features (9 raw + 16 engineered features) from current telemetry
        and short historical window telemetry.
        """
        bv = float(current_data.get("batteryVoltage", 350.0))
        bi = float(current_data.get("batteryCurrent", 0.0))
        bt = float(current_data.get("batteryTemperature", 25.0))
        mt = float(current_data.get("motorTemperature", 30.0))
        spd = float(current_data.get("vehicleSpeed", 0.0))
        acc = float(current_data.get("acceleration", 0.0))
        pwr = float(current_data.get("powerConsumption", 0.0))
        soc = float(current_data.get("soc", 50.0))
        charging_status = str(current_data.get("chargingStatus", "NOT_CHARGING"))
        is_charging = 1.0 if charging_status in ["CHARGING", "FAST_CHARGING"] else 0.0

        # Calculate historical deltas if history exists
        v_change = 0.0
        i_change = 0.0
        bt_change = 0.0
        mt_change = 0.0
        pwr_change = 0.0
        spd_change = 0.0
        acc_change = 0.0

        if history_buffer and len(history_buffer) > 0:
            prev = history_buffer[-1]
            v_change = bv - float(prev.get("batteryVoltage", bv))
            i_change = bi - float(prev.get("batteryCurrent", bi))
            bt_change = bt - float(prev.get("batteryTemperature", bt))
            mt_change = mt - float(prev.get("motorTemperature", mt))
            pwr_change = pwr - float(prev.get("powerConsumption", pwr))
            spd_change = spd - float(prev.get("vehicleSpeed", spd))
            acc_change = acc - float(prev.get("acceleration", acc))

        # 16 Engineered Features (§19)
        battery_power = (bv * bi) / 1000.0  # kW
        temperature_difference = mt - bt
        motor_battery_temp_diff = mt - bt
        power_to_speed_ratio = battery_power / (spd + 1.0)
        current_to_soc_ratio = bi / (soc + 1e-3)
        
        thermal_load_indicator = (bt * 0.4) + (mt * 0.6)
        electrical_load_indicator = (bv * abs(bi)) / 1000.0
        charging_load_indicator = electrical_load_indicator if is_charging else 0.0
        operational_load_indicator = thermal_load_indicator * (abs(power_to_speed_ratio) + 0.1)

        features = {
            # 9 Raw
            "batteryVoltage": bv,
            "batteryCurrent": bi,
            "batteryTemperature": bt,
            "motorTemperature": mt,
            "vehicleSpeed": spd,
            "acceleration": acc,
            "powerConsumption": pwr,
            "soc": soc,
            "isCharging": is_charging,
            
            # 16 Derived (§19)
            "batteryPower": battery_power,
            "temperatureDifference": temperature_difference,
            "motorBatteryTemperatureDifference": motor_battery_temp_diff,
            "powerToSpeedRatio": power_to_speed_ratio,
            "currentToSOCratio": current_to_soc_ratio,
            "voltageChange": v_change,
            "currentChange": i_change,
            "batteryTemperatureChange": bt_change,
            "motorTemperatureChange": mt_change,
            "powerChange": pwr_change,
            "speedChange": spd_change,
            "accelerationChange": acc_change,
            "thermalLoadIndicator": thermal_load_indicator,
            "electricalLoadIndicator": electrical_load_indicator,
            "chargingLoadIndicator": charging_load_indicator,
            "operationalLoadIndicator": operational_load_indicator
        }

        return features

    @staticmethod
    def to_feature_vector(features: Dict[str, float]) -> np.ndarray:
        """Converts feature dict to ordered 1D numpy array of length 25."""
        return np.array([features[name] for name in FEATURE_NAMES], dtype=np.float32)
