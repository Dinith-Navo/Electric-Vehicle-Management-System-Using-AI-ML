from fastapi import HTTPException, status
from typing import Optional
from ..schemas import CostEstimateRequest, CostEstimateResult, MonthlyCostSummary, StandardResponse
from .cost_service import CostAnalysisService
import logging

logger = logging.getLogger(__name__)

class CostAnalysisController:
    @staticmethod
    def estimate_cost_handler(request: CostEstimateRequest) -> StandardResponse[CostEstimateResult]:
        try:
            result = CostAnalysisService.estimate_session_cost(request)
            return StandardResponse(
                success=True,
                data=result,
                message="Session charging cost estimated successfully."
            )
        except Exception as e:
            logger.error(f"Cost estimation error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to estimate charging cost: {str(e)}"
            )

    @staticmethod
    async def get_monthly_summary_handler(month: Optional[str] = None, year: Optional[int] = None) -> StandardResponse[MonthlyCostSummary]:
        try:
            result = await CostAnalysisService.get_monthly_cost_summary(month, year)
            return StandardResponse(
                success=True,
                data=result,
                message="Monthly cost and charging summary retrieved successfully."
            )
        except Exception as e:
            logger.error(f"Monthly summary error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to retrieve monthly summary: {str(e)}"
            )
