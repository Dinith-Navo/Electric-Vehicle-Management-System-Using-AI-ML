from fastapi import APIRouter, HTTPException, status
from ..schemas.range_schema import RangePredictionRequest, RangePredictionResponse
from ..services.range_service import predict_ev_range
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Range Prediction"])

@router.post("/predict/range", response_model=RangePredictionResponse)
async def predict_range_endpoint(request: RangePredictionRequest):
    """
    Predict remaining EV driving range based on battery SoC, speed, ambient temperature,
    and vehicle efficiency factors.
    """
    try:
        data = predict_ev_range(request)
        return RangePredictionResponse(
            success=True,
            data=data,
            message="Range prediction computed successfully."
        )
    except Exception as e:
        logger.error(f"Error in range prediction endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate range prediction: {str(e)}"
        )
