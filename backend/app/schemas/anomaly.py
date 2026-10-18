from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

class OperatingStatus(str, Enum):
    NORMAL = "NORMAL"
    ABNORMAL = "ABNORMAL"

class SeverityLevel(str, Enum):
    NONE = "NONE"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class AnomalyCategory(str, Enum):
    THERMAL = "THERMAL"
    ELECTRICAL = "ELECTRICAL"
    MOTOR = "MOTOR"
    CHARGING = "CHARGING"
    POWER_CONSUMPTION = "POWER_CONSUMPTION"
    UNKNOWN_OPERATIONAL = "UNKNOWN_OPERATIONAL"
    COMBINED_OPERATIONAL = "COMBINED_OPERATIONAL"

class AffectedParameter(BaseModel):
    parameter: str
    currentValue: float
    referenceValue: float
    deviationPercentage: float
    direction: str  # "HIGH" | "LOW"
    contribution: str  # "STRONG" | "MODERATE" | "WEAK"

class ModelEvidence(BaseModel):
    evidence: float  # 0.0 to 1.0 normalized anomaly evidence
    rawScore: float
    prediction: int  # 1 for Normal, -1 for Anomaly
    details: Optional[Dict[str, Any]] = None

class ModelResults(BaseModel):
    isolationForest: ModelEvidence
    oneClassSVM: ModelEvidence
    autoencoder: ModelEvidence

class EnsembleResult(BaseModel):
    ensembleScore: float
    modelAgreementRatio: float
    modelAgreementText: str  # e.g., "3/3 Models" or "2/3 Models"
    modelPredictions: Dict[str, str]

class TemporalAnalysisResult(BaseModel):
    consecutiveAbnormalCount: int
    persistenceDurationSeconds: float
    trend: str  # "STABLE" | "INCREASING" | "DECREASING" | "TRANSIENT"
    isPersistent: bool

# --- REVOLUTIONARY FORENSICS SCHEMAS ---

class AnomalyDNASchema(BaseModel):
    fingerprintHash: str
    barcode: List[float]
    strainType: str
    mutationScore: float
    dominantGenes: List[Dict[str, Any]]

class CausalNodeSchema(BaseModel):
    parameter: str
    label: str
    lagSeconds: float
    deviationMagnitude: float
    role: str
    p_value: float
    transferEntropy: float
    unit: str

class CausalEdgeSchema(BaseModel):
    source: str
    target: str
    strength: float
    timeLagSeconds: float
    confidence: float
    description: str

class CausalGraphSchema(BaseModel):
    rootTrigger: str
    confidence: float
    narrativeSummary: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

class TrajectoryPointSchema(BaseModel):
    timeOffsetSeconds: int
    predictedScore: float
    predictedSeverity: str
    confidenceLower: float
    confidenceUpper: float

class PredictiveHorizonSchema(BaseModel):
    estimatedTimeToFailureSeconds: Optional[int] = None
    countdownFormatted: str = "--:--"
    urgencyLevel: str = "STABLE"
    triggerParameter: str = "NONE"
    currentGradientPerSecond: float = 0.0
    criticalThreshold: float = 0.92
    projectedEscalation: bool = False
    severityTrajectory: List[Dict[str, Any]] = []

class DisagreementForensicsSchema(BaseModel):
    agreementState: str
    consensusStrength: float
    authoritativeModel: str
    arbitrationVerdict: str
    divergencePerspectives: List[Dict[str, Any]]
    dissentingModel: str

class DigitalTwinDeviationSchema(BaseModel):
    vehicleId: str
    twinDistance: float
    twinHealthScore: float
    isTwinAnomalous: bool
    outlierParameters: List[str]
    parameterDeviations: Optional[Dict[str, Any]] = None

class AnomalyResponse(BaseModel):
    anomalyId: str
    vehicleId: str
    timestamp: datetime
    operatingStatus: OperatingStatus
    anomalyScore: float = Field(..., ge=0.0, le=1.0)
    confidence: float = Field(..., ge=0.0, le=1.0)
    severity: SeverityLevel
    category: AnomalyCategory
    affectedParameters: List[AffectedParameter]
    diagnosticAlert: str
    suggestedAction: str
    explanation: str
    modelResults: ModelResults
    ensembleResult: EnsembleResult
    temporalAnalysis: TemporalAnalysisResult
    dataQuality: float
    modelVersion: str
    createdAt: datetime
    
    # 🧬 Revolutionary Additions
    anomalyDNA: Optional[Dict[str, Any]] = None
    genomeMatches: Optional[List[Dict[str, Any]]] = None
    causalChain: Optional[Dict[str, Any]] = None
    predictiveHorizon: Optional[Dict[str, Any]] = None
    disagreementForensics: Optional[Dict[str, Any]] = None
    digitalTwinDeviation: Optional[Dict[str, Any]] = None
    
    # 🇱🇰 Sri Lanka EV Operational & Economic Intelligence
    sriLankaIntelligence: Optional[Dict[str, Any]] = None

class StandardApiResponse(BaseModel):
    success: bool = True
    data: Optional[Any] = None
    error: Optional[Dict[str, Any]] = None
    meta: Optional[Dict[str, Any]] = None
