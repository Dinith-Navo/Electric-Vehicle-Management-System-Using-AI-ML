import time
import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware


from app.core.config import settings
from app.core.logging import logger
from app.core.error_handlers import register_exception_handlers


from app.modules.anomaly_detection.models.model_manager import MLModelManager
from app.modules.battery_health.services.firebase_service import initialize_firebase, get_database
from app.modules.battery_health.service import models_available


from app.api.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=========================================================")
    logger.info("[START] Starting SmartEV Unified AI/ML Management System...")
    logger.info("=========================================================")

    try:
        MLModelManager.get_instance()
        logger.info("[OK] Component 1: Anomaly Detection ML Models initialized.")
    except Exception as e:
        logger.warning(f"[WARN] Component 1 ML initialization warning: {e}")

    try:
        initialize_firebase()
        logger.info("[OK] Component 2: Firebase service initialized.")
    except Exception as e:
        logger.warning(f"[WARN] Component 2 Firebase initialization warning: {e}")

    try:
        battery_status = models_available()
        logger.info(
            f"Component 2 Battery Models: "
            f"3M={'Ready' if battery_status.get('3m') else 'Pending'}, "
            f"6M={'Ready' if battery_status.get('6m') else 'Pending'}, "
            f"12M={'Ready' if battery_status.get('12m') else 'Pending'}"
        )
    except Exception as e:
        logger.warning(f"[WARN] Component 2 Battery Models check warning: {e}")

    logger.info("[OK] Component 3 & 4: Intelligent Services & Charging Optimization ready.")

    logger.info("=========================================================")
    logger.info("[ONLINE] SmartEV Master Backend is Online on Port 8000")
    logger.info("=========================================================")

    try:
        yield
    except Exception:
        pass
    finally:
        logger.info("SmartEV Master Backend shutting down...")



app = FastAPI(
    title="SmartEV - Unified AI/ML Electric Vehicle Management System",
    description=(
        "Unified REST API integrating:\n"
        "- Component 1: Post-Sale Performance Intelligence & Failure Anomaly Detection\n"
        "- Component 2: Adaptive Battery Health Prediction (3M / 6M / 12M SoH)\n"
        "- Component 3: Intelligent Services (Route, Range, Cost, Dashboard)\n"
        "- Component 4: Charging Station & Queue Prediction (grouped with Component 3)\n"
        "- Virtual Assistant: EV chat and voice transcription\n"
    ),
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



register_exception_handlers(app)

@app.middleware("http")
async def process_time_and_log_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = round((time.time() - start_time) * 1000.0, 2)
    response.headers["X-Process-Time-Ms"] = str(process_time)
    logger.info(f"{request.method} {request.url.path} - {response.status_code} ({process_time}ms)")
    return response



app.include_router(api_router)


@app.get("/", tags=["System"])
def root():
    return {
        "service": "SmartEV - Unified Electric Vehicle Management System",
        "status": "ONLINE",
        "version": "2.0.0",
        "docs": "/docs",
        "components": {
            "component_1_anomaly_detection": f"{settings.API_V1_STR}/anomaly",
            "component_2_battery_health": "/api/battery/status",
            "component_3_and_4_intelligent_charging": "/api/ev-optimization/dashboard",
            "virtual_assistant": f"{settings.API_V1_STR}/assistant/health"
        }
    }

@app.get("/health", tags=["System"])
def system_health():
    firebase_db = get_database()
    firebase_connected = (firebase_db is not None)
    battery_models = models_available()

    return {
        "system": "SmartEV Unified API",
        "status": "healthy",
        "components": {
            "anomaly_detection": "operational",
            "battery_health": {
                "firebase": "connected" if firebase_connected else "unavailable",
                "models": battery_models
            },
            "intelligent_service": "operational",
            "charging_optimization": "operational",
            "virtual_assistant": {
                "chat": "configured" if settings.OPENROUTER_API_KEY and settings.PINECONE_API_KEY and settings.PINECONE_HOST else "needs_configuration",
                "voice": "configured" if settings.GROQ_API_KEY else "needs_configuration"
            }
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
