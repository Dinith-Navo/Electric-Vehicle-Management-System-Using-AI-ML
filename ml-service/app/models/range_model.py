import os
import glob
import logging

logger = logging.getLogger(__name__)

class RangeModelLoader:
    """
    Interface for loading Google Colab trained machine learning models
    for EV Driving Range Prediction.
    
    Supported file formats in ml-service/saved_models/range/:
      - .joblib (Scikit-Learn Random Forest, Gradient Boosting, XGBoost, etc.)
      - .pkl / .pickle (Pickle serialized models)
    """
    def __init__(self, models_dir: str = None):
        if models_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            self.models_dir = os.path.join(base_dir, "saved_models", "range")
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
                    logger.info(f"Successfully loaded trained Range Prediction model from {self.model_filename}")
                except Exception as e:
                    logger.warning(f"Failed to load model file {self.model_filename}: {e}. Fallback will be used.")
                    self.model = None
            else:
                logger.info("No trained Range model found in saved_models/range/. Using rule-based fallback predictor.")
        except Exception as e:
            logger.warning(f"Error checking Range model directory: {e}")
            self.model = None

    def is_model_loaded(self) -> bool:
        return self.model is not None

    def predict(self, features: dict) -> float:
        """
        Run inference using the loaded model.
        Returns predicted remaining range in km.
        """
        if not self.is_model_loaded():
            raise RuntimeError("No trained model loaded to perform prediction.")
        
        import pandas as pd
        soc = features.get("soc", 75.0)
        capacity = features.get("batteryCapacityKWh", features.get("battery_capacity_kwh", 60.0))
        speed = features.get("speedKmH", features.get("speed_kmh", 60.0))
        temp = features.get("temperatureC", features.get("temperature_c", 25.0))
        consumption = features.get("energyConsumptionKWhPer100Km", features.get("energy_consumption_kwh_per_100km", 15.0))

        df_input = pd.DataFrame([{
            "soc": float(soc),
            "battery_capacity_kwh": float(capacity),
            "speed_kmh": float(speed),
            "temperature_c": float(temp),
            "energy_consumption_kwh_per_100km": float(consumption)
        }])

        try:
            pred = self.model.predict(df_input)
        except Exception:
            pred = self.model.predict(df_input.values)
            
        return float(pred[0])

# Global Singleton instance
range_model_loader = RangeModelLoader()
