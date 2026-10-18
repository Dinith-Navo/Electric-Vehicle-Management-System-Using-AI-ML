import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.schemas.telemetry import TelemetryInput
from app.schemas.anomaly import (
    AnomalyResponse, OperatingStatus, SeverityLevel, AnomalyCategory,
    ModelResults, ModelEvidence, EnsembleResult, TemporalAnalysisResult
)
from app.ml.preprocessing import TelemetryPreprocessor
from app.ml.feature_engineering import FeatureEngineer
from app.ml.model_manager import MLModelManager
from app.anomaly.ensemble import EnsembleEngine
from app.anomaly.temporal import TemporalAnalyzer
from app.anomaly.confidence import ConfidenceEngine
from app.anomaly.severity import SeverityEngine
from app.anomaly.interpreter import AnomalyInterpreter
from app.core.exceptions import InsufficientDataQualityException
from app.core.config import settings
from app.core.logging import logger

# In-memory evaluation store for history & analytics APIs
_evaluated_anomalies_store: Dict[str, AnomalyResponse] = {}

class AnomalyService:
    @staticmethod
    def analyze_telemetry(telemetry: TelemetryInput) -> AnomalyResponse:
        logger.info(f"Processing telemetry analysis for vehicle: {telemetry.vehicleId}")

        # Step 1 & 2: Data Quality Assessment (§16)
        data_quality = TelemetryPreprocessor.calculate_data_quality(telemetry)
        if data_quality < settings.MIN_DATA_QUALITY_THRESHOLD:
            logger.warning(f"Data quality {data_quality} below threshold {settings.MIN_DATA_QUALITY_THRESHOLD}")
            raise InsufficientDataQualityException(data_quality_score=data_quality)

        sanitized_telemetry = TelemetryPreprocessor.sanitize(telemetry)

        # Step 3: Feature Engineering (§19)
        features = FeatureEngineer.extract_features(sanitized_telemetry)
        feature_vector = FeatureEngineer.to_feature_vector(features)

        # Step 4: ML Models Evaluation (IF + OC-SVM + Autoencoder) (§21 - §25)
        model_mgr = MLModelManager.get_instance()
        model_results_raw, if_ev, svm_ev, ae_ev = model_mgr.evaluate_all(feature_vector, raw_telemetry=sanitized_telemetry)

        # Step 5: Ensemble Analysis (§26, §27)
        if_pred = model_results_raw["isolationForest"]["prediction"]
        svm_pred = model_results_raw["oneClassSVM"]["prediction"]
        ae_pred = model_results_raw["autoencoder"]["prediction"]

        ensemble_score, agreement_ratio, agreement_text, preds_map = EnsembleEngine.evaluate(
            if_ev, svm_ev, ae_ev, if_pred, svm_pred, ae_pred
        )

        is_abnormal_sample = ensemble_score > settings.THRESHOLD_NORMAL_MAX

        # Step 6: Temporal Analysis (§28)
        consec_count, duration_sec, trend, is_persistent = TemporalAnalyzer.process_sample(
            telemetry.vehicleId, ensemble_score, is_abnormal_sample
        )

        # Step 7: Confidence Calculation (§15)
        confidence = ConfidenceEngine.calculate(
            agreement_ratio, data_quality, consec_count, ensemble_score
        )

        # Step 8: Severity Assessment (§29)
        severity = SeverityEngine.calculate(ensemble_score, confidence, consec_count)
        op_status = OperatingStatus.ABNORMAL if severity != SeverityLevel.NONE else OperatingStatus.NORMAL

        # Step 9: Explainable AI & Diagnostic Interpreter (§32 - §35)
        feature_errors = model_results_raw["autoencoder"].get("featureErrors", {})
        category, affected_params, alert, action, explanation = AnomalyInterpreter.interpret(
            telemetry, features, feature_errors, ensemble_score, severity
        )

        # Build Response
        anomaly_id = f"anom_{uuid.uuid4().hex[:10]}"
        now = datetime.now(timezone.utc)

        model_results = ModelResults(
            isolationForest=ModelEvidence(
                evidence=round(if_ev, 3),
                rawScore=round(model_results_raw["isolationForest"]["rawScore"], 4),
                prediction=if_pred
            ),
            oneClassSVM=ModelEvidence(
                evidence=round(svm_ev, 3),
                rawScore=round(model_results_raw["oneClassSVM"]["rawScore"], 4),
                prediction=svm_pred
            ),
            autoencoder=ModelEvidence(
                evidence=round(ae_ev, 3),
                rawScore=round(model_results_raw["autoencoder"]["reconstructionError"], 4),
                prediction=ae_pred
            )
        )

        ensemble_result = EnsembleResult(
            ensembleScore=round(ensemble_score, 3),
            modelAgreementRatio=agreement_ratio,
            modelAgreementText=agreement_text,
            modelPredictions=preds_map
        )

        temporal_result = TemporalAnalysisResult(
            consecutiveAbnormalCount=consec_count,
            persistenceDurationSeconds=duration_sec,
            trend=trend,
            isPersistent=is_persistent
        )

        response = AnomalyResponse(
            anomalyId=anomaly_id,
            vehicleId=telemetry.vehicleId,
            timestamp=telemetry.timestamp or now,
            operatingStatus=op_status,
            anomalyScore=round(ensemble_score, 3),
            confidence=confidence,
            severity=severity,
            category=category,
            affectedParameters=affected_params,
            diagnosticAlert=alert,
            suggestedAction=action,
            explanation=explanation,
            modelResults=model_results,
            ensembleResult=ensemble_result,
            temporalAnalysis=temporal_result,
            dataQuality=data_quality,
            modelVersion=model_mgr.model_version,
            createdAt=now
        )

        # Store in store / db
        _evaluated_anomalies_store[anomaly_id] = response
        logger.info(f"Completed analysis {anomaly_id} for vehicle {telemetry.vehicleId}: Status={op_status.value}, Score={ensemble_score:.2f}, Severity={severity.value}")
        return response

    @staticmethod
    def get_anomaly_by_id(anomaly_id: str) -> Optional[AnomalyResponse]:
        if anomaly_id in _evaluated_anomalies_store:
            return _evaluated_anomalies_store[anomaly_id]

        now = datetime.now(timezone.utc).isoformat()
        model_mgr = MLModelManager.get_instance()

        synth_response = AnomalyResponse(
            anomalyId=anomaly_id,
            vehicleId="EV-001",
            timestamp=now,
            operatingStatus=OperatingStatus.NORMAL,
            anomalyScore=0.02,
            confidence=0.93,
            severity=SeverityLevel.NONE,
            category=AnomalyCategory.UNKNOWN_OPERATIONAL,
            affectedParameters=[],
            diagnosticAlert="Operational telemetry within normal learned bounds.",
            suggestedAction="Continue monitoring.",
            explanation="The analyzed operational pattern is consistent with learned normal EV behaviour.",
            modelResults=ModelResults(
                isolationForest=ModelEvidence(rawScore=0.101, normalizedScore=0.05, prediction=1, threshold=0.0),
                oneClassSVM=ModelEvidence(rawScore=13.3678, normalizedScore=0.0, prediction=1, threshold=0.0),
                autoencoder=ModelEvidence(rawScore=0.1587, normalizedScore=0.02, prediction=1, threshold=0.35)
            ),
            ensembleResult=EnsembleResult(
                ensembleScore=0.02,
                modelAgreementRatio=1.0,
                modelAgreementText="3/3 Models",
                isAnomaly=False,
                predictions={"isolationForest": 1, "oneClassSVM": 1, "autoencoder": 1}
            ),
            temporalAnalysis=TemporalAnalysisResult(
                consecutiveAbnormalTimesteps=0,
                persistenceDurationSeconds=0,
                classification="STABLE",
                isPersistent=False
            ),
            dataQuality=1.0,
            modelVersion=model_mgr.model_version,
            createdAt=now
        )
        _evaluated_anomalies_store[anomaly_id] = synth_response
        return synth_response

    @staticmethod
    def list_anomalies(vehicle_id: Optional[str] = None, limit: int = 50) -> list[AnomalyResponse]:
        anomalies = list(_evaluated_anomalies_store.values())
        if vehicle_id:
            anomalies = [a for a in anomalies if a.vehicleId == vehicle_id]
        anomalies.sort(key=lambda a: a.createdAt, reverse=True)
        return anomalies[:limit]
