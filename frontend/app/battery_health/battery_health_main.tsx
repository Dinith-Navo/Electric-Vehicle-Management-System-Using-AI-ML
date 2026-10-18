import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";

const features = [
  {
    icon: "trending-up-outline" as const,
    iconBg: { light: "#EEEDFE", dark: "#2A2560" },
    iconColor: { light: "#534AB7", dark: "#9B95E8" },
    title: "Battery health forecasting",
    desc: "Estimate future battery state of health from current battery condition data.",
  },
  {
    icon: "calendar-outline" as const,
    iconBg: { light: "#E1F5EE", dark: "#0D3326" },
    iconColor: { light: "#0F6E56", dark: "#3DBFA0" },
    title: "3, 6 & 12-month forecasts",
    desc: "View separate short-, medium- and long-term SOH forecasts.",
  },
  {
    icon: "bulb-outline" as const,
    iconBg: { light: "#FAEEDA", dark: "#2E1F00" },
    iconColor: { light: "#854F0B", dark: "#D4921F" },
    title: "Personalised recommendations",
    desc: "Receive behaviour-based charging and driving recommendations.",
  },
];

const badges = ["ML-powered", "3 forecast horizons", "Behaviour insights"];

export default function BatteryHealthMain() {
  const router = useRouter();
  const { theme, colors, toggleTheme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}> 
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      <View style={[styles.container, { backgroundColor: colors.bg }]}> 
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[
              styles.iconBtn,
              { backgroundColor: colors.iconBtn, borderColor: colors.border },
            ]}
            onPress={() => router.back()}
            activeOpacity={0.75}
          >
            <Ionicons
              name="arrow-back-outline"
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconBtn,
              { backgroundColor: colors.iconBtn, borderColor: colors.border },
            ]}
            onPress={toggleTheme}
            activeOpacity={0.75}
          >
            <Ionicons
              name={theme === "light" ? "moon-outline" : "sunny-outline"}
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
          contentContainerStyle={styles.content}
        >
          <View style={styles.hero}>
            <View
              style={[
                styles.iconRing,
                {
                  backgroundColor: theme === "light" ? "#EEEDFE" : "#2A2560",
                  borderColor: theme === "light" ? "#AFA9EC" : "#534AB7",
                },
              ]}
            >
              <Ionicons
                name="battery-charging-outline"
                size={34}
                color={theme === "light" ? "#534AB7" : "#9B95E8"}
              />
            </View>

            <Text style={[styles.heroTitle, { color: colors.textPrimary }]}> 
              EV battery health predictor
            </Text>
            <Text style={[styles.heroDesc, { color: colors.textSecondary }]}> 
              Enter current battery and usage information to forecast future SOH and
              receive personalised battery-care recommendations.
            </Text>
          </View>

          <View style={styles.badgeRow}>
            {badges.map((badge) => (
              <View
                key={badge}
                style={[styles.badge, { backgroundColor: colors.badgeBg }]}
              >
                <Text style={[styles.badgeText, { color: colors.badgeText }]}> 
                  {badge}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <Text style={[styles.sectionLabel, { color: colors.sectionLabel }]}> 
            WHAT YOU'LL GET
          </Text>

          {features.map((feature, index) => (
            <View
              key={index}
              style={[
                styles.featureCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.featIcon,
                  { backgroundColor: feature.iconBg[theme] },
                ]}
              >
                <Ionicons
                  name={feature.icon}
                  size={20}
                  color={feature.iconColor[theme]}
                />
              </View>

              <View style={styles.featBody}>
                <Text style={[styles.featTitle, { color: colors.textPrimary }]}> 
                  {feature.title}
                </Text>
                <Text style={[styles.featDesc, { color: colors.textSecondary }]}> 
                  {feature.desc}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textMuted}
              />
            </View>
          ))}

          <View
            style={[
              styles.notice,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#534AB7"
            />
            <Text style={[styles.noticeText, { color: colors.textSecondary }]}> 
              This research prototype provides decision-support estimates and does not
              replace manufacturer or service-centre battery diagnostics.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.push("/battery_health/input" as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="play-outline" size={16} color="#EEEDFE" />
            <Text style={styles.ctaText}>Start prediction</Text>
          </TouchableOpacity>
        </Animated.ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { paddingBottom: 40 },
  hero: { alignItems: "center", marginBottom: 20 },
  iconRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
    lineHeight: 28,
  },
  heroDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 12,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 22,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11, fontWeight: "600" },
  divider: { height: 0.5, marginBottom: 16 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  featureCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  featIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  featBody: { flex: 1 },
  featTitle: { fontSize: 13, fontWeight: "600", marginBottom: 3 },
  featDesc: { fontSize: 12, lineHeight: 17 },
  notice: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  noticeText: { flex: 1, fontSize: 11, lineHeight: 17 },
  ctaBtn: {
    marginTop: 24,
    backgroundColor: "#534AB7",
    borderRadius: 30,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#EEEDFE",
    letterSpacing: 0.2,
  },
});