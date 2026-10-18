import numpy as np
from sklearn.covariance import MinCovDet
from typing import Tuple

class MahalanobisModel:
    """
    Model 4: Robust Covariance & Mahalanobis Distance Anomaly Detector.
    Evaluates multivariate distance accounting for inter-parameter covariance.
    """
    def __init__(self, contamination: float = 0.05):
        self.model = MinCovDet(random_state=42)
        self.is_fitted = False
        self.threshold = 15.0  # Dynamic Chi-Square threshold

    def fit(self, X: np.ndarray):
        """Fit Minimum Covariance Determinant estimator on normal feature matrix X."""
        self.model.fit(X)
        distances = self.model.mahalanobis(X)
        self.threshold = float(np.percentile(distances, 95)) * 1.2
        self.is_fitted = True

    def predict(self, x: np.ndarray) -> Tuple[float, int]:
        """
        Returns:
          raw_score: Mahalanobis distance value
          prediction: 1 for normal, -1 for anomaly
        """
        if not self.is_fitted:
            raise RuntimeError("Mahalanobis model is not trained.")

        if x.ndim == 1:
            x_2d = x.reshape(1, -1)
        else:
            x_2d = x

        distance = float(self.model.mahalanobis(x_2d)[0])
        pred = -1 if distance > self.threshold else 1
        return distance, pred
