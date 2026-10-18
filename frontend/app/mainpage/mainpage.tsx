import React, { useState, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Image,
  Modal,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import { tokenStorage } from "../../ev_optimization/services/tokenStorage";
import { authApi } from "../../ev_optimization/services/apiClient";

interface FeatureCard {
  id: string;
  label: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  labelColor: string;
  route: string;
}

const features: FeatureCard[] = [
  {
    id: "anomaly",
    label: "ANOMALY DETECTION",
    title: "Real-time AI Anomaly Detection & Live Telemetry",
    description: "Multi-parameter sensor analytics, explainable AI diagnostics, and early fault warning system.",
    icon: "shield-checkmark-outline",
    iconBg: "rgba(239, 68, 68, 0.12)",
    iconColor: "#DC2626",
    labelColor: "#DC2626",
    route: "/anomaly_detection",
  },
  {
    id: "battery",
    label: "BATTERY HEALTH & DEGRADATION",
    title: "Adaptive Battery Health Prediction & Longevity Analytics",
    description: "Multi-horizon 3M, 6M & 12M SoH forecasting with AI-driven degradation prevention.",
    icon: "battery-charging-outline",
    iconBg: "rgba(16, 185, 129, 0.12)",
    iconColor: "#059669",
    labelColor: "#059669",
    route: "/battery_health/battery_health_main",
  },
  {
    id: "chatbot",
    label: "EV VIRTUAL ASSISTANT",
    title: "Intelligent EV Conversational & Diagnostic Assistant",
    description: "Context-aware voice & chat intelligence for operational troubleshooting and driver guidance.",
    icon: "chatbubbles-outline",
    iconBg: "rgba(249, 115, 22, 0.12)",
    iconColor: "#EA580C",
    labelColor: "#EA580C",
    route: "/ev_chatbot",
  },
  {
    id: "optimization",
    label: "CHARGING & RANGE OPTIMIZATION",
    title: "Smart Range Estimation & Station Queue Optimization",
    description: "Dynamic remaining range forecasting, corridor station analytics & intelligent route planning.",
    icon: "flash-outline",
    iconBg: "rgba(14, 165, 233, 0.12)",
    iconColor: "#0284c7",
    labelColor: "#0284c7",
    route: "/ev_optimization/dashboard",
  },
];

const MainPage = () => {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  // Require login to access Main Page: redirect to login if session missing
  useFocusEffect(
    useCallback(() => {
      let isCurrent = true;
      (async () => {
        try {
          const isAuth = await tokenStorage.isAuthenticated();
          if (!isAuth) {
            if (isCurrent) {
              router.replace("/login");
            }
            return;
          }
          const user = await tokenStorage.getUser();
          if (isCurrent) {
            setCurrentUser(user);
          }
        } catch (e) {
          if (isCurrent) {
            router.replace("/login");
          }
        }
      })();
      return () => {
        isCurrent = false;
      };
    }, [])
  );

  const handleCardPress = (item: FeatureCard) => {
    router.push(item.route as any);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // fallback
    }
    await tokenStorage.clearTokens();
    setCurrentUser(null);
    setProfileModalVisible(false);
    router.replace("/login");
  };

  const isDark = theme === "dark";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bg }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header with Logo, Title, and Action Controls */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require("../../assets/images/smartev_logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View>
              <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>SmartEV</Text>
              <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
                Intelligent EV Management
              </Text>
            </View>
          </View>

          {/* Top Right Action Controls: Settings & User Profile */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => router.push("/settings")}
              accessibilityLabel="Settings"
            >
              <Ionicons name="settings-outline" size={19} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.profilePill,
                { backgroundColor: colors.card, borderColor: "#0284c7" },
              ]}
              onPress={() => setProfileModalVisible(true)}
              accessibilityLabel="User Account"
            >
              <View style={styles.avatarMini}>
                <Ionicons name="person" size={13} color="#ffffff" />
              </View>
              <Text
                style={[styles.profilePillText, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {currentUser?.name ? currentUser.name.split(" ")[0] : "Driver"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Professional Unified Vehicle Intelligence Hero Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Top Row: Icon, Title, and System Online Status */}
          <View style={styles.heroTopRow}>
            <View style={styles.heroTitleGroup}>
              <View
                style={[
                  styles.heroIconBox,
                  { backgroundColor: isDark ? "rgba(2, 132, 199, 0.15)" : "#eff6ff" },
                ]}
              >
                <Ionicons name="hardware-chip-outline" size={20} color="#0284c7" />
              </View>
              <View style={styles.heroTitles}>
                <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
                  Unified Vehicle Intelligence
                </Text>
                <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                  Live Telemetry & Predictive Analytics Platform
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.liveStatusBadge,
                {
                  backgroundColor: isDark ? "rgba(16, 185, 129, 0.12)" : "#ecfdf5",
                  borderColor: isDark ? "rgba(16, 185, 129, 0.25)" : "#a7f3d0",
                },
              ]}
            >
              <View style={styles.livePulseDot} />
              <Text style={[styles.liveStatusText, { color: isDark ? "#34d399" : "#059669" }]}>
                Online
              </Text>
            </View>
          </View>

          {/* Connected Modules Quick Status Grid */}
          <View
            style={[
              styles.heroMetricsGrid,
              {
                borderTopColor: colors.border,
                backgroundColor: isDark ? "rgba(15, 23, 42, 0.35)" : "#f8fafc",
              },
            ]}
          >
            <View style={styles.heroMetricItem}>
              <View style={styles.metricLabelRow}>
                <Ionicons name="shield-checkmark-outline" size={12} color="#ef4444" />
                <Text style={[styles.heroMetricLabel, { color: colors.textSecondary }]}>
                  Anomaly
                </Text>
              </View>
              <Text style={[styles.heroMetricValue, { color: isDark ? "#38bdf8" : "#0284c7" }]}>
                Active
              </Text>
            </View>

            <View style={[styles.heroMetricDivider, { backgroundColor: colors.border }]} />

            <View style={styles.heroMetricItem}>
              <View style={styles.metricLabelRow}>
                <Ionicons name="battery-charging-outline" size={12} color="#10b981" />
                <Text style={[styles.heroMetricLabel, { color: colors.textSecondary }]}>
                  Battery SOH
                </Text>
              </View>
              <Text style={[styles.heroMetricValue, { color: isDark ? "#34d399" : "#059669" }]}>
                Ready
              </Text>
            </View>

            <View style={[styles.heroMetricDivider, { backgroundColor: colors.border }]} />

            <View style={styles.heroMetricItem}>
              <View style={styles.metricLabelRow}>
                <Ionicons name="chatbubble-ellipses-outline" size={12} color="#f97316" />
                <Text style={[styles.heroMetricLabel, { color: colors.textSecondary }]}>
                  Assistant
                </Text>
              </View>
              <Text style={[styles.heroMetricValue, { color: isDark ? "#fb923c" : "#ea580c" }]}>
                Ready
              </Text>
            </View>

            <View style={[styles.heroMetricDivider, { backgroundColor: colors.border }]} />

            <View style={styles.heroMetricItem}>
              <View style={styles.metricLabelRow}>
                <Ionicons name="flash-outline" size={12} color="#0284c7" />
                <Text style={[styles.heroMetricLabel, { color: colors.textSecondary }]}>
                  Charging
                </Text>
              </View>
              <Text style={[styles.heroMetricValue, { color: isDark ? "#38bdf8" : "#0284c7" }]}>
                Synced
              </Text>
            </View>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}>
            RESEARCH & OPERATIONAL MODULES
          </Text>
          <Text style={[styles.componentBadge, { color: "#0284c7" }]}>
            4 Active Modules
          </Text>
        </View>

        {/* Feature Cards - All 4 Accessible without public/private distinctions */}
        {features.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => handleCardPress(item)}
            activeOpacity={0.75}
          >
            <View style={[styles.cardIcon, { backgroundColor: item.iconBg }]}>
              <Ionicons name={item.icon} size={24} color={item.iconColor} />
            </View>

            <View style={styles.cardBody}>
              <Text style={[styles.cardLabel, { color: item.labelColor }]}>
                {item.label}
              </Text>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.title}</Text>
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                {item.description}
              </Text>

              <View style={styles.cardFooterRow}>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: isDark ? "#142820" : "#ecfdf5",
                      borderColor: "#10b981",
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={11}
                    color="#059669"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.statusPillText, { color: "#059669" }]}>
                    ✓ Available
                  </Text>
                </View>
              </View>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
              style={styles.cardChevron}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Account Info Modal */}
      <Modal
        visible={profileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setProfileModalVisible(false)}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.avatarLarge, { backgroundColor: "#0284c7" }]}>
                <Ionicons name="person" size={26} color="#ffffff" />
              </View>
              <View style={styles.modalHeaderText}>
                <Text style={[styles.modalUserName, { color: colors.textPrimary }]}>
                  {currentUser?.name || "SmartEV Driver"}
                </Text>
                <Text style={[styles.modalUserEmail, { color: colors.textSecondary }]}>
                  {currentUser?.email}
                </Text>
                {currentUser?.role && (
                  <Text style={[styles.modalUserRole, { color: colors.textMuted }]}>
                    Role: {currentUser.role}
                  </Text>
                )}
              </View>
            </View>

            <View style={[styles.modalDivider, { backgroundColor: colors.divider }]} />

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setProfileModalVisible(false);
                router.push("/settings");
              }}
            >
              <Ionicons name="settings-outline" size={18} color={colors.textPrimary} style={{ marginRight: 10 }} />
              <Text style={[styles.modalOptionText, { color: colors.textPrimary }]}>
                Global Settings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setProfileModalVisible(false);
                router.push("/ev_optimization/dashboard");
              }}
            >
              <Ionicons name="flash-outline" size={18} color="#0284c7" style={{ marginRight: 10 }} />
              <Text style={[styles.modalOptionText, { color: "#0284c7" }]}>
                Charging & Range Dashboard
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, styles.modalLogoutOption]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={18} color="#ef4444" style={{ marginRight: 10 }} />
              <Text style={[styles.modalOptionText, { color: "#ef4444" }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default MainPage;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    width: "100%",
  },
  container: {
    flex: 1,
    width: "100%",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
    paddingRight: 8,
  },
  logoImage: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  brandTitle: {
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  profilePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 6,
  },
  avatarMini: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#0284c7",
    alignItems: "center",
    justifyContent: "center",
  },
  profilePillText: {
    fontSize: 12,
    fontWeight: "700",
    maxWidth: 70,
  },
  heroCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    width: "100%",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 8,
  },
  heroTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  heroIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  heroTitles: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  liveStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
    flexShrink: 0,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
  liveStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  heroMetricsGrid: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  heroMetricItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  heroMetricLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  heroMetricValue: {
    fontSize: 11,
    fontWeight: "700",
  },
  heroMetricDivider: {
    width: 1,
    height: 22,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    width: "100%",
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.7,
  },
  componentBadge: {
    fontSize: 11,
    fontWeight: "700",
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1.5,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    lineHeight: 18.5,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 6,
  },
  cardFooterRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderWidth: 0.8,
  },
  statusPillText: {
    fontSize: 9.5,
    fontWeight: "600",
  },
  cardChevron: {
    alignSelf: "center",
    flexShrink: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeaderText: {
    flex: 1,
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: "700",
  },
  modalUserEmail: {
    fontSize: 12.5,
    marginTop: 1,
  },
  modalUserRole: {
    fontSize: 11,
    marginTop: 2,
  },
  modalDivider: {
    height: 1,
    marginVertical: 14,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalLogoutOption: {
    marginTop: 4,
  },
});