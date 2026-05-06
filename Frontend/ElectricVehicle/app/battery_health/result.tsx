import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "./ThemeContext";

const { width } = Dimensions.get("window");

// ─── Helpers ────────────────────────────────────────────────────────────────

function calcSOH(capacity: number, mileage: number, cycles: number, temp: number, fastCharge: number, age: number) {
  let soh = 100;
  soh -= (mileage / 100000) * 15;
  soh -= (cycles / 1000) * 20;
  soh -= (fastCharge / 100) * 10;
  soh -= age * 2;
  if (temp > 35) soh -= (temp - 35) * 0.5;
  return Math.max(50, Math.min(100, Math.round(soh)));
}

// ─── Circular Progress ───────────────────────────────────────────────────────

function CircularProgress({ value }: { value: number }) {
  const animVal = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animVal, { toValue: value, duration: 1200, useNativeDriver: false }).start();
  }, [value]);

  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  // SVG-style via border trick using Animated
  const color = value >= 80 ? "#00e5a0" : value >= 60 ? "#f5a623" : "#ff4757";

  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: size, height: size }}>
      {/* Background ring */}
      <View style={{
        position: "absolute",
        width: size, height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: "#1e2a3a",
      }} />
      {/* Foreground arc using border trick */}
      <View style={{
        position: "absolute",
        width: size, height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: "transparent",
        borderTopColor: color,
        borderRightColor: value > 25 ? color : "transparent",
        borderBottomColor: value > 50 ? color : "transparent",
        borderLeftColor: value > 75 ? color : "transparent",
        transform: [{ rotate: "-45deg" }],
      }} />
      <View style={{ alignItems: "center" }}>
        <Text style={{ fontSize: 36, fontWeight: "bold", color }}>{value}%</Text>
        <Text style={{ fontSize: 12, color: "#8899aa" }}>Current SOH</Text>
      </View>
    </View>
  );
}

// ─── Progress Bar ────────────────────────────────────────────────────────────

function ProgressBar({ value, color = "#f5a623" }: { value: number; color?: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value / 100, duration: 900, useNativeDriver: false }).start();
  }, [value]);
  return (
    <View style={{ height: 7, backgroundColor: "#1e2a3a", borderRadius: 4, overflow: "hidden", marginTop: 8 }}>
      <Animated.View style={{
        height: "100%",
        borderRadius: 4,
        backgroundColor: color,
        width: anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
      }} />
    </View>
  );
}

// ─── TAB: Dashboard ──────────────────────────────────────────────────────────

function Dashboard({ soh, capacity }: { soh: number; capacity: number }) {
  const estRange = Math.round((capacity / 75) * 360 * (soh / 100));
  const effCapacity = Math.round(capacity * soh / 100);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      {/* SOH Ring */}
      <View style={styles.card}>
        <View style={{ alignItems: "center", paddingVertical: 16 }}>
          <CircularProgress value={soh} />
          <Text style={styles.cardSubLabel}>State of Health</Text>
        </View>
      </View>

      {/* Health Predictions */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>📉</Text>
          <Text style={styles.cardTitle}>Health Predictions</Text>
        </View>
        {[
          { label: "3 Months", value: Math.round(soh * 0.975) },
          { label: "6 Months", value: Math.round(soh * 0.94) },
          { label: "12 Months", value: Math.round(soh * 0.875) },
        ].map((item) => (
          <View key={item.label} style={{ marginTop: 14 }}>
            <View style={styles.rowBetween}>
              <Text style={styles.metricLabel}>{item.label}</Text>
              <Text style={[styles.metricValue, { color: "#f5a623" }]}>{item.value}%</Text>
            </View>
            <ProgressBar value={item.value} />
          </View>
        ))}
      </View>

      {/* Stats Row */}
      <View style={styles.rowBetween}>
        <View style={[styles.statCard, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.statIcon}>🏎️</Text>
          <Text style={styles.statLabel}>Est. Range</Text>
          <Text style={styles.statBig}>{estRange}</Text>
          <Text style={styles.statUnit}>km</Text>
        </View>
        <View style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.statIcon}>🔋</Text>
          <Text style={styles.statLabel}>Capacity</Text>
          <Text style={styles.statBig}>{effCapacity}</Text>
          <Text style={styles.statUnit}>kWh</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── TAB: Insights ───────────────────────────────────────────────────────────

function Insights({ fastCharge, temp, soh }: { fastCharge: number; temp: number; soh: number }) {
  const items = [
    {
      icon: "⚡",
      title: "Charging Pattern",
      desc: "Your charging habits are optimal. Keep charging between 20-80%.",
      tag: "GOOD",
      tagColor: "#00e5a0",
      tagBg: "#003322",
    },
    {
      icon: "🌡️",
      title: "Temperature Impact",
      desc: `Average temperature is ${temp <= 35 ? "within" : "above"} optimal range (15-30°C).`,
      tag: temp <= 35 ? "GOOD" : "WARNING",
      tagColor: temp <= 35 ? "#00e5a0" : "#f5a623",
      tagBg: temp <= 35 ? "#003322" : "#332200",
    },
    {
      icon: "📉",
      title: "Battery Degradation",
      desc: `Battery is degrading at a ${soh >= 75 ? "normal" : "accelerated"} rate for its age and usage.`,
      tag: "INFO",
      tagColor: "#a78bfa",
      tagBg: "#1e1b4b",
    },
    {
      icon: "⚠️",
      title: "Fast Charging Usage",
      desc: `${fastCharge > 20 ? "High fast charging frequency detected. Consider reducing to 2-4 times per month." : "Fast charging usage is within safe limits."}`,
      tag: fastCharge > 20 ? "WARNING" : "GOOD",
      tagColor: fastCharge > 20 ? "#f5a623" : "#00e5a0",
      tagBg: fastCharge > 20 ? "#332200" : "#003322",
    },
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Battery Insights</Text>
      <Text style={styles.pageSubtitle}>Analysis of your battery health factors</Text>
      {items.map((item, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.insightRow}>
            <View style={styles.insightIconBox}>
              <Text style={{ fontSize: 22 }}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.insightTitle}>{item.title}</Text>
              <Text style={styles.insightDesc}>{item.desc}</Text>
              <View style={[styles.tag, { backgroundColor: item.tagBg }]}>
                <Text style={[styles.tagText, { color: item.tagColor }]}>{item.tag}</Text>
              </View>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── TAB: Behavior ───────────────────────────────────────────────────────────

function Behavior({ fastCharge, cycles }: { fastCharge: number; cycles: number }) {
  const fastCount = Math.round((fastCharge / 100) * 20);
  const avgCharge = Math.max(40, Math.min(90, 80 - fastCharge / 5));

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Usage Behavior</Text>
      <Text style={styles.pageSubtitle}>Your charging and usage patterns</Text>

      {/* Fast Charging Count */}
      <View style={styles.card}>
        <View style={styles.behaviorRow}>
          <View style={[styles.insightIconBox, { backgroundColor: "#0d2a1e" }]}>
            <Text style={{ fontSize: 22 }}>⚡</Text>
          </View>
          <View>
            <Text style={styles.metricLabel}>Fast Charging Count</Text>
            <Text style={styles.bigNumber}>{fastCount}</Text>
            <Text style={styles.statUnit}>per month</Text>
          </View>
        </View>
      </View>

      {/* Avg Charge Level */}
      <View style={styles.card}>
        <View style={styles.behaviorRow}>
          <View style={[styles.insightIconBox, { backgroundColor: "#1a1040" }]}>
            <Text style={{ fontSize: 22 }}>🔋</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.metricLabel}>Avg. Charge Level</Text>
            <Text style={styles.bigNumber}>{Math.round(avgCharge)}%</Text>
            <ProgressBar value={avgCharge} color="#a78bfa" />
          </View>
        </View>
      </View>

      {/* Total Cycles */}
      <View style={styles.card}>
        <View style={styles.behaviorRow}>
          <View style={[styles.insightIconBox, { backgroundColor: "#2a1800" }]}>
            <Text style={{ fontSize: 22 }}>📈</Text>
          </View>
          <View>
            <Text style={styles.metricLabel}>Total Charge Cycles</Text>
            <Text style={styles.bigNumber}>{cycles}</Text>
            <Text style={styles.statUnit}>lifetime cycles</Text>
          </View>
        </View>
      </View>

      {/* Recommendations */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>💡</Text>
          <Text style={styles.cardTitle}>Recommendations</Text>
        </View>
        {[
          "Reduce fast charging to 2-4 times per month",
          "Keep charge level between 20-80% for daily use",
          "Avoid extreme temperatures when possible",
          "Charge to 100% only before long trips",
        ].map((tip, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>{tip}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── TAB: Factors ────────────────────────────────────────────────────────────

function Factors({ temp, fastCharge, age }: { temp: number; fastCharge: number; age: number }) {
  const items = [
    {
      icon: "🌡️",
      title: "Temperature Exposure",
      desc: `Operating temperature is ${temp > 30 ? "slightly above" : "within"} optimal range`,
      impact: temp > 35 ? "High" : "Medium",
      value: Math.min(100, 50 + (temp - 25) * 2),
      impactColor: temp > 35 ? "#ff4757" : "#f5a623",
      impactBg: temp > 35 ? "#3a0a0a" : "#332200",
    },
    {
      icon: "⚡",
      title: "Fast Charging Habits",
      desc: "Frequent fast charging accelerates battery degradation",
      impact: fastCharge > 30 ? "High" : "Medium",
      value: fastCharge,
      impactColor: fastCharge > 30 ? "#ff4757" : "#f5a623",
      impactBg: fastCharge > 30 ? "#3a0a0a" : "#332200",
    },
    {
      icon: "📉",
      title: "Discharge Depth",
      desc: "Deep discharge cycles affect long-term battery health",
      impact: "Medium",
      value: 75,
      impactColor: "#f5a623",
      impactBg: "#332200",
    },
    {
      icon: "📅",
      title: "Battery Age",
      desc: "Natural degradation occurs over time regardless of usage",
      impact: age > 4 ? "High" : "Medium",
      value: Math.min(100, age * 15),
      impactColor: age > 4 ? "#ff4757" : "#f5a623",
      impactBg: age > 4 ? "#3a0a0a" : "#332200",
    },
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Impact Factors</Text>
      <Text style={styles.pageSubtitle}>Key factors affecting battery health</Text>
      {items.map((item, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.factorHeader}>
            <View style={styles.insightIconBox}>
              <Text style={{ fontSize: 22 }}>{item.icon}</Text>
            </View>
            <Text style={styles.insightTitle}>{item.title}</Text>
            <View style={[styles.impactBadge, { backgroundColor: item.impactBg }]}>
              <Text style={[styles.impactText, { color: item.impactColor }]}>{item.impact}</Text>
            </View>
          </View>
          <Text style={[styles.insightDesc, { marginLeft: 50 }]}>{item.desc}</Text>
          <View style={{ marginLeft: 50, marginTop: 4 }}>
            <View style={styles.rowBetween}>
              <ProgressBar value={item.value} />
            </View>
            <Text style={[styles.metricValue, { color: "#f5a623", textAlign: "right", marginTop: 2 }]}>
              {Math.round(item.value)}%
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── TAB: Report ─────────────────────────────────────────────────────────────

function Report({ soh, cycles, capacity }: { soh: number; cycles: number; capacity: number }) {
  const lifespan = Math.round(5 * (soh / 80));
  const efficiency = Math.round(soh * 0.95);

  const recommendations = [
    { text: "Maintain charge levels between 20-80% for daily use", ok: true },
    { text: "Reduce fast charging frequency to 2-4 times per month", ok: false },
    { text: "Avoid extreme temperatures when parking", ok: true },
    { text: "Consider battery health check at service center", ok: false },
    { text: "Regular charging is better than deep discharge cycles", ok: true },
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Health Report</Text>
      <Text style={styles.pageSubtitle}>Comprehensive battery analysis summary</Text>

      {/* Key Metrics */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Key Metrics</Text>
        {[
          { label: "State of Health (SOH)", value: `${soh}%`, color: "#00e5a0" },
          { label: "Estimated Lifespan", value: `${lifespan} years`, color: "#ffffff" },
          { label: "Battery Efficiency", value: `${efficiency}%`, color: "#ffffff" },
          { label: "Total Charge Cycles", value: `${cycles}`, color: "#ffffff" },
        ].map((m, i) => (
          <View key={i}>
            {i > 0 && <View style={styles.divider} />}
            <View style={[styles.rowBetween, { paddingVertical: 14 }]}>
              <Text style={styles.metricLabel}>{m.label}</Text>
              <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Recommendations */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recommendations</Text>
        {recommendations.map((r, i) => (
          <View key={i} style={[styles.bulletRow, { marginTop: 12 }]}>
            <Text style={{ fontSize: 18, marginRight: 10 }}>{r.ok ? "✅" : "⚠️"}</Text>
            <Text style={styles.bulletText}>{r.text}</Text>
          </View>
        ))}
      </View>

      {/* Download Button */}
      <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.85}>
        <Text style={styles.downloadIcon}>⬇️</Text>
        <Text style={styles.downloadText}>Download Report</Text>
      </TouchableOpacity>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// ─── Main Results Screen ─────────────────────────────────────────────────────

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: "⊞" },
  { key: "insights", label: "Insights", icon: "💡" },
  { key: "behavior", label: "Behavior", icon: "📊" },
  { key: "factors", label: "Factors", icon: "⚙️" },
  { key: "report", label: "Report", icon: "📋" },
];

export default function Results() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState("dashboard");

  const capacity = parseFloat(params.capacity as string) || 75;
  const mileage = parseFloat(params.mileage as string) || 45000;
  const cycles = parseFloat(params.cycles as string) || 350;
  const temp = parseFloat(params.temp as string) || 25;
  const fastCharge = parseFloat(params.fastCharge as string) || 30;
  const age = parseFloat(params.age as string) || 3;

  const soh = calcSOH(capacity, mileage, cycles, temp, fastCharge, age);

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard": return <Dashboard soh={soh} capacity={capacity} />;
      case "insights": return <Insights fastCharge={fastCharge} temp={temp} soh={soh} />;
      case "behavior": return <Behavior fastCharge={fastCharge} cycles={cycles} />;
      case "factors": return <Factors temp={temp} fastCharge={fastCharge} age={age} />;
      case "report": return <Report soh={soh} cycles={cycles} capacity={capacity} />;
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: "#0d1117" }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0d1117" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>
          {TABS.find((t) => t.key === activeTab)?.label === "Dashboard"
            ? "Battery Dashboard"
            : TABS.find((t) => t.key === activeTab)?.label}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>{renderTab()}</View>

      {/* Floating + Button */}
      <TouchableOpacity
        style={styles.floatingBtn}
        onPress={() => router.push('/battery_health/input' as any)}
        activeOpacity={0.85}
      >
        <Text style={styles.floatingBtnText}>+</Text>
      </TouchableOpacity>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabIcon, active && { color: "#00e5a0" }]}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, active && { color: "#00e5a0" }]}>{tab.label}</Text>
              {active && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: "#1a2233",
    alignItems: "center", justifyContent: "center",
  },
  backArrow: { color: "#fff", fontSize: 18 },
  topTitle: { fontSize: 20, fontWeight: "bold", color: "#ffffff" },

  card: {
    backgroundColor: "#131c2e",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  cardIcon: { fontSize: 18, marginRight: 8 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#ffffff" },
  cardSubLabel: { fontSize: 13, color: "#8899aa", marginTop: 8 },

  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  metricLabel: { fontSize: 14, color: "#8899aa" },
  metricValue: { fontSize: 15, fontWeight: "700", color: "#ffffff" },

  statCard: {
    backgroundColor: "#131c2e",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statLabel: { fontSize: 13, color: "#8899aa" },
  statBig: { fontSize: 32, fontWeight: "bold", color: "#ffffff" },
  statUnit: { fontSize: 12, color: "#8899aa" },

  pageTitle: { fontSize: 22, fontWeight: "bold", color: "#ffffff", marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: "#8899aa", marginBottom: 16 },

  insightRow: { flexDirection: "row", alignItems: "flex-start" },
  insightIconBox: {
    width: 44, height: 44,
    borderRadius: 12,
    backgroundColor: "#0d2233",
    alignItems: "center", justifyContent: "center",
    marginRight: 12,
  },
  insightTitle: { fontSize: 15, fontWeight: "700", color: "#ffffff", marginBottom: 4 },
  insightDesc: { fontSize: 13, color: "#8899aa", lineHeight: 18 },
  tag: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, marginTop: 8 },
  tagText: { fontSize: 11, fontWeight: "700" },

  behaviorRow: { flexDirection: "row", alignItems: "center" },
  bigNumber: { fontSize: 30, fontWeight: "bold", color: "#ffffff", marginTop: 2 },

  bulletRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 10 },
  bullet: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#00e5a0", marginTop: 5, marginRight: 10 },
  bulletText: { flex: 1, fontSize: 13, color: "#c0cce0", lineHeight: 20 },

  factorHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  impactBadge: { marginLeft: "auto", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  impactText: { fontSize: 11, fontWeight: "700" },

  divider: { height: 1, backgroundColor: "#1e2a3a" },

  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00e5a0",
    borderRadius: 30,
    paddingVertical: 18,
    marginBottom: 8,
  },
  downloadIcon: { fontSize: 20, marginRight: 10 },
  downloadText: { fontSize: 17, fontWeight: "700", color: "#0d1117" },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#131c2e",
    borderTopWidth: 1,
    borderTopColor: "#1e2a3a",
    paddingBottom: 16,
    paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: "center", position: "relative" },
  tabIcon: { fontSize: 18, color: "#8899aa" },
  tabLabel: { fontSize: 10, color: "#8899aa", marginTop: 2 },
  tabIndicator: {
    position: "absolute",
    bottom: -8,
    width: 30, height: 3,
    borderRadius: 2,
    backgroundColor: "#00e5a0",
  },
  floatingBtn: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6c63ff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6c63ff",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 99,
  },
  floatingBtnText: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "300",
    lineHeight: 34,
  },
});