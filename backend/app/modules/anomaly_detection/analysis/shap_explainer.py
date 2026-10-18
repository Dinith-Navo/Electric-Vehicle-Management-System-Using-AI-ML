import numpy as np
from typing import Dict, List, Tuple
from app.ml.feature_engineering import FEATURE_NAMES

class ShapleyExplainer:
    """
    Advanced Feature Importance Explainer calculating Shapley-style marginal feature values.
    Measures anomaly score sensitivity when individual feature dimensions are masked.
    """

    @staticmethod
    def calculate_shapley_values(
        feature_vector: np.ndarray,
        predict_fn,
        baseline_vector: np.ndarray
    ) -> List[Dict[str, float]]:
        """
        Returns ranked list of feature attributions:
        [{ "parameter": name, "shapleyValue": float, "importancePercentage": float }]
        """
        base_score, _, _, _ = predict_fn(feature_vector)
        base_val = base_score.get("isolationForest", {}).get("evidence", 0.0)

        shap_values = {}
        total_abs_impact = 0.0

        for i, name in enumerate(FEATURE_NAMES):
            if i < len(feature_vector):
                # Mask feature with baseline mean
                masked_vec = feature_vector.copy()
                masked_vec[i] = baseline_vector[i] if i < len(baseline_vector) else 0.0

                masked_score, _, _, _ = predict_fn(masked_vec)
                masked_val = masked_score.get("isolationForest", {}).get("evidence", 0.0)

                # Marginal impact
                impact = abs(base_val - masked_val)
                shap_values[name] = impact
                total_abs_impact += impact

        rankings = []
        for name, impact in shap_values.items():
            pct = (impact / (total_abs_impact + 1e-6)) * 100.0
            rankings.append({
                "parameter": name,
                "shapleyValue": round(impact, 4),
                "importancePercentage": round(pct, 2)
            })

        rankings.sort(key=lambda r: r["importancePercentage"], reverse=True)
        return rankings
