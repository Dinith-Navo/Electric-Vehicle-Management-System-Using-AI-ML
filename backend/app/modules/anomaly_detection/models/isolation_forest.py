import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from typing import Tuple, Dict, Any, Optional

class IsolationForestModel:
    def __init__(self, n_estimators: int = 800, contamination: float = 0.05, random_state: int = 42):
        self.model = IsolationForest(
            n_estimators=n_estimators,
            contamination=contamination,
            random_state=random_state,
            n_jobs=-1
        )
        self.is_fitted = False
        self.threshold = 0.0

    def fit(self, X: np.ndarray):
        """Fit Isolation Forest on normal feature matrix X."""
        self.model.fit(X)
        self.is_fitted = True
        self.threshold = 0.0

    def predict(self, x: np.ndarray, raw_telemetry: Optional[Dict[str, Any]] = None) -> Tuple[float, int]:
        """
        Evaluates input using user NEV Fault Dataset normalized scaling.
        Returns:
          raw_score: Decision function score (positive/near-zero for normal, negative for anomaly)
          prediction: 1 for normal, -1 for anomaly
        """
        if not self.is_fitted:
            raise RuntimeError("Isolation Forest model is not trained.")

        feature_names = getattr(self.model, "feature_names_in_", None)

        # Handle user NEV Fault Dataset 7-feature model (isolation_forest_final.joblib)
        if feature_names is not None and len(feature_names) == 7 and raw_telemetry is not None:
            self.threshold = -0.018  # Decision boundary threshold derived from NEV dataset test split

            bv_raw = float(raw_telemetry.get("batteryVoltage", 360.0))
            bi_raw = float(raw_telemetry.get("batteryCurrent", 45.0))
            spd_raw = float(raw_telemetry.get("vehicleSpeed", 55.0))
            mt_raw = float(raw_telemetry.get("motorTemperature", 50.0))
            acc_raw = float(raw_telemetry.get("acceleration", 0.5))
            bt_raw = float(raw_telemetry.get("batteryTemperature", 35.0))

            # Scale to NEV Dataset [0.0, 1.0] normalized bounds
            bv_norm = np.clip(0.75 + (bv_raw - 300.0) / 480.0, 0.0, 1.0)
            bi_norm = np.clip(0.11 + (abs(bi_raw) / 100.0) * 0.89, 0.0, 1.0)
            spd_norm = np.clip(0.06 + (spd_raw / 120.0) * 0.94, 0.0, 1.0)
            mt_norm = np.clip((mt_raw - 20.0) / 100.0, 0.0, 1.0)
            acc_norm = np.clip((abs(acc_raw) / 3.0) * 0.36, 0.0, 1.0)
            bt_norm = np.clip((bt_raw - 10.0) / 50.0, 0.0, 1.0)
            humidity_norm = 0.50

            row = {}
            for col in feature_names:
                col_str = str(col)
                if "Voltage" in col_str:
                    row[col] = bv_norm
                elif "Current" in col_str:
                    row[col] = bi_norm
                elif "Speed" in col_str or "RPM" in col_str:
                    row[col] = spd_norm
                elif "Ambient" in col_str:
                    row[col] = bt_norm
                elif "Temperature" in col_str:
                    row[col] = mt_norm
                elif "Vibration" in col_str:
                    row[col] = acc_norm
                elif "Humidity" in col_str:
                    row[col] = humidity_norm
                else:
                    row[col] = 0.0

            df_input = pd.DataFrame([row], columns=feature_names)
            raw_score = float(self.model.decision_function(df_input)[0])
            pred = 1 if raw_score >= self.threshold else -1
            return raw_score, pred

        # Standard 25-feature vector fallback prediction
        self.threshold = 0.0
        if x.ndim == 1:
            x_2d = x.reshape(1, -1)
        else:
            x_2d = x

        raw_score = float(self.model.decision_function(x_2d)[0])
        pred = int(self.model.predict(x_2d)[0])
        return raw_score, pred
