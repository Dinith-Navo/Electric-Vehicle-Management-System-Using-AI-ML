import uuid
from fastapi import APIRouter
from app.schemas.anomaly import StandardApiResponse
from app.services.anomaly_service import AnomalyService

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/summary", response_model=StandardApiResponse)
async def get_analytics_summary(vehicleId: str = "EV-001"):
    request_id = f"req_{uuid.uuid4().hex[:8]}"
    all_anomalies = AnomalyService.list_anomalies(vehicle_id=vehicleId, limit=200)

    total_analyses = len(all_anomalies)
    normal_count = sum(1 for a in all_anomalies if a.operatingStatus == "NORMAL")
    abnormal_count = total_analyses - normal_count

    severity_counts = {
        "NONE": sum(1 for a in all_anomalies if a.severity == "NONE"),
        "LOW": sum(1 for a in all_anomalies if a.severity == "LOW"),
        "MEDIUM": sum(1 for a in all_anomalies if a.severity == "MEDIUM"),
        "HIGH": sum(1 for a in all_anomalies if a.severity == "HIGH"),
        "CRITICAL": sum(1 for a in all_anomalies if a.severity == "CRITICAL")
    }

    avg_score = round(sum(a.anomalyScore for a in all_anomalies) / max(1, total_analyses), 3)
    avg_confidence = round(sum(a.confidence for a in all_anomalies) / max(1, total_analyses), 3)

    return StandardApiResponse(
        success=True,
        data={
            "totalAnalyses": total_analyses,
            "normalEvents": normal_count,
            "detectedAnomalies": abnormal_count,
            "averageAnomalyScore": avg_score,
            "averageConfidence": avg_confidence,
            "severityDistribution": severity_counts,
            "mostFrequentCategory": "MOTOR_THERMAL" if abnormal_count > 0 else "NONE",
            "mostAffectedParameter": "motorTemperature" if abnormal_count > 0 else "NONE"
        },
        meta={"requestId": request_id}
    )

@router.get("/trends", response_model=StandardApiResponse)
async def get_analytics_trends(vehicleId: str = "EV-001"):
    request_id = f"req_{uuid.uuid4().hex[:8]}"
    all_anomalies = AnomalyService.list_anomalies(vehicle_id=vehicleId, limit=30)
    
    score_trend = [{"timestamp": a.timestamp.isoformat(), "score": a.anomalyScore, "confidence": a.confidence} for a in reversed(all_anomalies)]

    return StandardApiResponse(
        success=True,
        data={
            "scoreTrends": score_trend
        },
        meta={"requestId": request_id}
    )
