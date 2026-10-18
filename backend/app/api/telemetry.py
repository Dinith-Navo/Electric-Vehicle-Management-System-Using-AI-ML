import uuid
from fastapi import APIRouter, Query, HTTPException, status
from typing import Optional, List
from datetime import datetime
from app.schemas.telemetry import TelemetryInput
from app.schemas.anomaly import StandardApiResponse

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])

_telemetry_history_store: List[TelemetryInput] = []

@router.post("", response_model=StandardApiResponse)
async def store_telemetry(telemetry: TelemetryInput):
    request_id = f"req_{uuid.uuid4().hex[:8]}"
    _telemetry_history_store.append(telemetry)
    if len(_telemetry_history_store) > 1000:
        _telemetry_history_store.pop(0)
        
    return StandardApiResponse(
        success=True,
        data={"stored": True, "telemetryId": f"tel_{uuid.uuid4().hex[:8]}"},
        meta={"requestId": request_id}
    )

@router.get("/latest", response_model=StandardApiResponse)
async def get_latest_telemetry(vehicleId: str = Query("EV-001")):
    request_id = f"req_{uuid.uuid4().hex[:8]}"
    filtered = [t for t in _telemetry_history_store if t.vehicleId == vehicleId]
    if filtered:
        latest = filtered[-1]
    else:
        # Default baseline sample
        latest = TelemetryInput(
            vehicleId=vehicleId,
            batteryVoltage=350.5,
            batteryCurrent=42.0,
            batteryTemperature=34.0,
            motorTemperature=48.0,
            vehicleSpeed=55.0,
            acceleration=0.5,
            powerConsumption=14.7,
            soc=72.0,
            chargingStatus="NOT_CHARGING"
        )

    return StandardApiResponse(
        success=True,
        data=latest.model_dump(),
        meta={"requestId": request_id}
    )

@router.get("/history", response_model=StandardApiResponse)
async def get_telemetry_history(vehicleId: str = Query("EV-001"), limit: int = Query(50, ge=1, le=200)):
    request_id = f"req_{uuid.uuid4().hex[:8]}"
    filtered = [t.model_dump() for t in _telemetry_history_store if t.vehicleId == vehicleId]
    return StandardApiResponse(
        success=True,
        data=filtered[-limit:],
        meta={"requestId": request_id, "total": len(filtered)}
    )
