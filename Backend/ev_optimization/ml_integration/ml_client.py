import os
import httpx
import logging
from datetime import datetime, timezone
from typing import Dict, Any

logger = logging.getLogger(__name__)

ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:8001")

async def request_range_prediction(payload: dict) -> dict:
    """
    Asynchronously calls the ML microservice for range prediction.
    If the ML service is unavailable, executes graceful local fallback.
    """
    url = f"{ML_SERVICE_URL}/predict/range"
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(1.0, connect=0.4)) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("success"):
                    return data.get("data", {})
    except Exception as e:
        logger.warning(f"ML Service range prediction call failed ({e}). Using backend local fallback.")

    # Graceful Backend Local Fallback
    soc = float(payload.get("soc", 75.0))
    capacity = float(payload.get("batteryCapacityKWh", 60.0))
    consumption = float(payload.get("energyConsumptionKWhPer100Km", 15.0))
    temp = float(payload.get("temperatureC", 25.0))
    speed = float(payload.get("speedKmH", 60.0))
    ac_on = bool(payload.get("acOn", False))

    usable_kwh = capacity * (soc / 100.0)
    temp_mult = 1.15 if (temp < 10 or temp > 35) else 1.0
    speed_mult = 1.12 if speed > 90 else 1.0
    ac_mult = 1.10 if ac_on else 1.0
    effective_kwh_per_100km = consumption * temp_mult * speed_mult * ac_mult

    remaining_km = round((usable_kwh / max(5.0, effective_kwh_per_100km)) * 100.0, 1)

    return {
        "remainingRangeKm": remaining_km,
        "confidenceScore": 0.85,
        "source": "mock",
        "modelName": "BackendFallbackRegressor",
        "factors": {
            "usableEnergyKWh": usable_kwh,
            "effectiveConsumption": effective_kwh_per_100km,
            "temperatureC": temp
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

async def request_queue_prediction(payload: dict) -> dict:
    """
    Asynchronously calls the ML microservice for queue & wait time prediction.
    If the ML service is unavailable, executes graceful local fallback.
    """
    url = f"{ML_SERVICE_URL}/predict/queue"
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(1.0, connect=0.4)) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("success"):
                    return data.get("data", {})
    except Exception as e:
        logger.warning(f"ML Service queue prediction call failed ({e}). Using backend local fallback.")

    # Graceful Backend Local Fallback
    total_chargers = int(payload.get("totalChargers", 4))
    occupied = int(payload.get("currentlyOccupied", 2))
    arrival_hour = int(payload.get("arrivalHour", 17))
    station_id = payload.get("stationId", "station_00")

    available = max(0, total_chargers - occupied)
    is_peak = arrival_hour in [8, 9, 17, 18, 19]
    predicted_q = 1 if (occupied >= total_chargers and is_peak) else (0 if available > 0 else 1)
    est_wait = predicted_q * 18

    return {
        "stationId": station_id,
        "predictedQueueLength": predicted_q,
        "estimatedWaitMinutes": est_wait,
        "availableChargersNow": available,
        "congestionLevel": "High" if predicted_q > 2 else ("Moderate" if predicted_q > 0 else "Low"),
        "source": "mock",
        "modelName": "BackendFallbackQueueEstimator",
        "hourlyForecast": [
            {"hour": f"{(arrival_hour + i) % 24:02d}:00", "predictedQueue": max(0, predicted_q + (1 if i == 1 else 0)), "estimatedWaitMin": est_wait}
            for i in range(4)
        ],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
