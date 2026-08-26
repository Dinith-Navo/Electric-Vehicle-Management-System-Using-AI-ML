from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class RangePredictionRequest(BaseModel):
    soc: float = Field(..., ge=0.0, le=100.0, description="Battery State of Charge (0-100%)", example=75.0)
    batteryCapacityKWh: float = Field(default=60.0, gt=0, description="Battery capacity in kWh", example=60.0)
    speedKmH: float = Field(default=60.0, ge=0, description="Average current vehicle speed in km/h", example=55.0)
    temperatureC: float = Field(default=25.0, description="Ambient temperature in Celsius", example=28.0)
    energyConsumptionKWhPer100Km: Optional[float] = Field(default=15.0, gt=0, description="Average consumption kWh/100km", example=14.8)
    acOn: Optional[bool] = Field(default=False, description="Whether AC / climate control is active", example=True)
    drivingMode: Optional[str] = Field(default="Normal", description="Eco, Normal, or Sport", example="Normal")
    vehicleModel: Optional[str] = Field(default="Standard EV", description="Model of the vehicle", example="Nissan Leaf / Tesla Model 3")

class RangePredictionData(BaseModel):
    remainingRangeKm: float = Field(..., description="Estimated driving range left in km")
    confidenceScore: float = Field(..., description="Confidence score of prediction (0.0 to 1.0)")
    source: str = Field(..., description="'trained-model' or 'mock'")
    modelName: str = Field(..., description="Name of the model or fallback rule used")
    factors: Dict[str, Any] = Field(default_factory=dict, description="Factor breakdown influencing prediction")
    timestamp: str = Field(..., description="Timestamp of inference")

class RangePredictionResponse(BaseModel):
    success: bool
    data: RangePredictionData
    message: str
