from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.anomaly import router as anomaly_router
from app.api.telemetry import router as telemetry_router
from app.api.vehicles import router as vehicles_router
from app.api.analytics import router as analytics_router
from app.api.research import router as research_router
from app.api.adversarial import router as adversarial_router

router = APIRouter()

router.include_router(health_router)
router.include_router(anomaly_router)
router.include_router(telemetry_router)
router.include_router(vehicles_router)
router.include_router(analytics_router)
router.include_router(research_router)
router.include_router(adversarial_router)

__all__ = ["router"]
