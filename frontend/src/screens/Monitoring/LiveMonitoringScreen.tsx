import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, Pause, Square, Cpu, Activity, Zap, Thermometer, Gauge, ShieldCheck, Sliders } from 'lucide-react-native';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { useVehicleStore } from '../../store/useVehicleStore';
import { Colors } from '../../constants/theme';

export const LiveMonitoringScreen = ({ navigation }: any) => {
  const { selectedVehicleId } = useVehicleStore();
  const { currentTelemetry, isStreaming, setIsStreaming, tickTelemetry } = useSimulatorStore();
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    let interval: any = null;
    if (isStreaming) {
      interval = setInterval(() => {
        tickTelemetry(selectedVehicleId);
        setLastUpdated(new Date().toLocaleTimeString());
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming, selectedVehicleId]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Live Operational Monitoring</Text>
          <Text style={styles.subtitle}>Real-time telemetry stream | Sampling: 1.0s</Text>
        </View>
        <View style={styles.statusChip}>
          <View style={[styles.statusDot, { backgroundColor: isStreaming ? '#10b981' : '#64748b' }]} />
          <Text style={styles.statusChipText}>{isStreaming ? 'STREAMING' : 'PAUSED'}</Text>
        </View>
      </View>

      {/* Controls Bar */}
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

        <TouchableOpacity style={styles.simBtn} onPress={() => navigation.navigate('Simulator')}>
          <Sliders size={16} color={Colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.simBtnText}>Simulator</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.aiBtn} onPress={() => navigation.navigate('AIAnalysis')}>
          <Cpu size={16} color={Colors.background} style={{ marginRight: 6 }} />
          <Text style={styles.aiBtnText}>Run AI</Text>
        </TouchableOpacity>
      </View>

      {/* Last Update Info */}
      <View style={styles.infoBanner}>
        <ShieldCheck size={16} color={Colors.primary} />
        <Text style={styles.infoText}>Last sync: {lastUpdated} | Data Quality: 100%</Text>
      </View>

      {/* Telemetry Parameter Display Cards */}
      <Text style={styles.sectionTitle}>Real-time Operational Metrics</Text>
      
      <View style={styles.paramCard}>
        <View style={styles.paramHeader}>
          <Zap size={20} color={Colors.primary} />
          <Text style={styles.paramName}>Battery Voltage</Text>
          <Text style={styles.paramValue}>{currentTelemetry.batteryVoltage} V</Text>
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${(currentTelemetry.batteryVoltage / 450) * 100}%`, backgroundColor: Colors.primary }]} />
        </View>
      </View>

      <View style={styles.paramCard}>
        <View style={styles.paramHeader}>
          <Activity size={20} color={Colors.secondary} />
          <Text style={styles.paramName}>Battery Current</Text>
          <Text style={styles.paramValue}>{currentTelemetry.batteryCurrent} A</Text>
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${Math.min(100, (Math.abs(currentTelemetry.batteryCurrent) / 300) * 100)}%`, backgroundColor: Colors.secondary }]} />
        </View>
      </View>

      <View style={styles.paramCard}>
        <View style={styles.paramHeader}>
          <Thermometer size={20} color="#f59e0b" />
          <Text style={styles.paramName}>Motor Temperature</Text>
          <Text style={styles.paramValue}>{currentTelemetry.motorTemperature} °C</Text>
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${(currentTelemetry.motorTemperature / 140) * 100}%`, backgroundColor: '#f59e0b' }]} />
        </View>
      </View>

      <View style={styles.paramCard}>
        <View style={styles.paramHeader}>
          <Thermometer size={20} color="#3b82f6" />
          <Text style={styles.paramName}>Battery Temperature</Text>
          <Text style={styles.paramValue}>{currentTelemetry.batteryTemperature} °C</Text>
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${(currentTelemetry.batteryTemperature / 80) * 100}%`, backgroundColor: '#3b82f6' }]} />
        </View>
      </View>

      <View style={styles.paramCard}>
        <View style={styles.paramHeader}>
          <Gauge size={20} color="#10b981" />
          <Text style={styles.paramName}>Power Consumption</Text>
          <Text style={styles.paramValue}>{currentTelemetry.powerConsumption} kW</Text>
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${Math.min(100, (currentTelemetry.powerConsumption / 120) * 100)}%`, backgroundColor: '#10b981' }]} />
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
  statusChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceCard, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusChipText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },

  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  controlBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 8, marginRight: 6 },
  controlBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  simBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surfaceCard, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.surfaceBorder, marginRight: 6 },
  simBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 12 },
  aiBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary, paddingVertical: 10, borderRadius: 8 },
  aiBtnText: { color: Colors.background, fontWeight: '700', fontSize: 12 },

  infoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceCard, padding: 10, borderRadius: 8, marginBottom: 20 },
  infoText: { fontSize: 12, color: Colors.textSecondary, marginLeft: 8 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  paramCard: { backgroundColor: Colors.surfaceCard, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.surfaceBorder },
  paramHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  paramName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginLeft: 10, flex: 1 },
  paramValue: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  barBg: { height: 6, backgroundColor: Colors.surface, borderRadius: 3 },
  barFill: { height: 6, borderRadius: 3 }
});
