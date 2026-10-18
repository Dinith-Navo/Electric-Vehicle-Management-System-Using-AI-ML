"""
Predictive Horizon & Severity Trajectory Engine

Calculates:
1. Time-to-Failure Horizon:
   - When anomalous/escalating: Dynamic countdown until critical failure/shutdown (e.g., "05:40", "01:15")
   - When nominal/normal: Continuous Mean Time Between Failures / Safe Operational Horizon (e.g., "> 14h 30m")
2. Severity Decay Curve: Models whether the anomaly is self-healing, stabilizing, or escalating
   across a future time horizon (T+30s, T+60s, T+120s, T+300s).
"""
import numpy as np
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from collections import deque


@dataclass
class TrajectoryPoint:
    timeOffsetSeconds: int
    predictedScore: float
    predictedSeverity: str
    confidenceLower: float
    confidenceUpper: float


@dataclass
class PredictiveHorizonResult:
    estimatedTimeToFailureSeconds: int             # Seconds to critical, or safe horizon seconds
    countdownFormatted: str                        # e.g., "05:40" (critical) or "> 14h 30m" (safe)
    urgencyLevel: str                              # "CRITICAL_IMMINENT" | "ELEVATED_RISK" | "MONITORING" | "NOMINAL_SAFE"
    triggerParameter: str
    currentGradientPerSecond: float
    criticalThreshold: float
    projectedEscalation: bool                      # True if getting worse
    severityTrajectory: List[Dict[str, Any]]       # [T+0, T+30, T+60, T+120, T+300]


class PredictiveHorizonEngine:
    """
    Analyzes telemetry score rate-of-change (gradient) and projects
    dynamic failure countdowns and future severity trajectories.
    """
    _score_history: Dict[str, deque] = {}  # vehicleId -> deque of (timestamp, score)

    SEVERITY_THRESHOLDS = {
        0.85: "CRITICAL",
        0.65: "HIGH",
        0.45: "MEDIUM",
        0.25: "LOW",
        0.00: "NONE"
    }

    @classmethod
    def _score_to_severity(cls, score: float) -> str:
        for threshold, level in cls.SEVERITY_THRESHOLDS.items():
            if score >= threshold:
                return level
        return "NONE"

    @classmethod
    def calculate_horizon(
        cls,
        vehicle_id: str,
        current_score: float,
        dominant_parameter: str,
        affected_count: int,
        soc: float = 75.0,
        power_kw: float = 15.0
    ) -> PredictiveHorizonResult:
        """Computes predictive horizon and forward trajectory."""
        if vehicle_id not in cls._score_history:
            cls._score_history[vehicle_id] = deque(maxlen=20)

        history = cls._score_history[vehicle_id]
        history.append(current_score)

        # Compute gradient (change per step)
        if len(history) >= 3:
            recent = list(history)[-5:]
            diffs = [recent[i] - recent[i-1] for i in range(1, len(recent))]
            gradient = float(np.mean(diffs))
        else:
            # Baseline gradient depending on score
            gradient = 0.015 if current_score > 0.6 else (-0.005 if current_score < 0.3 else 0.002)

        CRITICAL_SCORE_LIMIT = 0.92
        projected_escalation = gradient > 0.001

        # Calculate time-to-failure or safe endurance window
        if current_score >= 0.70:
            # Imminent breakdown
            time_to_failure = max(15, int(45 * (1.0 - (current_score - 0.70) / 0.30)))
            urgency = "CRITICAL_IMMINENT"
            projected_escalation = True
            mins = time_to_failure // 60
            secs = time_to_failure % 60
            countdown_str = f"{mins:02d}:{secs:02d}"
        elif current_score >= 0.38 and gradient > 0:
            remaining_score = max(0.01, CRITICAL_SCORE_LIMIT - current_score)
            steps_remaining = remaining_score / max(gradient, 0.0015)
            seconds_remaining = int(steps_remaining * 1.5)
            time_to_failure = max(25, min(720, seconds_remaining))

            if time_to_failure < 90:
                urgency = "CRITICAL_IMMINENT"
            elif time_to_failure < 240:
                urgency = "ELEVATED_RISK"
            else:
                urgency = "MONITORING"

            mins = time_to_failure // 60
            secs = time_to_failure % 60
            countdown_str = f"{mins:02d}:{secs:02d}"
        elif current_score >= 0.38:
            # Elevated but stabilizing / decaying
            time_to_failure = 900  # 15 minutes to stabilization
            urgency = "MONITORING"
            countdown_str = "15:00"
        else:
            # Nominal normal state: compute real-time physics-based mission endurance window
            pack_capacity_kwh = 65.0
            remaining_energy = (max(5.0, min(100.0, soc)) / 100.0) * pack_capacity_kwh
            effective_power = max(1.8, abs(power_kw))
            calc_hours = remaining_energy / effective_power
            safe_hours = round(float(np.clip(calc_hours, 3.5, 24.0)), 1)
            time_to_failure = int(safe_hours * 3600)
            urgency = "NOMINAL_SAFE"
            h = int(safe_hours)
            m = int((safe_hours - h) * 60)
            countdown_str = f"> {h}h {m:02d}m"
            dominant_parameter = "NOMINAL_ALL_SYSTEMS"

        # Generate severity trajectory points [T+0, T+30, T+60, T+120, T+300]
        offsets = [0, 30, 60, 120, 300]
        trajectory = []

        for offset in offsets:
            if offset == 0:
                proj_score = current_score
            else:
                if projected_escalation:
                    # Escalating logarithmically toward 1.0
                    proj_score = min(1.0, current_score + (1.0 - current_score) * (1 - np.exp(-offset / 100.0)))
                else:
                    # Decaying exponentially toward baseline 0.12
                    proj_score = max(0.08, current_score * np.exp(-offset / 80.0))

            proj_score = round(float(proj_score), 3)
            trajectory.append(asdict(TrajectoryPoint(
                timeOffsetSeconds=offset,
                predictedScore=proj_score,
                predictedSeverity=cls._score_to_severity(proj_score),
                confidenceLower=round(max(0.0, proj_score - 0.08), 3),
                confidenceUpper=round(min(1.0, proj_score + 0.08), 3)
            )))

        return PredictiveHorizonResult(
            estimatedTimeToFailureSeconds=time_to_failure,
            countdownFormatted=countdown_str,
            urgencyLevel=urgency,
            triggerParameter=dominant_parameter,
            currentGradientPerSecond=round(gradient, 4),
            criticalThreshold=CRITICAL_SCORE_LIMIT,
            projectedEscalation=projected_escalation,
            severityTrajectory=trajectory
        )
