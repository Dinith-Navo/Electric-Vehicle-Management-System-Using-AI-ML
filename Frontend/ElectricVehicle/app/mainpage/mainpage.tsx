import React from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const features = [
  {
    label: "Performance",
    title: "Post-sale EV performance intelligence & failure prediction",
    icon: "trending-up-outline" as const,
    iconBg: "#EEEDFE",
    iconColor: "#534AB7",
    labelColor: "#534AB7",
    route: null,
  },
  {
    label: "Battery",
    title: "Adaptive battery health prediction based on charging & driving behavior",
    icon: "battery-charging-outline" as const,
    iconBg: "#E1F5EE",
    iconColor: "#0F6E56",
    labelColor: "#0F6E56",
    route: "/battery_health/battery_health_main",
  },
  {
    label: "Diagnostics",
    title: "Intelligent EV problem diagnosis with context-aware do's & don'ts",
    icon: "medkit-outline" as const,
    iconBg: "#FAECE7",
    iconColor: "#993C1D",
    labelColor: "#993C1D",
    route: null,
  },
  {
    label: "Assistance",
    title: "Predictive charging & breakdown assistance system",
    icon: "location-outline" as const,
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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>SmartEV</Text>
            <Text style={styles.subtitle}>AI & ML Vehicle Management</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Battery health</Text>
            <Text style={styles.statValue}>87%</Text>
            <Text style={styles.statSub}>● Good condition</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Est. range</Text>
            <Text style={styles.statValue}>312 km</Text>
            <Text style={styles.statSub}>Last updated today</Text>
          </View>
        </View>

        {/* Section label */}
        <Text style={styles.sectionLabel}>FEATURES</Text>

        {/* Feature cards */}
        {features.map((item, index) => {
          const isActive = !!item.route;
          return (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() => item.route && router.push(item.route as any)}
              activeOpacity={isActive ? 0.7 : 1}
            >
              <View style={[styles.cardIcon, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon} size={20} color={item.iconColor} />
              </View>

              <View style={styles.cardBody}>
                <Text style={[styles.cardLabel, { color: item.labelColor }]}>
                  {item.label.toUpperCase()}
                </Text>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={isActive ? styles.badgeActive : styles.badgeSoon}>
                  <Text style={isActive ? styles.badgeActiveText : styles.badgeSoonText}>
                    {isActive ? "✓ Available" : "Coming soon"}
                  </Text>
                </View>
              </View>

              <Ionicons
                name="chevron-forward"
                size={16}
                color={isActive ? "#888" : "#ccc"}
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
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "600",
    color: "#1a1a1a",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff",
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#e8e8e8",
    padding: 14,
  },
  statLabel: {
    fontSize: 11,
    color: "#999",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  statSub: {
    fontSize: 11,
    color: "#0F6E56",
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#aaa",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: "#e8e8e8",
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cardBody: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1a1a1a",
    lineHeight: 19,
  },
  badgeActive: {
    alignSelf: "flex-start",
    backgroundColor: "#E1F5EE",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 8,
  },
  badgeActiveText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#0F6E56",
  },
  badgeSoon: {
    alignSelf: "flex-start",
    backgroundColor: "#F5F5F0",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 8,
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
  },
  badgeSoonText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#aaa",
  },
});