from fastapi import HTTPException, status
from ..schemas import RouteOptimizeRequest, RouteOptimizeResult, StandardResponse
from .route_service import RouteOptimizationService
import logging

logger = logging.getLogger(__name__)

class RouteOptimizationController:
    @staticmethod
    async def optimize_route_handler(request: RouteOptimizeRequest) -> StandardResponse[RouteOptimizeResult]:
        try:
            result = await RouteOptimizationService.optimize_route(request)
            return StandardResponse(
                success=True,
                data=result,
                message="Optimal route with charging recommendations calculated successfully."
            )
        except Exception as e:
            logger.error(f"Route optimization error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to calculate optimal route: {str(e)}"
            )
