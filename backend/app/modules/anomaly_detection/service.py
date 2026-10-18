import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from dataclasses import asdict

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
from app.anomaly.fingerprint import AnomalyFingerprintEngine
from app.anomaly.genome_db import AnomalyGenomeDB
from app.anomaly.causal_chain import CausalInferenceEngine
from app.anomaly.predictive_horizon import PredictiveHorizonEngine
from app.anomaly.disagreement_forensics import DisagreementForensicsEngine
from app.ml.digital_twin import DigitalTwinRegistry
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

        raw_telemetry_dict = {
            "batteryVoltage": sanitized_telemetry.get("batteryVoltage", 395.0),
            "batteryCurrent": sanitized_telemetry.get("batteryCurrent", 40.0),
            "batteryTemperature": sanitized_telemetry.get("batteryTemperature", 32.0),
            "motorTemperature": sanitized_telemetry.get("motorTemperature", 52.0),
            "vehicleSpeed": sanitized_telemetry.get("vehicleSpeed", 60.0),
            "acceleration": sanitized_telemetry.get("acceleration", 0.5),
            "powerConsumption": sanitized_telemetry.get("powerConsumption", 18.0),
            "soc": sanitized_telemetry.get("soc", 75.0),
        }

        reference_dict = {
            "batteryVoltage": 395.0,
            "batteryCurrent": 40.0,
            "batteryTemperature": 32.0,
            "motorTemperature": 52.0,
            "vehicleSpeed": 60.0,
            "acceleration": 0.5,
            "powerConsumption": 18.0,
            "soc": 75.0,
        }

        dominant_feature = affected_params[0].parameter if affected_params else "batteryTemperature"

        # 🔥 FEATURE 1: NEURAL FORENSICS — Anomaly DNA Fingerprinting & Genome Match
        dna = AnomalyFingerprintEngine.generate_fingerprint(
            telemetry_values=raw_telemetry_dict,
            reference_values=reference_dict,
            model_evidences={"isolationForest": if_ev, "oneClassSVM": svm_ev, "autoencoder": ae_ev},
            ensemble_score=ensemble_score,
            feature_errors=feature_errors
        )
        genome_db = AnomalyGenomeDB.get_instance()
        genome_matches = genome_db.find_nearest_matches(dna.embedding_vector, top_k=3, threshold=0.45)
        if op_status == OperatingStatus.ABNORMAL:
            genome_db.record_occurrence(dna.strain_type, telemetry.vehicleId, dna.embedding_vector)

        anomaly_dna_dict = {
            "fingerprintHash": dna.fingerprint_hash,
            "barcode": dna.dna_barcode,
            "strainType": dna.strain_type,
            "mutationScore": dna.mutation_score,
            "dominantGenes": dna.dominant_genes
        }

        # 🔥 FEATURE 3: CAUSAL INFERENCE ENGINE — Root Cause & Cascade DAG
        causal_result = CausalInferenceEngine.infer_causal_chain(
            vehicle_id=telemetry.vehicleId,
            current_telemetry=raw_telemetry_dict,
            reference_values=reference_dict,
            affected_parameters=[p.parameter for p in affected_params]
        )
        causal_chain_dict = asdict(causal_result)

        # 🔥 FEATURE 4 & 6: PREDICTIVE HORIZON & SEVERITY DECAY CURVE
        horizon_result = PredictiveHorizonEngine.calculate_horizon(
            vehicle_id=telemetry.vehicleId,
            current_score=ensemble_score,
            dominant_parameter=dominant_feature,
            affected_count=len(affected_params),
            soc=raw_telemetry_dict.get("soc", 75.0),
            power_kw=raw_telemetry_dict.get("powerConsumption", 15.0)
        )
        predictive_horizon_dict = asdict(horizon_result)

        # 🔥 FEATURE 5: CROSS-MODEL DISAGREEMENT FORENSICS
        disagreement_result = DisagreementForensicsEngine.analyze_disagreement(
            if_ev=if_ev,
            svm_ev=svm_ev,
            ae_ev=ae_ev,
            if_pred=if_pred,
            svm_pred=svm_pred,
            ae_pred=ae_pred,
            dominant_feature=dominant_feature,
            category=category.value
        )
        disagreement_forensics_dict = asdict(disagreement_result)

        # 🔥 FEATURE 7: DIGITAL TWIN SANDBOX — Learned Vehicle Profile Deviation
        DigitalTwinRegistry.update_twin(telemetry.vehicleId, raw_telemetry_dict)
        digital_twin_deviation = DigitalTwinRegistry.evaluate_twin_deviation(telemetry.vehicleId, raw_telemetry_dict)

        # 🇱🇰 SRI LANKA MULTI-PHYSICS EV INTELLIGENCE & ECONOMIC FORENSICS
        bat_temp = raw_telemetry_dict.get("batteryTemperature", 32.0)
        mot_temp = raw_telemetry_dict.get("motorTemperature", 52.0)
        voltage = raw_telemetry_dict.get("batteryVoltage", 395.0)
        power_kw = raw_telemetry_dict.get("powerConsumption", 18.0)
        speed = raw_telemetry_dict.get("vehicleSpeed", 60.0)

        # Tropical Heat Stress Index (Calibrated for Colombo/Gampaha 33°C ambient)
        thermal_excess = max(0.0, bat_temp - 32.0) * 2.2 + max(0.0, mot_temp - 65.0) * 1.4
        tropical_thermal_index = min(100.0, round(25.0 + thermal_excess, 1))

        # Monsoon Road Ingress & Insulation Resistance
        if voltage < 290.0 and ensemble_score > 0.65:
            insulation_state = "CRITICAL_INGRESS"
            insulation_mohm = 0.12  # Below 200 kOhm breakdown
        elif voltage < 330.0 or ensemble_score > 0.45:
            insulation_state = "MONSOON_MOISTURE_WARNING"
            insulation_mohm = 0.85
        else:
            insulation_state = "NOMINAL"
            insulation_mohm = 98.5

        # CEB Grid Fluctuation & Peak TOU Calculation
        hour_now = datetime.now(timezone.utc).hour + 5  # SL time approx (+5:30)
        is_ceb_peak = 18 <= (hour_now % 24) <= 22
        is_ceb_offpeak = 22 < (hour_now % 24) or (hour_now % 24) < 6

        if is_ceb_peak:
            ceb_tariff_window = "PEAK_WINDOW (LKR 78.00 / kWh)"
            ceb_cost_per_kwh = 78.0
            peak_avoidance_saving = round(power_kw * 1.5 * (78.0 - 32.0), 2)
        elif is_ceb_offpeak:
            ceb_tariff_window = "OFF_PEAK_WINDOW (LKR 32.00 / kWh - 59% SAVING)"
            ceb_cost_per_kwh = 32.0
            peak_avoidance_saving = 0.0
        else:
            ceb_tariff_window = "DAY_WINDOW (LKR 54.00 / kWh)"
            ceb_cost_per_kwh = 54.0
            peak_avoidance_saving = round(power_kw * 1.5 * (54.0 - 32.0), 2)

        # Repair / Degradation Cost in Sri Lankan Rupees (LKR)
        damage_cost_map = {
            SeverityLevel.CRITICAL: 285000.0,  # Full LFP module replacement
            SeverityLevel.HIGH: 95000.0,      # Inverter IGBT / Stator rewinding
            SeverityLevel.MEDIUM: 38000.0,    # BMS top-balance & insulation drying
            SeverityLevel.LOW: 12500.0,       # Preventive sensor calibration
            SeverityLevel.NONE: 0.0
        }
        estimated_damage_lkr = damage_cost_map.get(severity, 0.0)

        # Multilingual Sri Lankan Operational Guidance
        if severity in [SeverityLevel.HIGH, SeverityLevel.CRITICAL]:
            advisory_en = f"High thermal/electrical stress on {telemetry.vehicleId}. Derate motor power, avoid Kadugannawa/Ramboda inclines, and defer charging until 22:30 Off-Peak window."
            advisory_si = "වාහනයේ බැටරිය හෝ මෝටරය අධික ලෙස වෙහෙසට පත්ව ඇත. කඳු නැගීමෙන් වළකින්න සහ රාත්‍රී 10:30 න් පසු අඩු ගාස්තු යටතේ ආරෝපණය කරන්න."
            advisory_ta = "வாகனத்தின் பேட்டரி அதிக வெப்பமடைந்துள்ளது. மலைப் பாதைகளைத் தவிர்த்து, இரவு 10:30 மணிக்குப் பிறகு சார்ஜ் செய்யவும்."
        else:
            advisory_en = f"Vehicle {telemetry.vehicleId} operating within tropical safety envelope. Optimal CEB charging window starts at 22:30 PM."
            advisory_si = "වාහනයේ ක්‍රියාකාරිත්වය සාමාන්‍ය මට්ටමේ පවතී. අඩු ගාස්තු ආරෝපණ කාලය රාත්‍රී 10:30 ට ආරම්භ වේ."
            advisory_ta = "வாகனம் பாதுகாப்பான நிலையில் இயங்குகிறது. குறைந்த கட்டண சார்ஜிங் நேரம் இரவு 10:30 மணிக்கு தொடங்குகிறது."

        sri_lanka_intelligence = {
            "tropicalThermalIndex": tropical_thermal_index,
            "monsoonInsulationState": insulation_state,
            "insulationResistanceMOhm": insulation_mohm,
            "cebTariffWindow": ceb_tariff_window,
            "cebCurrentCostPerKwh": ceb_cost_per_kwh,
            "cebPeakAvoidanceSavingLkr": peak_avoidance_saving,
            "estimatedFailureRepairCostLkr": estimated_damage_lkr,
            "repackImbalanceMv": round(ensemble_score * 85.0, 1),
            "advisoryEnglish": advisory_en,
            "advisorySinhala": advisory_si,
            "advisoryTamil": advisory_ta
        }

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
            createdAt=now,
            # 🧬 Revolutionary Forensics
            anomalyDNA=anomaly_dna_dict,
            genomeMatches=genome_matches,
            causalChain=causal_chain_dict,
            predictiveHorizon=predictive_horizon_dict,
            disagreementForensics=disagreement_forensics_dict,
            digitalTwinDeviation=digital_twin_deviation,
            # 🇱🇰 Sri Lanka EV Operational & Economic Intelligence
            sriLankaIntelligence=sri_lanka_intelligence
        )

        # Store in store / db
        _evaluated_anomalies_store[anomaly_id] = response
        logger.info(f"Completed analysis {anomaly_id} for vehicle {telemetry.vehicleId}: Status={op_status.value}, Score={ensemble_score:.2f}, Strain={dna.strain_type}")
        return response

    @staticmethod
    def get_anomaly_by_id(anomaly_id: str) -> Optional[AnomalyResponse]:
        return _evaluated_anomalies_store.get(anomaly_id)

    @staticmethod
    def list_anomalies(vehicle_id: Optional[str] = None, limit: int = 50) -> list[AnomalyResponse]:
        anomalies = list(_evaluated_anomalies_store.values())
        if vehicle_id:
            anomalies = [a for a in anomalies if a.vehicleId == vehicle_id]
        anomalies.sort(key=lambda a: a.createdAt, reverse=True)
        return anomalies[:limit]
