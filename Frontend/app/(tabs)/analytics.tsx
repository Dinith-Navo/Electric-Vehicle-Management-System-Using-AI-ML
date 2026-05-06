import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { VictoryLine, VictoryChart, VictoryTheme, VictoryArea, VictoryAxis, VictoryPie } from 'victory-native';

const { width } = Dimensions.get('window');

const SOH_DATA = [
  { x: 'Mon', y: 96.2 },
  { x: 'Tue', y: 95.8 },
  { x: 'Wed', y: 95.1 },
  { x: 'Thu', y: 94.7 },
  { x: 'Fri', y: 94.2 },
  { x: 'Sat', y: 93.8 },
  { x: 'Sun', y: 94.0 },
];

const ENERGY_DATA = [
  { x: 'Mon', y: 12.4 },
  { x: 'Tue', y: 9.8 },
  { x: 'Wed', y: 15.2 },
  { x: 'Thu', y: 11.1 },
  { x: 'Fri', y: 13.5 },
  { x: 'Sat', y: 10.2 },
  { x: 'Sun', y: 14.8 },
];

const TEMP_DATA = [
  { x: 'Mon', y: 28 },
  { x: 'Tue', y: 31 },
  { x: 'Wed', y: 34 },
  { x: 'Thu', y: 29 },
  { x: 'Fri', y: 27 },
  { x: 'Sat', y: 33 },
  { x: 'Sun', y: 30 },
];

function StatSummary({
  icon,
  label,
  value,
  delta,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  delta: string;
  color: string;
}) {
  const isPositive = delta.startsWith('+');
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={[styles.summaryDelta, { color: isPositive ? '#10B981' : '#EF4444' }]}>{delta}</Text>
    </View>
  );
}

const TABS = ['Battery', 'Charging', 'Temperature', 'Energy'];

export default function Analytics() {
  const telemetry = useAppStore((s) => s.telemetry);
  const [activeTab, setActiveTab] = useState(0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Analytics</Text>
            <Text style={styles.subtitle}>Historical Performance Data</Text>
          </View>
          <Ionicons name="stats-chart" size={28} color="#00F0FF" />
        </View>

        {/* Summary Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          <StatSummary icon="battery-full" label="Avg SoH" value="94.3%" delta="+0.2%" color="#10B981" />
          <StatSummary icon="flash" label="Avg Voltage" value="383V" delta="-1.2V" color="#00F0FF" />
          <StatSummary icon="thermometer" label="Avg Temp" value="30.3°C" delta="+1.8°C" color="#F59E0B" />
          <StatSummary icon="leaf" label="Energy Used" value="86.5 kWh" delta="+4.1%" color="#8B5CF6" />
        </ScrollView>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          {TABS.map((tab, i) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(i)}
              style={[styles.tab, activeTab === i && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Charts Section */}
        <View style={styles.chartCard}>
          <Text style={styles.chartCardTitle}>
            {TABS[activeTab]} {activeTab === 3 ? 'Consumption' : 'Trends'}
          </Text>
          
          <View style={{ width: '100%', height: 220, overflow: 'hidden' }}>
            {activeTab === 0 && (
              <VictoryChart width={width - 48} height={220} theme={VictoryTheme.material}>
              <VictoryAxis
                style={{
                  axis: { stroke: '#1E293B' },
                  tickLabels: { fill: '#94A3B8', fontSize: 10 },
                  grid: { stroke: 'transparent' },
                }}
              />
              <VictoryAxis
                dependentAxis
                style={{
                  axis: { stroke: 'transparent' },
                  tickLabels: { fill: '#94A3B8', fontSize: 10 },
                  grid: { stroke: '#1E293B', strokeDasharray: '4, 4' },
                }}
              />
              <VictoryLine
                data={SOH_DATA}
                style={{
                  data: { stroke: '#10B981', strokeWidth: 3 },
                }}
                animate={{ duration: 1000, onLoad: { duration: 500 } }}
              />
            </VictoryChart>
          )}

            {activeTab === 1 && (
              <VictoryChart width={width - 48} height={220} theme={VictoryTheme.material}>
              <VictoryAxis
                 style={{
                  axis: { stroke: '#1E293B' },
                  tickLabels: { fill: '#94A3B8', fontSize: 10 },
                  grid: { stroke: 'transparent' },
                }}
              />
              <VictoryAxis
                dependentAxis
                style={{
                  axis: { stroke: 'transparent' },
                  tickLabels: { fill: '#94A3B8', fontSize: 10 },
                  grid: { stroke: '#1E293B', strokeDasharray: '4, 4' },
                }}
              />
              <VictoryArea
                data={ENERGY_DATA}
                style={{
                  data: { fill: 'rgba(0, 240, 255, 0.2)', stroke: '#00F0FF', strokeWidth: 2 },
                }}
                animate={{ duration: 1000 }}
              />
            </VictoryChart>
          )}

            {activeTab === 2 && (
              <VictoryChart width={width - 48} height={220} theme={VictoryTheme.material}>
              <VictoryAxis
                 style={{
                  axis: { stroke: '#1E293B' },
                  tickLabels: { fill: '#94A3B8', fontSize: 10 },
                  grid: { stroke: 'transparent' },
                }}
              />
              <VictoryAxis
                dependentAxis
                style={{
                  axis: { stroke: 'transparent' },
                  tickLabels: { fill: '#94A3B8', fontSize: 10 },
                  grid: { stroke: '#1E293B', strokeDasharray: '4, 4' },
                }}
              />
              <VictoryLine
                data={TEMP_DATA}
                style={{
                  data: { stroke: '#F59E0B', strokeWidth: 3 },
                }}
                animate={{ duration: 1000 }}
              />
            </VictoryChart>
          )}

            {activeTab === 3 && (
              <View style={{ alignItems: 'center', height: 220, justifyContent: 'center' }}>
                <VictoryPie
                  data={[
                    { x: 'Drive', y: 65 },
                    { x: 'AC', y: 15 },
                    { x: 'Elec', y: 10 },
                    { x: 'Idle', y: 10 },
                  ]}
                  width={250}
                  height={250}
                  innerRadius={60}
                  colorScale={['#00F0FF', '#10B981', '#8B5CF6', '#F59E0B']}
                  style={{
                    labels: { fill: '#94A3B8', fontSize: 10, fontWeight: 'bold' },
                  }}
                  animate={{ duration: 1000 }}
                />
              </View>
            )}
          </View>
        </View>

        {/* Insight Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📊 Performance Insight</Text>
          <Text style={styles.infoText}>
            Your battery efficiency has improved by <Text style={styles.highlight}>4.1%</Text> this week due to optimal thermal management. Keep charging between 20-80% for maximum longevity.
          </Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#080F1F' },
  container: { flex: 1, backgroundColor: '#080F1F', paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 20 },
  title: { color: '#F8FAFC', fontSize: 26, fontWeight: '800' },
  subtitle: { color: '#94A3B8', fontSize: 13, marginTop: 2 },

  summaryCard: { backgroundColor: '#0D1B2A', borderRadius: 16, padding: 16, marginRight: 12, minWidth: 130, borderWidth: 1, borderColor: '#1E293B' },
  summaryIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  summaryLabel: { color: '#475569', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  summaryValue: { color: '#F8FAFC', fontSize: 18, fontWeight: '800', marginTop: 4 },
  summaryDelta: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  tabContainer: { flexDirection: 'row', backgroundColor: '#0D1B2A', borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#1E293B' },
  tabText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#00F0FF' },

  chartCard: { backgroundColor: '#0D1B2A', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1E293B' },
  chartCardTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '700', marginBottom: 10 },

  infoCard: { backgroundColor: '#0D1B2A', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1E293B' },
  infoTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  infoText: { color: '#94A3B8', fontSize: 13, lineHeight: 20 },
  highlight: { color: '#00F0FF', fontWeight: '700' },
});
