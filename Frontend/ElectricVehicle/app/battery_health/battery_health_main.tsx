import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "./ThemeContext";

const features = [
  {
    icon: "📈",
    title: "Predict Battery Health (SOH)",
    desc: "Get accurate state of health predictions",
  },
  {
    icon: "📅",
    title: "3, 6, 12 Month Forecasts",
    desc: "See how your battery will perform over time",
  },
  {
    icon: "💡",
    title: "Smart Recommendations",
    desc: "Get tips to maintain optimal battery health",
  },
];

export default function BatteryHealthMain() {
  const router = useRouter();
  const { theme, toggleTheme, colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />

      {/* Theme Toggle */}
      <TouchableOpacity
        style={[styles.themeToggle, { backgroundColor: colors.toggleBg }]}
        onPress={toggleTheme}
      >
        <Text style={styles.themeIcon}>{theme === "dark" ? "☀️" : "🌙"}</Text>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Battery Icon */}
        <View style={styles.iconWrapper}>
          <View style={styles.iconCircle}>
            <Text style={styles.batteryEmoji}>🔋</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.title }]}>
          EV Battery Health Predictor
        </Text>
        <Text style={[styles.subtitle, { color: colors.subtitle }]}>
          Monitor and predict your electric vehicle battery health using simple
          input data. Get future predictions and personalized recommendations.
        </Text>

        {/* Feature List */}
        {features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={[styles.featureIconBox, { backgroundColor: colors.iconBox }]}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.featureTitle }]}>
                {f.title}
              </Text>
              <Text style={[styles.featureDesc, { color: colors.featureDesc }]}>
                {f.desc}
              </Text>
            </View>
          </View>
        ))}

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/battery_health/input" as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Start Prediction</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  themeToggle: {
    alignSelf: "flex-end",
    padding: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  themeIcon: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: 20,
  },
  iconWrapper: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#6c63ff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6c63ff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  batteryEmoji: {
    fontSize: 38,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 18,
  },
  featureIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  featureDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  button: {
    marginTop: 36,
    width: "100%",
    paddingVertical: 18,
    borderRadius: 30,
    backgroundColor: "#6c63ff",
    alignItems: "center",
    shadowColor: "#6c63ff",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});