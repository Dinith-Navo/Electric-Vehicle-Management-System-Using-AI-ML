import uuid
from fastapi import APIRouter
from app.schemas.anomaly import StandardApiResponse

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=StandardApiResponse)
async def health_check():
    request_id = f"req_{uuid.uuid4().hex[:8]}"
    return StandardApiResponse(
        success=True,
        data={
            "status": "ONLINE",
            "service": "AI-Based EV Operational Anomaly Detection System (AIEVADS)",
            "version": "1.0.0",
            "environment": "development"
        },
        meta={"requestId": request_id}
    )
