import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, Pause, Zap, Activity, Thermometer, ShieldAlert } from 'lucide-react-native';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { useVehicleStore } from '../../store/useVehicleStore';
import { SimulatorScenario } from '../../types/telemetry';
import { Colors } from '../../constants/theme';

const SCENARIOS: { id: SimulatorScenario; label: string }[] = [
  { id: 'NORMAL_DRIVING', label: 'Normal Driving Baseline' },
  { id: 'CITY_DRIVING', label: 'City Stop-and-Go' },
  { id: 'HIGHWAY_DRIVING', label: 'Highway High Speed' },
  { id: 'HEAVY_ACCELERATION', label: 'Heavy Acceleration Peak' },
  { id: 'MOTOR_THERMAL_ANOMALY', label: 'Motor Thermal Overheating' },
  { id: 'BATTERY_THERMAL_ANOMALY', label: 'Battery Pack Thermal' },
  { id: 'ELECTRICAL_ANOMALY', label: 'Electrical Bus Instability' },
  { id: 'VOLTAGE_INSTABILITY', label: 'Battery Voltage Drop' },
  { id: 'CURRENT_SPIKE', label: 'Extreme Current Surge' },
  { id: 'CHARGING_ANOMALY', label: 'Fast-Charging Thermal Load' },
  { id: 'POWER_ANOMALY', label: 'Disproportionate Power Draw' },
  { id: 'COMBINED_ANOMALY', label: 'Combined Multi-System Anomaly' }
];

export const SimulatorScreen = ({ navigation }: any) => {
  const { selectedVehicleId } = useVehicleStore();
  const { scenario, setScenario, currentTelemetry, isStreaming, setIsStreaming, tickTelemetry } = useSimulatorStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>In-App Telemetry & Anomaly Simulator</Text>
      <Text style={styles.subtitle}>Physics Correlated Test Generator (§51 - §54)</Text>

      {/* Control Buttons */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.btn, isStreaming ? { backgroundColor: '#f59e0b' } : { backgroundColor: '#10b981' }]}
          onPress={() => setIsStreaming(!isStreaming)}
        >
          {isStreaming ? <Pause size={16} color="#ffffff" /> : <Play size={16} color="#ffffff" />}
          <Text style={styles.btnText}>{isStreaming ? 'Pause Simulation' : 'Start Stream'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: Colors.primary }]}
          onPress={() => {
            tickTelemetry(selectedVehicleId);
            navigation.navigate('AIAnalysis');
          }}
        >
          <Text style={[styles.btnText, { color: Colors.background }]}>Analyze Current State</Text>
        </TouchableOpacity>
      </View>

      {/* Current Simulated Values */}
      <View style={styles.telemetryPreview}>
        <Text style={styles.previewTitle}>Live Generated Values</Text>
        <Text style={styles.prevText}>Voltage: <Text style={styles.boldVal}>{currentTelemetry.batteryVoltage} V</Text> | Current: <Text style={styles.boldVal}>{currentTelemetry.batteryCurrent} A</Text></Text>
        <Text style={styles.prevText}>Motor Temp: <Text style={styles.boldVal}>{currentTelemetry.motorTemperature} °C</Text> | Power: <Text style={styles.boldVal}>{currentTelemetry.powerConsumption} kW</Text></Text>
      </View>

      {/* Scenario Selector Chips */}
      <Text style={styles.sectionTitle}>Select Operational Scenario</Text>
      {SCENARIOS.map((sc) => {
        const isSelected = scenario === sc.id;
        return (
          <TouchableOpacity
            key={sc.id}
            style={[styles.scCard, isSelected && styles.selectedScCard]}
            onPress={() => {
              setScenario(sc.id);
              tickTelemetry(selectedVehicleId);
            }}
          >
            <ShieldAlert size={18} color={isSelected ? Colors.primary : Colors.textMuted} />
            <Text style={[styles.scLabel, isSelected && styles.selectedScLabel]}>{sc.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginBottom: 16 },

  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, marginHorizontal: 4 },
  btnText: { fontWeight: '700', fontSize: 12, color: '#ffffff', marginLeft: 6 },

  telemetryPreview: { backgroundColor: Colors.surfaceCard, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.surfaceBorder },
  previewTitle: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 6 },
  prevText: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  boldVal: { color: Colors.textPrimary, fontWeight: '700' },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  scCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceCard, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.surfaceBorder },
  selectedScCard: { borderColor: Colors.primary, backgroundColor: Colors.surface },
  scLabel: { fontSize: 13, color: Colors.textSecondary, marginLeft: 10, fontWeight: '600' },
  selectedScLabel: { color: Colors.primary, fontWeight: '700' }
});
