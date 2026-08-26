from fastapi import APIRouter, HTTPException, status
from ..schemas.queue_schema import QueuePredictionRequest, QueuePredictionResponse
from ..services.queue_service import predict_station_queue
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Queue Prediction"])

@router.post("/predict/queue", response_model=QueuePredictionResponse)
async def predict_queue_endpoint(request: QueuePredictionRequest):
    """
    Predict charging station queue length and wait time based on occupancy,
    time of day, charger power, and day of week.
    """
    try:
        data = predict_station_queue(request)
        return QueuePredictionResponse(
            success=True,
            data=data,
            message="Queue prediction computed successfully."
        )
    except Exception as e:
        logger.error(f"Error in queue prediction endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate queue prediction: {str(e)}"
        )
