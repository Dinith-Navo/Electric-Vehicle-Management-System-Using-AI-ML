from ..schemas import ChargingEstimateRequest, ChargingEstimateResult
import logging

logger = logging.getLogger(__name__)

class ChargingTimeService:
    @staticmethod
    def calculate_charging_time(req: ChargingEstimateRequest) -> ChargingEstimateResult:
        current_soc = min(100.0, max(0.0, req.currentSoc))
        target_soc = min(100.0, max(current_soc, req.targetSoc))
        
        delta_soc = target_soc - current_soc
        energy_required_kwh = round(req.batteryCapacityKWh * (delta_soc / 100.0), 2)
        eff = max(0.6, min(1.0, req.efficiency or 0.90))
        effective_power_kw = round(req.chargerPowerKw * eff, 2)

        if energy_required_kwh <= 0.0 or effective_power_kw <= 0.0:
            return ChargingEstimateResult(
                energyRequiredKWh=0.0,
                effectiveChargingPowerKw=effective_power_kw,
                chargingDurationMinutes=0,
                chargingDurationFormatted="0 mins",
                recommendedMaxSoc=80.0,
                curveAdjustmentFactor=1.0
            )

        curve_factor = 1.0
        if target_soc > 80.0:
            portion_below_80 = max(0.0, min(80.0, target_soc) - current_soc)
            portion_above_80 = max(0.0, target_soc - max(80.0, current_soc))
            if delta_soc > 0:
                curve_factor = (portion_below_80 * 1.0 + portion_above_80 * 1.6) / delta_soc

        hours_required = (energy_required_kwh / effective_power_kw) * curve_factor
        total_minutes = int(round(hours_required * 60))

        hours = total_minutes // 60
        mins = total_minutes % 60
        if hours > 0:
            formatted_time = f"{hours} hr {mins} mins"
        else:
            formatted_time = f"{mins} mins"

        return ChargingEstimateResult(
            energyRequiredKWh=energy_required_kwh,
            effectiveChargingPowerKw=effective_power_kw,
            chargingDurationMinutes=total_minutes,
            chargingDurationFormatted=formatted_time,
            recommendedMaxSoc=80.0,
            curveAdjustmentFactor=round(curve_factor, 2)
        )
