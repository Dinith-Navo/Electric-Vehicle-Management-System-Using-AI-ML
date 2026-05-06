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
import Colors from '../../constants/Colors';

const { width } = Dimensions.get('window');

function MetricCard({
  icon,
  label,
  value,
  suffix,
  color,
  subLabel,
  theme,
}: {
  icon: any;
  label: string;
  value: number;
  suffix: string;
  color: string;
  subLabel?: string;
  theme: typeof Colors.dark;
}) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1.05, duration: 300, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [value]);

  return (
    <Animated.View style={[styles.metricCard, { transform: [{ scale: pulse }], backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.iconCircle, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>
        {value.toFixed(value % 1 === 0 ? 0 : 1)}
        <Text style={styles.metricSuffix}>{suffix}</Text>
      </Text>
      {subLabel && <Text style={[styles.metricSub, { color: theme.textSecondary }]}>{subLabel}</Text>}
    </Animated.View>
  );
}

function BatteryGauge({ soc, isCharging, theme, darkMode }: { soc: number; isCharging: boolean; theme: typeof Colors.dark; darkMode: boolean }) {
  const fillAnim = useRef(new Animated.Value(soc)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: soc,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [soc]);

  const color = soc > 60 ? theme.success : soc > 30 ? theme.warning : theme.danger;
  const barWidth = fillAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <LinearGradient 
      colors={darkMode ? ['#0D1B2A', '#1A2744'] : ['#FFFFFF', '#F1F5F9']} 
      style={[styles.batteryCard, { borderColor: `${theme.accent}20` }]}
    >
      <View style={styles.batteryHeader}>
        <View>
          <Text style={[styles.batteryTitle, { color: theme.textSecondary }]}>Battery Status</Text>
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

      <Text style={[styles.batterySubText, { color: theme.textSecondary }]}>
        {isCharging ? '⚡ Charging in progress...' : 'System discharging'}
      </Text>

      <View style={[styles.batteryBar, { backgroundColor: theme.background }]}>
        <Animated.View
          style={[styles.batteryFill, { width: barWidth, backgroundColor: color }]}
        />
      </View>

      <View style={styles.batteryLegend}>
        <Text style={[styles.legendText, { color: theme.textSecondary }]}>0%</Text>
        <Text style={[styles.legendText, { color: theme.textSecondary }]}>50%</Text>
        <Text style={[styles.legendText, { color: theme.textSecondary }]}>100%</Text>
      </View>
    </LinearGradient>
  );
}

function LiveIndicator({ theme }: { theme: typeof Colors.dark }) {
  const blink = useRef(new Animated.Value(1)).current;
  const isLive = useAppStore((s) => s.isLiveConnected);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View style={[styles.liveIndicator, { borderColor: theme.border, backgroundColor: `${theme.card}99` }]}>
      <Animated.View style={[styles.liveDot, { opacity: isLive ? blink : 1, backgroundColor: isLive ? theme.success : theme.danger }]} />
      <Text style={[styles.liveText, { color: isLive ? theme.success : theme.textSecondary }]}>
        {isLive ? 'ONLINE' : 'OFFLINE'}
      </Text>
    </View>
  );
}

export default function Dashboard() {
  useTelemetrySimulation(true);
  const telemetry = useAppStore((s) => s.telemetry);
  const prediction = useAppStore((s) => s.prediction);
  const userProfile = useAppStore((s) => s.userProfile);
  const darkMode = useAppStore((s) => s.darkMode);
  const theme = darkMode ? Colors.dark : Colors.light;
  const [showWelcome, setShowWelcome] = React.useState(true);
  const welcomeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in dashboard
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Welcome message sequence
    Animated.sequence([
      Animated.timing(welcomeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(welcomeAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start(() => setShowWelcome(false));
  }, []);

  const getRiskColor = (risk: string) =>
    risk === 'High' ? theme.danger : risk === 'Medium' ? theme.warning : theme.success;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <Animated.ScrollView style={[styles.container, { opacity: fadeAnim, backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
              Hello, {userProfile?.name?.split(' ')[0] ?? 'Driver'} 👋
            </Text>
            <Text style={[styles.headerTitle, { color: theme.text }]}>EV Intelligence</Text>
          </View>
          <LiveIndicator theme={theme} />
        </View>

        {/* Battery Gauge with Lottie */}
        <BatteryGauge soc={telemetry.soc} isCharging={telemetry.isCharging} theme={theme} darkMode={darkMode} />

        {/* 4 Metric Cards */}
        <View style={styles.metricsGrid}>
          <MetricCard icon="flash" label="SoH" value={telemetry.soh} suffix="%" color={theme.success} subLabel="State of Health" theme={theme} />
          <MetricCard icon="thermometer" label="Temp" value={telemetry.temperature} suffix="°C" color={theme.warning} subLabel="Pack Temp" theme={theme} />
          <MetricCard icon="speedometer" label="Voltage" value={telemetry.voltage} suffix="V" color="#8B5CF6" subLabel="Pack Voltage" theme={theme} />
          <MetricCard icon="cellular" label="Current" value={Math.abs(telemetry.current)} suffix="A" color="#E94560" subLabel="Pack Current" theme={theme} />
        </View>

        {/* AI Prediction Summary */}
        <LinearGradient colors={darkMode ? ['#1A2744', '#0D1B2A'] : ['#FFFFFF', '#F1F5F9']} style={[styles.predictionCard, { borderColor: `${theme.accent}15` }]}>
          <View style={styles.predictionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>🤖 AI Diagnostics</Text>
            <View style={[styles.riskBadge, { backgroundColor: `${getRiskColor(prediction.failureRisk)}22`, borderColor: getRiskColor(prediction.failureRisk) }]}>
              <Text style={[styles.riskText, { color: getRiskColor(prediction.failureRisk) }]}>
                {prediction.failureRisk} Risk
              </Text>
            </View>
          </View>

          <View style={styles.predictionRow}>
            <View style={styles.predictionStat}>
              <Text style={[styles.predStatLabel, { color: theme.textSecondary }]}>Health</Text>
              <Text style={[styles.predStatValue, { color: theme.text }]}>{prediction.batteryHealth}%</Text>
            </View>
            <View style={styles.predictionStat}>
              <Text style={[styles.predStatLabel, { color: theme.textSecondary }]}>Life</Text>
              <Text style={[styles.predStatValue, { color: theme.text }]}>{prediction.predictedLife}</Text>
            </View>
            <View style={styles.predictionStat}>
              <Text style={[styles.predStatLabel, { color: theme.textSecondary }]}>Score</Text>
              <Text style={[styles.predStatValue, { color: theme.text }]}>{prediction.riskScore}</Text>
            </View>
          </View>

          <View style={[styles.healthBarBg, { backgroundColor: theme.background }]}>
            <View style={[styles.healthBarFill, { width: `${prediction.batteryHealth}%`, backgroundColor: getRiskColor(prediction.failureRisk) }]} />
          </View>
        </LinearGradient>

        {/* AI Recommendations */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>💡 Smart Suggestions</Text>
          {prediction.insights.slice(0, 2).map((insight, i) => (
            <View key={i} style={[styles.insightCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="bulb" size={16} color={theme.accent} />
              <Text style={[styles.insightText, { color: theme.textSecondary }]}>{insight}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 30 }} />
      </Animated.ScrollView>

      {/* Welcome Message Overlay */}
      {showWelcome && (
        <Animated.View style={[styles.welcomeOverlay, { opacity: welcomeAnim, pointerEvents: 'none' }]}>
          <LinearGradient
            colors={darkMode ? ['rgba(0, 240, 255, 0.9)', 'rgba(0, 122, 144, 0.9)'] : ['rgba(14, 165, 233, 0.9)', 'rgba(2, 132, 199, 0.9)']}
            style={styles.welcomeGradient}
          >
            <Ionicons name="sparkles" size={32} color="#FFFFFF" />
            <Text style={styles.welcomeTitle}>Welcome Back!</Text>
            <Text style={styles.welcomeName}>{userProfile?.name ?? 'EV Pioneer'}</Text>
          </LinearGradient>
        </Animated.View>
      )}
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

  welcomeOverlay: { position: 'absolute', top: 100, left: 40, right: 40, zIndex: 999, alignItems: 'center' },
  welcomeGradient: { paddingVertical: 20, paddingHorizontal: 30, borderRadius: 24, alignItems: 'center', shadowColor: '#00F0FF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
  welcomeTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 },
  welcomeName: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 4 },
});
