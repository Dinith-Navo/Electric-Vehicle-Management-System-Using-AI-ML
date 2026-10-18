from fastapi import APIRouter, Query
from typing import Optional
from app.modules.intelligent_service.schemas import StandardResponse, DashboardOverviewData
from app.modules.intelligent_service.dashboard.dashboard_service import DashboardService

from app.modules.intelligent_service.range_prediction.range_routes import router as range_router
from app.modules.intelligent_service.recommendation.recommendation_routes import router as recommendation_router
from app.modules.intelligent_service.route_optimization.route_routes import router as route_router
from app.modules.intelligent_service.cost_analysis.cost_routes import router as cost_router

router = APIRouter()

@router.get("/dashboard", response_model=StandardResponse[DashboardOverviewData], tags=["Dashboard"])
async def get_dashboard_overview(
    userLat: Optional[float] = Query(6.9271),
    userLon: Optional[float] = Query(79.8612)
):
    """
    Returns aggregated dashboard metrics including battery SoC, predicted remaining range,
    recommended charging station, and monthly charging summary.
    """
    data = await DashboardService.get_dashboard_data(userLat, userLon)
    return StandardResponse(
        success=True,
        data=data,
        message="Dashboard overview loaded successfully."
    )

router.include_router(range_router)
router.include_router(route_router)
router.include_router(cost_router)
router.include_router(recommendation_router)

__all__ = ["router"]
