class ConfidenceEngine:
    """
    Evaluates system AI Confidence score (0.0 to 1.0) independently from anomaly score.
    Combines:
    - Model Agreement Ratio (35%)
    - Data Quality Score (25%)
    - Temporal Consistency & Persistence (25%)
    - Evidence Strength (15%)
    """

    @staticmethod
    def calculate(
        model_agreement_ratio: float,
        data_quality_score: float,
        consecutive_abnormal_count: int,
        ensemble_score: float
    ) -> float:
        # 1. Model Agreement Factor (35%)
        f_agreement = model_agreement_ratio * 0.35

        # 2. Data Quality Factor (25%)
        f_quality = data_quality_score * 0.25

        # 3. Temporal Factor (25%)
        # Higher confidence when pattern persists beyond transient noise
        if consecutive_abnormal_count >= 4:
            f_temporal = 0.25
        elif consecutive_abnormal_count == 3:
            f_temporal = 0.20
        elif consecutive_abnormal_count == 2:
            f_temporal = 0.15
        elif consecutive_abnormal_count == 1:
            f_temporal = 0.10
        else: # 0 consecutive (Normal)
            f_temporal = 0.22  # High confidence in normal state

        # 4. Evidence Strength (15%)
        # Extreme anomaly scores (close to 1.0) or very clear normal scores (close to 0.0) produce high evidence strength
        evidence_clarity = abs(ensemble_score - 0.40) * 2.0  # High clarity at boundaries
        f_evidence = float(min(1.0, max(0.0, evidence_clarity))) * 0.15

        total_confidence = f_agreement + f_quality + f_temporal + f_evidence
        return round(float(min(1.0, max(0.0, total_confidence))), 2)
