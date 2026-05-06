import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { useTelemetrySimulation } from '../../hooks/useTelemetrySimulation';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

function MetricCard({
  icon,
  label,
  value,
  suffix,
  color,
  subLabel,
}: {
  icon: any;
  label: string;
  value: number;
  suffix: string;
  color: string;
  subLabel?: string;
}) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1.05, duration: 300, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [value]);

  return (
    <Animated.View style={[styles.metricCard, { transform: [{ scale: pulse }] }]}>
      <View style={[styles.iconCircle, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>
        {value.toFixed(value % 1 === 0 ? 0 : 1)}
        <Text style={styles.metricSuffix}>{suffix}</Text>
      </Text>
      {subLabel && <Text style={styles.metricSub}>{subLabel}</Text>}
    </Animated.View>
  );
}

function BatteryGauge({ soc, isCharging }: { soc: number; isCharging: boolean }) {
  const fillAnim = useRef(new Animated.Value(soc)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: soc,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [soc]);

  const color = soc > 60 ? '#10B981' : soc > 30 ? '#F59E0B' : '#EF4444';
  const barWidth = fillAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <LinearGradient colors={['#0D1B2A', '#1A2744']} style={styles.batteryCard}>
      <View style={styles.batteryHeader}>
        <View>
          <Text style={styles.batteryTitle}>Battery Status</Text>
          <Text style={[styles.batteryPercent, { color }]}>{soc.toFixed(1)}%</Text>
        </View>
        <View style={styles.lottieContainer}>
           {isCharging ? (
             <LottieView
               source={{ uri: 'https://assets9.lottiefiles.com/packages/lf20_hu9p9uoz.json' }}
               autoPlay
               loop
               style={styles.lottieBattery}
             />
           ) : (
             <Ionicons name="battery-half" size={48} color={color} />
           )}
        </View>
      </View>

      <Text style={styles.batterySubText}>
        {isCharging ? '⚡ Charging in progress...' : 'System discharging'}
      </Text>

      <View style={styles.batteryBar}>
        <Animated.View
          style={[styles.batteryFill, { width: barWidth, backgroundColor: color }]}
        />
      </View>

      <View style={styles.batteryLegend}>
        <Text style={styles.legendText}>0%</Text>
        <Text style={styles.legendText}>50%</Text>
        <Text style={styles.legendText}>100%</Text>
      </View>
    </LinearGradient>
  );
}

function LiveIndicator() {
  const blink = useRef(new Animated.Value(1)).current;
  const isLive = useAppStore((s) => s.isLiveConnected);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.liveIndicator}>
      <Animated.View style={[styles.liveDot, { opacity: blink, backgroundColor: isLive ? '#10B981' : '#EF4444' }]} />
      <Text style={[styles.liveText, { color: isLive ? '#10B981' : '#EF4444' }]}>
        {isLive ? 'LIVE' : 'OFFLINE'}
      </Text>
    </View>
  );
}

export default function Dashboard() {
  useTelemetrySimulation(true);
  const telemetry = useAppStore((s) => s.telemetry);
  const prediction = useAppStore((s) => s.prediction);
  const userProfile = useAppStore((s) => s.userProfile);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const getRiskColor = (risk: string) =>
    risk === 'High' ? '#EF4444' : risk === 'Medium' ? '#F59E0B' : '#10B981';

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.ScrollView style={[styles.container, { opacity: fadeAnim }]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Hello, {userProfile?.name?.split(' ')[0] ?? 'Driver'} 👋
            </Text>
            <Text style={styles.headerTitle}>EV Intelligence</Text>
          </View>
          <LiveIndicator />
        </View>

        {/* Battery Gauge with Lottie */}
        <BatteryGauge soc={telemetry.soc} isCharging={telemetry.isCharging} />

        {/* 4 Metric Cards */}
        <View style={styles.metricsGrid}>
          <MetricCard icon="flash" label="SoH" value={telemetry.soh} suffix="%" color="#00F0FF" subLabel="State of Health" />
          <MetricCard icon="thermometer" label="Temp" value={telemetry.temperature} suffix="°C" color="#F59E0B" subLabel="Pack Temp" />
          <MetricCard icon="speedometer" label="Voltage" value={telemetry.voltage} suffix="V" color="#8B5CF6" subLabel="Pack Voltage" />
          <MetricCard icon="cellular" label="Current" value={Math.abs(telemetry.current)} suffix="A" color="#E94560" subLabel="Pack Current" />
        </View>

        {/* AI Prediction Summary */}
        <LinearGradient colors={['#1A2744', '#0D1B2A']} style={styles.predictionCard}>
          <View style={styles.predictionHeader}>
            <Text style={styles.sectionTitle}>🤖 AI Diagnostics</Text>
            <View style={[styles.riskBadge, { backgroundColor: `${getRiskColor(prediction.failureRisk)}22`, borderColor: getRiskColor(prediction.failureRisk) }]}>
              <Text style={[styles.riskText, { color: getRiskColor(prediction.failureRisk) }]}>
                {prediction.failureRisk} Risk
              </Text>
            </View>
          </View>

          <View style={styles.predictionRow}>
            <View style={styles.predictionStat}>
              <Text style={styles.predStatLabel}>Health</Text>
              <Text style={styles.predStatValue}>{prediction.batteryHealth}%</Text>
            </View>
            <View style={styles.predictionStat}>
              <Text style={styles.predStatLabel}>Life</Text>
              <Text style={styles.predStatValue}>{prediction.predictedLife}</Text>
            </View>
            <View style={styles.predictionStat}>
              <Text style={styles.predStatLabel}>Score</Text>
              <Text style={styles.predStatValue}>{prediction.riskScore}</Text>
            </View>
          </View>

          <View style={styles.healthBarBg}>
            <View style={[styles.healthBarFill, { width: `${prediction.batteryHealth}%`, backgroundColor: getRiskColor(prediction.failureRisk) }]} />
          </View>
        </LinearGradient>

        {/* AI Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Smart Suggestions</Text>
          {prediction.insights.slice(0, 2).map((insight, i) => (
            <View key={i} style={styles.insightCard}>
              <Ionicons name="bulb" size={16} color="#00F0FF" />
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 30 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#080F1F' },
  container: { flex: 1, backgroundColor: '#080F1F', paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 20 },
  greeting: { color: '#94A3B8', fontSize: 14 },
  headerTitle: { color: '#F8FAFC', fontSize: 26, fontWeight: '800' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#1E293B' },
  liveDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  liveText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  batteryCard: { borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0,240,255,0.15)' },
  batteryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  batteryTitle: { color: '#94A3B8', fontSize: 13, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
  batteryPercent: { fontSize: 48, fontWeight: '900', letterSpacing: -1 },
  lottieContainer: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  lottieBattery: { width: '100%', height: '100%' },
  batterySubText: { color: '#94A3B8', fontSize: 13, marginBottom: 14 },
  batteryBar: { height: 8, backgroundColor: '#1E293B', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  batteryFill: { height: '100%', borderRadius: 4 },
  batteryLegend: { flexDirection: 'row', justifyContent: 'space-between' },
  legendText: { color: '#475569', fontSize: 10 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 4 },
  metricCard: { width: (width - 44) / 2, backgroundColor: '#0D1B2A', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1E293B' },
  iconCircle: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  metricLabel: { color: '#475569', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  metricValue: { fontSize: 22, fontWeight: '800' },
  metricSuffix: { fontSize: 13, fontWeight: '500' },
  metricSub: { color: '#475569', fontSize: 10, marginTop: 2 },

  predictionCard: { borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0,240,255,0.12)' },
  predictionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  riskText: { fontSize: 12, fontWeight: '700' },
  predictionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  predictionStat: { alignItems: 'center' },
  predStatLabel: { color: '#475569', fontSize: 11, marginBottom: 4 },
  predStatValue: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
  healthBarBg: { height: 6, backgroundColor: '#1E293B', borderRadius: 3, overflow: 'hidden' },
  healthBarFill: { height: '100%', borderRadius: 3 },

  section: { marginBottom: 16 },
  insightCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D1B2A', borderRadius: 12, padding: 14, marginTop: 8, borderWidth: 1, borderColor: '#1E293B', gap: 10 },
  insightText: { color: '#94A3B8', fontSize: 13, flex: 1 },
});
