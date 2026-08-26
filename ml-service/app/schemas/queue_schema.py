from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class QueuePredictionRequest(BaseModel):
    stationId: str = Field(..., description="ID or identifier of the charging station", example="station_01")
    totalChargers: int = Field(default=6, gt=0, description="Total physical charging ports", example=6)
    currentlyOccupied: Optional[int] = Field(default=3, ge=0, description="Currently occupied chargers", example=3)
    arrivalHour: Optional[int] = Field(default=14, ge=0, le=23, description="Hour of arrival (0-23)", example=17)
    dayOfWeek: Optional[int] = Field(default=2, ge=0, le=6, description="Day of week (0=Mon, 6=Sun)", example=4)
    chargingSpeedKw: Optional[float] = Field(default=50.0, gt=0, description="Average charger kW", example=50.0)
    avgSessionMinutes: Optional[float] = Field(default=35.0, gt=0, description="Historical avg session duration", example=35.0)

class QueuePredictionData(BaseModel):
    stationId: str
    predictedQueueLength: int = Field(..., description="Predicted number of vehicles waiting in queue")
    estimatedWaitMinutes: int = Field(..., description="Estimated wait time in minutes before charging starts")
    availableChargersNow: int = Field(..., description="Available stalls right now")
    congestionLevel: str = Field(..., description="'Low', 'Moderate', 'High', or 'Critical'")
    source: str = Field(..., description="'trained-model' or 'mock'")
    modelName: str = Field(..., description="Name of the model used")
    hourlyForecast: List[Dict[str, Any]] = Field(default_factory=list, description="Next 6 hours queue forecast")
    timestamp: str = Field(..., description="Timestamp of inference")

class QueuePredictionResponse(BaseModel):
    success: bool
    data: QueuePredictionData
    message: str
