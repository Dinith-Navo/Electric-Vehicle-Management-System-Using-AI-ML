from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "customer"

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str

class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    role: Optional[str] = None
    user: Optional[UserResponse] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class OwnerRegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class OwnerLoginRequest(BaseModel):
    email: str
    password: str

class VehicleSchema(BaseModel):
    id: Optional[str] = None
    userId: Optional[str] = None
    model: str
    manufacturer: str
    batteryType: str
    batteryCapacityKWh: Optional[float] = 64.0
    year: int
    vin: str

class TelemetrySchema(BaseModel):
    vehicleId: Optional[str] = "default-vehicle"
    soc: float
    soh: float
    voltage: float
    current: float
    temperature: float
    drivingEfficiency: float
    speed: Optional[float] = 60.0
    timestamp: Optional[str] = None
