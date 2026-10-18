import numpy as np
from sklearn.svm import OneClassSVM
from typing import Tuple

class OneClassSVMModel:
    def __init__(self, kernel: str = 'rbf', gamma: str = 'scale', nu: float = 0.05):
        self.model = OneClassSVM(
            kernel=kernel,
            gamma=gamma,
            nu=nu
        )
        self.is_fitted = False

    def fit(self, X: np.ndarray):
        """Fit One-Class SVM on normal feature matrix X."""
        self.model.fit(X)
        self.is_fitted = True

    def predict(self, x: np.ndarray) -> Tuple[float, int]:
        """
        Returns:
          raw_score: Decision function distance to hyperplane (negative = anomaly)
          prediction: 1 for normal, -1 for anomaly
        """
        if not self.is_fitted:
            raise RuntimeError("One-Class SVM model is not trained.")

        if x.ndim == 1:
            x_arr = x.reshape(1, -1)
        else:
            x_arr = x

        n_features = getattr(self.model, "n_features_in_", 7)
        if x_arr.shape[1] > n_features:
            x_input = x_arr[:, :n_features]
        elif x_arr.shape[1] < n_features:
            pad = np.zeros((x_arr.shape[0], n_features - x_arr.shape[1]), dtype=np.float32)
            x_input = np.hstack([x_arr, pad])
        else:
            x_input = x_arr

        raw_score = float(self.model.decision_function(x_input)[0])
        pred = int(self.model.predict(x_input)[0])
        return raw_score, pred
