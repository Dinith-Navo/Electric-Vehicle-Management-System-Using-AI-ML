from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class VehicleSchema(BaseModel):
    model: str
    manufacturer: str
    batteryType: str
    year: int
    vin: str

class TelemetrySchema(BaseModel):
    soc: float
    soh: float
    voltage: float
    current: float
    temperature: float
    drivingEfficiency: float
