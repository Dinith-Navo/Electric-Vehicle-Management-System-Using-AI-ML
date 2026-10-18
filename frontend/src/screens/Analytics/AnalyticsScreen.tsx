import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, PieChart, TrendingUp, Activity } from 'lucide-react-native';
import { analyticsApi } from '../../api/client';
import { useVehicleStore } from '../../store/useVehicleStore';
import { Colors, SeverityColors } from '../../constants/theme';

export const AnalyticsScreen = () => {
  const { selectedVehicleId } = useVehicleStore();

  const { data: summary } = useQuery({
    queryKey: ['analyticsSummary', selectedVehicleId],
    queryFn: () => analyticsApi.getSummary(selectedVehicleId),
    refetchInterval: 5000
  });

  const { data: trends } = useQuery({
    queryKey: ['analyticsTrends', selectedVehicleId],
    queryFn: () => analyticsApi.getTrends(selectedVehicleId),
    refetchInterval: 5000
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>System Analytics & Performance</Text>
      <Text style={styles.subtitle}>Historical Anomaly Distributions & ML Pipeline Performance</Text>

      {/* Overview Stat Grid */}
      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Text style={styles.sLabel}>Total Evaluations</Text>
          <Text style={styles.sVal}>{summary?.totalAnalyses ?? 0}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.sLabel}>Detected Anomalies</Text>
          <Text style={[styles.sVal, { color: Colors.status.ABNORMAL }]}>{summary?.detectedAnomalies ?? 0}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.sLabel}>Avg Anomaly Score</Text>
          <Text style={styles.sVal}>{summary?.averageAnomalyScore?.toFixed(2) ?? '0.00'}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.sLabel}>Avg AI Confidence</Text>
          <Text style={styles.sVal}>{((summary?.averageConfidence ?? 0) * 100).toFixed(0)}%</Text>
        </View>
      </View>

      {/* Severity Breakdown Bar Representation */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Severity Distribution Breakdown</Text>
        {Object.entries(summary?.severityDistribution || {}).map(([level, count]: any) => {
          const total = summary?.totalAnalyses || 1;
          const pct = Math.round((count / total) * 100);
          const color = SeverityColors[level] || Colors.primary;
          return (
            <View key={level} style={styles.sevRow}>
              <View style={styles.sevLabelRow}>
                <Text style={styles.sevName}>{level}</Text>
                <Text style={styles.sevCount}>{count} ({pct}%)</Text>
              </View>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
              </View>
            </View>
          );
        })}
      </View>

      {/* Key Insights Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Operational Diagnostic Insights</Text>
        <Text style={styles.insightText}>Most Frequent Anomaly Subsystem: <Text style={styles.boldVal}>{summary?.mostFrequentCategory || 'None'}</Text></Text>
        <Text style={styles.insightText}>Primary Parameter Contribution: <Text style={styles.boldVal}>{summary?.mostAffectedParameter || 'None'}</Text></Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginBottom: 16 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  statCard: { width: '48%', backgroundColor: Colors.surfaceCard, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.surfaceBorder },
  sLabel: { fontSize: 11, color: Colors.textMuted },
  sVal: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginTop: 4 },

  card: { backgroundColor: Colors.surfaceCard, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.surfaceBorder },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },

  sevRow: { marginBottom: 10 },
  sevLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  sevName: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  sevCount: { fontSize: 11, color: Colors.textSecondary },
  barBg: { height: 6, backgroundColor: Colors.surface, borderRadius: 3 },
  barFill: { height: 6, borderRadius: 3 },

  insightText: { fontSize: 13, color: Colors.textSecondary, marginBottom: 8 },
  boldVal: { color: Colors.primary, fontWeight: '700' }
});
