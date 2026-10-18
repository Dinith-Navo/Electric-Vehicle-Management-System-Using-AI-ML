import uuid
import time
import numpy as np
from fastapi import APIRouter
from app.schemas.telemetry import TelemetryInput
from app.schemas.anomaly import StandardApiResponse
from app.services.anomaly_service import AnomalyService
from app.ml.feature_engineering import FeatureEngineer, FEATURE_NAMES
from app.ml.model_manager import MLModelManager
from app.ml.preprocessing import TelemetryPreprocessor
from app.ml.evaluation import ResearchEvaluator
from app.anomaly.shap_explainer import ShapleyExplainer

router = APIRouter(prefix="/research", tags=["Research & Model Comparison"])

@router.get("/model-comparison", response_model=StandardApiResponse)
async def model_comparison():
    request_id = f"req_{uuid.uuid4().hex[:8]}"
    benchmarks = ResearchEvaluator.run_benchmark_suite()
    
    comparison_data = {
        "models": [
            {
                "id": "isolation_forest",
                "name": "Isolation Forest",
                "type": "Tree Partitioning",
                "hyperparameters": {"n_estimators": 800, "contamination": 0.05},
                "status": "ONLINE (Colab Trained)",
                "weightInEnsemble": 0.30,
                "precision": benchmarks["evaluationMetrics"]["isolationForest"]["precision"],
                "recall": benchmarks["evaluationMetrics"]["isolationForest"]["recall"],
                "f1Score": benchmarks["evaluationMetrics"]["isolationForest"]["f1Score"],
                "rocAuc": benchmarks["evaluationMetrics"]["isolationForest"]["rocAuc"],
                "averageInferenceTimeMs": 2.4
            },
            {
                "id": "one_class_svm",
                "name": "One-Class SVM",
                "type": "Hyperplane Boundary",
                "hyperparameters": {"kernel": "rbf", "gamma": "scale", "nu": 0.05},
                "status": "ONLINE",
                "weightInEnsemble": 0.30,
                "precision": benchmarks["evaluationMetrics"]["oneClassSVM"]["precision"],
                "recall": benchmarks["evaluationMetrics"]["oneClassSVM"]["recall"],
                "f1Score": benchmarks["evaluationMetrics"]["oneClassSVM"]["f1Score"],
                "rocAuc": benchmarks["evaluationMetrics"]["oneClassSVM"]["rocAuc"],
                "averageInferenceTimeMs": 4.1
            },
            {
                "id": "autoencoder",
                "name": "Deep Autoencoder",
                "type": "Neural Network (PyTorch)",
                "architecture": "25 -> 16 -> 8 -> 4 (Latent) -> 8 -> 16 -> 25",
                "status": "ONLINE",
                "weightInEnsemble": 0.40,
                "precision": benchmarks["evaluationMetrics"]["autoencoder"]["precision"],
                "recall": benchmarks["evaluationMetrics"]["autoencoder"]["recall"],
                "f1Score": benchmarks["evaluationMetrics"]["autoencoder"]["f1Score"],
                "rocAuc": benchmarks["evaluationMetrics"]["autoencoder"]["rocAuc"],
                "averageInferenceTimeMs": 6.8
            }
        ],
        "ensembleBenchmark": benchmarks["evaluationMetrics"]["ensemble"],
        "confusionMatrix": benchmarks["confusionMatrix"],
        "latexTableCode": benchmarks["latexTableCode"]
    }
    
    return StandardApiResponse(
        success=True,
        data=comparison_data,
        meta={"requestId": request_id}
    )

@router.get("/ablation", response_model=StandardApiResponse)
async def ablation_study():
    """
    Returns automated parameter-drop Ablation Study results (§70).
    """
    request_id = f"req_{uuid.uuid4().hex[:8]}"
    model_mgr = MLModelManager.get_instance()
    ablation_data = ResearchEvaluator.run_ablation_study(model_mgr.evaluate_all)
    return StandardApiResponse(
        success=True,
        data=ablation_data,
        meta={"requestId": request_id}
    )

@router.post("/inspect", response_model=StandardApiResponse)
async def inspect_features_and_models(telemetry: TelemetryInput):
    request_id = f"req_{uuid.uuid4().hex[:8]}"
    start_time = time.time()
    
    sanitized = TelemetryPreprocessor.sanitize(telemetry)
    features = FeatureEngineer.extract_features(sanitized)
    vector = FeatureEngineer.to_feature_vector(features)
    
    model_mgr = MLModelManager.get_instance()
    model_raw_results, if_ev, svm_ev, ae_ev = model_mgr.evaluate_all(vector, raw_telemetry=sanitized)
    
    anomaly_res = AnomalyService.analyze_telemetry(telemetry)

    # Calculate Shapley feature attributions
    baseline_vec = np.zeros(len(vector), dtype=np.float32)
    shapley_rankings = ShapleyExplainer.calculate_shapley_values(
        vector,
        lambda v: model_mgr.evaluate_all(v, raw_telemetry=sanitized),
        baseline_vec
    )

    processing_time_ms = round((time.time() - start_time) * 1000.0, 2)
    
    return StandardApiResponse(
        success=True,
        data={
            "rawTelemetry": telemetry.model_dump(),
            "sanitizedTelemetry": sanitized,
            "engineeredFeatures": features,
            "featureVector": vector.tolist(),
            "featureNames": FEATURE_NAMES,
            "shapleyFeatureAttributions": shapley_rankings[:5],
            "modelOutputs": {
                "isolationForest": model_raw_results["isolationForest"],
                "oneClassSVM": model_raw_results["oneClassSVM"],
                "autoencoder": model_raw_results["autoencoder"]
            },
            "normalizedEvidence": {
                "isolationForest": round(if_ev, 3),
                "oneClassSVM": round(svm_ev, 3),
                "autoencoder": round(ae_ev, 3)
            },
            "ensembleEvaluation": anomaly_res.ensembleResult.model_dump(),
            "temporalAnalysis": anomaly_res.temporalAnalysis.model_dump(),
            "finalAssessment": {
                "score": anomaly_res.anomalyScore,
                "confidence": anomaly_res.confidence,
                "severity": anomaly_res.severity.value,
                "category": anomaly_res.category.value,
                "alert": anomaly_res.diagnosticAlert,
                "explanation": anomaly_res.explanation
            },
            "processingTimeMs": processing_time_ms
        },
        meta={"requestId": request_id}
    )
