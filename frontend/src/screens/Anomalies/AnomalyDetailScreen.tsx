import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  Activity, 
  Clock, 
  ArrowLeft, 
  Dna, 
  GitCommit, 
  Scale, 
  Timer, 
  Layers, 
  ChevronRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react-native';
import { anomalyApi } from '../../api/client';
import { Colors, SeverityColors } from '../../constants/theme';

export const AnomalyDetailScreen = ({ route, navigation }: any) => {
  const { anomalyId } = route.params || {};

  const { data: anomaly, isLoading } = useQuery({
    queryKey: ['anomalyDetail', anomalyId],
    queryFn: () => anomalyApi.getById(anomalyId),
    enabled: !!anomalyId
  });

  if (isLoading || !anomaly) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading AI Neural Forensics Report...</Text>
      </View>
    );
  }

  const isNormal = anomaly.operatingStatus === 'NORMAL';
  const severityColor = SeverityColors[anomaly.severity] || Colors.primary;
  const dna = anomaly.anomalyDNA;
  const causal = anomaly.causalChain;
  const horizon = anomaly.predictiveHorizon;
  const disagreement = anomaly.disagreementForensics;
  const twin = anomaly.digitalTwinDeviation;

  const getBarcodeColor = (val: number) => {
    if (val > 0.8) return '#ef4444';
    if (val > 0.6) return '#f97316';
    if (val > 0.4) return '#06b6d4';
    if (val > 0.2) return '#6366f1';
    return '#a855f7';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>Neural Forensic Diagnostic</Text>
          <Text style={styles.subtitle}>ID: {anomaly.anomalyId} | {new Date(anomaly.timestamp).toLocaleTimeString()}</Text>
        </View>
      </View>

      {/* Main Status Hero */}
      <View style={[styles.heroCard, { borderColor: severityColor }]}>
        <View style={styles.heroRow}>
          <View style={styles.statusRow}>
            {isNormal ? (
              <CheckCircle2 size={24} color={Colors.status.NORMAL} />
            ) : (
              <ShieldAlert size={24} color={Colors.status.ABNORMAL} />
            )}
            <Text style={[styles.statusTitle, { color: isNormal ? Colors.status.NORMAL : Colors.status.ABNORMAL }]}>
              {anomaly.operatingStatus}
            </Text>
          </View>
          <Text style={[styles.severityBadge, { backgroundColor: severityColor }]}>
            {anomaly.severity}
          </Text>
        </View>

        <Text style={styles.alertText}>{anomaly.diagnosticAlert}</Text>
        <Text style={styles.actionText}>Recommended Action: {anomaly.suggestedAction}</Text>
      </View>

      {/* 🔥 FEATURE 1: ANOMALY DNA FINGERPRINT CARD */}
      {dna && (
        <TouchableOpacity 
          style={styles.dnaCard}
          onPress={() => navigation.navigate('AnomalyDNA', { dna, anomalyId: anomaly.anomalyId })}
        >
          <View style={styles.dnaHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Dna size={18} color={Colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.dnaTitle}>Anomaly DNA Signature</Text>
            </View>
            <View style={styles.strainPill}>
              <Text style={styles.strainPillText}>{dna.strainType}</Text>
            </View>
          </View>

          {/* Barcode Strip */}
          <View style={styles.barcodeVisualContainer}>
            {dna.barcode.map((val, idx) => (
              <View
                key={idx}
                style={[
                  styles.barcodeStrip,
                  {
                    height: 12 + val * 24,
                    backgroundColor: getBarcodeColor(val),
                    opacity: 0.4 + val * 0.6
                  }
                ]}
              />
            ))}
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.hashSnippet}>Hash: {dna.fingerprintHash.slice(0, 24)}...</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.dnaLinkText}>Inspect Genome</Text>
              <ChevronRight size={14} color={Colors.primary} />
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* 🔥 FEATURE 4: PREDICTIVE HORIZON & TIME-TO-FAILURE COUNTDOWN */}
      {horizon && (() => {
        const isCritical = horizon.urgencyLevel === 'CRITICAL_IMMINENT';
        const isElevated = horizon.urgencyLevel === 'ELEVATED_RISK';
        const isNominal = horizon.urgencyLevel === 'NOMINAL_SAFE' || horizon.urgencyLevel === 'STABLE';
        const urgencyColor = isCritical ? '#ef4444' : isElevated ? '#f59e0b' : '#10b981';
        return (
          <View style={[styles.horizonCard, { borderColor: urgencyColor }]}>
            <View style={styles.horizonHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Timer size={18} color={urgencyColor} style={{ marginRight: 6 }} />
                <Text style={styles.horizonTitle}>Predictive Failure Horizon</Text>
              </View>
              <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor }]}>
                <Text style={styles.urgencyText}>{horizon.urgencyLevel.replace('_', ' ')}</Text>
              </View>
            </View>

            <View style={styles.countdownRow}>
              <View>
                <Text style={styles.countdownLabel}>
                  {isNominal ? 'SAFE OPERATIONAL WINDOW:' : 'ESTIMATED TIME TO CRITICAL:'}
                </Text>
                <Text style={[styles.countdownValue, { color: urgencyColor }]}>
                  {horizon.countdownFormatted}
                </Text>
              </View>
              <View style={styles.gradientBox}>
                <Text style={styles.countdownLabel}>STABILITY TRAJECTORY:</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  {horizon.projectedEscalation ? (
                    <TrendingUp size={16} color="#ef4444" style={{ marginRight: 4 }} />
                  ) : (
                    <TrendingDown size={16} color="#10b981" style={{ marginRight: 4 }} />
                  )}
                  <Text style={[styles.gradientText, { color: horizon.projectedEscalation ? '#ef4444' : '#10b981' }]}>
                    {horizon.projectedEscalation ? '+Escalating' : 'Decaying / Safe Envelope'}
                  </Text>
                </View>
              </View>
            </View>

          {/* Severity Trajectory Spark Horizon (T+0s -> T+300s) */}
          <Text style={styles.trajectoryLabel}>FORWARD SEVERITY TRAJECTORY (T+30s to T+300s):</Text>
          <View style={styles.trajectoryRow}>
            {horizon.severityTrajectory.map((pt, idx) => (
              <View key={idx} style={styles.trajPoint}>
                <Text style={styles.trajTime}>T+{pt.timeOffsetSeconds}s</Text>
                <View style={[styles.trajBar, { height: Math.max(12, pt.predictedScore * 38), backgroundColor: SeverityColors[pt.predictedSeverity] || Colors.primary }]} />
                <Text style={styles.trajScore}>{pt.predictedScore.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>
        );
      })()}

      {/* 🔥 FEATURE 3: CAUSAL INFERENCE ENGINE — ROOT CAUSE & CASCADE TIMELINE */}
      {causal && (
        <View style={styles.causalCard}>
          <View style={styles.causalHeader}>
            <GitCommit size={18} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.causalTitle}>Causal Inference Chain (Granger DAG)</Text>
          </View>
          <Text style={styles.causalNarrative}>{causal.narrativeSummary}</Text>

          <View style={styles.timelineContainer}>
            {causal.nodes.map((node, idx) => {
              const isRoot = node.role === 'ROOT_TRIGGER';
              const isLast = idx === causal.nodes.length - 1;
              return (
                <View key={idx} style={styles.timelineNodeRow}>
                  <View style={styles.timelineLeftCol}>
                    <View style={[styles.timelineDot, isRoot && styles.timelineDotRoot]} />
                    {!isLast && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.nodeHeader}>
                      <Text style={[styles.nodeLabel, isRoot && { color: '#ef4444' }]}>{node.label}</Text>
                      <Text style={styles.nodeLag}>T - {node.lagSeconds}s</Text>
                    </View>
                    <Text style={styles.nodeDetails}>
                      Role: <Text style={{ fontWeight: '700', color: Colors.textPrimary }}>{node.role.replace('_', ' ')}</Text> | Dev: +{node.deviationMagnitude}% | Transfer Entropy: {node.transferEntropy}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 🔥 FEATURE 5: CROSS-MODEL DISAGREEMENT FORENSICS & ARBITRATION */}
      {disagreement && (
        <View style={styles.arbitrationCard}>
          <View style={styles.arbitrationHeader}>
            <Scale size={18} color="#a855f7" style={{ marginRight: 6 }} />
            <Text style={styles.arbitrationTitle}>Cross-Model Disagreement Forensics</Text>
          </View>

          <View style={styles.arbVerdictBox}>
            <Text style={styles.arbTag}>AUTHORITATIVE ARBITER: {disagreement.authoritativeModel.toUpperCase()}</Text>
            <Text style={styles.arbVerdictText}>{disagreement.arbitrationVerdict}</Text>
          </View>

          {/* Model Perspectives Comparison */}
          {disagreement.divergencePerspectives.map((p, idx) => (
            <View key={idx} style={styles.perspectiveRow}>
              <View style={styles.persHeader}>
                <Text style={styles.persModelName}>{p.modelName}</Text>
                <View style={[styles.votePill, { backgroundColor: p.vote === 'ANOMALY' ? '#ef4444' : '#10b981' }]}>
                  <Text style={styles.votePillText}>{p.vote} ({p.evidenceScore.toFixed(2)})</Text>
                </View>
              </View>
              <Text style={styles.persText}>{p.perspective}</Text>
              <Text style={styles.persBlindspot}>Risk Blindspot: {p.blindspotRisk}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 🔥 FEATURE 7: DIGITAL TWIN SANDBOX PROFILE */}
      {twin && (
        <View style={styles.twinCard}>
          <View style={styles.twinHeader}>
            <Layers size={18} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.twinTitle}>Digital Twin Baseline Sandbox</Text>
          </View>
          <Text style={styles.twinDesc}>
            Learned individual normal behavior profile for vehicle {twin.vehicleId}.
          </Text>

          <View style={styles.twinMetricsRow}>
            <View style={styles.twinMetricBox}>
              <Text style={styles.twinMLabel}>Twin Mahalanobis Distance</Text>
              <Text style={[styles.twinMVal, { color: twin.isTwinAnomalous ? '#ef4444' : '#10b981' }]}>
                {twin.twinDistance.toFixed(2)}σ
              </Text>
              <Text style={styles.twinMSub}>{twin.isTwinAnomalous ? 'Outside Twin Envelope' : 'Within Normal Profile'}</Text>
            </View>

            <View style={styles.twinMetricBox}>
              <Text style={styles.twinMLabel}>Twin Health Score</Text>
              <Text style={[styles.twinMVal, { color: Colors.primary }]}>{twin.twinHealthScore}%</Text>
              <Text style={styles.twinMSub}>Learned Impedance State</Text>
            </View>
          </View>
        </View>
      )}

      {/* Affected Parameters Table */}
      <Text style={styles.sectionHeader}>Affected Subsystem Parameters</Text>
      {anomaly.affectedParameters.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardBody}>No individual parameter bounds were breached.</Text>
        </View>
      ) : (
        anomaly.affectedParameters.map((p, idx) => (
          <View key={idx} style={styles.paramCard}>
            <View style={styles.pHeader}>
              <Text style={styles.pName}>{p.parameter}</Text>
              <Text style={[styles.pContrib, p.contribution === 'STRONG' && { color: Colors.status.ABNORMAL }]}>
                {p.contribution} CONTRIBUTION
              </Text>
            </View>

            <View style={styles.pDetailsRow}>
              <Text style={styles.pDetail}>Current: <Text style={styles.boldVal}>{p.currentValue}</Text></Text>
              <Text style={styles.pDetail}>Reference: <Text style={styles.boldVal}>{p.referenceValue}</Text></Text>
              <Text style={styles.pDetail}>Dev: <Text style={[styles.boldVal, { color: severityColor }]}>+{p.deviationPercentage}% ({p.direction})</Text></Text>
            </View>
          </View>
        ))
      )}

      {/* Audit Meta */}
      <View style={styles.auditBox}>
        <Text style={styles.auditText}>AI Engine v2.0 | Neural Forensics Online | Quality: {((anomaly.dataQuality ?? 1) * 100).toFixed(0)}%</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backButton: { padding: 8, backgroundColor: Colors.surfaceCard, borderRadius: 8 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 11, color: Colors.textMuted },

  heroCard: { backgroundColor: Colors.surfaceCard, borderRadius: 14, padding: 16, borderWidth: 1.5, marginBottom: 14 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusTitle: { fontSize: 18, fontWeight: '800', marginLeft: 8 },
  severityBadge: { fontSize: 11, fontWeight: '800', color: '#ffffff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  alertText: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  actionText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },

  dnaCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginBottom: 14
  },
  dnaHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dnaTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  strainPill: { backgroundColor: 'rgba(6, 182, 212, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  strainPillText: { fontSize: 10, fontWeight: '800', color: Colors.primary },
  barcodeVisualContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 38,
    backgroundColor: '#070b12',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8
  },
  barcodeStrip: { width: 5, borderRadius: 1.5 },
  hashSnippet: { fontSize: 10, color: Colors.textMuted, fontFamily: 'monospace' },
  dnaLinkText: { fontSize: 11, fontWeight: '700', color: Colors.primary, marginRight: 2 },

  horizonCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f59e0b',
    marginBottom: 14
  },
  horizonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  horizonTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  urgencyBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  urgencyText: { fontSize: 9, fontWeight: '800', color: '#ffffff' },
  countdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  countdownLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '700' },
  countdownValue: { fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  gradientBox: { alignItems: 'flex-end' },
  gradientText: { fontSize: 11, fontWeight: '700' },
  trajectoryLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '700', marginBottom: 6 },
  trajectoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 60, backgroundColor: Colors.surface, padding: 8, borderRadius: 8 },
  trajPoint: { alignItems: 'center', width: '18%' },
  trajBar: { width: 8, borderRadius: 4, marginBottom: 4 },
  trajTime: { fontSize: 8, color: Colors.textMuted, marginBottom: 2 },
  trajScore: { fontSize: 9, fontWeight: '700', color: Colors.textSecondary },

  causalCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 14
  },
  causalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  causalTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  causalNarrative: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17, marginBottom: 12 },
  timelineContainer: { marginTop: 4 },
  timelineNodeRow: { flexDirection: 'row' },
  timelineLeftCol: { width: 24, alignItems: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary, marginTop: 4 },
  timelineDotRoot: { backgroundColor: '#ef4444', width: 12, height: 12, borderRadius: 6 },
  timelineLine: { width: 2, flex: 1, backgroundColor: Colors.surfaceBorder },
  timelineContent: { flex: 1, paddingBottom: 14 },
  nodeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nodeLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  nodeLag: { fontSize: 10, fontWeight: '800', color: Colors.primary },
  nodeDetails: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  arbitrationCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#a855f7',
    marginBottom: 14
  },
  arbitrationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  arbitrationTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  arbVerdictBox: {
    backgroundColor: Colors.surface,
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#a855f7',
    marginBottom: 10
  },
  arbTag: { fontSize: 9, fontWeight: '800', color: '#a855f7', marginBottom: 3 },
  arbVerdictText: { fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },
  perspectiveRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.surfaceBorder },
  persHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  persModelName: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  votePill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  votePillText: { fontSize: 9, fontWeight: '800', color: '#ffffff' },
  persText: { fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },
  persBlindspot: { fontSize: 10, color: Colors.textMuted, fontStyle: 'italic', marginTop: 2 },

  twinCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 14
  },
  twinHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  twinTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  twinDesc: { fontSize: 11, color: Colors.textSecondary, marginBottom: 10 },
  twinMetricsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  twinMetricBox: { width: '48%', backgroundColor: Colors.surface, padding: 10, borderRadius: 8 },
  twinMLabel: { fontSize: 10, color: Colors.textMuted },
  twinMVal: { fontSize: 18, fontWeight: '800', marginVertical: 2 },
  twinMSub: { fontSize: 9, color: Colors.textSecondary },

  sectionHeader: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  card: { backgroundColor: Colors.surfaceCard, borderRadius: 12, padding: 14, marginBottom: 14 },
  cardBody: { fontSize: 12, color: Colors.textSecondary },

  paramCard: { backgroundColor: Colors.surfaceCard, borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.surfaceBorder },
  pHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  pName: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  pContrib: { fontSize: 10, fontWeight: '800', color: Colors.textMuted },
  pDetailsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pDetail: { fontSize: 11, color: Colors.textSecondary },
  boldVal: { color: Colors.textPrimary, fontWeight: '700' },

  auditBox: { alignItems: 'center', marginTop: 10 },
  auditText: { fontSize: 10, color: Colors.textMuted }
});
