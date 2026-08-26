from fastapi import APIRouter
from ..schemas import RouteOptimizeRequest, RouteOptimizeResult, StandardResponse
from .route_controller import RouteOptimizationController

router = APIRouter(tags=["Route Optimization"])

@router.post("/route/optimize", response_model=StandardResponse[RouteOptimizeResult])
async def optimize_route_route(request: RouteOptimizeRequest):
    return await RouteOptimizationController.optimize_route_handler(request)
