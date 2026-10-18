from fastapi import APIRouter
from app.modules.battery_health.prediction_routes import router as prediction_router
from app.modules.battery_health.history_routes import router as history_router
from app.modules.battery_health.debug_routes import router as debug_router

router = APIRouter()

router.include_router(prediction_router)
router.include_router(history_router)
router.include_router(debug_router)

__all__ = ["router", "prediction_router", "history_router", "debug_router"]
