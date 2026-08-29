import React, { useState } from "react";
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

export default function RangePredictionScreen() {
  const router = useRouter();
  const { theme, colors, toggleTheme } = useTheme();

  const [form, setForm] = useState({
    soc: "75",
    batteryCapacity: "64",
    speed: "60",
    temperature: "28",
    consumption: "14.8",
    acOn: true,
    drivingMode: "Normal",
    vehicleModel: "Hyundai Kona Electric",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const payload: RangePredictInput = {
        soc: parseFloat(form.soc) || 75,
        batteryCapacityKWh: parseFloat(form.batteryCapacity) || 64,
        speedKmH: parseFloat(form.speed) || 60,
        temperatureC: parseFloat(form.temperature) || 28,
        energyConsumptionKWhPer100Km: parseFloat(form.consumption) || 14.8,
        acOn: form.acOn,
        drivingMode: form.drivingMode,
        vehicleModel: form.vehicleModel,
      };

      const res = await evOptimizationApi.predictRange(payload);
      if (res && res.success) {
        setResult(res.data);
      } else {
        throw new Error("Invalid response");
      }
    } catch (e: any) {
      console.log("Prediction API error, applying client-side fallback calculation:", e.message);
      // Client-side fallback if backend cannot be reached
      const usableKWh = (parseFloat(form.batteryCapacity) || 64) * ((parseFloat(form.soc) || 75) / 100);
      const tempFactor = parseFloat(form.temperature) > 32 || parseFloat(form.temperature) < 15 ? 1.15 : 1.0;
      const speedFactor = parseFloat(form.speed) > 90 ? 1.15 : 1.0;
      const acFactor = form.acOn ? 1.10 : 1.0;
      const modeFactor = form.drivingMode === "Eco" ? 0.90 : form.drivingMode === "Sport" ? 1.15 : 1.0;
      const eff = (parseFloat(form.consumption) || 14.8) * tempFactor * speedFactor * acFactor * modeFactor;
      const calculatedRange = Math.round((usableKWh / eff) * 100 * 10) / 10;

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
                <Text style={styles.resultTagText}>PREDICTION RESULT</Text>
              </View>
              <View style={[styles.sourceBadge, { backgroundColor: result.source === "trained-model" ? "#DCFCE7" : "#EFF6FF" }]}>
                <Text style={[styles.sourceBadgeText, { color: result.source === "trained-model" ? "#15803D" : "#1D4ED8" }]}>
                  {result.source === "trained-model" ? "● Trained ML Model" : "● Mock Regressor"}
                </Text>
              </View>
            </View>

            <View style={styles.resultValueBlock}>
              <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Estimated Remaining Range</Text>
              <View style={styles.resultNumRow}>
                <Text style={[styles.resultNum, { color: colors.textPrimary }]}>
                  {result.remainingRangeKm}
                </Text>
                <Text style={[styles.resultUnit, { color: colors.textSecondary }]}>km</Text>
              </View>
              <Text style={styles.confidenceText}>
                Confidence Score: {Math.round(result.confidenceScore * 100)}% ({result.modelName})
              </Text>
            </View>

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
          </View>
        )}

        {/* Input Parameters Form */}
        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Vehicle & Trip Parameters</Text>
          <Text style={[styles.formSub, { color: colors.textSecondary }]}>
            Adjust current telemetry factors to simulate driving range.
          </Text>

          {/* SoC Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Battery State of Charge (%)</Text>
              <Text style={[styles.valueDisplay, { color: "#2563EB" }]}>{form.soc}%</Text>
            </View>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
              value={form.soc}
              onChangeText={(t) => setForm({ ...form, soc: t })}
              keyboardType="numeric"
              placeholder="e.g. 75"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Battery Capacity */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Battery Capacity (kWh)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
              value={form.batteryCapacity}
              onChangeText={(t) => setForm({ ...form, batteryCapacity: t })}
              keyboardType="numeric"
              placeholder="e.g. 64"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Speed & Temperature Row */}
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

          {/* Energy Consumption */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Base Consumption (kWh / 100km)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
              value={form.consumption}
              onChangeText={(t) => setForm({ ...form, consumption: t })}
              keyboardType="numeric"
              placeholder="14.8"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Driving Mode Selector */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Driving Mode</Text>
            <View style={styles.modeRow}>
              {["Eco", "Normal", "Sport"].map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.modeBtn,
                    {
                      backgroundColor: form.drivingMode === m ? "#2563EB" : colors.bgSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setForm({ ...form, drivingMode: m })}
                >
                  <Text
                    style={[
                      styles.modeBtnText,
                      { color: form.drivingMode === m ? "#fff" : colors.textSecondary },
                    ]}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* AC Toggle */}
          <TouchableOpacity
            style={[styles.toggleRow, { backgroundColor: colors.bgSecondary }]}
            onPress={() => setForm({ ...form, acOn: !form.acOn })}
            activeOpacity={0.8}
          >
            <View style={styles.toggleTextGroup}>
              <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>Air Conditioning / Heating</Text>
              <Text style={[styles.toggleSub, { color: colors.textMuted }]}>Climate control impact (~10%)</Text>
            </View>
            <Ionicons
              name={form.acOn ? "checkbox" : "square-outline"}
              size={24}
              color={form.acOn ? "#2563EB" : colors.textMuted}
            />
          </TouchableOpacity>

          {/* Submit Button */}
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
                <Text style={styles.submitBtnText}>Calculate Smart Range</Text>
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
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  resultValueBlock: {
    alignItems: "center",
    paddingVertical: 10,
  },
  resultLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  resultNumRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  resultNum: {
    fontSize: 44,
    fontWeight: "800",
  },
  resultUnit: {
    fontSize: 18,
    fontWeight: "600",
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
  formCard: {
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 18,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  formSub: {
    fontSize: 12,
    marginBottom: 16,
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
    fontSize: 13,
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
    borderWidth: 0.5,
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
