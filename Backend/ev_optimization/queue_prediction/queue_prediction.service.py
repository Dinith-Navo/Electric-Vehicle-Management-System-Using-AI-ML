from ..schemas import QueuePredictRequest, QueuePredictResult
from ..ml_integration.ml_client import request_queue_prediction
from database import prediction_logs_collection, charging_stations_collection
import logging

logger = logging.getLogger(__name__)

class QueuePredictionService:
    @staticmethod
    async def predict_queue(req: QueuePredictRequest) -> QueuePredictResult:
        payload = req.model_dump()

        # If totalChargers not explicitly provided, look up station from DB
        try:
            station = await charging_stations_collection.find_one({"stationId": req.stationId})
            if station and "ports" in station:
                total_ports = sum(p.get("total", 1) for p in station["ports"])
                occupied_ports = sum(p.get("total", 1) - p.get("available", 1) for p in station["ports"])
                payload["totalChargers"] = total_ports
                payload["currentlyOccupied"] = occupied_ports
        except Exception as e:
            logger.debug(f"Could not load station metadata for queue prediction: {e}")

        raw_result = await request_queue_prediction(payload)

        result = QueuePredictResult(
            stationId=req.stationId,
            predictedQueueLength=int(raw_result.get("predictedQueueLength", 1)),
            estimatedWaitMinutes=int(raw_result.get("estimatedWaitMinutes", 15)),
            availableChargersNow=int(raw_result.get("availableChargersNow", 2)),
            congestionLevel=str(raw_result.get("congestionLevel", "Moderate")),
            source=str(raw_result.get("source", "mock")),
            modelName=str(raw_result.get("modelName", "QueuePredictor")),
            hourlyForecast=raw_result.get("hourlyForecast", []),
            timestamp=str(raw_result.get("timestamp", ""))
        )

        try:
            await prediction_logs_collection.insert_one({
                "type": "queue_prediction",
                "request": payload,
                "result": result.model_dump(),
                "timestamp": result.timestamp
            })
        except Exception as e:
            logger.debug(f"Failed to log queue prediction to DB: {e}")

        return result
