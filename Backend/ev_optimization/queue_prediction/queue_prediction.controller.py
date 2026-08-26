from fastapi import HTTPException, status
from ..schemas import QueuePredictRequest, QueuePredictResult, StandardResponse
from .queue_prediction.service import QueuePredictionService
import logging

logger = logging.getLogger(__name__)

class QueuePredictionController:
    @staticmethod
    async def predict_queue_handler(request: QueuePredictRequest) -> StandardResponse[QueuePredictResult]:
        try:
            result = await QueuePredictionService.predict_queue(request)
            return StandardResponse(
                success=True,
                data=result,
                message="Station queue and waiting time calculated successfully."
            )
        except Exception as e:
            logger.error(f"Queue prediction error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to compute queue prediction: {str(e)}"
            )
