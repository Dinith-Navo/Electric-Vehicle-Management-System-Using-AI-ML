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

// 🧬 Revolutionary Forensics Interfaces

export interface DominantGene {
  gene: string;
  strength: number;
  deviationMagnitude: number;
  reconstructionError: number;
  expression: 'OVEREXPRESSED' | 'UNDEREXPRESSED';
}

export interface AnomalyDNA {
  fingerprintHash: string;
  barcode: number[];
  strainType: string;
  mutationScore: number;
  dominantGenes: DominantGene[];
}

export interface GenomeRecord {
  genomeId: string;
  strainName: string;
  fingerprintHash: string;
  barcode: number[];
  rootCause: string;
  recommendedPlaybook: string;
  severity: string;
  firstDiscovered: string;
  occurrenceCount: number;
  matchedVehicles: string[];
  dominantGenes: string[];
}

export interface GenomeMatch {
  similarity: number;
  record: GenomeRecord;
}

export interface CausalNode {
  parameter: string;
  label: string;
  lagSeconds: number;
  deviationMagnitude: number;
  role: 'ROOT_TRIGGER' | 'INTERMEDIATE_CASCADE' | 'FINAL_SYMPTOM';
  p_value: number;
  transferEntropy: number;
  unit: string;
}

export interface CausalEdge {
  source: string;
  target: string;
  strength: number;
  timeLagSeconds: number;
  confidence: number;
  description: string;
}

export interface CausalChainResult {
  rootTrigger: string;
  confidence: number;
  narrativeSummary: string;
  nodes: CausalNode[];
  edges: CausalEdge[];
}

export interface TrajectoryPoint {
  timeOffsetSeconds: number;
  predictedScore: number;
  predictedSeverity: string;
  confidenceLower: number;
  confidenceUpper: number;
}

export interface PredictiveHorizon {
  estimatedTimeToFailureSeconds: number | null;
  countdownFormatted: string;
  urgencyLevel: 'CRITICAL_IMMINENT' | 'ELEVATED_RISK' | 'MONITORING' | 'STABLE' | 'NOMINAL_SAFE';
  triggerParameter: string;
  currentGradientPerSecond: number;
  criticalThreshold: number;
  projectedEscalation: boolean;
  severityTrajectory: TrajectoryPoint[];
}

export interface ModelDivergencePerspective {
  modelName: string;
  vote: 'ANOMALY' | 'NORMAL';
  evidenceScore: number;
  perspective: string;
  primarySensitivityFeature: string;
  blindspotRisk: string;
}

export interface DisagreementForensics {
  agreementState: string;
  consensusStrength: number;
  authoritativeModel: string;
  arbitrationVerdict: string;
  divergencePerspectives: ModelDivergencePerspective[];
  dissentingModel: string;
}

export interface DigitalTwinDeviation {
  vehicleId: string;
  twinDistance: number;
  twinHealthScore: number;
  isTwinAnomalous: boolean;
  outlierParameters: string[];
  parameterDeviations?: Record<string, {
    current: number;
    learnedTwinMean: number;
    zScore: number;
    isTwinOutlier: boolean;
  }>;
}

// Adversarial Lab Types
export interface ModelRobustnessScorecard {
  modelName: string;
  robustnessScore: number;
  evasionRate: number;
  breakdownEpsilon: number;
  vulnerabilityLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  weakestFeature: string;
  recommendedHardening: string;
}

export interface CampaignCurvePoint {
  epsilon: number;
  isolationForestAccuracy: number;
  oneClassSVMAccuracy: number;
  autoencoderAccuracy: number;
  ensembleAccuracy: number;
}

export interface AdversarialCampaignResult {
  campaignId: string;
  timestamp: string;
  totalAttacksRun: number;
  attackType: string;
  scorecards: ModelRobustnessScorecard[];
  campaignCurve: CampaignCurvePoint[];
  mostResilientModel: string;
  mostVulnerableModel: string;
  executiveSummary: string;
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

  // 🧬 Revolutionary Forensics Fields
  anomalyDNA?: AnomalyDNA;
  genomeMatches?: GenomeMatch[];
  causalChain?: CausalChainResult;
  predictiveHorizon?: PredictiveHorizon;
  disagreementForensics?: DisagreementForensics;
  digitalTwinDeviation?: DigitalTwinDeviation;

  // 🇱🇰 Sri Lanka EV Operational & Economic Intelligence
  sriLankaIntelligence?: SriLankaIntelligence;
}

export interface SriLankaIntelligence {
  tropicalThermalIndex: number;
  monsoonInsulationState: 'NOMINAL' | 'MONSOON_MOISTURE_WARNING' | 'CRITICAL_INGRESS';
  insulationResistanceMOhm: number;
  cebTariffWindow: string;
  cebCurrentCostPerKwh: number;
  cebPeakAvoidanceSavingLkr: number;
  estimatedFailureRepairCostLkr: number;
  repackImbalanceMv: number;
  advisoryEnglish: string;
  advisorySinhala: string;
  advisoryTamil: string;
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
