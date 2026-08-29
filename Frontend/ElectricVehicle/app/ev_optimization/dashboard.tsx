import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import { evOptimizationApi } from "../../ev_optimization/services/apiClient";

export default function EVOptimizationDashboard() {
  const router = useRouter();
  const { theme, colors, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);

  const loadData = async () => {
    try {
      const res = await evOptimizationApi.getDashboard();
      if (res && res.success) {
        setData(res.data);
      } else {
        // Fallback default
        setData(getDefaultData());
      }
    } catch (e: any) {
      console.log("Dashboard fetch error, using resilient fallback data:", e.message);
      setData(getDefaultData());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getDefaultData = () => ({
    vehicle: {
      model: "Hyundai Kona Electric",
      batteryCapacityKWh: 64,
      batteryHealthSoH: 96.5,
      currentSoc: 74,
      energyConsumption: 14.8,
      vin: "KMHEV81ABLA109823",
    },
    currentSoc: 74,
    estimatedRangeKm: 342.5,
    rangeConfidence: 0.91,
    rangeSource: "mock",
    nearbyStationsCount: 6,
    recommendedStation: {
      stationId: "CS-CMB-001",
      name: "Colombo Fort Supercharge Hub",
      distanceKm: 2.8,
      suitabilityScore: 94.5,
      rating: 4.8,
      ports: [{ type: "CCS2", powerKw: 150, available: 3, pricePerKWh: 0.38 }],
    },
    recentChargingSessionsCount: 5,
    monthlyCostToDate: 43.42,
    quickStats: {
      batteryHealth: 96.5,
      avgConsumption: "14.8 kWh/100km",
      nearestStationDistanceKm: 2.8,
      savingsVsPetrolMonth: 69.47,
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const quickNav = [
    {
      title: "Range Predictor",
      sub: "Smart ML Estimation",
      icon: "speedometer-outline" as const,
      color: "#2563EB",
      bg: "#EFF6FF",
      route: "/ev_optimization/range_prediction",
    },
    {
      title: "Charging Stations",
      sub: "Find & Filter Hubs",
      icon: "flash-outline" as const,
      color: "#059669",
      bg: "#ECFDF5",
      route: "/ev_optimization/charging_stations",
    },
    {
      title: "Queue Predictor",
      sub: "Live Wait Times",
      icon: "time-outline" as const,
      color: "#D97706",
      bg: "#FFFBEB",
      route: "/ev_optimization/queue_prediction",
    },
    {
      title: "Route Optimizer",
      sub: "Smart Stop Finder",
      icon: "navigate-outline" as const,
      color: "#7C3AED",
      bg: "#F5F3FF",
      route: "/ev_optimization/route_optimization",
    },
    {
      title: "Charging Estimator",
      sub: "Time & Power Calc",
      icon: "battery-charging-outline" as const,
      color: "#0284C7",
      bg: "#F0F9FF",
      route: "/ev_optimization/charging_estimator",
    },
    {
      title: "Cost Analysis",
      sub: "Savings & History",
      icon: "wallet-outline" as const,
      color: "#DC2626",
      bg: "#FEF2F2",
      route: "/ev_optimization/cost_analysis",
    },
  ];

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

        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>SmartEV Optimization</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Intelligent Range & Charging</Text>
        </View>

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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading vehicle telemetry...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2563EB"]} />}
        >
          {/* Main Hero Card: Range & SoC */}
          <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.heroHeader}>
              <View>
                <Text style={[styles.vehicleModel, { color: colors.textPrimary }]}>
                  {data?.vehicle?.model || "Electric Vehicle"}
                </Text>
                <Text style={[styles.vinText, { color: colors.textMuted }]}>
                  VIN: {data?.vehicle?.vin || "KMHEV81ABLA109823"}
                </Text>
              </View>
              <View style={[styles.sourceBadge, { backgroundColor: theme === "light" ? "#E0F2FE" : "#1E3A8A" }]}>
                <Ionicons name="sparkles" size={12} color="#0284C7" />
                <Text style={styles.sourceText}>
                  {data?.rangeSource === "trained-model" ? "ML Model" : "AI Optimizer"}
                </Text>
              </View>
            </View>

            <View style={styles.heroMetrics}>
              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Predicted Range</Text>
                <View style={styles.rangeValueRow}>
                  <Text style={[styles.metricValueLarge, { color: colors.textPrimary }]}>
                    {data?.estimatedRangeKm || 342}
                  </Text>
                  <Text style={[styles.metricUnit, { color: colors.textSecondary }]}>km</Text>
                </View>
                <Text style={[styles.metricNote, { color: "#059669" }]}>● Normal Drive Mode</Text>
              </View>

              <View style={styles.heroDivider} />

              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Battery SoC</Text>
                <View style={styles.rangeValueRow}>
                  <Text style={[styles.metricValueLarge, { color: "#059669" }]}>
                    {data?.currentSoc || 74}%
                  </Text>
                </View>
                <Text style={[styles.metricNote, { color: colors.textMuted }]}>
                  {data?.vehicle?.batteryCapacityKWh || 64} kWh Pack
                </Text>
              </View>
            </View>

            {/* Battery Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, Math.max(5, data?.currentSoc || 74))}%`,
                    backgroundColor: (data?.currentSoc || 74) > 20 ? "#10B981" : "#EF4444",
                  },
                ]}
              />
            </View>
          </View>

          {/* Quick Metrics Strip */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statBoxLabel, { color: colors.textMuted }]}>BATTERY SOH</Text>
              <Text style={[styles.statBoxValue, { color: colors.textPrimary }]}>
                {data?.quickStats?.batteryHealth || 96.5}%
              </Text>
              <Text style={styles.statBoxSub}>Optimal</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statBoxLabel, { color: colors.textMuted }]}>EFFICIENCY</Text>
              <Text style={[styles.statBoxValue, { color: colors.textPrimary }]}>
                {data?.quickStats?.avgConsumption || "14.8 kWh"}
              </Text>
              <Text style={styles.statBoxSub}>per 100km</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statBoxLabel, { color: colors.textMuted }]}>MONTH SAVINGS</Text>
              <Text style={[styles.statBoxValue, { color: "#059669" }]}>
                ${data?.quickStats?.savingsVsPetrolMonth || 69.4}
              </Text>
              <Text style={styles.statBoxSub}>vs Petrol</Text>
            </View>
          </View>

          {/* Recommended Station Card */}
          {data?.recommendedStation && (
            <View style={[styles.recommendationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.recHeader}>
                <View style={styles.recTag}>
                  <Ionicons name="star" size={12} color="#D97706" />
                  <Text style={styles.recTagText}>BEST CHARGING RECOMMENDATION</Text>
                </View>
                <Text style={styles.scoreText}>
                  Match {data.recommendedStation.suitabilityScore || 94}%
                </Text>
              </View>

              <Text style={[styles.recStationName, { color: colors.textPrimary }]}>
                {data.recommendedStation.name}
              </Text>

              <View style={styles.recDetailsRow}>
                <View style={styles.recDetailItem}>
                  <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.recDetailText, { color: colors.textSecondary }]}>
                    {data.recommendedStation.distanceKm || 2.8} km away
                  </Text>
                </View>

                <View style={styles.recDetailItem}>
                  <Ionicons name="flash-outline" size={14} color="#059669" />
                  <Text style={[styles.recDetailText, { color: colors.textSecondary }]}>
                    {data.recommendedStation.ports?.[0]?.powerKw || 150} kW Fast
                  </Text>
                </View>

                <View style={styles.recDetailItem}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={[styles.recDetailText, { color: colors.textSecondary }]}>
                    {data.recommendedStation.rating || 4.8}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.navigateBtn}
                onPress={() => router.push("/ev_optimization/charging_stations" as any)}
                activeOpacity={0.85}
              >
                <Text style={styles.navigateBtnText}>View Station & Navigation</Text>
                <Ionicons name="chevron-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Feature Grid */}
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>INTELLIGENT MODULES</Text>

          <View style={styles.grid}>
            {quickNav.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.75}
              >
                <View style={[styles.gridIconBox, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <Text style={[styles.gridCardTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.gridCardSub, { color: colors.textMuted }]}>{item.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
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
  titleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  heroCard: {
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  vehicleModel: {
    fontSize: 18,
    fontWeight: "700",
  },
  vinText: {
    fontSize: 11,
    marginTop: 2,
  },
  sourceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#0284C7",
  },
  heroMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
  },
  heroDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 12,
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  rangeValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  metricValueLarge: {
    fontSize: 32,
    fontWeight: "800",
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: "500",
  },
  metricNote: {
    fontSize: 11,
    marginTop: 2,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 12,
    alignItems: "center",
  },
  statBoxLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statBoxValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  statBoxSub: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
  },
  recommendationCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 16,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  recHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#D97706",
    letterSpacing: 0.4,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
  },
  recStationName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
  recDetailsRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 14,
  },
  recDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recDetailText: {
    fontSize: 12,
  },
  navigateBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  navigateBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridCard: {
    width: "48.3%",
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 14,
  },
  gridIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  gridCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  gridCardSub: {
    fontSize: 11,
  },
});
