import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Animated, SafeAreaView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcSOH(capacity: number, mileage: number, cycles: number, temp: number, fastCharge: number, age: number) {
  let soh = 100;
  soh -= (mileage / 100000) * 15;
  soh -= (cycles / 1000) * 20;
  soh -= (fastCharge / 100) * 10;
  soh -= age * 2;
  if (temp > 35) soh -= (temp - 35) * 0.5;
  return Math.max(50, Math.min(100, Math.round(soh)));
}

// ─── Circular Progress ────────────────────────────────────────────────────────

function CircularProgress({ value }: { value: number }) {
  const size = 140;
  const stroke = 10;
  const color      = value >= 80 ? "#0F6E56" : value >= 65 ? "#854F0B" : "#A32D2D";
  const trackColor = value >= 80 ? "#E1F5EE" : value >= 65 ? "#FAEEDA" : "#FCEBEB";
  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: size, height: size }}>
      <View style={{ position: "absolute", width: size, height: size, borderRadius: size / 2, borderWidth: stroke, borderColor: trackColor }} />
      <View style={{
        position: "absolute", width: size, height: size, borderRadius: size / 2,
        borderWidth: stroke, borderColor: "transparent",
        borderTopColor: color,
        borderRightColor: value > 25 ? color : "transparent",
        borderBottomColor: value > 50 ? color : "transparent",
        borderLeftColor: value > 75 ? color : "transparent",
        transform: [{ rotate: "-45deg" }],
      }} />
      <Text style={{ fontSize: 30, fontWeight: "600", color }}>{value}%</Text>
      <Text style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>Current SOH</Text>
    </View>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, color = "#BA7517", trackColor = "#F1EFE8" }: {
  value: number; color?: string; trackColor?: string;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value / 100, duration: 900, useNativeDriver: false }).start();
  }, [value]);
  return (
    <View style={{ height: 6, backgroundColor: trackColor, borderRadius: 4, overflow: "hidden", marginTop: 6 }}>
      <Animated.View style={{
        height: "100%", borderRadius: 4, backgroundColor: color,
        width: anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
      }} />
    </View>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeType = "good" | "warn" | "info" | "error";
const BADGE_STYLES: Record<BadgeType, { bg: string; color: string; label: string }> = {
  good:  { bg: "#E1F5EE", color: "#0F6E56", label: "Good" },
  warn:  { bg: "#FAEEDA", color: "#854F0B", label: "Warning" },
  info:  { bg: "#EEEDFE", color: "#534AB7", label: "Info" },
  error: { bg: "#FCEBEB", color: "#A32D2D", label: "Critical" },
};

function Badge({ type }: { type: BadgeType }) {
  const s = BADGE_STYLES[type];
  return (
    <View style={{ alignSelf: "flex-start", backgroundColor: s.bg, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6 }}>
      <Text style={{ fontSize: 10, fontWeight: "600", color: s.color }}>{s.label}</Text>
    </View>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function Card({ children, style, colors }: { children: React.ReactNode; style?: object; colors: any }) {
  return (
    <View style={[{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 0.5, borderRadius: 14, padding: 16, marginBottom: 12 }, style]}>
      {children}
    </View>
  );
}

// ─── FeatureRow ───────────────────────────────────────────────────────────────

function FeatureRow({ iconName, iconBg, iconColor, title, desc, badge, colors }: {
  iconName: any; iconBg: string; iconColor: string;
  title: string; desc: string; badge: BadgeType; colors: any;
}) {
  return (
    <Card colors={colors} style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
        <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: iconBg, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name={iconName} size={18} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "500", color: colors.textPrimary, marginBottom: 3 }}>{title}</Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>{desc}</Text>
          <Badge type={badge} />
        </View>
      </View>
    </Card>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ soh, capacity, colors }: { soh: number; capacity: number; colors: any }) {
  const estRange    = Math.round((capacity / 75) * 360 * (soh / 100));
  const effCapacity = Math.round(capacity * soh / 100);

  return (
    <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <Card colors={colors}>
        <View style={{ alignItems: "center", paddingVertical: 12 }}>
          <CircularProgress value={soh} />
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 8 }}>State of health</Text>
        </View>
      </Card>

      <Card colors={colors}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: "#EEEDFE", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="trending-down-outline" size={14} color="#534AB7" />
          </View>
          <Text style={{ fontSize: 14, fontWeight: "500", color: colors.textPrimary }}>Health predictions</Text>
        </View>
        {[
          { label: "3 months",  value: Math.round(soh * 0.975), color: "#1D9E75" },
          { label: "6 months",  value: Math.round(soh * 0.940), color: "#BA7517" },
          { label: "12 months", value: Math.round(soh * 0.875), color: "#BA7517" },
        ].map((item) => (
          <View key={item.label} style={{ marginTop: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>{item.label}</Text>
              <Text style={{ fontSize: 13, fontWeight: "500", color: item.color }}>{item.value}%</Text>
            </View>
            <ProgressBar value={item.value} color={item.color} trackColor={colors.progressTrack} />
          </View>
        ))}
      </Card>

      <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
        <Card colors={colors} style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: colors.textSecondary }}>Est. range</Text>
          <Text style={{ fontSize: 26, fontWeight: "500", color: colors.textPrimary, marginTop: 2 }}>{estRange}</Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>km</Text>
        </Card>
        <Card colors={colors} style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: colors.textSecondary }}>Eff. capacity</Text>
          <Text style={{ fontSize: 26, fontWeight: "500", color: colors.textPrimary, marginTop: 2 }}>{effCapacity}</Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>kWh</Text>
        </Card>
      </View>
    </ScrollView>
  );
}

// ─── Insights ─────────────────────────────────────────────────────────────────

function Insights({ fastCharge, temp, soh, colors }: { fastCharge: number; temp: number; soh: number; colors: any }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <Text style={{ fontSize: 18, fontWeight: "500", color: colors.textPrimary, marginBottom: 4 }}>Battery insights</Text>
      <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 14 }}>Analysis of your battery health factors</Text>

      <FeatureRow colors={colors} iconName="flash-outline" iconBg="#E1F5EE" iconColor="#0F6E56"
        title="Charging pattern" desc="Habits are optimal. Keep charging between 20–80%." badge="good" />
      <FeatureRow colors={colors} iconName="thermometer-outline" iconBg="#FAEEDA" iconColor="#854F0B"
        title="Temperature impact"
        desc={`Avg temp is ${temp <= 35 ? "within" : "above"} optimal range (15–30°C).`}
        badge={temp <= 35 ? "good" : "warn"} />
      <FeatureRow colors={colors} iconName="trending-down-outline" iconBg="#EEEDFE" iconColor="#534AB7"
        title="Battery degradation"
        desc={`Degrading at a ${soh >= 75 ? "normal" : "accelerated"} rate for its age and usage.`}
        badge="info" />
      <FeatureRow colors={colors} iconName="alert-circle-outline" iconBg="#FCEBEB" iconColor="#A32D2D"
        title="Fast charging usage"
        desc={fastCharge > 20 ? "High frequency detected. Reduce to 2–4 times/month." : "Fast charging is within safe limits."}
        badge={fastCharge > 20 ? "error" : "good"} />
    </ScrollView>
  );
}

// ─── Behavior ─────────────────────────────────────────────────────────────────

function Behavior({ fastCharge, cycles, colors }: { fastCharge: number; cycles: number; colors: any }) {
  const fastCount = Math.round((fastCharge / 100) * 20);
  const avgCharge = Math.max(40, Math.min(90, 80 - fastCharge / 5));
  const tips = [
    "Reduce fast charging to 2–4 times per month",
    "Keep charge level between 20–80% for daily use",
    "Avoid extreme temperatures when parking",
    "Charge to 100% only before long trips",
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <Text style={{ fontSize: 18, fontWeight: "500", color: colors.textPrimary, marginBottom: 4 }}>Usage behavior</Text>
      <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 14 }}>Your charging and usage patterns</Text>

      {[
        { bg: "#E1F5EE", ic: "#0F6E56", icon: "flash-outline",        label: "Fast charging count", val: `${fastCount}`, unit: "per month", bar: false },
        { bg: "#EEEDFE", ic: "#534AB7", icon: "battery-half-outline",  label: "Avg charge level",   val: `${Math.round(avgCharge)}%`, unit: "", bar: true, barVal: avgCharge, barColor: "#534AB7" },
        { bg: "#FAEEDA", ic: "#854F0B", icon: "refresh-outline",       label: "Total charge cycles", val: `${cycles}`, unit: "lifetime", bar: false },
      ].map((row, i) => (
        <Card key={i} colors={colors}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: row.bg, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={row.icon as any} size={20} color={row.ic} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>{row.label}</Text>
              <Text style={{ fontSize: 26, fontWeight: "500", color: colors.textPrimary, marginTop: 2 }}>{row.val}</Text>
              {row.unit ? <Text style={{ fontSize: 11, color: colors.textMuted }}>{row.unit}</Text> : null}
              {row.bar ? <ProgressBar value={row.barVal!} color={row.barColor} trackColor={colors.progressTrack} /> : null}
            </View>
          </View>
        </Card>
      ))}

      <Card colors={colors}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "#EEEDFE", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="bulb-outline" size={14} color="#534AB7" />
          </View>
          <Text style={{ fontSize: 14, fontWeight: "500", color: colors.textPrimary }}>Recommendations</Text>
        </View>
        {tips.map((tip, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 8 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#534AB7", marginTop: 5 }} />
            <Text style={{ flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>{tip}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

// ─── Factors ──────────────────────────────────────────────────────────────────

function Factors({ temp, fastCharge, age, colors }: { temp: number; fastCharge: number; age: number; colors: any }) {
  const barColor: Record<BadgeType, string> = {
    good: "#1D9E75", warn: "#BA7517", info: "#534AB7", error: "#A32D2D",
  };

  const items = [
    { icon: "thermometer-outline" as const, iconBg: "#FAEEDA", iconColor: "#854F0B",
      title: "Temperature exposure",
      desc: `Operating temperature is ${temp > 30 ? "slightly above" : "within"} optimal range`,
      type: (temp > 35 ? "error" : "warn") as BadgeType,
      value: Math.min(100, 50 + (temp - 25) * 2) },
    { icon: "flash-outline" as const, iconBg: "#FCEBEB", iconColor: "#A32D2D",
      title: "Fast charging habits",
      desc: "Frequent fast charging accelerates battery degradation",
      type: (fastCharge > 30 ? "error" : "warn") as BadgeType,
      value: fastCharge },
    { icon: "battery-dead-outline" as const, iconBg: "#EEEDFE", iconColor: "#534AB7",
      title: "Discharge depth",
      desc: "Deep discharge cycles affect long-term battery health",
      type: "warn" as BadgeType, value: 75 },
    { icon: "calendar-outline" as const, iconBg: "#F1EFE8", iconColor: "#5F5E5A",
      title: "Battery age",
      desc: "Natural degradation occurs over time regardless of usage",
      type: (age > 4 ? "error" : "info") as BadgeType,
      value: Math.min(100, age * 15) },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <Text style={{ fontSize: 18, fontWeight: "500", color: colors.textPrimary, marginBottom: 4 }}>Impact factors</Text>
      <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 14 }}>Key factors affecting battery health</Text>
      {items.map((item, i) => (
        <Card key={i} colors={colors}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: item.iconBg, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={item.icon} size={18} color={item.iconColor} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: "500", color: colors.textPrimary, flex: 1 }}>{item.title}</Text>
            <Badge type={item.type} />
          </View>
          <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>{item.desc}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
            <View style={{ flex: 1 }}>
              <ProgressBar value={item.value} color={barColor[item.type]} trackColor={colors.progressTrack} />
            </View>
            <Text style={{ fontSize: 11, fontWeight: "600", color: barColor[item.type], minWidth: 30, textAlign: "right" }}>
              {Math.round(item.value)}%
            </Text>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

// ─── Report ───────────────────────────────────────────────────────────────────

function Report({ soh, cycles, capacity, colors }: { soh: number; cycles: number; capacity: number; colors: any }) {
  const lifespan   = Math.round(5 * (soh / 80));
  const efficiency = Math.round(soh * 0.95);

  const metrics = [
    { label: "State of health (SOH)", value: `${soh}%`,          color: "#0F6E56" },
    { label: "Estimated lifespan",    value: `${lifespan} years`, color: undefined },
    { label: "Battery efficiency",    value: `${efficiency}%`,    color: undefined },
    { label: "Total charge cycles",   value: `${cycles}`,         color: undefined },
  ];

  const recs = [
    { ok: true,  text: "Maintain charge levels between 20–80% for daily use" },
    { ok: false, text: "Reduce fast charging frequency to 2–4 times per month" },
    { ok: true,  text: "Avoid extreme temperatures when parking" },
    { ok: false, text: "Consider battery health check at service centre" },
    { ok: true,  text: "Regular charging is better than deep discharge cycles" },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <Text style={{ fontSize: 18, fontWeight: "500", color: colors.textPrimary, marginBottom: 4 }}>Health report</Text>
      <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 14 }}>Comprehensive battery analysis summary</Text>

      <Card colors={colors}>
        <Text style={{ fontSize: 14, fontWeight: "500", color: colors.textPrimary, marginBottom: 12 }}>Key metrics</Text>
        {metrics.map((m, i) => (
          <View key={i}>
            {i > 0 && <View style={{ height: 0.5, backgroundColor: colors.divider, marginVertical: 8 }} />}
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>{m.label}</Text>
              <Text style={{ fontSize: 13, fontWeight: "500", color: m.color ?? colors.textPrimary }}>{m.value}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Card colors={colors}>
        <Text style={{ fontSize: 14, fontWeight: "500", color: colors.textPrimary, marginBottom: 4 }}>Recommendations</Text>
        {recs.map((r, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 10 }}>
            <Ionicons
              name={r.ok ? "checkmark-circle-outline" : "alert-circle-outline"}
              size={16}
              color={r.ok ? "#0F6E56" : "#854F0B"}
              style={{ marginTop: 1 }}
            />
            <Text style={{ flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 18 }}>{r.text}</Text>
          </View>
        ))}
      </Card>

      <TouchableOpacity style={S.downloadBtn} activeOpacity={0.85}>
        <Ionicons name="download-outline" size={16} color="#EEEDFE" />
        <Text style={S.downloadText}>Download report</Text>
      </TouchableOpacity>
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: "grid-outline" as const },
  { key: "insights",  label: "Insights",  icon: "bulb-outline" as const },
  { key: "behavior",  label: "Behavior",  icon: "bar-chart-outline" as const },
  { key: "factors",   label: "Factors",   icon: "options-outline" as const },
  { key: "report",    label: "Report",    icon: "document-text-outline" as const },
];

export default function Results() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme, colors, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("dashboard");

  const capacity   = parseFloat(params.capacity   as string) || 75;
  const mileage    = parseFloat(params.mileage    as string) || 45000;
  const cycles     = parseFloat(params.cycles     as string) || 350;
  const temp       = parseFloat(params.temp       as string) || 25;
  const fastCharge = parseFloat(params.fastCharge as string) || 30;
  const age        = parseFloat(params.age        as string) || 3;

  const soh = calcSOH(capacity, mileage, cycles, temp, fastCharge, age);
  const activeLabel = TABS.find(t => t.key === activeTab)?.label ?? "";

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard": return <Dashboard soh={soh} capacity={capacity} colors={colors} />;
      case "insights":  return <Insights  fastCharge={fastCharge} temp={temp} soh={soh} colors={colors} />;
      case "behavior":  return <Behavior  fastCharge={fastCharge} cycles={cycles} colors={colors} />;
      case "factors":   return <Factors   temp={temp} fastCharge={fastCharge} age={age} colors={colors} />;
      case "report":    return <Report    soh={soh} cycles={cycles} capacity={capacity} colors={colors} />;
    }
  };

  return (
    <SafeAreaView style={[S.safe, { backgroundColor: colors.card }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.card} />

      {/* Top bar */}
      <View style={[S.topBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[S.iconBtn, { backgroundColor: colors.bg, borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back-outline" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[S.topTitle, { color: colors.textPrimary }]}>{activeLabel}</Text>
        <TouchableOpacity
          style={[S.iconBtn, { backgroundColor: colors.bg, borderColor: colors.border }]}
          onPress={toggleTheme}
        >
          <Ionicons
            name={theme === "light" ? "moon-outline" : "sunny-outline"}
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={[S.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={S.tabItem} onPress={() => setActiveTab(tab.key)}>
              <Ionicons name={tab.icon} size={18} color={active ? "#534AB7" : colors.textMuted} />
              <Text style={[S.tabLabel, { color: active ? "#534AB7" : colors.textMuted }]}>{tab.label}</Text>
              {active && <View style={S.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flex: 1, backgroundColor: colors.bg }}>{renderTab()}</View>

      {/* FAB */}
      <TouchableOpacity
        style={S.fab}
        onPress={() => router.push("/battery_health/input" as any)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={26} color="#EEEDFE" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  safe:         { flex: 1 },
  topBar:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  iconBtn:      { width: 36, height: 36, borderRadius: 18, borderWidth: 0.5, alignItems: "center", justifyContent: "center" },
  topTitle:     { fontSize: 16, fontWeight: "500" },
  tabBar:       { flexDirection: "row", borderBottomWidth: 0.5 },
  tabItem:      { flex: 1, alignItems: "center", paddingVertical: 9, position: "relative" },
  tabLabel:     { fontSize: 10, marginTop: 2 },
  tabIndicator: { position: "absolute", bottom: 0, width: 28, height: 2.5, borderRadius: 2, backgroundColor: "#534AB7" },
  downloadBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#534AB7", borderRadius: 30, paddingVertical: 14, marginTop: 4 },
  downloadText: { fontSize: 14, fontWeight: "500", color: "#EEEDFE" },
  fab:          { position: "absolute", bottom: 80, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: "#534AB7", alignItems: "center", justifyContent: "center", zIndex: 99 },
});