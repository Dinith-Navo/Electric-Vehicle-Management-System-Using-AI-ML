export type OperatingStatus = 'NORMAL' | 'ABNORMAL';

export type SeverityLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AnomalyCategory =
  | 'THERMAL'
  | 'ELECTRICAL'
  | 'MOTOR'
  | 'CHARGING'
  | 'POWER_CONSUMPTION'
  | 'UNKNOWN_OPERATIONAL'
  | 'COMBINED_OPERATIONAL';

export interface AffectedParameter {
  parameter: string;
  currentValue: number;
  referenceValue: number;
  deviationPercentage: number;
  direction: 'HIGH' | 'LOW';
  contribution: 'STRONG' | 'MODERATE' | 'WEAK';
}

export interface ModelEvidence {
  evidence: number;
  rawScore: number;
  prediction: number;
  details?: Record<string, any>;
}

export interface ModelResults {
  isolationForest: ModelEvidence;
  oneClassSVM: ModelEvidence;
  autoencoder: ModelEvidence;
}

export interface EnsembleResult {
  ensembleScore: number;
  modelAgreementRatio: number;
  modelAgreementText: string;
  modelPredictions: Record<string, string>;
}

export interface TemporalAnalysisResult {
  consecutiveAbnormalCount: number;
  persistenceDurationSeconds: number;
  trend: 'STABLE' | 'INCREASING' | 'DECREASING' | 'TRANSIENT';
  isPersistent: boolean;
}

export interface AnomalyResponse {
  anomalyId: string;
  vehicleId: string;
  timestamp: string;
  operatingStatus: OperatingStatus;
  anomalyScore: number;
  confidence: number;
  severity: SeverityLevel;
  category: AnomalyCategory;
  affectedParameters: AffectedParameter[];
  diagnosticAlert: string;
  suggestedAction: string;
  explanation: string;
  modelResults: ModelResults;
  ensembleResult: EnsembleResult;
  temporalAnalysis: TemporalAnalysisResult;
  dataQuality: number;
  modelVersion: string;
  createdAt: string;
}

export interface StandardApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    requestId: string;
    [key: string]: any;
  };
}
