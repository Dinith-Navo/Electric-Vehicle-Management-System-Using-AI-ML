from fastapi import HTTPException, status
from ..schemas import RangePredictRequest, RangePredictResult, StandardResponse
from .range_prediction.service import RangePredictionService
import logging

logger = logging.getLogger(__name__)

class RangePredictionController:
    @staticmethod
    async def predict_range_handler(request: RangePredictRequest) -> StandardResponse[RangePredictResult]:
        try:
            result = await RangePredictionService.predict_range(request)
            return StandardResponse(
                success=True,
                data=result,
                message="EV driving range calculated successfully."
            )
        except Exception as e:
            logger.error(f"Range prediction error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to compute range prediction: {str(e)}"
            )
