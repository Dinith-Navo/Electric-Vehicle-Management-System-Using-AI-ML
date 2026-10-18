import numpy as np

class ScoreNormalizer:
    """
    Normalizes heterogeneous raw model outputs into a unified [0.0, 1.0] anomaly evidence scale.
    - 0.00 - 0.30 represents normal operational behavior.
    - 0.31 - 1.00 represents abnormal anomaly evidence.
    """

    @staticmethod
    def normalize_isolation_forest(raw_score: float, threshold: float = 0.0) -> float:
        """
        Isolation Forest decision function:
        Positive values (> 0.0) indicate normal data points.
        Negative values (< 0.0) indicate anomalies.
        """
        if raw_score >= threshold:
            # Normal: Map positive raw score to 0.00 - 0.20 evidence
            evidence = 0.20 / (1.0 + np.exp(10.0 * (raw_score - threshold)))
        else:
            # Anomaly: Map negative raw score smoothly from 0.30 to 1.00 evidence
            evidence = 0.30 + 0.70 * (1.0 - np.exp(-15.0 * (threshold - raw_score)))

        return float(np.clip(evidence, 0.0, 1.0))

    @staticmethod
    def normalize_one_class_svm(raw_score: float, threshold: float = 0.0) -> float:
        """
        One-Class SVM decision function:
        Positive values indicate inside boundary (Normal).
        Negative values indicate outside boundary (Anomaly).
        """
        if raw_score >= threshold:
            evidence = 0.20 / (1.0 + np.exp(8.0 * (raw_score - threshold)))
        else:
            evidence = 0.30 + 0.70 * (1.0 - np.exp(-12.0 * (threshold - raw_score)))

        return float(np.clip(evidence, 0.0, 1.0))

    @staticmethod
    def normalize_autoencoder(reconstruction_error: float, threshold: float = 0.05) -> float:
        """
        Autoencoder raw output is Mean Squared Error (>= 0.0).
        Error below threshold maps to low evidence [0.0, 0.20].
        Error above threshold scales smoothly from 0.30 to 1.00.
        """
        if reconstruction_error <= threshold:
            evidence = 0.20 * (reconstruction_error / (threshold + 1e-6))
        else:
            ratio = reconstruction_error / threshold
            evidence = 0.30 + 0.70 * (1.0 - np.exp(-0.8 * (ratio - 1.0)))

        return float(np.clip(evidence, 0.0, 1.0))
