from fastapi import HTTPException, status

class InsufficientDataQualityException(HTTPException):
    def __init__(self, data_quality_score: float, details: str = "Data quality score below acceptable operational threshold."):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "INSUFFICIENT_DATA_QUALITY",
                "message": details,
                "dataQualityScore": data_quality_score
            }
        )

class AIAnalysisUnavailableException(HTTPException):
    def __init__(self, details: str = "The AI anomaly detection service is temporarily unavailable."):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "AI_ANALYSIS_UNAVAILABLE",
                "message": details
            }
        )

class VehicleNotFoundException(HTTPException):
    def __init__(self, vehicle_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "VEHICLE_NOT_FOUND",
                "message": f"Vehicle with ID '{vehicle_id}' was not found."
            }
        )
