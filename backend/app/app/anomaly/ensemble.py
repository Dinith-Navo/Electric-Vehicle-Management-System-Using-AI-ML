from typing import Dict, Any, Tuple
from app.core.config import settings

class EnsembleEngine:
    """
    Combines heterogeneous model evidence into a unified ensemble score and evaluates
    inter-model agreement ratio.
    """

    @staticmethod
    def evaluate(
        if_evidence: float,
        svm_evidence: float,
        ae_evidence: float,
        if_pred: int,
        svm_pred: int,
        ae_pred: int
    ) -> Tuple[float, float, str, Dict[str, str]]:
        """
        Returns:
          ensemble_score: float (0.0 to 1.0)
          agreement_ratio: float (0.33, 0.67, or 1.0)
          agreement_text: str (e.g. "3/3 Models")
          predictions_map: Dict of predictions per model ("NORMAL" | "ANOMALY")
        """
        w_if = settings.WEIGHT_ISOLATION_FOREST
        w_svm = settings.WEIGHT_ONE_CLASS_SVM
        w_ae = settings.WEIGHT_AUTOENCODER

        # Weighted combination
        ensemble_score = (w_if * if_evidence) + (w_svm * svm_evidence) + (w_ae * ae_evidence)
        ensemble_score = float(min(1.0, max(0.0, ensemble_score)))

        # Convert predictions (-1 = Anomaly, 1 = Normal) to status
        if_status = "ANOMALY" if if_pred == -1 or if_evidence > 0.50 else "NORMAL"
        svm_status = "ANOMALY" if svm_pred == -1 or svm_evidence > 0.50 else "NORMAL"
        ae_status = "ANOMALY" if ae_pred == -1 or ae_evidence > 0.50 else "NORMAL"

        predictions = [if_status, svm_status, ae_status]
        anomaly_count = predictions.count("ANOMALY")
        normal_count = predictions.count("NORMAL")

        majority = max(anomaly_count, normal_count)
        agreement_ratio = round(majority / 3.0, 2)
        agreement_text = f"{majority}/3 Models"

        preds_map = {
            "isolationForest": if_status,
            "oneClassSVM": svm_status,
            "autoencoder": ae_status
        }

        return ensemble_score, agreement_ratio, agreement_text, preds_map
