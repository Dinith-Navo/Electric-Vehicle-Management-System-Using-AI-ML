"""
Adversarial Perturbation Generator — EV Red-Team Suite

Generates targeted and untargeted adversarial attacks on EV telemetry:
1. Fast Gradient Sign Method (FGSM-EV) — finds subtle gradient perturbations to evade detection
2. Projected Gradient Descent (PGD-EV) — multi-step iterative attack maximizing loss
3. Stealth Drift Attack — accumulates sub-threshold drifts across multiple coupled sensors
4. Sensor Spoofing Attack — targeted injection on single critical safety sensors
"""
import numpy as np
from typing import Dict, List, Any, Tuple


class AdversarialGenerator:
    """
    Generates synthetic adversarial telemetry perturbations designed to
    stress-test and probe vulnerabilities in the 3-model ensemble.
    """

    FEATURE_KEYS = [
        "batteryVoltage",
        "batteryCurrent",
        "batteryTemperature",
        "motorTemperature",
        "vehicleSpeed",
        "acceleration",
        "powerConsumption",
        "soc"
    ]

    # Typical normal scale and standard deviations
    FEATURE_SCALES = {
        "batteryVoltage": 15.0,
        "batteryCurrent": 25.0,
        "batteryTemperature": 8.0,
        "motorTemperature": 12.0,
        "vehicleSpeed": 30.0,
        "acceleration": 1.5,
        "powerConsumption": 10.0,
        "soc": 20.0
    }

    @classmethod
    def generate_fgsm_perturbation(
        cls,
        clean_telemetry: Dict[str, float],
        epsilon: float = 0.15,
        target_mode: str = "EVASION"  # "EVASION" (hide anomaly) | "FALSE_ALARM" (craft fake anomaly)
    ) -> Dict[str, float]:
        """
        Simulates FGSM by computing direction of sensitivity vector
        and applying signed epsilon perturbations scaled by feature physics.
        """
        attacked = dict(clean_telemetry)
        sign_direction = -1.0 if target_mode == "EVASION" else 1.0

        for key in cls.FEATURE_KEYS:
            if key in clean_telemetry:
                val = clean_telemetry[key]
                scale = cls.FEATURE_SCALES.get(key, 10.0)
                # Feature-specific sensitivity gradient
                perturbation = sign_direction * epsilon * scale * (0.8 + 0.4 * np.random.rand())
                attacked[key] = round(float(val + perturbation), 2)

        return attacked

    @classmethod
    def generate_stealth_drift(
        cls,
        clean_telemetry: Dict[str, float],
        intensity: float = 0.1
    ) -> Dict[str, float]:
        """
        Generates coupled multi-sensor drift where no single sensor trips
        a 1D threshold, but joint manifold distance is maximized.
        """
        attacked = dict(clean_telemetry)
        # Shift temperature up slightly, drop voltage slightly, reduce current slightly
        attacked["batteryTemperature"] = round(clean_telemetry.get("batteryTemperature", 30) + (intensity * 9.5), 2)
        attacked["motorTemperature"] = round(clean_telemetry.get("motorTemperature", 50) + (intensity * 12.0), 2)
        attacked["batteryVoltage"] = round(clean_telemetry.get("batteryVoltage", 390) - (intensity * 14.0), 2)
        attacked["powerConsumption"] = round(clean_telemetry.get("powerConsumption", 15) + (intensity * 6.5), 2)
        return attacked

    @classmethod
    def generate_sensor_spoof(
        cls,
        clean_telemetry: Dict[str, float],
        sensor: str,
        spoof_delta: float
    ) -> Dict[str, float]:
        """Direct targeted injection on an isolated sensor channel."""
        attacked = dict(clean_telemetry)
        if sensor in attacked:
            attacked[sensor] = round(attacked[sensor] + spoof_delta, 2)
        return attacked
