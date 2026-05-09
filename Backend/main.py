from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
import uvicorn

from models import UserCreate, UserLogin, Token, VehicleSchema, TelemetrySchema
from database import user_collection, vehicle_collection, telemetry_collection
from auth import get_password_hash, verify_password, create_access_token

app = FastAPI(title="PSEVPIFPS Full Python Backend")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# --- AUTH ROUTES ---
@app.post("/api/auth/register", response_model=Token)
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

@app.post("/api/auth/login", response_model=Token)
async def login(user: UserLogin):
    db_user = await user_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": str(db_user["_id"])})
    return {"access_token": access_token, "token_type": "bearer"}

# --- VEHICLE ROUTES ---
@app.post("/api/vehicles")
async def create_vehicle(vehicle: VehicleSchema, token: str = Depends(oauth2_scheme)):
    # Simple token dependency check
    vehicle_dict = vehicle.model_dump()
    result = await vehicle_collection.insert_one(vehicle_dict)
    return {"message": "Vehicle added", "id": str(result.inserted_id)}

# --- TELEMETRY & ML ROUTES ---
@app.post("/api/telemetry")
async def add_telemetry(data: TelemetrySchema):
    telemetry_dict = data.model_dump()
    await telemetry_collection.insert_one(telemetry_dict)
    return {"message": "Telemetry received"}

@app.get("/api/predictions")
async def get_predictions():
    # Mock AI output for React Native/Web dashboard
    return {
        "batteryHealth": 88.5,
        "failureRisk": "Low",
        "predictedLife": "3.2 Years",
        "maintenanceSuggestion": "System running optimally."
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
