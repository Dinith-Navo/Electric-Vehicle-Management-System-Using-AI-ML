import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { VictoryLine, VictoryChart, VictoryTheme, VictoryArea, VictoryAxis, VictoryPie } from 'victory-native';
import { analyticsService } from '../../services';
import Colors from '../../constants/Colors';

const { width } = Dimensions.get('window');

const TABS = ['Battery', 'Charging', 'Temperature', 'Energy'];

function StatSummary({
  icon,
  label,
  value,
  delta,
  color,
  theme,
}: {
  icon: any;
  label: string;
  value: string;
  delta: string;
  color: string;
  theme: typeof Colors.dark;
}) {
  const isPositive = delta.startsWith('+');
  return (
    <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.summaryIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.summaryDelta, { color: isPositive ? theme.success : theme.danger }]}>{delta}</Text>
    </View>
  );
}

export default function Analytics() {
  const token = useAppStore((s) => s.token);
  const telemetry = useAppStore((s) => s.telemetry);
  const darkMode = useAppStore((s) => s.darkMode);
  const theme = darkMode ? Colors.dark : Colors.light;
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [energyUsage, setEnergyUsage] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      fetchAnalytics();
    }
  }, [token, activeTab]);

  const fetchAnalytics = async () => {
    if (!token) return;
    try {
      setLoading(true);
      // Fetch summary
      const summaryData = await analyticsService.getSummary(token);
      setSummary(summaryData.summary);

      // Fetch trends based on active tab
      const types = ['soh', 'current', 'temperature', 'efficiency'];
      const trendData = await analyticsService.getTrends(token, types[activeTab]);
      
      let formatted = trendData.trends.map((t: any) => ({
        x: t.date.split('-').slice(1).join('/'), // Format MM/DD
        y: t.value
      }));

      // Fallback for demo purposes if no real data exists
      if (formatted.length === 0) {
        const now = new Date();
        formatted = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(now);
          d.setDate(d.getDate() - (6 - i));
          return {
            x: `${d.getMonth() + 1}/${d.getDate()}`,
            y: activeTab === 0 ? 94 + Math.random() : 
               activeTab === 1 ? -15 + Math.random() * 5 : 
               30 + Math.random() * 5
          };
        });
      }
      setChartData(formatted);

      // Fetch energy usage if on that tab
      if (activeTab === 3) {
        const energyData = await analyticsService.getEnergy(token);
        if (energyData.success) {
          setEnergyUsage(energyData.usage.map((u: any) => ({ x: u.label, y: u.value })));
        }
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Analytics</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Historical Performance Data</Text>
          </View>
          <Ionicons name="stats-chart" size={28} color={theme.accent} />
        </View>
 
        {/* Summary Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          <StatSummary 
            icon="battery-full" 
            label="Live SoH" 
            value={`${(telemetry.soh || summary?.avgSoH || 0).toFixed(1)}%`} 
            delta={summary?.avgSoH ? `${(telemetry.soh - summary.avgSoH).toFixed(1)}%` : '+0.0%'} 
            color={theme.success} 
            theme={theme} 
          />
          <StatSummary 
            icon="flash" 
            label="Live Voltage" 
            value={`${(telemetry.voltage || summary?.avgVoltage || 0).toFixed(0)}V`} 
            delta={summary?.avgVoltage ? `${(telemetry.voltage - summary.avgVoltage).toFixed(1)}V` : '+0.0V'} 
            color={theme.accent} 
            theme={theme} 
          />
          <StatSummary 
            icon="thermometer" 
            label="Live Temp" 
            value={`${(telemetry.temperature || summary?.avgTemp || 0).toFixed(1)}°C`} 
            delta={summary?.avgTemp ? `${(telemetry.temperature - summary.avgTemp).toFixed(1)}°C` : '+0.0°C'} 
            color={theme.warning} 
            theme={theme} 
          />
          <StatSummary 
            icon="leaf" 
            label="Efficiency" 
            value={`${(telemetry.efficiency || summary?.avgEfficiency || 0).toFixed(2)}`} 
            delta={summary?.avgEfficiency ? `${(telemetry.efficiency - summary.avgEfficiency).toFixed(2)}` : '+0.00'} 
            color="#8B5CF6" 
            theme={theme} 
          />
        </ScrollView>
 
        {/* Tab Selector */}
        <View style={[styles.tabContainer, { backgroundColor: theme.card }]}>
          {TABS.map((tab, i) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(i)}
              style={[styles.tab, activeTab === i && { backgroundColor: theme.background }]}
            >
              <Text style={[styles.tabText, { color: theme.textSecondary }, activeTab === i && { color: theme.accent }]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
 
        {/* Charts Section */}
        <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.chartCardTitle, { color: theme.text }]}>
            {TABS[activeTab]} {activeTab === 3 ? 'Consumption' : 'Trends'}
          </Text>
          
          <View style={{ width: '100%', height: 220, overflow: 'hidden', justifyContent: 'center' }}>
            {loading ? (
              <ActivityIndicator size="large" color={theme.accent} />
            ) : chartData.length > 0 ? (
              <>
                {activeTab < 3 ? (
                  <VictoryChart width={width - 48} height={220} theme={VictoryTheme.material}>
                    <VictoryAxis
                      style={{
                        axis: { stroke: theme.border },
                        tickLabels: { fill: theme.textSecondary, fontSize: 10 },
                        grid: { stroke: 'transparent' },
                      }}
                    />
                    <VictoryAxis
                      dependentAxis
                      style={{
                        axis: { stroke: 'transparent' },
                        tickLabels: { fill: theme.textSecondary, fontSize: 10 },
                        grid: { stroke: theme.border, strokeDasharray: '4, 4' },
                      }}
                    />
                    {activeTab === 1 ? (
                      <VictoryArea
                        data={chartData}
                        style={{
                          data: { fill: `${theme.accent}33`, stroke: theme.accent, strokeWidth: 2 },
                        }}
                        animate={{ duration: 1000 }}
                      />
                    ) : (
                      <VictoryLine
                        data={chartData}
                        style={{
                          data: { stroke: activeTab === 0 ? theme.success : theme.warning, strokeWidth: 3 },
                        }}
                        animate={{ duration: 1000, onLoad: { duration: 500 } }}
                      />
                    )}
                  </VictoryChart>
                ) : (
                  <View style={{ alignItems: 'center', height: 220, justifyContent: 'center' }}>
                    <VictoryPie
                      data={energyUsage.length > 0 ? energyUsage : [
                        { x: 'Drive', y: 65 },
                        { x: 'AC', y: 15 },
                        { x: 'Elec', y: 10 },
                        { x: 'Idle', y: 10 },
                      ]}
                      width={250}
                      height={250}
                      innerRadius={60}
                      colorScale={[theme.accent, theme.success, '#8B5CF6', theme.warning]}
                      style={{
                        labels: { fill: theme.textSecondary, fontSize: 10, fontWeight: 'bold' },
                      }}
                      animate={{ duration: 1000 }}
                    />
                  </View>
                )}
              </>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: theme.textSecondary }}>No data available for this period</Text>
              </View>
            )}
          </View>
        </View>
 
        {/* Insight Card */}
        <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.infoTitle, { color: theme.text }]}>📊 Performance Insight</Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Your battery efficiency has improved by <Text style={[styles.highlight, { color: theme.accent }]}>4.1%</Text> this week due to optimal thermal management. Keep charging between 20-80% for maximum longevity.
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
