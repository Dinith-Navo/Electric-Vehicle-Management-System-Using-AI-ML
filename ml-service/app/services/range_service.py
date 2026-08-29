from datetime import datetime, timezone
import logging
from ..schemas.range_schema import RangePredictionRequest, RangePredictionData
from ..models.range_model import range_model_loader

logger = logging.getLogger(__name__)

def predict_ev_range(request: RangePredictionRequest) -> RangePredictionData:
    """
    Computes EV remaining driving range.
    Uses trained ML model from saved_models/range if available;
    otherwise executes realistic empirical physics-based fallback calculation.
    """
    timestamp = datetime.now(timezone.utc).isoformat()
    
    # 1. Attempt Trained Model Inference
    if range_model_loader.is_model_loaded():
        try:
            pred_range = range_model_loader.predict(request.model_dump())
            return RangePredictionData(
                remainingRangeKm=round(max(0.0, float(pred_range)), 1),
                confidenceScore=0.92,
                source="trained-model",
                modelName=range_model_loader.model_filename or "ColabTrainedModel",
                factors={
                    "soc": request.soc,
                    "batteryCapacityKWh": request.batteryCapacityKWh,
                    "speedKmH": request.speedKmH,
                    "temperatureC": request.temperatureC,
                    "energyConsumption": request.energyConsumptionKWhPer100Km
                },
                timestamp=timestamp
            )
        except Exception as e:
            logger.warning(f"Trained model inference failed: {e}. Falling back to empirical model.")

    # 2. Robust Empirical / Mock Fallback Model
    # Available usable battery energy in kWh
    usable_energy_kwh = request.batteryCapacityKWh * (request.soc / 100.0)

    # Base consumption in kWh / 100km
    base_consumption = request.energyConsumptionKWhPer100Km or 15.0

    # Temperature factor (efficiency drops below 15°C or above 32°C)
    temp = request.temperatureC
    if temp < 0:
        temp_factor = 1.25  # +25% consumption
    elif temp < 15:
        temp_factor = 1.0 + (15 - temp) * 0.015
    elif temp > 32:
        temp_factor = 1.0 + (temp - 32) * 0.012
    else:
        temp_factor = 1.0   # Optimal thermal window

    # Speed factor (aerodynamic drag scales quadratically at high speeds)
    speed = request.speedKmH
    if speed <= 50:
        speed_factor = 0.95
    elif speed <= 80:
        speed_factor = 1.00
    elif speed <= 100:
        speed_factor = 1.12
    else:
        speed_factor = 1.0 + (speed - 80) * 0.006

    # Climate control / AC factor
    ac_factor = 1.10 if request.acOn else 1.00

    # Driving mode factor
    mode_map = {
        "eco": 0.90,
        "normal": 1.00,
        "sport": 1.15
    }
    mode_factor = mode_map.get((request.drivingMode or "normal").lower(), 1.00)

    # Effective consumption (kWh / 100km)
    effective_consumption = base_consumption * temp_factor * speed_factor * ac_factor * mode_factor
    effective_consumption = max(8.0, effective_consumption)

    # Calculated remaining range
    estimated_range_km = (usable_energy_kwh / effective_consumption) * 100.0
    estimated_range_km = max(0.0, round(estimated_range_km, 1))

    return RangePredictionData(
        remainingRangeKm=estimated_range_km,
        confidenceScore=0.88,
        source="mock",
        modelName="EmpiricalPhysicsRegressor-Fallback",
        factors={
            "usableEnergyKWh": round(usable_energy_kwh, 2),
            "effectiveConsumptionKWhPer100Km": round(effective_consumption, 2),
            "tempFactor": round(temp_factor, 2),
            "speedFactor": round(speed_factor, 2),
            "acFactor": round(ac_factor, 2),
            "drivingMode": request.drivingMode or "Normal"
        },
        timestamp=timestamp
    )
