import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import { evOptimizationApi, RangePredictInput } from "../../ev_optimization/services/apiClient";

interface VehiclePreset {
  model: string;
  capacityKWh: number;
  consumptionKWhPer100Km: number;
  badge: string;
}

const EV_MODELS: VehiclePreset[] = [
  {
    model: "Hyundai Kona Electric",
    capacityKWh: 64,
    consumptionKWhPer100Km: 14.8,
    badge: "64 kWh • 14.8 kWh/100km",
  },
  {
    model: "Nissan Leaf e+",
    capacityKWh: 62,
    consumptionKWhPer100Km: 16.2,
    badge: "62 kWh • 16.2 kWh/100km",
  },
  {
    model: "Tesla Model 3 LR",
    capacityKWh: 75,
    consumptionKWhPer100Km: 14.2,
    badge: "75 kWh • 14.2 kWh/100km",
  },
  {
    model: "BYD Atto 3",
    capacityKWh: 60.5,
    consumptionKWhPer100Km: 15.6,
    badge: "60.5 kWh • 15.6 kWh/100km",
  },
  {
    model: "MG ZS EV",
    capacityKWh: 51,
    consumptionKWhPer100Km: 16.5,
    badge: "51 kWh • 16.5 kWh/100km",
  },
];

export default function RangePredictionScreen() {
  const router = useRouter();
  const { theme, colors, toggleTheme } = useTheme();

  const [form, setForm] = useState({
    soc: "74.5",
    batteryCapacity: "64",
    speed: "60",
    temperature: "28",
    consumption: "14.8",
    acOn: true,
    drivingMode: "Normal",
    vehicleModel: "Hyundai Kona Electric",
  });

  const [liveVehicle, setLiveVehicle] = useState<any>(null);
  const [isTelemetrySynced, setIsTelemetrySynced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Sync telemetry from dashboard endpoint
  const syncTelemetry = useCallback(async () => {
    try {
      const res = await evOptimizationApi.getDashboard();
      if (res && res.success && res.data) {
        const v = res.data.vehicle || {};
        setLiveVehicle(v);
        setForm((prev) => ({
          ...prev,
          soc: v.currentSoc !== undefined ? String(v.currentSoc) : prev.soc,
          batteryCapacity: v.batteryCapacityKWh !== undefined ? String(v.batteryCapacityKWh) : prev.batteryCapacity,
          consumption: v.energyConsumption !== undefined ? String(v.energyConsumption) : prev.consumption,
          vehicleModel: v.model || prev.vehicleModel,
        }));
        setIsTelemetrySynced(true);
      }
    } catch {
      // Retain fallback
    }
  }, []);

  useEffect(() => {
    syncTelemetry();
  }, [syncTelemetry]);

  const handleSelectModel = (preset: VehiclePreset) => {
    setForm((prev) => ({
      ...prev,
      vehicleModel: preset.model,
      batteryCapacity: String(preset.capacityKWh),
      consumption: String(preset.consumptionKWhPer100Km),
    }));
  };

  const handlePredict = async () => {
    setLoading(true);
    const socVal = parseFloat(form.soc) || 75;
    const capVal = parseFloat(form.batteryCapacity) || 64;
    const speedVal = parseFloat(form.speed) || 60;
    const tempVal = parseFloat(form.temperature) || 28;
    const consVal = parseFloat(form.consumption) || 14.8;

    try {
      const payload: RangePredictInput = {
        soc: socVal,
        batteryCapacityKWh: capVal,
        speedKmH: speedVal,
        temperatureC: tempVal,
        energyConsumptionKWhPer100Km: consVal,
        acOn: form.acOn,
        drivingMode: form.drivingMode,
        vehicleModel: form.vehicleModel,
      };

      const res = await evOptimizationApi.predictRange(payload);
      if (res && res.success && res.data) {
        setResult(res.data);
      } else {
        throw new Error("Invalid response");
      }
    } catch (e: any) {
      console.log("Prediction notice, applying client calculation:", e.message);
      // Client-side fallback calculation
      const usableKWh = capVal * (socVal / 100);
      const tempFactor = tempVal > 32 || tempVal < 15 ? 1.15 : 1.0;
      const speedFactor = speedVal > 90 ? 1.16 : (speedVal > 70 ? 1.08 : 1.0);
      const acFactor = form.acOn ? 1.10 : 1.0;
      const modeFactor = form.drivingMode === "Eco" ? 0.90 : form.drivingMode === "Sport" ? 1.15 : 1.0;
      const eff = consVal * tempFactor * speedFactor * acFactor * modeFactor;
      const calculatedRange = Math.round((usableKWh / maxVal(5.0, eff)) * 100 * 10) / 10;

      setResult({
        remainingRangeKm: calculatedRange,
        confidenceScore: 0.88,
        source: "mock",
        modelName: "ClientFallbackEstimator",
        factors: {
          usableEnergyKWh: usableKWh,
          tempFactor,
          speedFactor,
          acFactor,
        },
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const maxVal = (a: number, b: number) => (a > b ? a : b);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />

      {/* Top Header Bar */}
      <View style={[styles.topBar, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.iconBtn, borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back-outline" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Smart Range Predictor</Text>

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
        {/* Prediction Results Card if Available */}
        {result && (
          <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.resultHeader}>
              <View style={styles.resultTag}>
                <Ionicons name="flash" size={14} color="#059669" />
                <Text style={styles.resultTagText}>ESTIMATED RANGE</Text>
              </View>

              <View
                style={[
                  styles.sourceBadge,
                  {
                    backgroundColor:
                      result.source === "trained-model" ? "rgba(16, 185, 129, 0.12)" : "rgba(37, 99, 235, 0.12)",
                    borderColor: result.source === "trained-model" ? "#10B981" : "#2563EB",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sourceBadgeText,
                    { color: result.source === "trained-model" ? "#059669" : "#2563EB" },
                  ]}
                >
                  {result.source === "trained-model" ? "● Trained ML (Synthetic Benchmark)" : "● Physics Fallback Model"}
                </Text>
              </View>
            </View>

            <View style={styles.resultValueBlock}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
                Predicted Remaining Driving Range
              </Text>
              <View style={styles.resultNumRow}>
                <Text style={[styles.resultNum, { color: colors.textPrimary }]}>
                  {result.remainingRangeKm}
                </Text>
                <Text style={[styles.resultUnit, { color: "#2563EB" }]}>km</Text>
              </View>
              <Text style={styles.confidenceText}>
                Confidence Score: {Math.round(result.confidenceScore * 100)}% ({result.modelName})
              </Text>
            </View>

            {/* Factors Grid */}
            <View style={styles.factorGrid}>
              <View style={[styles.factorItem, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.factorTitle, { color: colors.textMuted }]}>BATTERY SOC</Text>
                <Text style={[styles.factorVal, { color: colors.textPrimary }]}>{form.soc}%</Text>
              </View>
              <View style={[styles.factorItem, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.factorTitle, { color: colors.textMuted }]}>SPEED</Text>
                <Text style={[styles.factorVal, { color: colors.textPrimary }]}>{form.speed} km/h</Text>
              </View>
              <View style={[styles.factorItem, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.factorTitle, { color: colors.textMuted }]}>TEMP</Text>
                <Text style={[styles.factorVal, { color: colors.textPrimary }]}>{form.temperature}°C</Text>
              </View>
              <View style={[styles.factorItem, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.factorTitle, { color: colors.textMuted }]}>AC / CLIMATE</Text>
                <Text style={[styles.factorVal, { color: form.acOn ? "#0284C7" : colors.textPrimary }]}>
                  {form.acOn ? "ON" : "OFF"}
                </Text>
              </View>
            </View>

            {/* Range Optimization Tips */}
            <View style={styles.tipsBox}>
              <View style={styles.tipRow}>
                <Ionicons name="bulb-outline" size={14} color="#D97706" />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  {form.drivingMode === "Eco"
                    ? "Eco Mode active: Extended efficiency profile enabled (+10% range)."
                    : "Switching to Eco Mode would add ~12-18 km of additional driving range."}
                </Text>
              </View>
              {form.acOn && (
                <View style={styles.tipRow}>
                  <Ionicons name="snow-outline" size={14} color="#0284C7" />
                  <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                    Turning AC off would recover ~{Math.round(result.remainingRangeKm * 0.09)} km of range.
                  </Text>
                </View>
              )}
            </View>

            {/* Action button: Find stations within this range */}
            <TouchableOpacity
              style={styles.findStationsBtn}
              onPress={() => router.push("/ev_optimization/charging_stations" as any)}
            >
              <Ionicons name="flash-outline" size={16} color="#ffffff" />
              <Text style={styles.findStationsBtnText}>Find Charging Stations Within Range</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input Parameters Form Card */}
        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.telemetrySyncRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Vehicle & Telemetry Parameters</Text>
              <Text style={[styles.formSub, { color: colors.textSecondary }]}>
                {isTelemetrySynced && liveVehicle?.vin
                  ? `Synced with VIN: ${liveVehicle.vin} • SoH: ${liveVehicle.batteryHealthSoH || 96.5}%`
                  : "Simulate dynamic range under varying road and battery conditions."}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.syncBadgeBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
              onPress={syncTelemetry}
            >
              <Ionicons name="refresh" size={13} color="#2563EB" />
              <Text style={styles.syncBadgeBtnText}>Sync Telemetry</Text>
            </TouchableOpacity>
          </View>

          {/* Model Selector Pills */}
          <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Select EV Model Profile</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modelsScroll}>
            {EV_MODELS.map((preset) => {
              const isSelected = form.vehicleModel === preset.model;
              return (
                <TouchableOpacity
                  key={preset.model}
                  style={[
                    styles.modelChip,
                    {
                      backgroundColor: isSelected ? "#2563EB" : colors.bgSecondary,
                      borderColor: isSelected ? "#2563EB" : colors.border,
                    },
                  ]}
                  onPress={() => handleSelectModel(preset)}
                >
                  <Ionicons
                    name="car-sport"
                    size={14}
                    color={isSelected ? "#ffffff" : "#2563EB"}
                  />
                  <View>
                    <Text
                      style={[
                        styles.modelChipText,
                        { color: isSelected ? "#ffffff" : colors.textPrimary },
                      ]}
                    >
                      {preset.model}
                    </Text>
                    <Text
                      style={[
                        styles.modelChipSub,
                        { color: isSelected ? "rgba(255,255,255,0.8)" : colors.textSecondary },
                      ]}
                    >
                      {preset.badge}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* SoC Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                Battery State of Charge (%)
              </Text>
              <Text style={[styles.valueDisplay, { color: "#2563EB" }]}>{form.soc}%</Text>
            </View>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
              value={form.soc}
              onChangeText={(t) => setForm({ ...form, soc: t })}
              keyboardType="numeric"
              placeholder="e.g. 74.5"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Battery Capacity & Base Consumption */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Capacity (kWh)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
                value={form.batteryCapacity}
                onChangeText={(t) => setForm({ ...form, batteryCapacity: t })}
                keyboardType="numeric"
                placeholder="64"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Cons. (kWh/100km)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
                value={form.consumption}
                onChangeText={(t) => setForm({ ...form, consumption: t })}
                keyboardType="numeric"
                placeholder="14.8"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          {/* Speed & Ambient Temperature */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Speed (km/h)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
                value={form.speed}
                onChangeText={(t) => setForm({ ...form, speed: t })}
                keyboardType="numeric"
                placeholder="60"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Ambient Temp (°C)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
                value={form.temperature}
                onChangeText={(t) => setForm({ ...form, temperature: t })}
                keyboardType="numeric"
                placeholder="28"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          {/* Driving Mode Selector */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Driving Mode Profile</Text>
            <View style={styles.modeRow}>
              {["Eco", "Normal", "Sport"].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.modeBtn,
                    {
                      backgroundColor: form.drivingMode === m ? "#2563EB" : colors.bgSecondary,
                      borderColor: form.drivingMode === m ? "#2563EB" : colors.border,
                    },
                  ]}
                  onPress={() => setForm({ ...form, drivingMode: m })}
                >
                  <Text
                    style={[
                      styles.modeBtnText,
                      { color: form.drivingMode === m ? "#ffffff" : colors.textSecondary },
                    ]}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* AC / Climate Toggle */}
          <TouchableOpacity
            style={[styles.toggleRow, { backgroundColor: colors.bgSecondary }]}
            onPress={() => setForm({ ...form, acOn: !form.acOn })}
            activeOpacity={0.8}
          >
            <View style={styles.toggleTextGroup}>
              <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>
                Climate Control / Air Conditioning
              </Text>
              <Text style={[styles.toggleSub, { color: colors.textMuted }]}>
                Compressor cooling or cabin heating penalty (~10%)
              </Text>
            </View>
            <Ionicons
              name={form.acOn ? "checkbox" : "square-outline"}
              size={24}
              color={form.acOn ? "#2563EB" : colors.textMuted}
            />
          </TouchableOpacity>

          {/* Calculate Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handlePredict}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color="#fff" />
                <Text style={styles.submitBtnText}>Estimate Remaining Range</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
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
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  resultCard: {
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 18,
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  resultTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  resultTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
    letterSpacing: 0.5,
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  resultValueBlock: {
    alignItems: "center",
    paddingVertical: 8,
  },
  resultLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  resultNumRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  resultNum: {
    fontSize: 46,
    fontWeight: "800",
  },
  resultUnit: {
    fontSize: 18,
    fontWeight: "700",
  },
  confidenceText: {
    fontSize: 11,
    color: "#059669",
    marginTop: 4,
  },
  factorGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  factorItem: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  factorTitle: {
    fontSize: 8,
    fontWeight: "700",
    marginBottom: 2,
  },
  factorVal: {
    fontSize: 12,
    fontWeight: "700",
  },
  tipsBox: {
    marginTop: 14,
    gap: 6,
    padding: 10,
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderRadius: 8,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tipText: {
    fontSize: 11,
    flex: 1,
  },
  findStationsBtn: {
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 14,
  },
  findStationsBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  formCard: {
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 18,
  },
  telemetrySyncRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  formSub: {
    fontSize: 11,
    lineHeight: 16,
  },
  syncBadgeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 8,
  },
  syncBadgeBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563EB",
  },
  modelsScroll: {
    marginBottom: 14,
  },
  modelChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  modelChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  modelChipSub: {
    fontSize: 9,
    marginTop: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  valueDisplay: {
    fontSize: 13,
    fontWeight: "700",
  },
  textInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 18,
  },
  toggleTextGroup: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  toggleSub: {
    fontSize: 11,
    marginTop: 2,
  },
  submitBtn: {
    backgroundColor: "#2563EB",
    height: 48,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
