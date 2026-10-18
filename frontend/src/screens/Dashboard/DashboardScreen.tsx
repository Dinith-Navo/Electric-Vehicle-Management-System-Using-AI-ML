import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { 
  Activity, 
  ShieldAlert, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Thermometer, 
  Gauge, 
  ChevronRight, 
  RefreshCw,
  Timer,
  Dna,
  Flame,
  TrendingUp,
  TrendingDown,
  Car
} from 'lucide-react-native';
import { anomalyApi, telemetryApi } from '../../api/client';
import { useVehicleStore } from '../../store/useVehicleStore';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { Colors, SeverityColors } from '../../constants/theme';
import { RadarTelemetryChart } from '../../components/RadarTelemetryChart';
import { SriLankaEVAnomalyEngine } from '../../components/SriLankaEVAnomalyEngine';

export const DashboardScreen = ({ navigation }: any) => {
  const { selectedVehicleId, selectedVehicle, fleet, setSelectedVehicleId } = useVehicleStore();
  const { currentTelemetry, tickTelemetry } = useSimulatorStore();

  // Continuous real-time 1-second telemetry clock
  useEffect(() => {
    const timer = setInterval(() => {
      tickTelemetry(selectedVehicleId);
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedVehicleId]);

  // Query latest anomaly evaluation with 1.2s real-time streaming
  const { data: latestAnomaly, isLoading, refetch } = useQuery({
    queryKey: ['latestAnomaly', selectedVehicleId],
    queryFn: async () => {
      return await anomalyApi.detect(currentTelemetry);
    },
    refetchInterval: 1200
  });

  const isNormal = latestAnomaly?.operatingStatus === 'NORMAL';
  const severity = latestAnomaly?.severity || 'NONE';
  const severityColor = SeverityColors[severity] || Colors.primary;
  const horizon = latestAnomaly?.predictiveHorizon;
  const dna = latestAnomaly?.anomalyDNA;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🇱🇰 Sri Lankan EV Intelligence</Text>
          <Text style={styles.subtitle}>
            Active Fleet Unit: <Text style={styles.vehicleHighlight}>{selectedVehicle?.plate || selectedVehicleId}</Text> | SL-MADE 2.0
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={() => refetch()}>
          <RefreshCw size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Sri Lankan Fleet Quick Switcher */}
      <View style={styles.fleetSelectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fleetScroll}>
          {fleet.map((v) => {
            const isSelected = v.id === selectedVehicleId;
            return (
              <TouchableOpacity
                key={v.id}
                style={[styles.fleetPill, isSelected && styles.fleetPillActive]}
                onPress={() => setSelectedVehicleId(v.id)}
              >
                <Car size={13} color={isSelected ? Colors.background : Colors.primary} style={{ marginRight: 5 }} />
                <View>
                  <Text style={[styles.fleetPillTitle, isSelected && styles.fleetPillTitleActive]}>
                    {v.plate}
                  </Text>
                  <Text style={[styles.fleetPillSub, isSelected && styles.fleetPillSubActive]}>
                    {v.name.split(' ')[0]} {v.name.split(' ')[1] || ''}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 🇱🇰 FLAGSHIP: Sri Lanka Multi-Physics EV Anomaly Defense Matrix */}
      <SriLankaEVAnomalyEngine
        telemetry={currentTelemetry}
        anomaly={latestAnomaly}
        vehicle={selectedVehicle}
      />

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
          onPress={() => latestAnomaly && navigation.navigate('AnomaliesTab', {
            screen: 'AnomalyDetail',
            params: { anomalyId: latestAnomaly.anomalyId }
          })}
        >
          <Text style={styles.inspectButtonText}>Inspect Neural Forensic Report</Text>
          <ChevronRight size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 🔥 FEATURE 4 & 6: PREDICTIVE HORIZON COUNTDOWN & SEVERITY DECAY SPARK */}
      {horizon && (() => {
        const isCritical = horizon.urgencyLevel === 'CRITICAL_IMMINENT';
        const isElevated = horizon.urgencyLevel === 'ELEVATED_RISK';
        const isNominal = horizon.urgencyLevel === 'NOMINAL_SAFE' || horizon.urgencyLevel === 'STABLE';
        const urgencyColor = isCritical ? '#ef4444' : isElevated ? '#f59e0b' : '#10b981';
        return (
          <View style={[styles.horizonWidget, { borderColor: urgencyColor }]}>
            <View style={styles.horizonWidgetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Timer size={16} color={urgencyColor} style={{ marginRight: 6 }} />
                <Text style={styles.horizonWidgetTitle}>Time-To-Failure Horizon</Text>
              </View>
              <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor }]}>
                <Text style={styles.urgencyText}>{horizon.urgencyLevel.replace('_', ' ')}</Text>
              </View>
            </View>

            <View style={styles.countdownRow}>
              <View>
                <Text style={[styles.countdownValue, { color: urgencyColor }]}>
                  {horizon.countdownFormatted}
                </Text>
                <Text style={styles.countdownSub}>
                  {isNominal ? 'Continuous Safe Mission Window' : 'Projected Failure Countdown'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {horizon.projectedEscalation ? (
                    <TrendingUp size={15} color="#ef4444" style={{ marginRight: 4 }} />
                  ) : (
                    <TrendingDown size={15} color="#10b981" style={{ marginRight: 4 }} />
                  )}
                  <Text style={{ fontSize: 12, fontWeight: '700', color: horizon.projectedEscalation ? '#ef4444' : '#10b981' }}>
                    {horizon.projectedEscalation ? 'Escalating' : 'Self-Healing / Stable'}
                  </Text>
                </View>
                <Text style={styles.countdownSub}>Sensor Vector: {horizon.triggerParameter}</Text>
              </View>
            </View>

          {/* Spark Bar Trajectory */}
          <View style={styles.trajBarRow}>
            {horizon.severityTrajectory.map((pt, idx) => (
              <View key={idx} style={styles.trajCol}>
                <View style={[styles.trajBarSmall, { height: Math.max(8, pt.predictedScore * 28), backgroundColor: SeverityColors[pt.predictedSeverity] || Colors.primary }]} />
                <Text style={styles.trajColTime}>T+{pt.timeOffsetSeconds}s</Text>
              </View>
            ))}
          </View>
        </View>
        );
      })()}

      {/* 🔥 FEATURE 1: ANOMALY DNA BARCODE SNIPPET */}
      {dna && (
        <TouchableOpacity 
          style={styles.dnaQuickCard}
          onPress={() => navigation.navigate('AnomaliesTab', {
            screen: 'AnomalyDNA',
            params: { dna, anomalyId: latestAnomaly?.anomalyId }
          })}
        >
          <View style={styles.dnaQuickHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Dna size={16} color={Colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.dnaQuickTitle}>DNA Strain: {dna.strainType}</Text>
            </View>
            <Text style={styles.dnaViewAll}>Genome DB →</Text>
          </View>
          <View style={styles.barcodeStripRow}>
            {dna.barcode.slice(0, 24).map((val, idx) => (
              <View
                key={idx}
                style={[
                  styles.quickBarcodeBar,
                  {
                    height: 8 + val * 16,
                    backgroundColor: val > 0.6 ? '#ef4444' : val > 0.3 ? '#06b6d4' : '#6366f1',
                    opacity: 0.5 + val * 0.5
                  }
                ]}
              />
            ))}
          </View>
        </TouchableOpacity>
      )}

      {/* 🚀 MULTI-DIMENSIONAL TELEMETRY RADAR */}
      <RadarTelemetryChart telemetry={currentTelemetry} />

      {/* Core AI Metrics Grid */}
      <Text style={styles.sectionHeader}>Ensemble AI Telemetry Assessment</Text>
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
          <Text style={styles.metricSub}>Cross-Model Consensus</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Model Agreement</Text>
          <Text style={styles.metricValue}>{latestAnomaly?.ensembleResult.modelAgreementText || '3/3 Models'}</Text>
          <Text style={styles.metricSub}>IF + SVM + Autoencoder</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Digital Twin Distance</Text>
          <Text style={styles.metricValue}>
            {latestAnomaly?.digitalTwinDeviation?.twinDistance.toFixed(2) ?? '1.05'}σ
          </Text>
          <Text style={styles.metricSub}>Adaptive Normal Envelope</Text>
        </View>
      </View>

      {/* Live Telemetry Overview Cards */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionHeader}>Live Drivetrain Ingest</Text>
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

      {/* Revolutionary Quick Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.actionCard, { borderColor: '#f97316' }]} 
          onPress={() => navigation.navigate('ResearchTab', { screen: 'AdversarialLab' })}
        >
          <Flame size={20} color="#f97316" />
          <Text style={styles.actionTitle}>Adversarial Lab</Text>
          <Text style={styles.actionSub}>Attack & Stress-test AI</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionCard, { borderColor: Colors.primary }]} 
          onPress={() => navigation.navigate('AnomaliesTab', { screen: 'AnomalyDNA' })}
        >
          <Dna size={20} color={Colors.primary} />
          <Text style={styles.actionTitle}>DNA Genome DB</Text>
          <Text style={styles.actionSub}>Genetic strain search</Text>
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
  subtitle: { fontSize: 12, color: Colors.textSecondary },
  vehicleHighlight: { color: Colors.primary, fontWeight: '600' },
  refreshButton: { padding: 8, borderRadius: 8, backgroundColor: Colors.surfaceCard },

  fleetSelectorContainer: { marginBottom: 16 },
  fleetScroll: { paddingVertical: 2 },
  fleetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  fleetPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary
  },
  fleetPillTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textPrimary
  },
  fleetPillTitleActive: {
    color: Colors.background
  },
  fleetPillSub: {
    fontSize: 9,
    color: Colors.textMuted
  },
  fleetPillSubActive: {
    color: 'rgba(7, 11, 18, 0.75)'
  },

  heroCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 14
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

  horizonWidget: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f59e0b',
    marginBottom: 14
  },
  horizonWidgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  horizonWidgetTitle: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  urgencyBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  urgencyText: { fontSize: 9, fontWeight: '800', color: '#ffffff' },
  countdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  countdownValue: { fontSize: 24, fontWeight: '900', color: '#f59e0b' },
  countdownSub: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  trajBarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 42, backgroundColor: Colors.surface, padding: 6, borderRadius: 8 },
  trajCol: { alignItems: 'center', width: '18%' },
  trajBarSmall: { width: 7, borderRadius: 3.5, marginBottom: 2 },
  trajColTime: { fontSize: 8, color: Colors.textMuted },

  dnaQuickCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 16
  },
  dnaQuickHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  dnaQuickTitle: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  dnaViewAll: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  barcodeStripRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 26,
    backgroundColor: '#070b12',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  quickBarcodeBar: { width: 4, borderRadius: 1 },

  sectionHeader: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  linkText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  metricCard: {
    width: '48%',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  metricLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  metricValue: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginVertical: 3 },
  metricSub: { fontSize: 10, color: Colors.textSecondary },
  metricBarBg: { height: 4, backgroundColor: Colors.surface, borderRadius: 2, marginTop: 4 },
  metricBarFill: { height: 4, borderRadius: 2 },

  telemetryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  telemetryCard: {
    width: '48%',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  telLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  telValue: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },
  unit: { fontSize: 11, color: Colors.textMuted },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionCard: {
    width: '48%',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder
  },
  actionTitle: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, marginTop: 8 },
  actionSub: { fontSize: 10, color: Colors.textMuted, marginTop: 2 }
});
