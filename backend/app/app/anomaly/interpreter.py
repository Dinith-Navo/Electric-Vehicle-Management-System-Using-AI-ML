from typing import List, Dict, Any, Tuple
from app.schemas.telemetry import TelemetryInput
from app.schemas.anomaly import (
    AnomalyCategory, SeverityLevel, AffectedParameter, OperatingStatus
)

PARAM_LEARNED_REFERENCES = {
    "batteryVoltage": 360.0,
    "batteryCurrent": 45.0,
    "batteryTemperature": 35.0,
    "motorTemperature": 50.0,
    "vehicleSpeed": 55.0,
    "acceleration": 0.5,
    "powerConsumption": 16.0,
    "soc": 60.0
}

class AnomalyInterpreter:
    """
    Multivariate Explainable AI (XAI) engine providing non-definitive diagnostic support,
    affected parameter identification, and recommended actions.
    """

    @staticmethod
    def interpret(
        telemetry: TelemetryInput,
        features: Dict[str, float],
        feature_errors: Dict[str, float],
        anomaly_score: float,
        severity: SeverityLevel
    ) -> Tuple[AnomalyCategory, List[AffectedParameter], str, str, str]:
        """
        Returns:
          category: AnomalyCategory
          affected_parameters: List[AffectedParameter]
          diagnostic_alert: str
          suggested_action: str
          explanation: str
        """
        if severity == SeverityLevel.NONE:
            return (
                AnomalyCategory.UNKNOWN_OPERATIONAL,
                [],
                "Operational telemetry within normal learned bounds.",
                "Continue monitoring.",
                "The analyzed operational pattern is consistent with learned normal EV behaviour."
            )

        # 1. Identify Affected Parameters from Autoencoder reconstruction errors and deviations
        affected_params: List[AffectedParameter] = []
        
        t_dict = telemetry.model_dump()
        for param, ref_val in PARAM_LEARNED_REFERENCES.items():
            curr_val = float(t_dict.get(param, ref_val))
            reconstruction_err = feature_errors.get(param, 0.0)
            
            # Compute percentage deviation from reference
            dev_pct = abs(curr_val - ref_val) / (abs(ref_val) + 1e-3) * 100.0
            
            if dev_pct > 15.0 or reconstruction_err > 0.02:
                direction = "HIGH" if curr_val >= ref_val else "LOW"
                if dev_pct > 40.0 or reconstruction_err > 0.10:
                    contribution = "STRONG"
                elif dev_pct > 25.0 or reconstruction_err > 0.05:
                    contribution = "MODERATE"
                else:
                    contribution = "WEAK"

                affected_params.append(
                    AffectedParameter(
                        parameter=param,
                        currentValue=round(curr_val, 2),
                        referenceValue=round(ref_val, 2),
                        deviationPercentage=round(dev_pct, 2),
                        direction=direction,
                        contribution=contribution
                    )
                )

        # Sort affected parameters by deviation magnitude
        affected_params.sort(key=lambda p: p.deviationPercentage, reverse=True)

        # 2. Multivariate Category Analysis (§31)
        param_names = [p.parameter for p in affected_params]
        bt_high = telemetry.batteryTemperature > 50.0
        mt_high = telemetry.motorTemperature > 70.0
        curr_high = abs(telemetry.batteryCurrent) > 180.0
        volt_abnormal = telemetry.batteryVoltage < 310.0 or telemetry.batteryVoltage > 430.0
        pwr_high = telemetry.powerConsumption > 60.0
        charging_on = telemetry.chargingStatus.value in ["CHARGING", "FAST_CHARGING"]

        if mt_high and (curr_high or pwr_high or "motorTemperature" in param_names):
            category = AnomalyCategory.MOTOR
            alert = "Potential motor thermal abnormality detected."
            exp = (
                "High motor temperature combined with elevated battery current and power consumption "
                "deviates from learned normal operational limits."
            )
        elif bt_high and ("batteryTemperature" in param_names or curr_high):
            category = AnomalyCategory.THERMAL
            alert = "Potential battery thermal elevation detected."
            exp = (
                "Battery pack temperature is elevated relative to power throughput and ambient baseline."
            )
        elif charging_on and (volt_abnormal or curr_high or "chargingStatus" in param_names):
            category = AnomalyCategory.CHARGING
            alert = "Potential charging-related operational abnormality detected."
            exp = (
                "Unusual voltage/current profile observed during charging cycle."
            )
        elif volt_abnormal or curr_high or "batteryVoltage" in param_names or "batteryCurrent" in param_names:
            category = AnomalyCategory.ELECTRICAL
            alert = "Potential electrical bus instability detected."
            exp = (
                "Battery voltage/current transient fluctuations exceed normal operational tolerances."
            )
        elif pwr_high or "powerConsumption" in param_names:
            category = AnomalyCategory.POWER_CONSUMPTION
            alert = "Potential power consumption anomaly detected."
            exp = (
                "Power draw is significantly disproportionate to vehicle speed and acceleration."
            )
        elif len(affected_params) >= 3:
            category = AnomalyCategory.COMBINED_OPERATIONAL
            alert = "Potential combined operational anomaly detected."
            exp = (
                "Correlated multi-parameter deviations across thermal, electrical, and motion telemetry."
            )
        else:
            category = AnomalyCategory.UNKNOWN_OPERATIONAL
            alert = "Potential abnormal operational pattern detected."
            exp = (
                "The AI identified an unusual multivariate operating pattern compared with learned normal EV behaviour."
            )

        # 3. Recommended Actions (§35)
        if severity == SeverityLevel.LOW:
            action = "Continue monitoring affected operational parameters."
        elif severity == SeverityLevel.MEDIUM:
            action = "Consider diagnostic inspection of vehicle subsystem."
        elif severity == SeverityLevel.HIGH:
            action = "Schedule professional diagnostic inspection."
        elif severity == SeverityLevel.CRITICAL:
            action = "Seek professional vehicle inspection promptly."
        else:
            action = "Continue monitoring."

        return category, affected_params, alert, action, exp
