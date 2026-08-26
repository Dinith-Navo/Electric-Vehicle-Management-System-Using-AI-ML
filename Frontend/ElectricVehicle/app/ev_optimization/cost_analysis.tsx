import React, { useEffect, useState } from "react";
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
import { evOptimizationApi, CostEstimateInput } from "../../ev_optimization/services/apiClient";

export default function CostAnalysisScreen() {
  const router = useRouter();
  const { theme, colors, toggleTheme } = useTheme();

  const [calcEnergy, setCalcEnergy] = useState("32.5");
  const [calcPrice, setCalcPrice] = useState("0.35");
  const [calcFee, setCalcFee] = useState("1.50");

  const [costResult, setCostResult] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonthlyData();
    calculateSession();
  }, []);

  const loadMonthlyData = async () => {
    try {
      const res = await evOptimizationApi.getMonthlyCostSummary();
      if (res && res.success) {
        setMonthlyData(res.data);
      } else {
        throw new Error("Data error");
      }
    } catch (e: any) {
      console.log("Monthly cost notice, using fallback:", e.message);
      setMonthlyData({
        month: "August",
        year: 2026,
        totalSessions: 5,
        totalEnergyKWh: 145.1,
        totalCost: 53.42,
        avgCostPerSession: 10.68,
        avgCostPerKWh: 0.368,
        savingsVsPetrol: 85.47,
        recentSessions: [
          { sessionId: "SES-0982", date: "2026-08-24", stationName: "Colombo Fort Hub", energyKWh: 28.5, durationMinutes: 24, cost: 10.83, chargerType: "CCS2 (150kW)" },
          { sessionId: "SES-0975", date: "2026-08-19", stationName: "Kollupitiya Marine Drive", energyKWh: 22.0, durationMinutes: 18, cost: 7.70, chargerType: "CCS2 (120kW)" },
          { sessionId: "SES-0961", date: "2026-08-14", stationName: "Rajagiriya EcoCharge", energyKWh: 34.2, durationMinutes: 32, cost: 10.26, chargerType: "CCS2 (100kW)" },
          { sessionId: "SES-0948", date: "2026-08-08", stationName: "Katunayake Highway Fast", energyKWh: 42.0, durationMinutes: 35, cost: 17.64, chargerType: "CCS2 (180kW)" },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateSession = async () => {
    const kwh = parseFloat(calcEnergy) || 30;
    const price = parseFloat(calcPrice) || 0.35;
    const fee = parseFloat(calcFee) || 1.50;

    try {
      const payload: CostEstimateInput = { energyKWh: kwh, pricePerKWh: price, serviceFee: fee };
      const res = await evOptimizationApi.estimateCost(payload);
      if (res && res.success) {
        setCostResult(res.data);
      } else {
        throw new Error("Calculation error");
      }
    } catch {
      const base = Math.round(kwh * price * 100) / 100;
      const tax = Math.round(base * 0.08 * 100) / 100;
      setCostResult({
        baseEnergyCost: base,
        taxAmount: tax,
        serviceFee: fee,
        totalSessionCost: Math.round((base + tax + fee) * 100) / 100,
        currency: "USD",
        pricePerKWh: price,
      });
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

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Cost & Energy Analytics</Text>

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
        {/* Monthly Summary Hero Card */}
        {monthlyData && (
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.summaryHeader}>
              <View>
                <Text style={[styles.summaryMonth, { color: colors.textPrimary }]}>
                  {monthlyData.month} {monthlyData.year} Summary
                </Text>
                <Text style={[styles.summarySub, { color: colors.textSecondary }]}>
                  {monthlyData.totalSessions} charging sessions recorded
                </Text>
              </View>
              <View style={styles.savingsTag}>
                <Ionicons name="trending-down" size={13} color="#059669" />
                <Text style={styles.savingsTagText}>${monthlyData.savingsVsPetrol} Saved</Text>
              </View>
            </View>

            <View style={styles.mainSpendBlock}>
              <Text style={[styles.spendLabel, { color: colors.textMuted }]}>TOTAL MONTHLY CHARGING SPEND</Text>
              <Text style={[styles.spendValue, { color: colors.textPrimary }]}>${monthlyData.totalCost}</Text>
              <Text style={[styles.energySub, { color: "#2563EB" }]}>
                ⚡ {monthlyData.totalEnergyKWh} kWh energy charged
              </Text>
            </View>

            <View style={styles.summaryGrid}>
              <View style={[styles.summaryBox, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.sBoxLabel, { color: colors.textMuted }]}>AVG SESSION</Text>
                <Text style={[styles.sBoxVal, { color: colors.textPrimary }]}>${monthlyData.avgCostPerSession}</Text>
              </View>
              <View style={[styles.summaryBox, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.sBoxLabel, { color: colors.textMuted }]}>AVG PER KWH</Text>
                <Text style={[styles.sBoxVal, { color: colors.textPrimary }]}>${monthlyData.avgCostPerKWh}</Text>
              </View>
              <View style={[styles.summaryBox, { backgroundColor: colors.bgSecondary }]}>
                <Text style={[styles.sBoxLabel, { color: colors.textMuted }]}>SESSIONS</Text>
                <Text style={[styles.sBoxVal, { color: colors.textPrimary }]}>{monthlyData.totalSessions}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Calculator Card */}
        <View style={[styles.calcCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Session Cost Calculator</Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            Estimate single charging session fee based on required energy.
          </Text>

          <View style={styles.calcRow}>
            <View style={[styles.inputCol, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Energy (kWh)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
                value={calcEnergy}
                onChangeText={setCalcEnergy}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputCol, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Price ($/kWh)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.border }]}
                value={calcPrice}
                onChangeText={setCalcPrice}
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.calcBtn} onPress={calculateSession}>
            <Text style={styles.calcBtnText}>Calculate Cost</Text>
          </TouchableOpacity>

          {costResult && (
            <View style={[styles.costResultBox, { backgroundColor: colors.bgSecondary }]}>
              <View style={styles.costBreakdownRow}>
                <Text style={[styles.costItemLabel, { color: colors.textSecondary }]}>Base Energy Cost</Text>
                <Text style={[styles.costItemVal, { color: colors.textPrimary }]}>${costResult.baseEnergyCost}</Text>
              </View>
              <View style={styles.costBreakdownRow}>
                <Text style={[styles.costItemLabel, { color: colors.textSecondary }]}>Tax & Utility Surcharges</Text>
                <Text style={[styles.costItemVal, { color: colors.textPrimary }]}>${costResult.taxAmount}</Text>
              </View>
              <View style={styles.costBreakdownRow}>
                <Text style={[styles.costItemLabel, { color: colors.textSecondary }]}>Station Service Fee</Text>
                <Text style={[styles.costItemVal, { color: colors.textPrimary }]}>${costResult.serviceFee}</Text>
              </View>

              <View style={styles.totalDivider} />

              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Estimated Session Total</Text>
                <Text style={styles.totalAmount}>${costResult.totalSessionCost}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Recent Session History Log */}
        {monthlyData?.recentSessions?.length > 0 && (
          <View style={styles.historySection}>
            <Text style={[styles.historySectionTitle, { color: colors.textSecondary }]}>
              RECENT CHARGING SESSIONS
            </Text>

            {monthlyData.recentSessions.map((session: any, idx: number) => (
              <View
                key={session.sessionId || idx}
                style={[styles.sessionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.sessionLeft}>
                  <View style={styles.sessionIconBox}>
                    <Ionicons name="flash" size={16} color="#059669" />
                  </View>
                  <View>
                    <Text style={[styles.sessionStation, { color: colors.textPrimary }]}>
                      {session.stationName}
                    </Text>
                    <Text style={[styles.sessionDate, { color: colors.textMuted }]}>
                      {session.date} • {session.durationMinutes} mins ({session.chargerType})
                    </Text>
                  </View>
                </View>

                <View style={styles.sessionRight}>
                  <Text style={[styles.sessionCost, { color: colors.textPrimary }]}>${session.cost}</Text>
                  <Text style={[styles.sessionKWh, { color: "#2563EB" }]}>{session.energyKWh} kWh</Text>
                </View>
              </View>
            ))}
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
  summaryCard: { borderRadius: 16, borderWidth: 0.5, padding: 18, marginBottom: 16 },
  summaryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  summaryMonth: { fontSize: 16, fontWeight: "700" },
  summarySub: { fontSize: 11, marginTop: 2 },
  savingsTag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#DCFCE7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  savingsTagText: { fontSize: 10, fontWeight: "700", color: "#15803D" },
  mainSpendBlock: { alignItems: "center", paddingVertical: 10 },
  spendLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  spendValue: { fontSize: 36, fontWeight: "800" },
  energySub: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  summaryGrid: { flexDirection: "row", gap: 8, marginTop: 14 },
  summaryBox: { flex: 1, padding: 8, borderRadius: 8, alignItems: "center" },
  sBoxLabel: { fontSize: 8, fontWeight: "700", marginBottom: 2 },
  sBoxVal: { fontSize: 13, fontWeight: "700" },
  calcCard: { borderRadius: 16, borderWidth: 0.5, padding: 18, marginBottom: 20 },
  cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  cardSub: { fontSize: 11, marginBottom: 12 },
  calcRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  inputCol: {},
  inputLabel: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
  textInput: { height: 40, borderRadius: 8, borderWidth: 0.5, paddingHorizontal: 10, fontSize: 13 },
  calcBtn: { backgroundColor: "#2563EB", height: 40, borderRadius: 8, justifyContent: "center", alignItems: "center", marginBottom: 14 },
  calcBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  costResultBox: { padding: 12, borderRadius: 10 },
  costBreakdownRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  costItemLabel: { fontSize: 11 },
  costItemVal: { fontSize: 11, fontWeight: "600" },
  totalDivider: { height: 0.5, backgroundColor: "#D1D5DB", marginVertical: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 13, fontWeight: "700" },
  totalAmount: { fontSize: 18, fontWeight: "800", color: "#059669" },
  historySection: {},
  historySectionTitle: { fontSize: 10, fontWeight: "700", letterSpacing: 0.6, marginBottom: 10 },
  sessionCard: {
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sessionLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  sessionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
  },
  sessionStation: { fontSize: 13, fontWeight: "700" },
  sessionDate: { fontSize: 10, marginTop: 1 },
  sessionRight: { alignItems: "flex-end" },
  sessionCost: { fontSize: 13, fontWeight: "700" },
  sessionKWh: { fontSize: 10, fontWeight: "600", marginTop: 1 },
});
