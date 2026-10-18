import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, Pause, Cpu, Activity, Zap, Thermometer, Gauge, AlertTriangle, ShieldCheck, Sliders, Flame } from 'lucide-react-native';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { useVehicleStore } from '../../store/useVehicleStore';
import { Colors } from '../../constants/theme';
import { HolographicVehicleChassis } from '../../components/HolographicVehicleChassis';
import { OscilloscopeWaveform } from '../../components/OscilloscopeWaveform';
import { SriLankaRouteHeatmap } from '../../components/SriLankaRouteHeatmap';
import { SLEVFleetIntelligencePanel } from '../../components/SLEVFleetIntelligencePanel';
import { SimulatorScenario } from '../../types/telemetry';

export const LiveMonitoringScreen = ({ navigation }: any) => {
  const { selectedVehicleId } = useVehicleStore();
  const { currentTelemetry, isStreaming, setIsStreaming, tickTelemetry, setScenario, scenario } = useSimulatorStore();
  const [selectedComponent, setSelectedComponent] = useState<string>('Battery Pack');

  useEffect(() => {
    let interval: any = null;
    if (isStreaming) {
      interval = setInterval(() => {
        tickTelemetry(selectedVehicleId);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming, selectedVehicleId]);

  const triggerFault = (scen: SimulatorScenario) => {
    setScenario(scen);
    tickTelemetry(selectedVehicleId);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Live Telemetry Mission Control</Text>
          <Text style={styles.subtitle}>Vehicle: <Text style={{ color: Colors.primary, fontWeight: '700' }}>{selectedVehicleId}</Text> | High-Frequency Ingest</Text>
        </View>
        <View style={styles.statusChip}>
          <View style={[styles.statusDot, { backgroundColor: isStreaming ? '#10b981' : '#64748b' }]} />
          <Text style={styles.statusChipText}>{isStreaming ? 'STREAMING' : 'PAUSED'}</Text>
        </View>
      </View>

      {/* Primary Control Bar */}
      <View style={styles.controlsRow}>
        {!isStreaming ? (
          <TouchableOpacity style={[styles.controlBtn, { backgroundColor: '#10b981' }]} onPress={() => setIsStreaming(true)}>
            <Play size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.controlBtnText}>Start Stream</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.controlBtn, { backgroundColor: '#f59e0b' }]} onPress={() => setIsStreaming(false)}>
            <Pause size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.controlBtnText}>Pause</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.aiBtn} onPress={() => navigation.navigate('AIAnalysis')}>
          <Cpu size={16} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.aiBtnText}>Run AI Inspection</Text>
        </TouchableOpacity>
      </View>

      {/* 🚀 1. HOLOGRAPHIC DIGITAL TWIN CHASSIS */}
      <HolographicVehicleChassis
        telemetry={currentTelemetry}
        onSelectComponent={(c) => setSelectedComponent(c)}
      />

      {/* 🚀 2. REAL-TIME OSCILLOSCOPE WAVEFORM */}
      <OscilloscopeWaveform
        voltage={currentTelemetry.batteryVoltage}
        current={currentTelemetry.batteryCurrent}
        label="HV Traction Inverter Phase A Ripple"
      />

      {/* 🇱🇰 3. SRI LANKA ROUTE STRESS HEATMAP */}
      <SriLankaRouteHeatmap
        telemetry={currentTelemetry}
        anomalyScore={0}
        severity="NONE"
      />

      {/* 🚌 4. SL EV FLEET INTELLIGENCE PANEL */}
      <SLEVFleetIntelligencePanel
        telemetry={currentTelemetry}
        cebLoadShedding={false}
      />

      {/* 🚀 5. ONE-TAP EMERGENCY FAULT INJECTION BAR */}
      <View style={styles.faultBarCard}>
        <View style={styles.faultHeader}>
          <AlertTriangle size={16} color="#f97316" style={{ marginRight: 6 }} />
          <Text style={styles.faultTitle}>Instant Anomaly Injection Bench</Text>
        </View>
        <Text style={styles.faultDesc}>Inject instantaneous physical failure strains to test AI forensic response:</Text>

        <View style={styles.faultBtnsRow}>
          <TouchableOpacity 
            style={[styles.faultBtn, scenario === 'BATTERY_THERMAL_ANOMALY' && styles.faultBtnActive]}
            onPress={() => triggerFault('BATTERY_THERMAL_ANOMALY')}
          >
            <Text style={styles.faultBtnText}>🔥 Thermal Runaway</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.faultBtn, scenario === 'VOLTAGE_INSTABILITY' && styles.faultBtnActive]}
            onPress={() => triggerFault('VOLTAGE_INSTABILITY')}
          >
            <Text style={styles.faultBtnText}>⚡ Voltage Droop</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.faultBtn, scenario === 'CURRENT_SPIKE' && styles.faultBtnActive]}
            onPress={() => triggerFault('CURRENT_SPIKE')}
          >
            <Text style={styles.faultBtnText}>💥 Current Surge</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.faultBtn, { borderColor: '#10b981' }]}
            onPress={() => triggerFault('NORMAL_DRIVING')}
          >
            <Text style={[styles.faultBtnText, { color: '#10b981' }]}>🛡️ Reset Normal</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Live Numeric Metrics Grid */}
      <Text style={styles.sectionHeader}>Calibrated Sensor Channels</Text>
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Zap size={18} color={Colors.primary} />
          <Text style={styles.mLabel}>Pack Voltage</Text>
          <Text style={styles.mVal}>{currentTelemetry.batteryVoltage.toFixed(1)} <Text style={styles.mUnit}>V</Text></Text>
          <Text style={styles.mStatus}>Nominal: 395V</Text>
        </View>

        <View style={styles.metricCard}>
          <Activity size={18} color="#6366f1" />
          <Text style={styles.mLabel}>Bus Current</Text>
          <Text style={styles.mVal}>{currentTelemetry.batteryCurrent.toFixed(1)} <Text style={styles.mUnit}>A</Text></Text>
          <Text style={styles.mStatus}>Nominal: 40A</Text>
        </View>

        <View style={styles.metricCard}>
          <Thermometer size={18} color="#f59e0b" />
          <Text style={styles.mLabel}>BMS Cell Temp</Text>
          <Text style={[styles.mVal, currentTelemetry.batteryTemperature > 50 && { color: '#ef4444' }]}>
            {currentTelemetry.batteryTemperature.toFixed(1)} <Text style={styles.mUnit}>°C</Text>
          </Text>
          <Text style={styles.mStatus}>Limit: 60°C</Text>
        </View>

        <View style={styles.metricCard}>
          <Gauge size={18} color="#a855f7" />
          <Text style={styles.mLabel}>Motor Stator</Text>
          <Text style={[styles.mVal, currentTelemetry.motorTemperature > 80 && { color: '#ef4444' }]}>
            {currentTelemetry.motorTemperature.toFixed(1)} <Text style={styles.mUnit}>°C</Text>
          </Text>
          <Text style={styles.mStatus}>Limit: 95°C</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 11, color: Colors.textMuted },
  statusChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceCard, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: Colors.surfaceBorder },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusChipText: { fontSize: 9, fontWeight: '800', color: Colors.textSecondary },

  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  controlBtn: { width: '48%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
  controlBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 12 },
  aiBtn: { width: '48%', backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
  aiBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 12 },

  faultBarCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f97316',
    marginBottom: 14
  },
  faultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  faultTitle: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  faultDesc: { fontSize: 11, color: Colors.textSecondary, marginBottom: 10 },
  faultBtnsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  faultBtn: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  faultBtnActive: { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.15)' },
  faultBtnText: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary },

  sectionHeader: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  metricCard: {
    width: '48%',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder
  },
  mLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 4 },
  mVal: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginVertical: 2 },
  mUnit: { fontSize: 12, color: Colors.textMuted },
  mStatus: { fontSize: 9, color: Colors.textSecondary }
});
