import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.schemas.telemetry import TelemetryInput
from app.schemas.anomaly import AnomalyResponse, StandardApiResponse
from app.services.anomaly_service import AnomalyService
from app.anomaly.genome_db import AnomalyGenomeDB

router = APIRouter(prefix="/anomaly", tags=["Anomaly Detection"])

class FingerprintMatchRequest(BaseModel):
    embeddingVector: List[float]
    topK: int = 3
    threshold: float = 0.45

@router.post("/detect", response_model=StandardApiResponse)
async def detect_anomaly(telemetry: TelemetryInput):
    request_id = f"req_{uuid.uuid4().hex[:8]}"
    anomaly_result = AnomalyService.analyze_telemetry(telemetry)
    return StandardApiResponse(
        success=True,
        data=anomaly_result.model_dump(),
        meta={"requestId": request_id}
    )

@router.get("/genome/strains", response_model=StandardApiResponse)
async def get_genome_strains():
    """Retrieve all cataloged Anomaly DNA strains from the Genome Database."""
    request_id = f"req_{uuid.uuid4().hex[:8]}"
    strains = AnomalyGenomeDB.get_instance().get_all_strains()
    return StandardApiResponse(
        success=True,
        data=strains,
        meta={"requestId": request_id, "total": len(strains)}
    )

@router.post("/genome/match", response_model=StandardApiResponse)
async def match_fingerprint(req: FingerprintMatchRequest):
    """Find historically similar anomaly DNA patterns using embedding cosine distance."""
    request_id = f"req_{uuid.uuid4().hex[:8]}"
    matches = AnomalyGenomeDB.get_instance().find_nearest_matches(
        req.embeddingVector, top_k=req.topK, threshold=req.threshold
    )
    return StandardApiResponse(
        success=True,
        data=matches,
        meta={"requestId": request_id, "total": len(matches)}
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

@router.get("/{anomaly_id}/causal-chain", response_model=StandardApiResponse)
async def get_anomaly_causal_chain(anomaly_id: str):
    request_id = f"req_{uuid.uuid4().hex[:8]}"
    result = AnomalyService.get_anomaly_by_id(anomaly_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ANOMALY_NOT_FOUND", "message": f"Anomaly record '{anomaly_id}' not found."}
        )
    return StandardApiResponse(
        success=True,
        data=result.causalChain,
        meta={"requestId": request_id}
    )
