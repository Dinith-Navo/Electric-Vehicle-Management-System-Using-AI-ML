from fastapi import HTTPException, status
from ..schemas import ChargingEstimateRequest, ChargingEstimateResult, StandardResponse
from .charging_time_service import ChargingTimeService
import logging

logger = logging.getLogger(__name__)

class ChargingTimeController:
    @staticmethod
    def estimate_charging_time_handler(request: ChargingEstimateRequest) -> StandardResponse[ChargingEstimateResult]:
        try:
            result = ChargingTimeService.calculate_charging_time(request)
            return StandardResponse(
                success=True,
                data=result,
                message="Charging duration and energy requirements estimated successfully."
            )
        except Exception as e:
            logger.error(f"Charging estimation error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to calculate charging time: {str(e)}"
            )
