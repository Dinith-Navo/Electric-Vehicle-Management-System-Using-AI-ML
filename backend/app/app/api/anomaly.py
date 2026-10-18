import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Optional, List
from app.schemas.telemetry import TelemetryInput
from app.schemas.anomaly import AnomalyResponse, StandardApiResponse
from app.services.anomaly_service import AnomalyService

router = APIRouter(prefix="/anomaly", tags=["Anomaly Detection"])

@router.post("/detect", response_model=StandardApiResponse)
@router.post("/predict", response_model=StandardApiResponse)
async def detect_anomaly(telemetry: TelemetryInput):
    request_id = f"req_{uuid.uuid4().hex[:8]}"
    anomaly_result = AnomalyService.analyze_telemetry(telemetry)
    return StandardApiResponse(
        success=True,
        data=anomaly_result.model_dump(),
        meta={"requestId": request_id}
    )

@router.get("/list", response_model=StandardApiResponse)
async def list_anomalies(vehicleId: Optional[str] = None, limit: int = Query(50, ge=1, le=200)):
    request_id = f"req_{uuid.uuid4().hex[:8]}"
    results = AnomalyService.list_anomalies(vehicle_id=vehicleId, limit=limit)
    return StandardApiResponse(
        success=True,
        data=[r.model_dump() for r in results],
        meta={"requestId": request_id, "total": len(results)}
    )

@router.get("/{anomaly_id}", response_model=StandardApiResponse)
async def get_anomaly(anomaly_id: str):
    request_id = f"req_{uuid.uuid4().hex[:8]}"
    result = AnomalyService.get_anomaly_by_id(anomaly_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ANOMALY_NOT_FOUND", "message": f"Anomaly record '{anomaly_id}' not found."}
        )
    return StandardApiResponse(
        success=True,
        data=result.model_dump(),
        meta={"requestId": request_id}
    )
