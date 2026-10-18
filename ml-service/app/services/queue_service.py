from datetime import datetime, timezone
import logging
from ..schemas.queue_schema import QueuePredictionRequest, QueuePredictionData
from ..models.queue_model import queue_model_loader

logger = logging.getLogger(__name__)

def predict_station_queue(request: QueuePredictionRequest) -> QueuePredictionData:
    """
    Predicts charging station queue length and wait time.
    Uses trained ML model from saved_models/queue if available;
    otherwise executes realistic empirical queuing fallback model.
    """
    timestamp = datetime.now(timezone.utc).isoformat()
    total_chargers = max(1, request.totalChargers)
    occupied = min(total_chargers, max(0, request.currentlyOccupied or 0))
    available_now = max(0, total_chargers - occupied)

    # 1. Attempt Trained Model Inference
    if queue_model_loader.is_model_loaded():
        try:
            pred_dict = queue_model_loader.predict(request.model_dump())
            q_len = int(pred_dict.get("queueLength", 0))
            wait_m = int(pred_dict.get("waitMinutes", 0))
            
            congestion = "Low"
            if q_len >= 4:
                congestion = "Critical"
            elif q_len >= 2:
                congestion = "High"
            elif q_len >= 1:
                congestion = "Moderate"

            return QueuePredictionData(
                stationId=request.stationId,
                predictedQueueLength=q_len,
                estimatedWaitMinutes=wait_m,
                availableChargersNow=available_now,
                congestionLevel=congestion,
                source="trained-model",
                modelName=queue_model_loader.model_filename or "ColabQueueModel",
                hourlyForecast=[],
                timestamp=timestamp
            )
        except Exception as e:
            logger.warning(f"Trained queue model inference failed: {e}. Falling back to empirical simulation.")

    # 2. Empirical Queuing / Fallback Model
    arrival_hour = request.arrivalHour if request.arrivalHour is not None else 14
    day = request.dayOfWeek if request.dayOfWeek is not None else 2
    avg_session = request.avgSessionMinutes or 35.0

    # Hourly demand curves (0-23)
    # Peak periods: 08:00 - 10:00 (morning rush) and 17:00 - 20:00 (evening peak)
    peak_weights = {
        7: 1.1, 8: 1.6, 9: 1.7, 10: 1.3, 11: 1.2, 12: 1.4,
        13: 1.3, 14: 1.2, 15: 1.3, 16: 1.5, 17: 1.9, 18: 2.0,
        19: 1.8, 20: 1.5, 21: 1.2, 22: 0.9, 23: 0.6, 0: 0.3
    }
    demand_multiplier = peak_weights.get(arrival_hour, 0.8)

    # Weekend effect: higher midday leisure demand
    is_weekend = (day >= 5)
    if is_weekend:
        demand_multiplier *= 1.15

    # Utilization ratio
    utilization = occupied / float(total_chargers)

    if available_now > 0 and utilization < 0.7:
        predicted_queue = 0
        est_wait = 0
    else:
        # If fully occupied or nearly full, queue develops based on demand
        base_queue = max(0, occupied - total_chargers + 1)
        predicted_queue = int(round(base_queue + (demand_multiplier * 1.5)))
        predicted_queue = max(0, min(10, predicted_queue))
        
        # M/M/c queuing approximation for wait time
        # Throughput = total_chargers / avg_session (cars/min)
        service_rate_per_min = total_chargers / avg_session
        est_wait = int(round(predicted_queue / service_rate_per_min)) if service_rate_per_min > 0 else 15

    if predicted_queue == 0:
        congestion = "Low"
    elif predicted_queue <= 2:
        congestion = "Moderate"
    elif predicted_queue <= 4:
        congestion = "High"
    else:
        congestion = "Critical"

    # Generate 6-hour forecast
    hourly_forecast = []
    for h in range(6):
        future_hour = (arrival_hour + h) % 24
        fut_mult = peak_weights.get(future_hour, 0.8)
        fut_q = max(0, int(round((predicted_queue + (fut_mult - 1.0) * 2))))
        fut_wait = int(round((fut_q * avg_session) / total_chargers))
        hourly_forecast.append({
            "hour": f"{future_hour:02d}:00",
            "predictedQueue": fut_q,
            "estimatedWaitMin": fut_wait
        })

    return QueuePredictionData(
        stationId=request.stationId,
        predictedQueueLength=predicted_queue,
        estimatedWaitMinutes=est_wait,
        availableChargersNow=available_now,
        congestionLevel=congestion,
        source="mock",
        modelName="QueuingTheory-Fallback",
        hourlyForecast=hourly_forecast,
        timestamp=timestamp
    )
