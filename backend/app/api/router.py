import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.config import settings
from app.core.database import user_collection, vehicle_collection, telemetry_collection
from app.shared.schemas.models import (
    UserCreate,
    UserLogin,
    Token,
    RefreshTokenRequest,
    UserResponse,
    VehicleSchema,
    TelemetrySchema,
)

# Robust authentication with disk persistence fallback
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    persist_revoked_token,
    get_current_user,
    get_optional_current_user,
    security,
    _MEMORY_USERS,
)
from persistence import persist_user

# Four modular component routers
from app.modules.anomaly_detection.routes import router as anomaly_router
from app.modules.battery_health.routes import router as battery_health_router
from app.ev_optimization.ev_optimization_routes import ev_optimization_router
from app.api.virtual_assistant import router as virtual_assistant_router

api_router = APIRouter()

# -------------------------------------------------------------
# Component 1: Anomaly Detection (/api/v1) - PUBLIC
# -------------------------------------------------------------
api_router.include_router(anomaly_router, prefix=settings.API_V1_STR)

# -------------------------------------------------------------
# Component 2: Battery Health Prediction (/api/battery & /predict) - PUBLIC
# -------------------------------------------------------------
api_router.include_router(battery_health_router)

# -------------------------------------------------------------
# Component 3 & 4: Intelligent Services & Charging/Queue Optimization (/api/ev-optimization & /api/optimization)
# -------------------------------------------------------------
api_router.include_router(ev_optimization_router, prefix="/api/ev-optimization")
api_router.include_router(ev_optimization_router, prefix="/api/optimization")

# -------------------------------------------------------------
# Virtual Assistant (/api/v1/assistant) - PUBLIC
# -------------------------------------------------------------
api_router.include_router(virtual_assistant_router, prefix=settings.API_V1_STR)

# -------------------------------------------------------------
# Shared Authentication & Vehicle Telemetry APIs
# -------------------------------------------------------------
@api_router.post("/api/auth/register", response_model=Token, tags=["Authentication"])
async def register(user: UserCreate):
    existing_user = None
    try:
        existing_user = await user_collection.find_one({"email": user.email})
    except Exception:
        pass

    if not existing_user:
        for u in _MEMORY_USERS.values():
            if u.get("email") == user.email:
                existing_user = u
                break

    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    if len(user.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")

    hashed_password = get_password_hash(user.password)
    user_dict = user.model_dump()
    user_dict["password"] = hashed_password
    user_dict["role"] = user.role or "customer"

    user_id = None
    try:
        result = await user_collection.insert_one(user_dict)
        user_id = str(result.inserted_id)
        user_dict["id"] = user_id
    except Exception:
        user_id = str(uuid.uuid4())
        user_dict["id"] = user_id
        user_dict["_id"] = user_id

    _MEMORY_USERS[user_id] = user_dict
    persist_user(user_id, user_dict)

    token_data = {
        "sub": user_id,
        "email": user.email,
        "role": user_dict["role"],
        "name": user.name,
    }
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    user_resp = UserResponse(
        id=user_id,
        name=user.name,
        email=user.email,
        role=user_dict["role"],
    )

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        role=user_dict["role"],
        user=user_resp,
    )


@api_router.post("/api/auth/login", response_model=Token, tags=["Authentication"])
async def login(user: UserLogin):
    db_user = None
    try:
        db_user = await user_collection.find_one({"email": user.email})
        if db_user:
            db_user["id"] = str(db_user.get("_id", ""))
    except Exception:
        pass

    if not db_user:
        for u in _MEMORY_USERS.values():
            if u.get("email") == user.email:
                db_user = u
                break

    if not db_user or not verify_password(user.password, db_user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_id = str(db_user.get("id") or db_user.get("_id", ""))
    role = db_user.get("role", "customer")
    name = db_user.get("name", "User")

    token_data = {
        "sub": user_id,
        "email": db_user.get("email"),
        "role": role,
        "name": name,
    }
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    user_resp = UserResponse(
        id=user_id,
        name=name,
        email=db_user.get("email"),
        role=role,
    )

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        role=role,
        user=user_resp,
    )


@api_router.post("/api/auth/refresh", response_model=Token, tags=["Authentication"])
async def refresh_access_token(req: RefreshTokenRequest):
    payload = decode_refresh_token(req.refresh_token)
    user_id = payload.get("sub")
    email = payload.get("email")
    role = payload.get("role", "customer")
    name = payload.get("name", "User")

    token_data = {"sub": user_id, "email": email, "role": role, "name": name}
    new_access_token = create_access_token(data=token_data)
    new_refresh_token = create_refresh_token(data=token_data)

    await persist_revoked_token(req.refresh_token)

    return Token(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        role=role,
        user=UserResponse(id=user_id, name=name, email=email, role=role),
    )


@api_router.post("/api/auth/logout", tags=["Authentication"])
async def logout(credentials=Depends(security)):
    if credentials and credentials.credentials:
        await persist_revoked_token(credentials.credentials)
    return {"message": "Logged out successfully. Token revoked."}


@api_router.get("/api/auth/me", response_model=UserResponse, tags=["Authentication"])
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.get("id") or current_user.get("_id", "")),
        name=current_user.get("name", "User"),
        email=current_user.get("email", ""),
        role=current_user.get("role", "customer"),
    )


@api_router.post("/api/vehicles", tags=["Vehicles"])
async def create_vehicle(vehicle: VehicleSchema, current_user: dict = Depends(get_current_user)):
    vehicle_dict = vehicle.model_dump()
    vehicle_dict["userId"] = current_user.get("id") or str(current_user.get("_id", ""))
    result = await vehicle_collection.insert_one(vehicle_dict)
    return {"message": "Vehicle created successfully", "id": str(result.inserted_id)}


@api_router.post("/api/telemetry", tags=["Telemetry"])
async def add_telemetry(data: TelemetrySchema):
    telemetry_dict = data.model_dump()
    await telemetry_collection.insert_one(telemetry_dict)
    return {"message": "Telemetry received"}


@api_router.get("/api/predictions", tags=["Overview"])
async def get_overview_predictions():
    return {
        "batteryHealth": 88.5,
        "failureRisk": "Low",
        "predictedLife": "3.2 Years",
        "maintenanceSuggestion": "System running optimally across all AI components.",
    }
