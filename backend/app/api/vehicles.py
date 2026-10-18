import uuid
from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from app.schemas.anomaly import StandardApiResponse

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

_vehicles_db: Dict[str, Dict[str, Any]] = {
    "EV-001": {
        "vehicleId": "EV-001",
        "ownerId": "user_demo",
        "vehicleName": "Model E Performance",
        "manufacturer": "Apex Motors",
        "model": "E-GT",
        "year": 2026,
        "status": "ACTIVE",
        "createdAt": "2026-08-28T10:00:00Z"
    },
    "EV-002": {
        "vehicleId": "EV-002",
        "ownerId": "user_demo",
        "vehicleName": "Cyber Hauler",
        "manufacturer": "Vanguard EV",
        "model": "V-Truck",
        "year": 2025,
        "status": "ACTIVE",
        "createdAt": "2026-08-28T11:00:00Z"
    }
}

@router.get("", response_model=StandardApiResponse)
async def list_vehicles():
    request_id = f"req_{uuid.uuid4().hex[:8]}"
    return StandardApiResponse(
        success=True,
        data=list(_vehicles_db.values()),
        meta={"requestId": request_id}
    )

@router.get("/{vehicle_id}", response_model=StandardApiResponse)
async def get_vehicle(vehicle_id: str):
    request_id = f"req_{uuid.uuid4().hex[:8]}"
    if vehicle_id not in _vehicles_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "VEHICLE_NOT_FOUND", "message": f"Vehicle '{vehicle_id}' not found."}
        )
    return StandardApiResponse(
        success=True,
        data=_vehicles_db[vehicle_id],
        meta={"requestId": request_id}
    )
