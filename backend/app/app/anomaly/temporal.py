from typing import List, Dict, Any, Tuple

# Vehicle-id mapped in-memory temporal state buffers
_vehicle_temporal_buffers: Dict[str, List[Dict[str, Any]]] = {}

class TemporalAnalyzer:
    """
    Maintains a rolling window of recent operational evaluations per vehicle to analyze
    temporal persistence, consecutive anomalies, and trend direction.
    """

    @staticmethod
    def process_sample(
        vehicle_id: str,
        current_score: float,
        is_abnormal_sample: bool,
        window_size: int = 10
    ) -> Tuple[int, float, str, bool]:
        """
        Returns:
          consecutive_count: int
          persistence_duration_seconds: float
          trend: str ("STABLE" | "INCREASING" | "DECREASING" | "TRANSIENT")
          is_persistent: bool
        """
        if vehicle_id not in _vehicle_temporal_buffers:
            _vehicle_temporal_buffers[vehicle_id] = []

        buf = _vehicle_temporal_buffers[vehicle_id]
        buf.append({"score": current_score, "abnormal": is_abnormal_sample})

        if len(buf) > window_size:
            buf.pop(0)

        # Count consecutive abnormal samples looking back from most recent
        consecutive_count = 0
        for item in reversed(buf):
            if item["abnormal"]:
                consecutive_count += 1
            else:
                break

        # Estimated persistence duration (assuming ~5 sec telemetry interval)
        persistence_duration_seconds = consecutive_count * 5.0

        # Evaluate trend slope across window
        if len(buf) >= 3:
            recent_scores = [item["score"] for item in buf[-3:]]
            if recent_scores[-1] - recent_scores[0] > 0.15:
                trend = "INCREASING"
            elif recent_scores[0] - recent_scores[-1] > 0.15:
                trend = "DECREASING"
            else:
                trend = "STABLE"
        else:
            trend = "STABLE"

        is_persistent = consecutive_count >= 3

        return consecutive_count, persistence_duration_seconds, trend, is_persistent
