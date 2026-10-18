import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
  Easing,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";
import { useTheme } from "./ThemeContext";
import { tokenStorage } from "../ev_optimization/services/tokenStorage";

// Prevent native splash screen from hiding automatically if supported
SplashScreen.preventAutoHideAsync().catch(() => {});

const { width } = Dimensions.get("window");

export default function SplashScreenComponent() {
  const router = useRouter();
  const { colors, theme } = useTheme();

  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let isMounted = true;

    // Hide native splash screen quickly so our custom animated one renders
    SplashScreen.hideAsync().catch(() => {});

    async function runAnimation() {
      let reduceAnim = false;
      try {
        const pref = await AsyncStorage.getItem("@smartev_reduce_anim");
        reduceAnim = pref === "true";
      } catch (e) {
        // fallback
      }

      const animDuration = reduceAnim ? 400 : 900;
      const stayDuration = reduceAnim ? 500 : 1200;

      // Start fade & scale animation
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: animDuration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(reduceAnim ? 150 : 350),
          Animated.parallel([
            Animated.timing(textOpacity, {
              toValue: 1,
              duration: animDuration - 100,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(textTranslateY, {
              toValue: 0,
              duration: animDuration - 100,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();

      // Continuous subtle pulse on ambient glow
      if (!reduceAnim) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.08,
              duration: 1100,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1100,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();
      }

      // Check authentication status
      let isAuth = false;
      try {
        isAuth = await tokenStorage.isAuthenticated();
      } catch (e) {}

      // Automatically navigate: to Main Page if already logged in, otherwise to Login
      const timer = setTimeout(() => {
        if (isMounted) {
          if (isAuth) {
            router.replace("/mainpage/mainpage");
          } else {
            router.replace("/login");
          }
        }
      }, animDuration + stayDuration);

      return () => clearTimeout(timer);
    }

    runAnimation();

    return () => {
      isMounted = false;
    };
  }, []);

  const isDark = theme === "dark";
  const bg = isDark ? "#080c14" : "#0d1b2a"; // Deep futuristic tech navy for startup

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={bg} />

      {/* Decorative ambient background rings */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            transform: [{ scale: pulseAnim }],
            opacity: isDark ? 0.25 : 0.2,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.contentBox,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <View style={styles.logoWrapper}>
          <Image
            source={require("../assets/images/smartev_logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <Text style={styles.brandTitle}>
            Smart<Text style={styles.brandHighlight}>EV</Text>
          </Text>
          <Text style={styles.brandSubtitle}>Intelligent EV Management</Text>

          <View style={styles.indicatorContainer}>
            <View style={styles.indicatorDot} />
            <Text style={styles.versionText}>v2.0.0 Research Platform</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  glowRing: {
    position: "absolute",
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: (width * 0.85) / 2,
    backgroundColor: "#0ea5e9",
  },
  contentBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrapper: {
    width: 140,
    height: 140,
    borderRadius: 36,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1.5,
    borderColor: "rgba(14, 165, 233, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 24,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  textContainer: {
    alignItems: "center",
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  brandHighlight: {
    color: "#0ea5e9",
  },
  brandSubtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#94a3b8",
    letterSpacing: 0.5,
    marginBottom: 28,
  },
  indicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  indicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#10b981",
    marginRight: 8,
  },
  versionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#cbd5e1",
    letterSpacing: 0.3,
  },
});
