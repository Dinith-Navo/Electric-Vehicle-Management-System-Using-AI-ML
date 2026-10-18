import React from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface FeatureCard {
  label: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  labelColor: string;
  route: string | null;
}

const features: FeatureCard[] = [
  {
    label: "ANOMALY DETECTION",
    title: "Real-time AI anomaly detection with XAI diagnostics & live telemetry",
    description: "",
    icon: "shield-checkmark-outline",
    iconBg: "#FDE8E8",
    iconColor: "#C53030",
    labelColor: "#B91C1C",
    route: "/anomaly_detection",
  },
  {
    label: "BATTERY HEALTH & DEGRADATION",
    title: "Adaptive Battery Health Prediction & Longevity Analytics",
    description: "Multi-horizon 3M, 6M & 12M SoH forecasting with AI-driven charging optimization and degradation prevention.",
    icon: "battery-charging-outline",
    iconBg: "#E1F5EE",
    iconColor: "#0F6E56",
    labelColor: "#0F6E56",
    route: "/battery_health/battery_health_main",
  },
  {
    label: "VIRTUAL ASSISTANT",
    title: "Intelligent EV Conversational & Diagnostic Assistant",
    description: "Context-aware voice & chat intelligence for operational troubleshooting and driver support.",
    icon: "chatbubbles-outline",
    iconBg: "#FAECE7",
    iconColor: "#993C1D",
    labelColor: "#993C1D",
    route: "/ev_chatbot",
  },
  {
    label: "CHARGING & RANGE OPTIMIZATION",
    title: "Smart Range Estimation & Station Queue Optimization",
    description: "Dynamic remaining range forecasting, station congestion analytics & intelligent route planning.",
    icon: "flash-outline",
    iconBg: "#FAEEDA",
    iconColor: "#854F0B",
    labelColor: "#854F0B",
    route: "/ev_optimization/dashboard",
  },
];

const MainPage = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F0" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.brandRow}>
              <Image
                source={require("../../assets/images/smartev_logo.png")}
                style={styles.logoImage}
                resizeMode="cover"
              />
              <View>
                <Text style={styles.title}>SmartEV</Text>
                <Text style={styles.badgeSub}>Enterprise Connected Vehicle Intelligence</Text>
              </View>
            </View>
          </View>
          <View style={styles.onlineBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.onlineBadgeText}>System Online</Text>
          </View>
        </View>

        {/* Professional Enterprise Suite Card */}
        <View style={styles.infoBanner}>
          <View style={styles.infoIconWrapper}>
            <Ionicons name="hardware-chip-outline" size={18} color="#4F46E5" />
          </View>
          <View style={styles.infoTextWrapper}>
            <View style={styles.bannerHeaderRow}>
              <Text style={styles.infoTitle}>Unified Vehicle Intelligence Platform</Text>
              <Text style={styles.platformVersion}>v2.0 • Real-time AI</Text>
            </View>
            <Text style={styles.infoDesc}>
              A comprehensive intelligent management ecosystem combining real-time failure prediction, multi-horizon battery health forecasting, and dynamic charging station optimization.
            </Text>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>RESEARCH & OPERATIONAL MODULES</Text>
          <Text style={styles.componentBadge}>4 Active Services</Text>
        </View>

        {/* Feature Cards */}
        {features.map((item, index) => {
          const isActive = !!item.route;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.card, isActive && styles.cardActive]}
              onPress={() => item.route && router.push(item.route as any)}
              activeOpacity={isActive ? 0.7 : 1}
            >
              <View style={[styles.cardIcon, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon} size={22} color={item.iconColor} />
              </View>

              <View style={styles.cardBody}>
                <Text style={[styles.cardLabel, { color: item.labelColor }]}>
                  {item.label}
                </Text>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.description ? <Text style={styles.cardDesc}>{item.description}</Text> : null}

                <View style={isActive ? styles.badgeActive : styles.badgeSoon}>
                  <Text style={isActive ? styles.badgeActiveText : styles.badgeSoonText}>
                    {isActive ? "✓ Available" : "Coming soon"}
                  </Text>
                </View>
              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color="#888"
                style={styles.cardChevron}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MainPage;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F5F0",
    width: "100%",
  },
  container: {
    flex: 1,
    width: "100%",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
    maxWidth: 760,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 4,
    width: "100%",
  },
  headerTitleContainer: {
    flex: 1,
    paddingRight: 10,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.4,
  },
  badgeSub: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 1,
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: "#A7F3D0",
    gap: 5,
    flexShrink: 0,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#059669",
  },
  onlineBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  infoBanner: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    padding: 14,
    marginBottom: 20,
    gap: 12,
    alignItems: "flex-start",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  infoIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  infoTextWrapper: {
    flex: 1,
  },
  bannerHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
    flexWrap: "wrap",
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
  },
  platformVersion: {
    fontSize: 10,
    color: "#4F46E5",
    fontWeight: "600",
  },
  infoDesc: {
    fontSize: 11.5,
    color: "#4B5563",
    lineHeight: 17,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.7,
  },
  componentBadge: {
    fontSize: 10.5,
    color: "#4F46E5",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardActive: {
    borderColor: "#E0E7FF",
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 19,
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 11,
    color: "#6B7280",
    lineHeight: 16,
  },
  badgeActive: {
    alignSelf: "flex-start",
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    marginTop: 6,
    borderWidth: 0.5,
    borderColor: "#A7F3D0",
  },
  badgeActiveText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#059669",
  },
  badgeSoon: {
    alignSelf: "flex-start",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    marginTop: 6,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },
  badgeSoonText: {
    fontSize: 9.5,
    fontWeight: "500",
    color: "#9CA3AF",
  },
  cardChevron: {
    alignSelf: "center",
    flexShrink: 0,
  },
});