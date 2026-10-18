from fastapi import APIRouter
from app.modules.charging_queue.queue_prediction.queue_routes import router as queue_router
from app.modules.charging_queue.charging_stations.station_routes import router as station_router
from app.modules.charging_queue.charging_estimator.charging_time_routes import router as estimator_router

router = APIRouter()

router.include_router(queue_router)
router.include_router(station_router)
router.include_router(estimator_router)

__all__ = ["router"]
