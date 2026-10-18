import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Cpu, Activity, Zap, CheckCircle2, ArrowRight } from 'lucide-react-native';
import { researchApi } from '../../api/client';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { Colors } from '../../constants/theme';

export const ResearchModeScreen = ({ navigation }: any) => {
  const { currentTelemetry } = useSimulatorStore();

  const { data: researchData } = useQuery({
    queryKey: ['researchInspect', currentTelemetry],
    queryFn: () => researchApi.inspectPipeline(currentTelemetry)
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Academic Research Mode</Text>
          <Text style={styles.subtitle}>SHAP Attributions & Feature Vector Inspection</Text>
        </View>
        <TouchableOpacity style={styles.compBtn} onPress={() => navigation.navigate('ModelComparison')}>
          <Text style={styles.compBtnText}>Model Comparison →</Text>
        </TouchableOpacity>
      </View>

      {/* Latency Performance Box */}
      <View style={styles.perfCard}>
        <Cpu size={20} color={Colors.primary} />
        <Text style={styles.perfText}>Pipeline Execution Latency: <Text style={styles.boldVal}>{researchData?.processingTimeMs ?? 0} ms</Text></Text>
      </View>

      {/* Shapley Feature Importance Attributions */}
      <Text style={styles.sectionHeader}>Top Shapley Feature Attributions (SHAP XAI)</Text>
      <View style={styles.card}>
        {researchData?.shapleyFeatureAttributions?.map((item: any, idx: number) => (
          <View key={idx} style={styles.shapRow}>
            <Text style={styles.shapName}>{idx + 1}. {item.parameter}</Text>
            <Text style={styles.shapVal}>{item.importancePercentage}% ({item.shapleyValue})</Text>
          </View>
        ))}
      </View>

      {/* 16 Engineered Features Table (§19) */}
      <Text style={styles.sectionHeader}>Engineered Derived Features (16 Parameters)</Text>
      <View style={styles.card}>
        {Object.entries(researchData?.engineeredFeatures || {}).map(([key, value]: any) => (
          <View key={key} style={styles.featureRow}>
            <Text style={styles.featureName}>{key}</Text>
            <Text style={styles.featureVal}>{typeof value === 'number' ? value.toFixed(3) : String(value)}</Text>
          </View>
        ))}
      </View>

      {/* Individual Model Output Evidence */}
      <Text style={styles.sectionHeader}>Individual Model Evidence Breakdown</Text>
      <View style={styles.card}>
        <View style={styles.mRow}>
          <Text style={styles.mTitle}>Isolation Forest (Colab Trained)</Text>
          <Text style={styles.mVal}>Evidence: {researchData?.normalizedEvidence?.isolationForest} (Raw: {researchData?.modelOutputs?.isolationForest?.rawScore})</Text>
        </View>
        <View style={styles.mRow}>
          <Text style={styles.mTitle}>One-Class SVM</Text>
          <Text style={styles.mVal}>Evidence: {researchData?.normalizedEvidence?.oneClassSVM} (Raw: {researchData?.modelOutputs?.oneClassSVM?.rawScore})</Text>
        </View>
        <View style={styles.mRow}>
          <Text style={styles.mTitle}>Deep Autoencoder</Text>
          <Text style={styles.mVal}>Evidence: {researchData?.normalizedEvidence?.autoencoder} (MSE: {researchData?.modelOutputs?.autoencoder?.reconstructionError})</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 12, color: Colors.textSecondary },
  compBtn: { backgroundColor: Colors.surfaceCard, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.surfaceBorder },
  compBtnText: { fontSize: 11, fontWeight: '700', color: Colors.primary },

  perfCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceCard, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.surfaceBorder, marginBottom: 16 },
  perfText: { fontSize: 13, color: Colors.textSecondary, marginLeft: 10 },
  boldVal: { color: Colors.primary, fontWeight: '800' },

  sectionHeader: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  card: { backgroundColor: Colors.surfaceCard, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.surfaceBorder },

  shapRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  shapName: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  shapVal: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  featureRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  featureName: { fontSize: 12, color: Colors.textSecondary },
  featureVal: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },

  mRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  mTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  mVal: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 }
});
