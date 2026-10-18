from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
from enum import Enum

class ChargingStatus(str, Enum):
    NOT_CHARGING = "NOT_CHARGING"
    CHARGING = "CHARGING"
    FAST_CHARGING = "FAST_CHARGING"
    DISCHARGING = "DISCHARGING"
    REGENERATIVE_BRAKING = "REGENERATIVE_BRAKING"

class TelemetryInput(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "vehicleId": "EV-001",
                "batteryVoltage": 350.0,
                "batteryCurrent": 80.0,
                "batteryTemperature": 42.0,
                "motorTemperature": 75.0,
                "vehicleSpeed": 65.0,
                "acceleration": 2.5,
                "powerConsumption": 18.0,
                "soc": 68.0,
                "chargingStatus": "NOT_CHARGING"
            }
        }
    )

    vehicleId: str = Field(..., description="Unique vehicle identifier")
    batteryVoltage: float = Field(..., description="Battery voltage in Volts", ge=0.0, le=800.0)
    batteryCurrent: float = Field(..., description="Battery current in Amperes", ge=-500.0, le=500.0)
    batteryTemperature: float = Field(..., description="Battery temperature in Celsius", ge=-30.0, le=100.0)
    motorTemperature: float = Field(..., description="Motor temperature in Celsius", ge=-30.0, le=150.0)
    vehicleSpeed: float = Field(..., description="Vehicle speed in km/h", ge=0.0, le=300.0)
    acceleration: float = Field(..., description="Acceleration in m/s^2", ge=-15.0, le=15.0)
    powerConsumption: float = Field(..., description="Power consumption in kW", ge=-100.0, le=300.0)
    soc: float = Field(..., description="State of Charge percentage", ge=0.0, le=100.0)
    chargingStatus: ChargingStatus = Field(default=ChargingStatus.NOT_CHARGING)
    timestamp: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))

class TelemetryBatchRequest(BaseModel):
    vehicleId: str
    readings: list[TelemetryInput]
