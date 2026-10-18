import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { researchApi } from '../../api/client';
import { Colors } from '../../constants/theme';

export const ModelComparisonScreen = ({ navigation }: { navigation?: any } = {}) => {
  const { data: comp } = useQuery({
    queryKey: ['modelComparison'],
    queryFn: () => researchApi.getModelComparison()
  });

  const { data: ablation } = useQuery({
    queryKey: ['ablationStudy'],
    queryFn: () => researchApi.getAblationStudy()
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>ML Model Benchmark & Ablation Study</Text>
      <Text style={styles.subtitle}>Isolation Forest vs One-Class SVM vs Deep Autoencoder (§56, §70)</Text>

      {/* Model Benchmark Cards */}
      {comp?.models?.map((m: any) => (
        <View key={m.id} style={styles.card}>
          <View style={styles.cHeader}>
            <Text style={styles.mName}>{m.name}</Text>
            <Text style={styles.mType}>{m.type}</Text>
          </View>

          <Text style={styles.mSub}>Status: <Text style={styles.boldVal}>{m.status}</Text> | Weight: <Text style={styles.boldVal}>{(m.weightInEnsemble * 100).toFixed(0)}%</Text></Text>
          <Text style={styles.mSub}>Inference Latency: <Text style={styles.boldVal}>{m.averageInferenceTimeMs} ms</Text></Text>

          <View style={styles.metricsRow}>
            <View style={styles.mBox}>
              <Text style={styles.mBoxLabel}>Precision</Text>
              <Text style={styles.mBoxVal}>{m.precision}</Text>
            </View>
            <View style={styles.mBox}>
              <Text style={styles.mBoxLabel}>Recall</Text>
              <Text style={styles.mBoxVal}>{m.recall}</Text>
            </View>
            <View style={styles.mBox}>
              <Text style={styles.mBoxLabel}>F1 Score</Text>
              <Text style={styles.mBoxVal}>{m.f1Score}</Text>
            </View>
            <View style={styles.mBox}>
              <Text style={styles.mBoxLabel}>ROC-AUC</Text>
              <Text style={styles.mBoxVal}>{m.rocAuc}</Text>
            </View>
          </View>
        </View>
      ))}

      {/* Ablation Study Table (§70) */}
      <Text style={styles.sectionHeader}>Ablation Study (Parameter-Drop Impact)</Text>
      <View style={styles.card}>
        <Text style={styles.cardSub}>Baseline Full Feature F1-Score: <Text style={styles.boldVal}>{ablation?.baselineF1}</Text></Text>
        {ablation?.ablationExperiments?.map((item: any, idx: number) => (
          <View key={idx} style={styles.abRow}>
            <View>
              <Text style={styles.abParam}>Withheld: {item.removedParameter}</Text>
              <Text style={styles.abSub}>Ablated F1: {item.ablatedF1} (Drop: -{item.f1ScoreDrop})</Text>
            </View>
            <Text style={[styles.abPct, item.criticality === 'HIGH' ? { color: '#ef4444' } : { color: '#f59e0b' }]}>
              -{item.performanceDegradationPct}%
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginBottom: 16 },

  sectionHeader: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10, marginTop: 10 },

  card: { backgroundColor: Colors.surfaceCard, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.surfaceBorder },
  cHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  mName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  mType: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  mSub: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  cardSub: { fontSize: 12, color: Colors.textSecondary, marginBottom: 12 },
  boldVal: { color: Colors.primary, fontWeight: '700' },

  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  mBox: { width: '23%', backgroundColor: Colors.surface, padding: 8, borderRadius: 8, alignItems: 'center' },
  mBoxLabel: { fontSize: 10, color: Colors.textMuted },
  mBoxVal: { fontSize: 12, fontWeight: '800', color: Colors.primary, marginTop: 2 },

  abRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  abParam: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  abSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  abPct: { fontSize: 14, fontWeight: '800' }
});
