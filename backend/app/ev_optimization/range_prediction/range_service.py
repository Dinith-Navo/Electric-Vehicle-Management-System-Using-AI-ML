from ..schemas import RangePredictRequest, RangePredictResult
from ..ml_integration.ml_client import request_range_prediction
from database import prediction_logs_collection
import logging

logger = logging.getLogger(__name__)

class RangePredictionService:
    @staticmethod
    async def predict_range(req: RangePredictRequest) -> RangePredictResult:
        payload = req.model_dump()
        raw_result = await request_range_prediction(payload)
        
        result = RangePredictResult(
            remainingRangeKm=float(raw_result.get("remainingRangeKm", 180.0)),
            confidenceScore=float(raw_result.get("confidenceScore", 0.88)),
            source=str(raw_result.get("source", "mock")),
            modelName=str(raw_result.get("modelName", "RangeRegressor")),
            factors=raw_result.get("factors", {}),
            timestamp=str(raw_result.get("timestamp", ""))
        )

        try:
            log_doc = {
                "type": "range_prediction",
                "request": payload,
                "result": result.model_dump(),
                "timestamp": result.timestamp
            }
            await prediction_logs_collection.insert_one(log_doc)
        except Exception as e:
            logger.debug(f"Failed to log prediction to DB: {e}")

        return result
