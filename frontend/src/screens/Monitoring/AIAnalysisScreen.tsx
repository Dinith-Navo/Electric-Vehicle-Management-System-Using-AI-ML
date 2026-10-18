import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { CheckCircle2, Cpu, ShieldAlert, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react-native';
import { anomalyApi } from '../../api/client';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { useVehicleStore } from '../../store/useVehicleStore';
import { AnomalyResponse } from '../../types/anomaly';
import { Colors, SeverityColors } from '../../constants/theme';

const PIPELINE_STEPS = [
  "1. Validating telemetry input parameters",
  "2. Assessing data quality & sensor bounds",
  "3. Sanitize & preprocess telemetry vectors",
  "4. Feature engineering (16 derived features)",
  "5. Operating context analysis",
  "6. Model 1: Isolation Forest inference",
  "7. Model 2: One-Class SVM decision evaluation",
  "8. Model 3: Deep Autoencoder reconstruction",
  "9. Score evidence normalization",
  "10. Ensemble score aggregation & agreement ratio",
  "11. Temporal persistence & window analysis",
  "12. Independent confidence score calculation",
  "13. Severity matrix assessment",
  "14. Explainable AI & Diagnostic Interpretation",
  "15. Final evaluation & Firestore sync"
];

export const AIAnalysisScreen = ({ navigation }: any) => {
  const { selectedVehicleId } = useVehicleStore();
  const { tickTelemetry } = useSimulatorStore();

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnomalyResponse | null>(null);

  const startAnalysis = async () => {
    setIsRunning(true);
    setCurrentStepIndex(0);
    setAnalysisResult(null);

    const telemetry = tickTelemetry(selectedVehicleId);

    // Stream step-by-step progress UI reflecting actual pipeline execution
    for (let i = 0; i < PIPELINE_STEPS.length - 1; i++) {
      setCurrentStepIndex(i);
      await new Promise(res => setTimeout(res, 100));
    }

    try {
      const result = await anomalyApi.detect(telemetry);
      setCurrentStepIndex(PIPELINE_STEPS.length - 1);
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    startAnalysis();
  }, []);

  const isNormal = analysisResult?.operatingStatus === 'NORMAL';
  const severityColor = analysisResult ? SeverityColors[analysisResult.severity] : Colors.primary;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>AI Operational Analysis</Text>
          <Text style={styles.subtitle}>End-to-End Anomaly Pipeline Execution</Text>
        </View>
        <TouchableOpacity style={styles.runButton} onPress={startAnalysis} disabled={isRunning}>
          <RefreshCw size={16} color={Colors.background} style={{ marginRight: 6 }} />
          <Text style={styles.runButtonText}>{isRunning ? 'Analyzing...' : 'Re-Run AI'}</Text>
        </TouchableOpacity>
      </View>

      {/* Pipeline Steps Tracker Card */}
      <View style={styles.stepsCard}>
        <Text style={styles.stepsTitle}>15-Step ML Pipeline Execution</Text>
        {PIPELINE_STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex || (!isRunning && analysisResult !== null);
          const isCurrent = idx === currentStepIndex && isRunning;
          return (
            <View key={idx} style={styles.stepItem}>
              {isDone ? (
                <CheckCircle2 size={16} color={Colors.status.NORMAL} />
              ) : isCurrent ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <View style={styles.stepDot} />
              )}
              <Text style={[
                styles.stepText,
                isDone && styles.stepDoneText,
                isCurrent && styles.stepCurrentText
              ]}>
                {step}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Result Display Section (§13) */}
      {analysisResult && (
        <View style={[styles.resultCard, { borderColor: severityColor }]}>
          <View style={styles.resultHeader}>
            <View style={styles.resultTitleRow}>
              {isNormal ? (
                <CheckCircle2 size={24} color={Colors.status.NORMAL} />
              ) : (
                <ShieldAlert size={24} color={Colors.status.ABNORMAL} />
              )}
              <Text style={[styles.resultTitle, { color: isNormal ? Colors.status.NORMAL : Colors.status.ABNORMAL }]}>
                {isNormal ? 'NORMAL OPERATION' : 'ANOMALY DETECTED'}
              </Text>
            </View>
            <Text style={[styles.severityBadge, { backgroundColor: severityColor }]}>
              {analysisResult.severity}
            </Text>
          </View>

          <Text style={styles.alertMessage}>{analysisResult.diagnosticAlert}</Text>
          <Text style={styles.explanationText}>{analysisResult.explanation}</Text>

          {/* Key Metric Pills */}
          <View style={styles.pillsRow}>
            <View style={styles.pill}>
              <Text style={styles.pillLabel}>Score</Text>
              <Text style={styles.pillValue}>{analysisResult.anomalyScore.toFixed(2)}</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillLabel}>Confidence</Text>
              <Text style={styles.pillValue}>{(analysisResult.confidence * 100).toFixed(0)}%</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillLabel}>Agreement</Text>
              <Text style={styles.pillValue}>{analysisResult.ensembleResult.modelAgreementText}</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillLabel}>Category</Text>
              <Text style={styles.pillValue}>{analysisResult.category}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => navigation.navigate('AnomalyDetail', { anomalyId: analysisResult.anomalyId })}
          >
            <Text style={styles.detailButtonText}>Inspect Detailed XAI & Model Evidence</Text>
            <ArrowRight size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 12, color: Colors.textSecondary },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  runButtonText: { fontSize: 12, fontWeight: '700', color: Colors.background },

  stepsCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 20
  },
  stepsTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  stepItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.surfaceBorder, marginHorizontal: 4 },
  stepText: { fontSize: 12, color: Colors.textMuted, marginLeft: 10 },
  stepDoneText: { color: Colors.textSecondary },
  stepCurrentText: { color: Colors.primary, fontWeight: '700' },

  resultCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 20
  },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resultTitleRow: { flexDirection: 'row', alignItems: 'center' },
  resultTitle: { fontSize: 16, fontWeight: '800', marginLeft: 8 },
  severityBadge: { fontSize: 11, fontWeight: '800', color: '#ffffff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  alertMessage: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  explanationText: { fontSize: 12, color: Colors.textSecondary, marginBottom: 14, lineHeight: 18 },

  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 14 },
  pill: {
    width: '48%',
    backgroundColor: Colors.surface,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8
  },
  pillLabel: { fontSize: 10, color: Colors.textMuted },
  pillValue: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },

  detailButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder
  },
  detailButtonText: { fontSize: 13, color: Colors.primary, fontWeight: '600' }
});
