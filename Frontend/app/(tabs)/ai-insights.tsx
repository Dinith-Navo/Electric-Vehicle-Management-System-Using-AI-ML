import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { predictionService } from '../../services';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';

function ConfidenceBar({ value, color, theme }: { value: number; color: string; theme: typeof Colors.dark }) {
  return (
    <View style={[styles.confBarBg, { backgroundColor: theme.background }]}>
      <View style={[styles.confBarFill, { width: `${value}%`, backgroundColor: color }]} />
    </View>
  );
}

function RiskMeter({ score, theme }: { score: number; theme: typeof Colors.dark }) {
  const color = score > 65 ? theme.danger : score > 35 ? theme.warning : theme.success;
  const label = score > 65 ? 'High Risk' : score > 35 ? 'Medium Risk' : 'Low Risk';
  return (
    <View style={styles.riskMeter}>
      <Text style={[styles.riskMeterLabel, { color: theme.textSecondary }]}>Risk Score</Text>
      <Text style={[styles.riskMeterValue, { color }]}>{score}</Text>
      <Text style={[styles.riskMeterLabel, { color }]}>{label}</Text>
      <View style={[styles.riskBarBg, { backgroundColor: theme.background }]}>
        <View style={[styles.riskBarFill, { width: `${score}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function HistoryItem({
  soh,
  risk,
  date,
  theme,
}: {
  soh: number;
  risk: string;
  date: string;
  theme: typeof Colors.dark;
}) {
  const color = risk === 'High' ? theme.danger : risk === 'Medium' ? theme.warning : theme.success;
  return (
    <View style={[styles.historyItem, { borderBottomColor: theme.border }]}>
      <View style={[styles.historyDot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.historyValue, { color: theme.text }]}>SoH: {soh}%</Text>
        <Text style={[styles.historyDate, { color: theme.textSecondary }]}>{date}</Text>
      </View>
      <View style={[styles.historyBadge, { backgroundColor: `${color}22`, borderColor: color }]}>
        <Text style={[styles.historyBadgeText, { color }]}>{risk}</Text>
      </View>
    </View>
  );
}

const MOCK_HISTORY = [
  { soh: 94.2, risk: 'Low', date: 'May 5, 2026 18:30' },
  { soh: 92.8, risk: 'Low', date: 'May 4, 2026 09:15' },
  { soh: 91.5, risk: 'Medium', date: 'May 3, 2026 14:00' },
  { soh: 89.3, risk: 'Medium', date: 'May 2, 2026 22:45' },
  { soh: 87.1, risk: 'High', date: 'May 1, 2026 07:30' },
];

export default function AIInsights() {
  const telemetry = useAppStore((s) => s.telemetry);
  const prediction = useAppStore((s) => s.prediction);
  const darkMode = useAppStore((s) => s.darkMode);
  const theme = darkMode ? Colors.dark : Colors.light;
  const token = useAppStore((s) => s.token);
  const setPrediction = useAppStore((s) => s.setPrediction);
  const predictionHistory = useAppStore((s) => s.predictionHistory);
  const setPredictionHistory = useAppStore((s) => s.setPredictionHistory);
 
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

  const fetchHistory = async () => {
    if (!token) return;
    try {
      const res = await predictionService.getHistory(token);
      if (res.success) {
        const formatted = res.predictions.map((p: any) => ({
          soh: p.batteryHealth,
          risk: p.failureRisk,
          date: new Date(p.createdAt).toLocaleDateString(),
        }));
        setPredictionHistory(formatted);
      }
    } catch (e) {
      console.warn('Failed to fetch prediction history');
    }
  };
 
  const getRiskColor = (risk: string) =>
    risk === 'High' ? theme.danger : risk === 'Medium' ? theme.warning : theme.success;
 
  const runPrediction = useCallback(async () => {
    setLoading(true);
    try {
      const result = await predictionService.predictSoH({
        voltage: telemetry.voltage,
        current: telemetry.current,
        temperature: telemetry.temperature,
        charging_cycles: telemetry.chargingCycles,
        charging_frequency: telemetry.chargingFrequency,
      });
 
      setPrediction({
        batteryHealth: result.predicted_soh ?? prediction.batteryHealth,
        failureRisk: result.risk_level ?? prediction.failureRisk,
        confidence: result.confidence ?? prediction.confidence,
        riskScore: result.risk_score ?? prediction.riskScore,
        insights: result.recommendations ?? prediction.insights,
        failureProbability: result.failure_probability ?? prediction.failureProbability,
        remainingLifeMonths: result.estimated_remaining_life_months ?? prediction.remainingLifeMonths,
        maintenanceSuggestion:
          result.recommendations?.[0] ?? prediction.maintenanceSuggestion,
      });
      setLastRun(new Date());
      await fetchHistory(); // Refresh history
      Alert.alert('Analysis Complete', 'AI model has processed the latest telemetry and updated your battery health insights.');
    } catch (e) {
      console.warn('Prediction error, using fallback');
    } finally {
      setLoading(false);
    }

  }, [telemetry, prediction, setPrediction, token]);

  const trainModel = async () => {
    setTraining(true);
    try {
      if (token) {
        const res = await predictionService.train(token);
        if (res.success) {
          Alert.alert('Training Complete', res.message || 'The AI model has been optimized for your driving patterns.');
        } else {
          Alert.alert('Training Failed', res.message || 'Could not complete AI retraining.');
        }
      }
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Using baseline model optimizations.';
      Alert.alert('Training Error', msg);
    } finally {
      setTraining(false);
    }
  };
 
  const riskColor = getRiskColor(prediction.failureRisk);
 
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>AI Insights</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Random Forest SoH Prediction</Text>
          </View>
          <Ionicons name="pulse" size={28} color={theme.accent} />
        </View>
 
        {/* Actions Section */}
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={runPrediction} disabled={loading} style={[styles.predictBtn, { flex: 1 }]}>
            <LinearGradient
              colors={loading ? [theme.border, theme.border] : (darkMode ? ['#00F0FF', '#0090A0'] : ['#0EA5E9', '#0284C7'])}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.predictBtnGradient}
            >
              {loading ? (
                <ActivityIndicator color={theme.text} />
              ) : (
                <>
                  <Ionicons name="flash" size={18} color={darkMode ? '#080F1F' : '#FFFFFF'} />
                  <Text style={[styles.predictBtnText, { color: darkMode ? '#080F1F' : '#FFFFFF' }]}>Run Diagnosis</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={trainModel} disabled={training} style={[styles.trainBtn, { backgroundColor: `${theme.accent}15`, borderColor: `${theme.accent}35` }]}>
            {training ? (
              <ActivityIndicator color={theme.accent} />
            ) : (
              <>
                <Ionicons name="school" size={18} color={theme.accent} />
                <Text style={[styles.trainBtnText, { color: theme.accent }]}>Retrain Model</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {lastRun && (
          <Text style={[styles.lastRunText, { color: theme.textSecondary }]}>
            Last diagnosis: {lastRun.toLocaleTimeString()}
          </Text>
        )}
 
        {/* Health Score */}
        <LinearGradient colors={darkMode ? ['#0D1B2A', '#1A2744'] : ['#FFFFFF', '#F1F5F9']} style={[styles.scoreCard, { borderColor: `${theme.accent}20` }]}>
          <View style={styles.scoreHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Battery Health Score</Text>
            <Text style={[styles.confidenceText, { color: theme.success }]}>
              {prediction.confidence}% confidence
            </Text>
          </View>
 
          <View style={styles.scoreRow}>
            <View>
              <Text style={[styles.healthScore, { color: riskColor }]}>
                {prediction.batteryHealth.toFixed(1)}%
              </Text>
              <Text style={[styles.healthLabel, { color: theme.textSecondary }]}>Predicted SoH</Text>
            </View>
            <RiskMeter score={prediction.riskScore} theme={theme} />
          </View>
 
          <ConfidenceBar value={prediction.batteryHealth} color={riskColor} theme={theme} />
        </LinearGradient>
 
        {/* Input Telemetry Used */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>📊 Input Telemetry</Text>
          <View style={styles.inputGrid}>
            {[
              { label: 'Voltage', value: `${telemetry.voltage.toFixed(1)}V` },
              { label: 'Current', value: `${telemetry.current.toFixed(1)}A` },
              { label: 'Temperature', value: `${telemetry.temperature.toFixed(1)}°C` },
              { label: 'Cycles', value: `${telemetry.chargingCycles}` },
              { label: 'Charge Freq', value: `${telemetry.chargingFrequency}x/wk` },
              { label: 'SoC', value: `${telemetry.soc.toFixed(1)}%` },
            ].map((item) => (
              <View key={item.label} style={[styles.inputItem, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{item.label}</Text>
                <Text style={[styles.inputValue, { color: theme.accent }]}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
 
        {/* Risk Analysis */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>⚠️ Risk Analysis</Text>
          <View style={[styles.riskBox, { borderColor: riskColor, backgroundColor: `${riskColor}11` }]}>
            <View style={styles.riskBoxHeader}>
              <Ionicons
                name={prediction.failureRisk === 'High' ? 'warning' : prediction.failureRisk === 'Medium' ? 'alert-circle' : 'checkmark-circle'}
                size={24}
                color={riskColor}
              />
              <Text style={[styles.riskBoxTitle, { color: riskColor }]}>
                {prediction.failureRisk} Failure Risk Detected
              </Text>
            </View>
            <Text style={[styles.riskBoxDesc, { color: theme.textSecondary }]}>
              Based on current telemetry, the Random Forest model predicts a{' '}
              <Text style={{ color: riskColor, fontWeight: '700' }}>
                {prediction.failureRisk.toLowerCase()} risk
              </Text>{' '}
              of battery degradation or failure in the near term.
            </Text>
          </View>
        </View>
 
        {/* Recommendations */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>💡 AI Recommendations</Text>
          {prediction.insights.map((insight, i) => (
            <View key={i} style={styles.recommendItem}>
              <View style={[styles.recommendNumber, { backgroundColor: `${theme.accent}22` }]}>
                <Text style={[styles.recommendNumberText, { color: theme.accent }]}>{i + 1}</Text>
              </View>
              <Text style={[styles.recommendText, { color: theme.textSecondary }]}>{insight}</Text>
            </View>
          ))}
        </View>
 
        {/* Predictive Roadmap */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 12 }]}>🗺️ Maintenance Roadmap</Text>
          <View style={styles.roadmapContainer}>
            {[
              { label: 'Battery Health Optimization', date: 'In 3 Months', status: 'Optimal', color: theme.success },
              { label: 'Coolant System Inspection', date: 'In 8 Months', status: 'Planned', color: theme.accent },
              { label: 'Tire Integrity Check', date: 'In 12 Months', status: 'Scheduled', color: theme.warning },
            ].map((step, i) => (
              <View key={i} style={styles.roadmapStep}>
                <View style={[styles.roadmapLine, { backgroundColor: theme.border }, i === 2 && { height: 0 }]} />
                <View style={[styles.roadmapDot, { backgroundColor: step.color }]} />
                <View style={styles.roadmapContent}>
                  <Text style={[styles.roadmapLabel, { color: theme.text }]}>{step.label}</Text>
                  <Text style={[styles.roadmapDate, { color: theme.textSecondary }]}>{step.date} • {step.status}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Prediction History */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>📜 Prediction History</Text>
          {predictionHistory.map((item, i) => (
            <HistoryItem key={i} soh={item.soh} risk={item.risk} date={item.date} theme={theme} />
          ))}
          {predictionHistory.length === 0 && (
            <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 10 }}>No prediction history found.</Text>
          )}
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

  predictBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 8 },
  predictBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  predictBtnText: { color: '#080F1F', fontSize: 16, fontWeight: '800' },
  lastRunText: { color: '#475569', fontSize: 12, textAlign: 'center', marginBottom: 16 },

  scoreCard: { borderRadius: 20, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,240,255,0.15)' },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
  confidenceText: { fontSize: 12, fontWeight: '600' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  healthScore: { fontSize: 48, fontWeight: '900', letterSpacing: -2 },
  healthLabel: { color: '#475569', fontSize: 12 },

  riskMeter: { alignItems: 'flex-end' },
  riskMeterLabel: { color: '#475569', fontSize: 11, marginBottom: 4 },
  riskMeterValue: { fontSize: 28, fontWeight: '900' },
  riskBarBg: { width: 100, height: 6, backgroundColor: '#1E293B', borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  riskBarFill: { height: '100%', borderRadius: 3 },

  confBarBg: { height: 8, backgroundColor: '#1E293B', borderRadius: 4, overflow: 'hidden' },
  confBarFill: { height: '100%', borderRadius: 4 },

  card: { backgroundColor: '#0D1B2A', borderRadius: 20, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: '#1E293B' },
  inputGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  inputItem: { width: '30%', backgroundColor: '#080F1F', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#1E293B' },
  inputLabel: { color: '#475569', fontSize: 10, marginBottom: 4 },
  inputValue: { color: '#00F0FF', fontSize: 14, fontWeight: '700' },

  riskBox: { borderWidth: 1, borderRadius: 14, padding: 16, marginTop: 14 },
  riskBoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  riskBoxTitle: { fontSize: 15, fontWeight: '700' },
  riskBoxDesc: { color: '#94A3B8', fontSize: 13, lineHeight: 20 },

  recommendItem: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12, gap: 12 },
  recommendNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,240,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  recommendNumberText: { color: '#00F0FF', fontSize: 12, fontWeight: '800' },
  recommendText: { color: '#94A3B8', fontSize: 13, flex: 1, lineHeight: 20 },

  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1E293B', gap: 12 },
  historyDot: { width: 10, height: 10, borderRadius: 5 },
  historyValue: { color: '#F8FAFC', fontSize: 14, fontWeight: '600' },
  historyDate: { color: '#475569', fontSize: 11, marginTop: 2 },
  historyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  historyBadgeText: { fontSize: 11, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  trainBtn: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, height: 58 },
  trainBtnText: { fontSize: 14, fontWeight: '700' },
  roadmapContainer: { marginTop: 8, paddingLeft: 8 },
  roadmapStep: { flexDirection: 'row', gap: 16, minHeight: 60 },
  roadmapLine: { position: 'absolute', left: 5, top: 10, bottom: -10, width: 2 },
  roadmapDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, zIndex: 1 },
  roadmapContent: { flex: 1, paddingBottom: 20 },
  roadmapLabel: { fontSize: 14, fontWeight: '700' },
  roadmapDate: { fontSize: 12, marginTop: 2 },
});
