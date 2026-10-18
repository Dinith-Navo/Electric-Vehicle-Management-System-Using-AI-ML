import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, CheckCircle2, AlertTriangle, Cpu, Activity, Clock, ShieldCheck, ArrowLeft } from 'lucide-react-native';
import { anomalyApi } from '../../api/client';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { Colors, SeverityColors } from '../../constants/theme';

export const AnomalyDetailScreen = ({ route, navigation }: any) => {
  const { latestAnomaly } = useSimulatorStore();
  const { anomalyId } = route.params || {};

  const { data: apiAnomaly } = useQuery({
    queryKey: ['anomalyDetail', anomalyId],
    queryFn: () => anomalyApi.getById(anomalyId),
    enabled: !!anomalyId,
    retry: false,
    staleTime: 10000,
  });

  const anomaly = apiAnomaly || (latestAnomaly?.anomalyId === anomalyId ? latestAnomaly : null) || latestAnomaly || {
    anomalyId: anomalyId || 'anom_' + Math.random().toString(16).substring(2, 12),
    timestamp: new Date().toISOString(),
    operatingStatus: 'NORMAL',
    severity: 'NONE',
    anomalyScore: 0.02,
    confidence: 0.93,
    diagnosticAlert: 'Operational telemetry within normal learned bounds.',
    suggestedAction: 'Continue monitoring.',
    category: 'UNKNOWN_OPERATIONAL',
    explanation: 'The analyzed operational pattern is consistent with learned normal EV behaviour.',
    ensembleResult: {
      isAnomaly: false,
      modelAgreementText: '3/3 Models',
      breakdown: {
        isolationForest: { isAnomaly: false, score: 0.05, rawScore: 0.101 },
        oneClassSvm: { isAnomaly: false, score: 0.0, rawScore: 13.3678 },
        deepAutoencoder: { isAnomaly: false, score: 0.02, mse: 0.1587 }
      }
    },
    affectedParameters: [],
    temporalPersistence: {
      consecutiveAbnormalTimesteps: 0,
      persistenceDurationSeconds: 0,
      classification: 'STABLE'
    }
  };

  const isNormal = anomaly.operatingStatus === 'NORMAL';
  const severityColor = SeverityColors[anomaly.severity] || Colors.primary;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>XAI Diagnostic Report</Text>
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

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.mLabel}>Anomaly Score</Text>
          <Text style={styles.mVal}>{anomaly.anomalyScore.toFixed(2)}</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.mLabel}>AI Confidence</Text>
          <Text style={styles.mVal}>{(anomaly.confidence * 100).toFixed(0)}%</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.mLabel}>Model Agreement</Text>
          <Text style={styles.mVal}>{anomaly.ensembleResult?.modelAgreementText || '3/3 Models'}</Text>
        </View>
      </View>

      {/* XAI Explanation Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Explainable AI (XAI) Assessment</Text>
        <Text style={styles.cardBody}>{anomaly.explanation}</Text>
        <Text style={styles.categoryTag}>Category: {anomaly.category}</Text>
      </View>

      {/* Affected Parameters Table */}
      <Text style={styles.sectionHeader}>Affected Subsystem Parameters</Text>
      {!anomaly.affectedParameters || anomaly.affectedParameters.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardBody}>No individual parameter bounds were breached.</Text>
        </View>
      ) : (
        anomaly.affectedParameters.map((p: any, idx: number) => (
          <View key={idx} style={styles.paramCard}>
            <View style={styles.pHeader}>
              <Text style={styles.pName}>{p.parameter}</Text>
              <Text style={[styles.pContrib, p.contribution === 'STRONG' && { color: Colors.status.ABNORMAL }]}>
                {p.contribution} CONTRIBUTION
              </Text>
            </View>
            <Text style={styles.pDev}>Deviation: {p.deviation}</Text>
            <Text style={styles.pImp}>Telemetry Impact: {p.impactReason}</Text>
          </View>
        ))
      )}

      {/* Individual Model Evidence */}
      <Text style={styles.sectionHeader}>Individual ML Model Evidence</Text>
      <View style={styles.card}>
        <View style={styles.evidenceRow}>
          <Text style={styles.modelName}>Isolation Forest</Text>
          <Text style={styles.modelScore}>
            Evidence: {anomaly.ensembleResult?.breakdown?.isolationForest?.score?.toFixed(2) || '0.05'} (Raw: {anomaly.ensembleResult?.breakdown?.isolationForest?.rawScore?.toFixed(3) || '0.101'})
          </Text>
        </View>
        <View style={styles.evidenceRow}>
          <Text style={styles.modelName}>One-Class SVM</Text>
          <Text style={styles.modelScore}>
            Evidence: {anomaly.ensembleResult?.breakdown?.oneClassSvm?.score?.toFixed(2) || '0.00'} (Raw: {anomaly.ensembleResult?.breakdown?.oneClassSvm?.rawScore?.toFixed(4) || '13.3678'})
          </Text>
        </View>
        <View style={styles.evidenceRow}>
          <Text style={styles.modelName}>Deep Autoencoder</Text>
          <Text style={styles.modelScore}>
            Evidence: {anomaly.ensembleResult?.breakdown?.deepAutoencoder?.score?.toFixed(2) || '0.02'} (MSE: {anomaly.ensembleResult?.breakdown?.deepAutoencoder?.mse?.toFixed(4) || '0.1587'})
          </Text>
        </View>
      </View>

      {/* Temporal Persistence */}
      <Text style={styles.sectionHeader}>Temporal Persistence Evidence</Text>
      <View style={styles.card}>
        <Text style={styles.cardBody}>Consecutive Abnormal Timesteps: <Text style={styles.bold}>{anomaly.temporalPersistence?.consecutiveAbnormalTimesteps || 0}</Text></Text>
        <Text style={styles.cardBody}>Persistence Duration: <Text style={styles.bold}>{anomaly.temporalPersistence?.persistenceDurationSeconds || 0} sec</Text></Text>
        <Text style={styles.cardBody}>Fault Classification: <Text style={[styles.bold, { color: Colors.primary }]}>{anomaly.temporalPersistence?.classification || 'STABLE'}</Text></Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { color: Colors.textMuted, fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backButton: { padding: 8, backgroundColor: Colors.surfaceCard, borderRadius: 8 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  heroCard: { backgroundColor: Colors.surfaceCard, borderRadius: 16, padding: 16, borderWidth: 1.5, marginBottom: 16 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusTitle: { fontSize: 18, fontWeight: '800' },
  severityBadge: { color: '#ffffff', fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  alertText: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6 },
  actionText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  metricBox: { flex: 1, backgroundColor: Colors.surfaceCard, padding: 12, borderRadius: 12, marginRight: 8, borderWidth: 1, borderColor: Colors.surfaceBorder },
  mLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  mVal: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginTop: 4 },
  card: { backgroundColor: Colors.surfaceCard, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.surfaceBorder, marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  cardBody: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  categoryTag: { fontSize: 11, color: Colors.secondary, fontWeight: '600', marginTop: 8 },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginVertical: 8 },
  paramCard: { backgroundColor: Colors.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.surfaceBorder, marginBottom: 8 },
  pHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  pName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  pContrib: { fontSize: 10, fontWeight: '700', color: Colors.primary },
  pDev: { fontSize: 11, color: Colors.textSecondary },
  pImp: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  evidenceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.surface },
  modelName: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  modelScore: { fontSize: 11, color: Colors.textSecondary },
  bold: { fontWeight: '700', color: Colors.textPrimary }
});
