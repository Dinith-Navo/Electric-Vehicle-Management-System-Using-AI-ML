import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Activity, ShieldAlert, Cpu, CheckCircle2, AlertTriangle, Zap, Thermometer, Gauge, ArrowUpRight, ChevronRight, RefreshCw } from 'lucide-react-native';
import { anomalyApi, telemetryApi } from '../../api/client';
import { useVehicleStore } from '../../store/useVehicleStore';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { Colors, SeverityColors } from '../../constants/theme';

export const DashboardScreen = ({ navigation }: any) => {
  const { selectedVehicleId } = useVehicleStore();
  const { currentTelemetry, tickTelemetry } = useSimulatorStore();

  // Query latest anomaly evaluation
  const { data: latestAnomaly, isLoading, refetch } = useQuery({
    queryKey: ['latestAnomaly', selectedVehicleId],
    queryFn: async () => {
      const telemetry = tickTelemetry(selectedVehicleId);
      return await anomalyApi.detect(telemetry);
    },
    refetchInterval: 5000
  });

  const isNormal = latestAnomaly?.operatingStatus === 'NORMAL';
  const severity = latestAnomaly?.severity || 'NONE';
  const severityColor = SeverityColors[severity] || Colors.primary;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>EV Anomaly Detection</Text>
          <Text style={styles.subtitle}>Vehicle ID: <Text style={styles.vehicleHighlight}>{selectedVehicleId}</Text></Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={() => refetch()}>
          <RefreshCw size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Main Status Hero Card */}
      <View style={[styles.heroCard, { borderColor: severityColor }]}>
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.heroLabel}>AI OPERATIONAL STATUS</Text>
            <View style={styles.statusBadgeRow}>
              {isNormal ? (
                <CheckCircle2 size={24} color={Colors.status.NORMAL} />
              ) : (
                <ShieldAlert size={24} color={Colors.status.ABNORMAL} />
              )}
              <Text style={[styles.statusText, { color: isNormal ? Colors.status.NORMAL : Colors.status.ABNORMAL }]}>
                {latestAnomaly?.operatingStatus || 'NORMAL'}
              </Text>
            </View>
          </View>

          <View style={styles.severityBox}>
            <Text style={styles.heroLabel}>SEVERITY</Text>
            <Text style={[styles.severityText, { color: severityColor }]}>{severity}</Text>
          </View>
        </View>

        {/* XAI Alert message banner */}
        <View style={styles.alertBox}>
          <AlertTriangle size={16} color={severityColor} style={{ marginRight: 8 }} />
          <Text style={styles.alertText} numberOfLines={2}>
            {latestAnomaly?.diagnosticAlert || 'Analyzing EV telemetry baseline...'}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.inspectButton} 
          onPress={() => {
            if (latestAnomaly) {
              navigation.navigate('AnomaliesTab', {
                screen: 'AnomalyDetail',
                params: { anomalyId: latestAnomaly.anomalyId }
              });
            } else {
              navigation.navigate('AnomaliesTab', { screen: 'AnomalyList' });
            }
          }}
        >
          <Text style={styles.inspectButtonText}>View XAI Diagnostic Report</Text>
          <ChevronRight size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Core AI Metrics Grid */}
      <Text style={styles.sectionHeader}>AI Pipeline Metrics</Text>
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Anomaly Score</Text>
          <Text style={styles.metricValue}>{latestAnomaly?.anomalyScore.toFixed(2) ?? '0.00'}</Text>
          <View style={styles.metricBarBg}>
            <View style={[styles.metricBarFill, { width: `${(latestAnomaly?.anomalyScore ?? 0) * 100}%`, backgroundColor: severityColor }]} />
          </View>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>AI Confidence</Text>
          <Text style={styles.metricValue}>{((latestAnomaly?.confidence ?? 0) * 100).toFixed(0)}%</Text>
          <Text style={styles.metricSub}>Independent Metric</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Model Agreement</Text>
          <Text style={styles.metricValue}>{latestAnomaly?.ensembleResult?.modelAgreementText || '3/3 Models'}</Text>
          <Text style={styles.metricSub}>Ensemble Ratio</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Data Quality</Text>
          <Text style={styles.metricValue}>{((latestAnomaly?.dataQuality ?? 1) * 100).toFixed(0)}%</Text>
          <Text style={styles.metricSub}>Range & Sensor Validity</Text>
        </View>
      </View>

      {/* Telemetry Overview Cards */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionHeader}>Live Telemetry Overview</Text>
        <TouchableOpacity onPress={() => navigation.navigate('LiveTab', { screen: 'Simulator' })}>
          <Text style={styles.linkText}>Launch Simulator →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.telemetryGrid}>
        <View style={styles.telemetryCard}>
          <Zap size={18} color={Colors.primary} />
          <Text style={styles.telLabel}>Battery Voltage</Text>
          <Text style={styles.telValue}>{currentTelemetry.batteryVoltage} <Text style={styles.unit}>V</Text></Text>
        </View>

        <View style={styles.telemetryCard}>
          <Activity size={18} color={Colors.secondary} />
          <Text style={styles.telLabel}>Battery Current</Text>
          <Text style={styles.telValue}>{currentTelemetry.batteryCurrent} <Text style={styles.unit}>A</Text></Text>
        </View>

        <View style={styles.telemetryCard}>
          <Thermometer size={18} color="#f59e0b" />
          <Text style={styles.telLabel}>Motor Temp</Text>
          <Text style={styles.telValue}>{currentTelemetry.motorTemperature} <Text style={styles.unit}>°C</Text></Text>
        </View>

        <View style={styles.telemetryCard}>
          <Gauge size={18} color="#10b981" />
          <Text style={styles.telLabel}>Power Draw</Text>
          <Text style={styles.telValue}>{currentTelemetry.powerConsumption} <Text style={styles.unit}>kW</Text></Text>
        </View>
      </View>

      {/* Quick Action Navigation Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('LiveTab', { screen: 'AIAnalysis' })}>
          <Cpu size={20} color={Colors.primary} />
          <Text style={styles.actionTitle}>Run AI Analysis</Text>
          <Text style={styles.actionSub}>Step-by-step pipeline</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('ResearchTab', { screen: 'ResearchHome' })}>
          <Activity size={20} color={Colors.secondary} />
          <Text style={styles.actionTitle}>Research Mode</Text>
          <Text style={styles.actionSub}>Model comparisons</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary },
  vehicleHighlight: { color: Colors.primary, fontWeight: '600' },
  refreshButton: { padding: 8, borderRadius: 8, backgroundColor: Colors.surfaceCard },

  heroCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 20
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  heroLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.5 },
  statusBadgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusText: { fontSize: 20, fontWeight: '800', marginLeft: 8 },
  severityBox: { alignItems: 'flex-end' },
  severityText: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12
  },
  alertText: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  inspectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder
  },
  inspectButtonText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  sectionHeader: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  linkText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  metricCard: {
    width: '48%',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  metricLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  metricValue: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginVertical: 4 },
  metricSub: { fontSize: 10, color: Colors.textSecondary },
  metricBarBg: { height: 4, backgroundColor: Colors.surface, borderRadius: 2, marginTop: 4 },
  metricBarFill: { height: 4, borderRadius: 2 },

  telemetryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  telemetryCard: {
    width: '48%',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  telLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 6 },
  telValue: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },
  unit: { fontSize: 12, color: Colors.textMuted },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionCard: {
    width: '48%',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  actionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginTop: 8 },
  actionSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 }
});
