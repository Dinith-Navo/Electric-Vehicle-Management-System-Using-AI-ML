from app.schemas.anomaly import SeverityLevel
from app.core.config import settings

class SeverityEngine:
    """
    Evaluates severity deterministically based on anomaly score, confidence,
    temporal persistence, and evidence strength.
    """

    @staticmethod
    def calculate(
        anomaly_score: float,
        confidence: float,
        consecutive_count: int
    ) -> SeverityLevel:
        if anomaly_score <= settings.THRESHOLD_NORMAL_MAX:
            return SeverityLevel.NONE

        if anomaly_score <= settings.THRESHOLD_LOW_MAX:
            return SeverityLevel.LOW

        if anomaly_score <= settings.THRESHOLD_MEDIUM_MAX:
            if consecutive_count >= 2 and confidence >= 0.50:
                return SeverityLevel.MEDIUM
            return SeverityLevel.LOW

        if anomaly_score <= settings.THRESHOLD_HIGH_MAX:
            if consecutive_count >= 3 and confidence >= 0.60:
                return SeverityLevel.HIGH
            return SeverityLevel.MEDIUM

        # Anomaly score > 0.85 (CRITICAL range)
        if consecutive_count >= 2 and confidence >= 0.70:
            return SeverityLevel.CRITICAL
        return SeverityLevel.HIGH
