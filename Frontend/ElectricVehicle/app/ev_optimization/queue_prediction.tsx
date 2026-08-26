import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import { evOptimizationApi, QueuePredictInput } from "../../ev_optimization/services/apiClient";

export default function QueuePredictionScreen() {
  const router = useRouter();
  const { theme, colors, toggleTheme } = useTheme();

  const [stations, setStations] = useState<any[]>([]);
  const [selectedStationId, setSelectedStationId] = useState("CS-CMB-001");
  const [arrivalHour, setArrivalHour] = useState(17);
  const [dayOfWeek, setDayOfWeek] = useState(3); // Wednesday

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    // Load station list
    evOptimizationApi.getStations().then((res) => {
      if (res && res.success && res.data.length > 0) {
        setStations(res.data);
        setSelectedStationId(res.data[0].stationId);
      }
    }).catch(() => {});

    // Initial prediction
    handlePredict("CS-CMB-001", 17, 3);
  }, []);

  const handlePredict = async (stId = selectedStationId, hr = arrivalHour, day = dayOfWeek) => {
    setLoading(true);
    try {
      const payload: QueuePredictInput = {
        stationId: stId,
        arrivalHour: hr,
        dayOfWeek: day,
      };
      const res = await evOptimizationApi.predictQueue(payload);
      if (res && res.success) {
        setResult(res.data);
      } else {
        throw new Error("API error");
      }
    } catch (e: any) {
      console.log("Queue prediction notice, using fallback:", e.message);
      // Fallback calculation
      const isPeak = hr >= 17 && hr <= 19;
      const qLen = isPeak ? 2 : 0;
      const waitMin = isPeak ? 25 : 0;
      setResult({
        stationId: stId,
        predictedQueueLength: qLen,
        estimatedWaitMinutes: waitMin,
        availableChargersNow: isPeak ? 1 : 3,
        congestionLevel: isPeak ? "Moderate" : "Low",
        source: "mock",
        modelName: "QueuingTheoryFallback",
        hourlyForecast: [
          { hour: `${hr}:00`, predictedQueue: qLen, estimatedWaitMin: waitMin },
          { hour: `${(hr + 1) % 24}:00`, predictedQueue: isPeak ? 3 : 1, estimatedWaitMin: isPeak ? 35 : 10 },
          { hour: `${(hr + 2) % 24}:00`, predictedQueue: isPeak ? 2 : 0, estimatedWaitMin: isPeak ? 20 : 0 },
          { hour: `${(hr + 3) % 24}:00`, predictedQueue: 0, estimatedWaitMin: 0 },
        ],
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const getCongestionColor = (level: string) => {
    switch (level) {
      case "Critical":
        return "#EF4444";
      case "High":
        return "#F97316";
      case "Moderate":
        return "#F59E0B";
      default:
        return "#10B981";
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />

      {/* Header */}
      <View style={[styles.topBar, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.iconBtn, borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back-outline" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Queue & Wait Predictor</Text>

        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.iconBtn, borderColor: colors.border }]}
          onPress={toggleTheme}
        >
          <Ionicons
            name={theme === "light" ? "moon-outline" : "sunny-outline"}
            size={18}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Prediction Results Banner */}
        {result && (
          <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.resultCardHeader}>
              <View style={styles.tagRow}>
                <Ionicons name="time" size={14} color="#2563EB" />
                <Text style={styles.tagText}>LIVE QUEUE ESTIMATION</Text>
              </View>
              <View style={[styles.sourceBadge, { backgroundColor: result.source === "trained-model" ? "#DCFCE7" : "#EFF6FF" }]}>
                <Text style={[styles.sourceBadgeText, { color: result.source === "trained-model" ? "#15803D" : "#1D4ED8" }]}>
                  {result.source === "trained-model" ? "● Trained ML Model" : "● Queuing Fallback"}
                </Text>
              </View>
            </View>

            <View style={styles.mainMetricsRow}>
              <View style={styles.mainMetricCol}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Estimated Wait Time</Text>
                <View style={styles.valRow}>
                  <Text style={[styles.bigVal, { color: colors.textPrimary }]}>
                    {result.estimatedWaitMinutes}
                  </Text>
                  <Text style={[styles.unitText, { color: colors.textSecondary }]}>mins</Text>
                </View>
              </View>

              <View style={styles.vDivider} />

              <View style={styles.mainMetricCol}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Queue Length</Text>
                <View style={styles.valRow}>
                  <Text style={[styles.bigVal, { color: colors.textPrimary }]}>
                    {result.predictedQueueLength}
                  </Text>
                  <Text style={[styles.unitText, { color: colors.textSecondary }]}>cars</Text>
                </View>
              </View>
            </View>

            <View style={styles.congestionStrip}>
              <View style={[styles.congestionBadge, { backgroundColor: getCongestionColor(result.congestionLevel) + "20" }]}>
                <View style={[styles.dot, { backgroundColor: getCongestionColor(result.congestionLevel) }]} />
                <Text style={[styles.congestionText, { color: getCongestionColor(result.congestionLevel) }]}>
                  {result.congestionLevel} Congestion
                </Text>
              </View>

              <Text style={[styles.availStallsText, { color: colors.textSecondary }]}>
                {result.availableChargersNow} Free Chargers Now
              </Text>
            </View>

            {/* 6-Hour Forecast Timeline */}
            {result.hourlyForecast && result.hourlyForecast.length > 0 && (
              <View style={styles.forecastSection}>
                <Text style={[styles.forecastTitle, { color: colors.textSecondary }]}>HOURLY QUEUE FORECAST</Text>
                <View style={styles.forecastRow}>
                  {result.hourlyForecast.map((f: any, idx: number) => (
                    <View key={idx} style={[styles.forecastItem, { backgroundColor: colors.bgSecondary }]}>
                      <Text style={[styles.forecastHour, { color: colors.textMuted }]}>{f.hour}</Text>
                      <Text style={[styles.forecastQueue, { color: colors.textPrimary }]}>
                        {f.predictedQueue} {f.predictedQueue === 1 ? "car" : "cars"}
                      </Text>
                      <Text style={[styles.forecastWait, { color: f.estimatedWaitMin > 20 ? "#EF4444" : "#10B981" }]}>
                        ~{f.estimatedWaitMin}m wait
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Station Selector Card */}
        <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Select Station & Arrival Time</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            Simulate expected waiting times before driving to the station.
          </Text>

          {/* Station Selection Pills */}
          <Text style={[styles.label, { color: colors.textPrimary }]}>Charging Hub</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stationScroll}>
            {(stations.length > 0 ? stations : [
              { stationId: "CS-CMB-001", name: "Colombo Fort Hub" },
              { stationId: "CS-KOL-002", name: "Kollupitiya Marine Drive" },
              { stationId: "CS-RAJ-003", name: "Rajagiriya EcoCharge" },
              { stationId: "CS-NEG-004", name: "Katunayake Airport" },
            ]).map((st) => (
              <TouchableOpacity
                key={st.stationId}
                style={[
                  styles.stationPill,
                  {
                    backgroundColor: selectedStationId === st.stationId ? "#2563EB" : colors.bgSecondary,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedStationId(st.stationId);
                  handlePredict(st.stationId, arrivalHour, dayOfWeek);
                }}
              >
                <Text
                  style={[
                    styles.stationPillText,
                    { color: selectedStationId === st.stationId ? "#fff" : colors.textPrimary },
                  ]}
                >
                  {st.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Arrival Hour Selector */}
          <Text style={[styles.label, { color: colors.textPrimary, marginTop: 14 }]}>
            Estimated Arrival Hour ({arrivalHour}:00)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourScroll}>
            {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((hr) => (
              <TouchableOpacity
                key={hr}
                style={[
                  styles.hourBtn,
                  {
                    backgroundColor: arrivalHour === hr ? "#2563EB" : colors.bgSecondary,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  setArrivalHour(hr);
                  handlePredict(selectedStationId, hr, dayOfWeek);
                }}
              >
                <Text
                  style={[
                    styles.hourBtnText,
                    { color: arrivalHour === hr ? "#fff" : colors.textPrimary },
                  ]}
                >
                  {hr}:00
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Day of Week */}
          <Text style={[styles.label, { color: colors.textPrimary, marginTop: 14 }]}>Day of Week</Text>
          <View style={styles.daysRow}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayName, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.dayBtn,
                  {
                    backgroundColor: dayOfWeek === idx ? "#2563EB" : colors.bgSecondary,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  setDayOfWeek(idx);
                  handlePredict(selectedStationId, arrivalHour, idx);
                }}
              >
                <Text
                  style={[
                    styles.dayBtnText,
                    { color: dayOfWeek === idx ? "#fff" : colors.textSecondary },
                  ]}
                >
                  {dayName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Trigger Predict */}
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => handlePredict()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="refresh" size={16} color="#fff" />
                <Text style={styles.refreshBtnText}>Re-calculate Wait Times</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
  },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  resultCard: { borderRadius: 16, borderWidth: 0.5, padding: 18, marginBottom: 16 },
  resultCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  tagText: { fontSize: 10, fontWeight: "700", color: "#2563EB", letterSpacing: 0.5 },
  sourceBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  sourceBadgeText: { fontSize: 10, fontWeight: "600" },
  mainMetricsRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingVertical: 10 },
  mainMetricCol: { alignItems: "center" },
  metricLabel: { fontSize: 11, marginBottom: 4 },
  valRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  bigVal: { fontSize: 36, fontWeight: "800" },
  unitText: { fontSize: 13, fontWeight: "600" },
  vDivider: { width: 1, height: 40, backgroundColor: "#E5E7EB" },
  congestionStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#E5E7EB",
    paddingTop: 12,
    marginTop: 6,
  },
  congestionBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  congestionText: { fontSize: 12, fontWeight: "700" },
  availStallsText: { fontSize: 12, fontWeight: "500" },
  forecastSection: { marginTop: 16 },
  forecastTitle: { fontSize: 9, fontWeight: "700", letterSpacing: 0.6, marginBottom: 8 },
  forecastRow: { flexDirection: "row", gap: 8 },
  forecastItem: { flex: 1, padding: 8, borderRadius: 8, alignItems: "center" },
  forecastHour: { fontSize: 10, fontWeight: "600", marginBottom: 2 },
  forecastQueue: { fontSize: 12, fontWeight: "700", marginBottom: 2 },
  forecastWait: { fontSize: 10, fontWeight: "600" },
  settingsCard: { borderRadius: 16, borderWidth: 0.5, padding: 18 },
  cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  cardSub: { fontSize: 11, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  stationScroll: { marginBottom: 6 },
  stationPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 0.5, marginRight: 8 },
  stationPillText: { fontSize: 12, fontWeight: "600" },
  hourScroll: { marginBottom: 6 },
  hourBtn: { width: 56, height: 36, borderRadius: 8, borderWidth: 0.5, justifyContent: "center", alignItems: "center", marginRight: 6 },
  hourBtnText: { fontSize: 12, fontWeight: "600" },
  daysRow: { flexDirection: "row", gap: 4, marginBottom: 18 },
  dayBtn: { flex: 1, height: 36, borderRadius: 8, borderWidth: 0.5, justifyContent: "center", alignItems: "center" },
  dayBtnText: { fontSize: 11, fontWeight: "600" },
  refreshBtn: {
    backgroundColor: "#2563EB",
    height: 44,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  refreshBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
