import os
import glob
import logging

logger = logging.getLogger(__name__)

class QueueModelLoader:
    """
    Interface for loading Google Colab trained machine learning models
    for EV Charging Station Queue & Wait Time Prediction.
    
    Supported file formats in ml-service/saved_models/queue/:
      - .joblib (Scikit-Learn, XGBoost, LightGBM, etc.)
      - .pkl / .pickle
    """
    def __init__(self, models_dir: str = None):
        if models_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            self.models_dir = os.path.join(base_dir, "saved_models", "queue")
        else:
            self.models_dir = models_dir
            
        self.model = None
        self.model_filename = None
        self._load_model_if_available()

    def _load_model_if_available(self):
        try:
            if not os.path.exists(self.models_dir):
                os.makedirs(self.models_dir, exist_ok=True)
                return

            candidates = glob.glob(os.path.join(self.models_dir, "*.joblib")) + \
                         glob.glob(os.path.join(self.models_dir, "*.pkl")) + \
                         glob.glob(os.path.join(self.models_dir, "*.pickle"))
            
            if candidates:
                chosen_path = candidates[0]
                self.model_filename = os.path.basename(chosen_path)
                try:
                    import joblib
                    self.model = joblib.load(chosen_path)
                    logger.info(f"Successfully loaded trained Queue Prediction model from {self.model_filename}")
                except Exception as e:
                    logger.warning(f"Failed to load queue model {self.model_filename}: {e}. Fallback will be used.")
                    self.model = None
            else:
                logger.info("No trained Queue model found in saved_models/queue/. Using rule-based fallback predictor.")
        except Exception as e:
            logger.warning(f"Error checking Queue model directory: {e}")
            self.model = None

    def is_model_loaded(self) -> bool:
        return self.model is not None

    def predict(self, features: dict) -> dict:
        """
        Run inference using the loaded model.
        Returns dict with predicted queue count and wait minutes.
        """
        if not self.is_model_loaded():
            raise RuntimeError("No trained model loaded to perform prediction.")
        
        import numpy as np
        # Feature vector: [totalChargers, occupied, arrivalHour, dayOfWeek, chargingSpeedKw, avgSessionMinutes]
        feature_vector = np.array([[
            features.get("totalChargers", 6),
            features.get("currentlyOccupied", 3),
            features.get("arrivalHour", 14),
            features.get("dayOfWeek", 2),
            features.get("chargingSpeedKw", 50.0),
            features.get("avgSessionMinutes", 35.0)
        ]])
        pred = self.model.predict(feature_vector)
        # Expected prediction format: [predicted_queue, wait_minutes]
        if hasattr(pred, "ndim") and pred.ndim > 1:
            q_len = max(0, int(round(pred[0][0])))
            wait_m = max(0, int(round(pred[0][1])))
        else:
            q_len = max(0, int(round(pred[0])))
            wait_m = q_len * 15
        return {"queueLength": q_len, "waitMinutes": wait_m}

# Global Singleton instance
queue_model_loader = QueueModelLoader()
