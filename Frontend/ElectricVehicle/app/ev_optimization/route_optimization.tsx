import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import { evOptimizationApi, RouteOptimizeInput } from "../../ev_optimization/services/apiClient";

const PRESET_ROUTES = [
  {
    name: "Colombo ➔ Galle (120 km)",
    originName: "Colombo Fort",
    originLat: 6.9344,
    originLon: 79.8428,
    destName: "Galle Dutch Fort",
    destLat: 6.0329,
    destLon: 80.2168,
  },
  {
    name: "Colombo ➔ Kandy (115 km)",
    originName: "Colombo Fort",
    originLat: 6.9344,
    originLon: 79.8428,
    destName: "Kandy City Center",
    destLat: 7.2906,
    destLon: 80.6337,
  },
  {
    name: "Colombo ➔ Katunayake (35 km)",
    originName: "Colombo Fort",
    originLat: 6.9344,
    originLon: 79.8428,
    destName: "Bandaranaike Airport",
    destLat: 7.1802,
    destLon: 79.8841,
  },
];

export default function RouteOptimizationScreen() {
  const router = useRouter();
  const { theme, colors, toggleTheme } = useTheme();

  const [selectedPreset, setSelectedPreset] = useState(0);
  const [currentSoc, setCurrentSoc] = useState("35");
  const [consumption, setConsumption] = useState("15.5");
  const [batteryCapacity, setBatteryCapacity] = useState("64");

  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<any>(null);

  const handlePlanRoute = async () => {
    setLoading(true);
    const routeData = PRESET_ROUTES[selectedPreset];
    const payload: RouteOptimizeInput = {
      originLat: routeData.originLat,
      originLon: routeData.originLon,
      originName: routeData.originName,
      destLat: routeData.destLat,
      destLon: routeData.destLon,
      destName: routeData.destName,
      currentSoc: parseFloat(currentSoc) || 35,
      batteryCapacityKWh: parseFloat(batteryCapacity) || 64,
      consumptionKWhPer100Km: parseFloat(consumption) || 15.5,
    };

    try {
      const res = await evOptimizationApi.optimizeRoute(payload);
      if (res && res.success) {
        setRouteResult(res.data);
      } else {
        throw new Error("Route calculation error");
      }
    } catch (e: any) {
      console.log("Route calculation notice, using fallback:", e.message);
      // Fallback calculation
      const dist = selectedPreset === 0 ? 128.5 : (selectedPreset === 1 ? 116.0 : 36.0);
      const estRange = ((parseFloat(batteryCapacity) || 64) * ((parseFloat(currentSoc) || 35) / 100) / (parseFloat(consumption) || 15.5)) * 100;
      const isReq = estRange < dist + 20;

      setRouteResult({
        origin: routeData.originName,
        destination: routeData.destName,
        totalDistanceKm: dist,
        estimatedDriveTimeMinutes: Math.round((dist / 65) * 60),
        isChargingRequired: isReq,
        currentEstimatedRangeKm: Math.round(estRange * 10) / 10,
        remainingRangeAtDestinationKm: Math.max(0, Math.round((estRange - dist) * 10) / 10),
        energyRequiredKWh: Math.round((dist / 100) * (parseFloat(consumption) || 15.5) * 10) / 10,
        waypoints: [
          { name: "Checkpoint 1 (25%)", distanceFromOriginKm: Math.round(dist * 0.25), remainingSocEstimated: 26.5 },
          { name: "Checkpoint 2 (50%)", distanceFromOriginKm: Math.round(dist * 0.50), remainingSocEstimated: 18.0 },
          { name: "Checkpoint 3 (75%)", distanceFromOriginKm: Math.round(dist * 0.75), remainingSocEstimated: 10.0 },
        ],
        recommendedChargingStops: isReq
          ? [
              {
                stationId: "CS-GAL-005",
                name: "Southern Expressway Fast Charger",
                distanceFromOriginKm: Math.round(dist * 0.55),
                arrivalSocEstimated: 14.5,
                recommendedChargeToSoc: 80.0,
                estimatedChargeTimeMinutes: 26,
                estimatedCost: 11.20,
                chargerSpeedKw: 120,
                connectorType: "CCS2",
              },
            ]
          : [],
        totalTripDurationMinutes: Math.round((dist / 65) * 60) + (isReq ? 26 : 0),
        totalEstimatedTripCost: isReq ? 11.20 : 0.0,
      });
    } finally {
      setLoading(false);
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

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Smart Route Optimizer</Text>

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
        {/* Route Planner Inputs */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Trip & Route Selection</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            Select a travel destination to calculate battery feasibility and charging stops.
          </Text>

          {/* Preset Buttons */}
          <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Preset Travel Corridors</Text>
          <View style={styles.presetsCol}>
            {PRESET_ROUTES.map((p, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.presetBtn,
                  {
                    backgroundColor: selectedPreset === idx ? "#2563EB" : colors.bgSecondary,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setSelectedPreset(idx)}
              >
                <Ionicons
                  name="navigate-circle-outline"
                  size={18}
                  color={selectedPreset === idx ? "#fff" : "#2563EB"}
                />
                <Text
                  style={[
                    styles.presetBtnText,
                    { color: selectedPreset === idx ? "#fff" : colors.textPrimary },
                  ]}
                >
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Parameters Row */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Current SoC (%)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
                value={currentSoc}
                onChangeText={setCurrentSoc}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Consumption (kWh)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
                value={consumption}
                onChangeText={setConsumption}
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.planBtn}
            onPress={handlePlanRoute}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="sparkles" size={16} color="#fff" />
                <Text style={styles.planBtnText}>Optimize Route & Charging</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Route Optimization Results */}
        {routeResult && (
          <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.resHeader}>
              <View>
                <Text style={[styles.resRouteTitle, { color: colors.textPrimary }]}>
                  {routeResult.origin} ➔ {routeResult.destination}
                </Text>
                <Text style={[styles.resSub, { color: colors.textSecondary }]}>
                  {routeResult.totalDistanceKm} km • ~{routeResult.estimatedDriveTimeMinutes} mins drive
                </Text>
              </View>

              <View
                style={[
                  styles.chargingBadge,
                  { backgroundColor: routeResult.isChargingRequired ? "#FEF2F2" : "#ECFDF5" },
                ]}
              >
                <Ionicons
                  name={routeResult.isChargingRequired ? "alert-circle" : "checkmark-circle"}
                  size={14}
                  color={routeResult.isChargingRequired ? "#DC2626" : "#059669"}
                />
                <Text
                  style={[
                    styles.chargingBadgeText,
                    { color: routeResult.isChargingRequired ? "#DC2626" : "#059669" },
                  ]}
                >
                  {routeResult.isChargingRequired ? "Charging Needed" : "Direct Route OK"}
                </Text>
              </View>
            </View>

            {/* Quick Metrics Bar */}
            <View style={styles.metricsBar}>
              <View style={styles.metricItem}>
                <Text style={[styles.mLabel, { color: colors.textMuted }]}>CURRENT RANGE</Text>
                <Text style={[styles.mVal, { color: colors.textPrimary }]}>
                  {routeResult.currentEstimatedRangeKm} km
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[styles.mLabel, { color: colors.textMuted }]}>ENERGY NEEDED</Text>
                <Text style={[styles.mVal, { color: colors.textPrimary }]}>
                  {routeResult.energyRequiredKWh} kWh
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[styles.mLabel, { color: colors.textMuted }]}>TOTAL TIME</Text>
                <Text style={[styles.mVal, { color: "#2563EB" }]}>
                  {routeResult.totalTripDurationMinutes} mins
                </Text>
              </View>
            </View>

            {/* Recommended Charging Stop */}
            {routeResult.recommendedChargingStops?.length > 0 && (
              <View style={styles.stopCard}>
                <View style={styles.stopTag}>
                  <Ionicons name="flash" size={12} color="#D97706" />
                  <Text style={styles.stopTagText}>RECOMMENDED CHARGING STOP</Text>
                </View>

                {routeResult.recommendedChargingStops.map((stop: any, sIdx: number) => (
                  <View key={sIdx} style={styles.stopContent}>
                    <Text style={styles.stopStationName}>{stop.name}</Text>
                    <Text style={styles.stopDetails}>
                      Stop at km {stop.distanceKm || stop.distanceFromOriginKm} • Arrival SoC: ~{stop.arrivalSocEstimated}%
                    </Text>

                    <View style={styles.chargeActionBox}>
                      <View>
                        <Text style={styles.chargeActionTitle}>
                          Charge {stop.arrivalSocEstimated}% ➔ {stop.recommendedChargeToSoc}%
                        </Text>
                        <Text style={styles.chargeActionSub}>
                          {stop.chargerSpeedKw}kW {stop.connectorType} Fast Charger
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.chargeTimeText}>+{stop.estimatedChargeTimeMinutes} mins</Text>
                        <Text style={styles.chargeCostText}>${stop.estimatedCost}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Checkpoints Timeline */}
            <Text style={[styles.timelineHeader, { color: colors.textSecondary }]}>ROUTE CHECKPOINTS</Text>
            <View style={styles.timeline}>
              {routeResult.waypoints?.map((w: any, idx: number) => (
                <View key={idx} style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineInfo}>
                    <Text style={[styles.tlName, { color: colors.textPrimary }]}>{w.name}</Text>
                    <Text style={[styles.tlDist, { color: colors.textSecondary }]}>
                      {w.distanceFromOriginKm} km • Est. SoC: {w.remainingSocEstimated}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
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
  card: { borderRadius: 16, borderWidth: 0.5, padding: 18, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  cardSub: { fontSize: 11, marginBottom: 14 },
  inputLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  presetsCol: { gap: 8, marginBottom: 14 },
  presetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 0.5,
  },
  presetBtnText: { fontSize: 12, fontWeight: "600" },
  row: { flexDirection: "row", gap: 10 },
  inputGroup: { marginBottom: 14 },
  textInput: { height: 42, borderRadius: 10, borderWidth: 0.5, paddingHorizontal: 12, fontSize: 13 },
  planBtn: {
    backgroundColor: "#2563EB",
    height: 46,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  planBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  resultCard: { borderRadius: 16, borderWidth: 0.5, padding: 18 },
  resHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  resRouteTitle: { fontSize: 16, fontWeight: "700" },
  resSub: { fontSize: 11, marginTop: 2 },
  chargingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chargingBadgeText: { fontSize: 10, fontWeight: "700" },
  metricsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#E5E7EB",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 10,
    marginBottom: 14,
  },
  metricItem: { alignItems: "center" },
  mLabel: { fontSize: 8, fontWeight: "700", letterSpacing: 0.5, marginBottom: 2 },
  mVal: { fontSize: 13, fontWeight: "700" },
  stopCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#FCD34D",
    padding: 14,
    marginBottom: 16,
  },
  stopTag: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  stopTagText: { fontSize: 9, fontWeight: "700", color: "#D97706", letterSpacing: 0.5 },
  stopContent: {},
  stopStationName: { fontSize: 14, fontWeight: "700", color: "#1F2937" },
  stopDetails: { fontSize: 11, color: "#4B5563", marginTop: 2, marginBottom: 8 },
  chargeActionBox: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chargeActionTitle: { fontSize: 12, fontWeight: "700", color: "#111827" },
  chargeActionSub: { fontSize: 10, color: "#6B7280", marginTop: 1 },
  chargeTimeText: { fontSize: 13, fontWeight: "700", color: "#2563EB" },
  chargeCostText: { fontSize: 11, color: "#059669", fontWeight: "600" },
  timelineHeader: { fontSize: 10, fontWeight: "700", letterSpacing: 0.6, marginBottom: 10 },
  timeline: { gap: 10 },
  timelineItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2563EB" },
  timelineInfo: { flex: 1 },
  tlName: { fontSize: 12, fontWeight: "600" },
  tlDist: { fontSize: 11 },
});
