import os
import joblib
import numpy as np
import torch
from typing import Dict, Any, Tuple, Optional
from sklearn.preprocessing import StandardScaler
from app.ml.isolation_forest import IsolationForestModel
from app.ml.one_class_svm import OneClassSVMModel
from app.ml.autoencoder import AutoencoderModel
from app.ml.score_normalization import ScoreNormalizer
from app.core.config import settings
from app.core.logging import logger

class MLModelManager:
    _instance = None

    def __init__(self):
        self.isolation_forest = IsolationForestModel()
        self.one_class_svm = OneClassSVMModel()
        self.autoencoder = AutoencoderModel()
        self.scaler = StandardScaler()
        self.is_loaded = False
        self.model_version = "ensemble-v1.0"

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = MLModelManager()
            cls._instance.initialize_or_train_baseline()
        return cls._instance

    def initialize_or_train_baseline(self):
        """
        Loads exported models from backend/models directory or trains baseline
        if exported model binaries do not exist.
        """
        os.makedirs(settings.MODEL_DIR, exist_ok=True)
        if self.is_loaded:
            return

        if_final_path = os.path.join(settings.MODEL_DIR, "isolation_forest_final.joblib")
        if_std_path = os.path.join(settings.MODEL_DIR, "isolation_forest.joblib")
        if_path = if_final_path if os.path.exists(if_final_path) else if_std_path

        svm_final_path = os.path.join(settings.MODEL_DIR, "one_class_svm_final.joblib")
        svm_std_path = os.path.join(settings.MODEL_DIR, "one_class_svm.joblib")
        svm_path = svm_final_path if os.path.exists(svm_final_path) else svm_std_path

        scaler_path = os.path.join(settings.MODEL_DIR, "scaler.joblib")
        
        ae_final_path = os.path.join(settings.MODEL_DIR, "deep_autoencoder_final.pt")
        ae_meta_path = os.path.join(settings.MODEL_DIR, "deep_autoencoder_meta.pt")
        ae_std_path = os.path.join(settings.MODEL_DIR, "autoencoder.pt")
        ae_path = ae_final_path if os.path.exists(ae_final_path) else ae_std_path

        # Check if pre-trained model files exist
        if os.path.exists(if_path):
            try:
                logger.info(f"Loading pre-trained models from {settings.MODEL_DIR}...")
                self.isolation_forest.model = joblib.load(if_path)
                self.isolation_forest.is_fitted = True

                if os.path.exists(scaler_path):
                    self.scaler = joblib.load(scaler_path)

                if os.path.exists(svm_path):
                    self.one_class_svm.model = joblib.load(svm_path)
                    self.one_class_svm.is_fitted = True

                if os.path.exists(ae_meta_path):
                    meta = torch.load(ae_meta_path)
                    input_dim = meta.get("input_dim", 7)
                    latent_dim = meta.get("latent_dim", 3)
                    self.autoencoder.set_architecture(input_dim=input_dim, latent_dim=latent_dim)
                    self.autoencoder.net.load_state_dict(meta["state_dict"])
                    self.autoencoder.threshold = float(meta.get("threshold", 1.0))
                    self.autoencoder.is_fitted = True
                elif os.path.exists(ae_path):
                    self.autoencoder.set_architecture(input_dim=7, latent_dim=3)
                    self.autoencoder.net.load_state_dict(torch.load(ae_path))
                    self.autoencoder.is_fitted = True

                self.is_loaded = True
                self.model_version = "nev-ensemble-v2.0"
                logger.info(f"Successfully loaded all 3 trained models ({os.path.basename(if_path)}, {os.path.basename(svm_path)}, {os.path.basename(ae_path)}) into ML pipeline.")
                return
            except Exception as e:
                logger.warning(f"Error loading pre-trained model ({e}), falling back to baseline initialization.")

        # Baseline fallback training
        logger.info("Initializing ML Model Pipeline with baseline training...")
        np.random.seed(42)
        n_samples = 2000
        
        bv = np.random.normal(360.0, 10.0, n_samples)
        bi = np.random.normal(45.0, 15.0, n_samples)
        bt = np.random.normal(35.0, 4.0, n_samples)
        mt = np.random.normal(50.0, 6.0, n_samples)
        spd = np.random.normal(55.0, 10.0, n_samples)
        acc = np.random.normal(0.5, 0.5, n_samples)
        pwr = (bv * bi) / 1000.0
        soc = np.linspace(90.0, 20.0, n_samples)
        is_charging = np.zeros(n_samples)

        battery_pwr = pwr
        temp_diff = mt - bt
        motor_bt_diff = mt - bt
        pwr_spd_ratio = battery_pwr / (spd + 1.0)
        curr_soc_ratio = bi / (soc + 1e-3)
        v_change = np.random.normal(0, 0.2, n_samples)
        i_change = np.random.normal(0, 1.0, n_samples)
        bt_change = np.random.normal(0, 0.05, n_samples)
        mt_change = np.random.normal(0, 0.1, n_samples)
        pwr_change = np.random.normal(0, 0.5, n_samples)
        spd_change = np.random.normal(0, 0.3, n_samples)
        acc_change = np.random.normal(0, 0.05, n_samples)
        thermal_load = (bt * 0.4) + (mt * 0.6)
        elec_load = (bv * np.abs(bi)) / 1000.0
        charg_load = np.zeros(n_samples)
        oper_load = thermal_load * (np.abs(pwr_spd_ratio) + 0.1)

        X_normal = np.column_stack([
            bv, bi, bt, mt, spd, acc, pwr, soc, is_charging,
            battery_pwr, temp_diff, motor_bt_diff, pwr_spd_ratio, curr_soc_ratio,
            v_change, i_change, bt_change, mt_change, pwr_change, spd_change, acc_change,
            thermal_load, elec_load, charg_load, oper_load
        ]).astype(np.float32)

        X_scaled = self.scaler.fit_transform(X_normal)

        self.isolation_forest.fit(X_scaled)
        self.one_class_svm.fit(X_scaled)
        self.autoencoder.fit(X_scaled, epochs=30, batch_size=32)

        # Save trained baseline
        joblib.dump(self.isolation_forest.model, if_std_path)
        joblib.dump(self.scaler, scaler_path)
        joblib.dump(self.one_class_svm.model, svm_path)
        torch.save(self.autoencoder.net.state_dict(), ae_path)

        self.is_loaded = True
        logger.info("ML Model Pipeline baseline trained and saved to backend/models.")

    def evaluate_all(self, feature_vector: np.ndarray, raw_telemetry: Optional[Dict[str, Any]] = None) -> Tuple[Dict[str, Any], float, float, float]:
        if feature_vector.ndim == 1:
            vec_2d = feature_vector.reshape(1, -1)
        else:
            vec_2d = feature_vector

        n_scaler_features = getattr(self.scaler, "n_features_in_", 25)
        if n_scaler_features == 7:
            if raw_telemetry is not None:
                bv_raw = float(raw_telemetry.get("batteryVoltage", 360.0))
                bi_raw = float(raw_telemetry.get("batteryCurrent", 45.0))
                spd_raw = float(raw_telemetry.get("vehicleSpeed", 55.0))
                mt_raw = float(raw_telemetry.get("motorTemperature", 50.0))
                acc_raw = float(raw_telemetry.get("acceleration", 0.5))
                bt_raw = float(raw_telemetry.get("batteryTemperature", 35.0))

                # Scale to NEV Dataset [0.0, 1.0] bounds matching dataset feature space
                bv_norm = np.clip(0.75 + (bv_raw - 300.0) / 480.0, 0.0, 1.0)
                bi_norm = np.clip(0.11 + (abs(bi_raw) / 100.0) * 0.89, 0.0, 1.0)
                spd_norm = np.clip(0.06 + (spd_raw / 120.0) * 0.94, 0.0, 1.0)
                mt_norm = np.clip((mt_raw - 20.0) / 100.0, 0.0, 1.0)
                acc_norm = np.clip((abs(acc_raw) / 3.0) * 0.36, 0.0, 1.0)
                bt_norm = np.clip((bt_raw - 10.0) / 50.0, 0.0, 1.0)
                humidity_norm = 0.50

                nev_features = np.array([[bv_norm, bi_norm, spd_norm, mt_norm, acc_norm, bt_norm, humidity_norm]], dtype=np.float32)
                if hasattr(self.scaler, "feature_names_in_"):
                    import pandas as pd
                    nev_df = pd.DataFrame(nev_features, columns=self.scaler.feature_names_in_)
                    scaled_vector = self.scaler.transform(nev_df)
                else:
                    scaled_vector = self.scaler.transform(nev_features)
            else:
                sub_vec = vec_2d[:, :7]
                if hasattr(self.scaler, "feature_names_in_"):
                    import pandas as pd
                    sub_df = pd.DataFrame(sub_vec, columns=self.scaler.feature_names_in_)
                    scaled_vector = self.scaler.transform(sub_df)
                else:
                    scaled_vector = self.scaler.transform(sub_vec)
        else:
            if hasattr(self.scaler, "feature_names_in_") and len(self.scaler.feature_names_in_) == vec_2d.shape[1]:
                import pandas as pd
                df_in = pd.DataFrame(vec_2d, columns=self.scaler.feature_names_in_)
                scaled_vector = self.scaler.transform(df_in)
            else:
                scaled_vector = self.scaler.transform(vec_2d)

        # Model 1: Isolation Forest
        if_raw, if_pred = self.isolation_forest.predict(scaled_vector, raw_telemetry=raw_telemetry)
        if_thresh = getattr(self.isolation_forest, "threshold", 0.0)
        if_evidence = ScoreNormalizer.normalize_isolation_forest(if_raw, threshold=if_thresh)

        # Model 2: One-Class SVM
        svm_raw, svm_pred = self.one_class_svm.predict(scaled_vector)
        svm_evidence = ScoreNormalizer.normalize_one_class_svm(svm_raw)

        # Model 3: Deep Autoencoder
        ae_thresh = getattr(self.autoencoder, "threshold", 1.0)
        ae_mse, ae_pred, ae_feature_errors = self.autoencoder.predict(scaled_vector[0])
        ae_evidence = ScoreNormalizer.normalize_autoencoder(ae_mse, threshold=ae_thresh)

        model_results = {
            "isolationForest": {
                "rawScore": if_raw,
                "evidence": if_evidence,
                "prediction": if_pred
            },
            "oneClassSVM": {
                "rawScore": svm_raw,
                "evidence": svm_evidence,
                "prediction": svm_pred
            },
            "autoencoder": {
                "reconstructionError": ae_mse,
                "evidence": ae_evidence,
                "prediction": ae_pred,
                "featureErrors": ae_feature_errors
            }
        }

        return model_results, if_evidence, svm_evidence, ae_evidence
