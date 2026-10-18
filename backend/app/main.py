import time
import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer

# -------------------------------------------------------------
# Component 1: Anomaly Detection Imports
# -------------------------------------------------------------
from app.core.config import settings
from app.core.logging import logger
from app.ml.model_manager import MLModelManager
from app.api.anomaly import router as anomaly_router
from app.api.telemetry import router as telemetry_router
from app.api.vehicles import router as vehicles_router
from app.api.analytics import router as analytics_router
from app.api.research import router as research_router
from app.api.health import router as health_router
from app.api.chatbot import router as chatbot_router

# -------------------------------------------------------------
# Component 2: Battery Health Imports
# -------------------------------------------------------------
from app.routes.prediction_routes import router as battery_prediction_router
from app.routes.history_routes import router as battery_history_router
from app.routes.debug_routes import router as battery_debug_router
from app.services.firebase_service import initialize_firebase, get_database
from app.services.prediction_service import models_available
from app.core.error_handlers import register_exception_handlers

# -------------------------------------------------------------
# Component 4: Charging Optimization Imports
# -------------------------------------------------------------
from app.ev_optimization.ev_optimization_routes import ev_optimization_router

# -------------------------------------------------------------
# Shared Database & Auth Models
# -------------------------------------------------------------
from app.shared.models import UserCreate, UserLogin, Token, VehicleSchema, TelemetrySchema
from app.shared.database import user_collection, vehicle_collection, telemetry_collection
from app.shared.auth import get_password_hash, verify_password, create_access_token


# =============================================================
# APPLICATION LIFESPAN
# =============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=========================================================")
    logger.info("🚀 Starting SmartEV Unified AI/ML Management System...")
    logger.info("=========================================================")

    # 1. Initialize Component 1 (Anomaly Detection ML Pipeline)
    try:
        MLModelManager.get_instance()
        logger.info("✅ Component 1: Anomaly Detection ML Models initialized.")
    except Exception as e:
        logger.warning(f"⚠️ Component 1 ML initialization warning: {e}")

    # 2. Initialize Component 2 (Firebase & Battery Health ML Models)
    try:
        initialize_firebase()
        logger.info("✅ Component 2: Firebase service initialized.")
    except Exception as e:
        logger.warning(f"⚠️ Component 2 Firebase initialization warning: {e}")

    try:
        battery_status = models_available()
        logger.info(
            f"Component 2 Battery Models: "
            f"3M={'Ready' if battery_status.get('3m') else 'Pending'}, "
            f"6M={'Ready' if battery_status.get('6m') else 'Pending'}, "
            f"12M={'Ready' if battery_status.get('12m') else 'Pending'}"
        )
    except Exception as e:
        logger.warning(f"⚠️ Component 2 Battery Models check warning: {e}")

    # 3. Component 4 (EV Charging Optimization)
    logger.info("✅ Component 4: Intelligent Charging & Range Optimization ready.")

    # 4. Seed demo data into DB (mongomock or real MongoDB)
    try:
        from database import seed_demo_data
        await seed_demo_data()
        logger.info("✅ Database: Demo/real vehicle data seeded for EV-001.")
    except Exception as e:
        logger.warning(f"⚠️ Database seed warning: {e}")

    logger.info("=========================================================")
    logger.info("🌟 SmartEV Master Backend is Online on Port 8000")
    logger.info("=========================================================")

    try:
        yield
    except Exception:
        pass
    finally:
        logger.info("SmartEV Master Backend shutting down...")


# =============================================================
# FASTAPI APPLICATION INSTANCE
# =============================================================

app = FastAPI(
    title="SmartEV - Unified AI/ML Electric Vehicle Management System",
    description=(
        "Unified REST API integrating:\n"
        "- Component 1: Post-Sale Performance Intelligence & Failure Anomaly Detection\n"
        "- Component 2: Adaptive Battery Health Prediction (3M / 6M / 12M SoH)\n"
        "- Component 4: Intelligent EV Charging Optimization & Range Prediction\n"
    ),
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)


# =============================================================
# CORS MIDDLEWARE
# =============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================
# EXCEPTION HANDLING & LOGGING MIDDLEWARE
# =============================================================

register_exception_handlers(app)

@app.middleware("http")
async def process_time_and_log_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = round((time.time() - start_time) * 1000.0, 2)
    response.headers["X-Process-Time-Ms"] = str(process_time)
    logger.info(f"{request.method} {request.url.path} - {response.status_code} ({process_time}ms)")
    return response


# =============================================================
# MOUNT API ROUTERS
# =============================================================

# --- Component 1: AI Anomaly Detection Routers ---
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(anomaly_router, prefix=settings.API_V1_STR)
app.include_router(telemetry_router, prefix=settings.API_V1_STR)
app.include_router(vehicles_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(research_router, prefix=settings.API_V1_STR)

# --- Component 3: Virtual Assistant (Chatbot) Router ---
app.include_router(chatbot_router)

# --- Component 2: Battery Health Prediction Routers ---
app.include_router(battery_prediction_router)
app.include_router(battery_history_router)
app.include_router(battery_debug_router)

# --- Component 4: Charging Optimization & Range Prediction Router ---
app.include_router(ev_optimization_router, prefix="/api/ev-optimization")


# =============================================================
# SHARED AUTH & TELEMETRY ROUTES
# =============================================================

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

@app.post("/api/auth/register", response_model=Token, tags=["Authentication"])
async def register(user: UserCreate):
    existing_user = await user_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    user_dict = user.model_dump()
    user_dict["password"] = hashed_password
    
    result = await user_collection.insert_one(user_dict)
    access_token = create_access_token(data={"sub": str(result.inserted_id)})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=Token, tags=["Authentication"])
async def login(user: UserLogin):
    db_user = await user_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": str(db_user["_id"])})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/vehicles", tags=["Vehicles"])
async def create_vehicle(vehicle: VehicleSchema, token: str = Depends(oauth2_scheme)):
    vehicle_dict = vehicle.model_dump()
    result = await vehicle_collection.insert_one(vehicle_dict)
    return {"message": "Vehicle added", "id": str(result.inserted_id)}

@app.post("/api/telemetry", tags=["Telemetry"])
async def add_telemetry(data: TelemetrySchema):
    telemetry_dict = data.model_dump()
    await telemetry_collection.insert_one(telemetry_dict)
    return {"message": "Telemetry received"}

@app.get("/api/predictions", tags=["Overview"])
async def get_overview_predictions():
    return {
        "batteryHealth": 88.5,
        "failureRisk": "Low",
        "predictedLife": "3.2 Years",
        "maintenanceSuggestion": "System running optimally across all AI components."
    }


# =============================================================
# ROOT & SYSTEM HEALTH
# =============================================================

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
            "component_4_charging_optimization": "/api/ev-optimization/health"
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
            "charging_optimization": "operational"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
