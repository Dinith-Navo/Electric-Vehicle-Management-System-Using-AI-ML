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
import { evOptimizationApi, ChargingEstimateInput } from "../../ev_optimization/services/apiClient";

export default function ChargingEstimatorScreen() {
  const router = useRouter();
  const { theme, colors, toggleTheme } = useTheme();

  const [batteryCapacity, setBatteryCapacity] = useState("64");
  const [currentSoc, setCurrentSoc] = useState("20");
  const [targetSoc, setTargetSoc] = useState("80");
  const [chargerPower, setChargerPower] = useState(50);
  const [efficiency, setEfficiency] = useState(0.90);

  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<any>(null);

  const handleEstimate = async () => {
    setLoading(true);
    const payload: ChargingEstimateInput = {
      batteryCapacityKWh: parseFloat(batteryCapacity) || 64,
      currentSoc: parseFloat(currentSoc) || 20,
      targetSoc: parseFloat(targetSoc) || 80,
      chargerPowerKw: chargerPower,
      efficiency,
    };

    try {
      const res = await evOptimizationApi.estimateChargingTime(payload);
      if (res && res.success) {
        setEstimate(res.data);
      } else {
        throw new Error("Calculation error");
      }
    } catch (e: any) {
      console.log("Estimator calculation notice, using fallback:", e.message);
      // Fallback calculation
      const cap = parseFloat(batteryCapacity) || 64;
      const cSoc = parseFloat(currentSoc) || 20;
      const tSoc = parseFloat(targetSoc) || 80;
      const deltaSoc = Math.max(0, tSoc - cSoc);
      const reqKWh = Math.round(cap * (deltaSoc / 100) * 10) / 10;
      const effPower = chargerPower * efficiency;
      const hours = effPower > 0 ? (reqKWh / effPower) * (tSoc > 80 ? 1.3 : 1.0) : 0;
      const mins = Math.round(hours * 60);

      setEstimate({
        energyRequiredKWh: reqKWh,
        effectiveChargingPowerKw: effPower,
        chargingDurationMinutes: mins,
        chargingDurationFormatted: mins > 60 ? `${Math.floor(mins / 60)} hr ${mins % 60} mins` : `${mins} mins`,
        recommendedMaxSoc: 80.0,
        curveAdjustmentFactor: tSoc > 80 ? 1.3 : 1.0,
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

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Charging Time Estimator</Text>

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
        {/* Output Results Card */}
        {estimate && (
          <View style={[styles.resCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.resHeader}>
              <View style={styles.resTag}>
                <Ionicons name="battery-charging" size={14} color="#059669" />
                <Text style={styles.resTagText}>ESTIMATION RESULT</Text>
              </View>
              {parseFloat(targetSoc) > 80 ? (
                <View style={styles.taperBadge}>
                  <Text style={styles.taperText}>⚡ Taper Curve Active (&gt;80%)</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.timeBlock}>
              <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>Required Charging Duration</Text>
              <Text style={[styles.timeValue, { color: colors.textPrimary }]}>
                {estimate.chargingDurationFormatted}
              </Text>
              <Text style={[styles.energyNote, { color: "#2563EB" }]}>
                +{estimate.energyRequiredKWh} kWh Energy Needed ({currentSoc}% ➔ {targetSoc}%)
              </Text>
            </View>

            <View style={styles.metricsGrid}>
              <View style={[styles.metricItem, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.mLabel, { color: colors.textMuted }]}>CHARGER POWER</Text>
                <Text style={[styles.mVal, { color: colors.textPrimary }]}>{chargerPower} kW</Text>
              </View>
              <View style={[styles.metricItem, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.mLabel, { color: colors.textMuted }]}>EFFECTIVE POWER</Text>
                <Text style={[styles.mVal, { color: colors.textPrimary }]}>{estimate.effectiveChargingPowerKw} kW</Text>
              </View>
              <View style={[styles.metricItem, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.mLabel, { color: colors.textMuted }]}>EFFICIENCY</Text>
                <Text style={[styles.mVal, { color: colors.textPrimary }]}>{Math.round(efficiency * 100)}%</Text>
              </View>
            </View>
          </View>
        )}

        {/* Inputs Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Session Parameters</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            Calculate charging speed based on battery capacity and charger output.
          </Text>

          {/* Battery Size */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Battery Pack Size (kWh)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
              value={batteryCapacity}
              onChangeText={setBatteryCapacity}
              keyboardType="numeric"
            />
          </View>

          {/* Current & Target SoC */}
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
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Target SoC (%)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
                value={targetSoc}
                onChangeText={setTargetSoc}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Charger Power Selection */}
          <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Charger Power Output (kW)</Text>
          <View style={styles.powerGrid}>
            {[
              { label: "7 kW (AC Home)", value: 7 },
              { label: "22 kW (AC Hub)", value: 22 },
              { label: "50 kW (DC Fast)", value: 50 },
              { label: "100 kW (Rapid)", value: 100 },
              { label: "150 kW (Ultra)", value: 150 },
              { label: "350 kW (HPC)", value: 350 },
            ].map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.powerBtn,
                  {
                    backgroundColor: chargerPower === p.value ? "#2563EB" : colors.bgSecondary,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setChargerPower(p.value)}
              >
                <Text
                  style={[
                    styles.powerBtnText,
                    { color: chargerPower === p.value ? "#fff" : colors.textPrimary },
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.calcBtn} onPress={handleEstimate} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="calculator-outline" size={18} color="#fff" />
                <Text style={styles.calcBtnText}>Calculate Charging Duration</Text>
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
  resCard: { borderRadius: 16, borderWidth: 0.5, padding: 18, marginBottom: 16 },
  resHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  resTag: { flexDirection: "row", alignItems: "center", gap: 4 },
  resTagText: { fontSize: 10, fontWeight: "700", color: "#059669", letterSpacing: 0.5 },
  taperBadge: { backgroundColor: "#FFFBEB", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  taperText: { fontSize: 10, fontWeight: "600", color: "#D97706" },
  timeBlock: { alignItems: "center", paddingVertical: 10 },
  timeLabel: { fontSize: 12, marginBottom: 4 },
  timeValue: { fontSize: 36, fontWeight: "800" },
  energyNote: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  metricsGrid: { flexDirection: "row", gap: 8, marginTop: 14 },
  metricItem: { flex: 1, padding: 8, borderRadius: 8, alignItems: "center" },
  mLabel: { fontSize: 8, fontWeight: "700", marginBottom: 2 },
  mVal: { fontSize: 13, fontWeight: "700" },
  card: { borderRadius: 16, borderWidth: 0.5, padding: 18 },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  cardSub: { fontSize: 11, marginBottom: 14 },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  textInput: { height: 42, borderRadius: 10, borderWidth: 0.5, paddingHorizontal: 12, fontSize: 13 },
  row: { flexDirection: "row", gap: 10 },
  powerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  powerBtn: { width: "48.5%", paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, borderWidth: 0.5, alignItems: "center" },
  powerBtnText: { fontSize: 11, fontWeight: "600" },
  calcBtn: {
    backgroundColor: "#2563EB",
    height: 46,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  calcBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
