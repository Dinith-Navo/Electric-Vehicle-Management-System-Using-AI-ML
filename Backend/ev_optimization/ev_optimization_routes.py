from fastapi import APIRouter, Query
from typing import Optional
from .schemas import StandardResponse, DashboardOverviewData
from .dashboard.dashboard_service import DashboardService

from .range_prediction.range_routes import router as range_router
from .queue_prediction.queue_routes import router as queue_router
from .charging_stations.station_routes import router as station_router
from .recommendation.recommendation_routes import router as recommendation_router
from .route_optimization.route_routes import router as route_router
from .charging_estimator.charging_time_routes import router as estimator_router
from .cost_analysis.cost_routes import router as cost_router

ev_optimization_router = APIRouter()

@ev_optimization_router.get("/health", tags=["Health"])
async def ev_optimization_health():
    return {
        "status": "healthy",
        "module": "Intelligent EV Charging Optimization & Range Prediction",
        "version": "1.0.0",
        "submodules": [
            "range_prediction",
            "queue_prediction",
            "charging_stations",
            "recommendation",
            "route_optimization",
            "charging_estimator",
            "cost_analysis",
            "ml_integration"
        ]
    }

@ev_optimization_router.get("/dashboard", response_model=StandardResponse[DashboardOverviewData], tags=["Dashboard"])
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

# Mount all submodules
ev_optimization_router.include_router(range_router)
ev_optimization_router.include_router(queue_router)
ev_optimization_router.include_router(station_router)
ev_optimization_router.include_router(recommendation_router)
ev_optimization_router.include_router(route_router)
ev_optimization_router.include_router(estimator_router)
ev_optimization_router.include_router(cost_router)
