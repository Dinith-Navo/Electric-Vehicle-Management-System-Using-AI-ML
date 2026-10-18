import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
  StatusBar,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme, ThemePreference } from "./ThemeContext";
import { tokenStorage } from "../ev_optimization/services/tokenStorage";
import { authApi } from "../ev_optimization/services/apiClient";

export default function SettingsScreen() {
  const router = useRouter();
  const { themePreference, setThemePreference, colors, theme } = useTheme();

  const [reduceAnim, setReduceAnim] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const pref = await AsyncStorage.getItem("@smartev_reduce_anim");
        setReduceAnim(pref === "true");

        const user = await tokenStorage.getUser();
        setCurrentUser(user);
      } catch (e) {
        console.warn("Failed to load settings data", e);
      } finally {
        setLoadingUser(false);
      }
    })();
  }, []);

  const handleToggleAnim = async (val: boolean) => {
    setReduceAnim(val);
    try {
      await AsyncStorage.setItem("@smartev_reduce_anim", val ? "true" : "false");
    } catch (e) {
      console.warn("Failed to persist animation preference", e);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // fallback
    }
    await tokenStorage.clearTokens();
    setCurrentUser(null);
    router.replace("/login");
  };

  const isDark = theme === "dark";

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />

      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.iconBtn, borderColor: colors.border }]}
          onPress={() => router.back()}
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.sectionLabel }]}>ACCOUNT</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {currentUser ? (
              <View>
                <View style={styles.userRow}>
                  <View style={[styles.avatarCircle, { backgroundColor: "#0284c7" }]}>
                    <Ionicons name="person" size={24} color="#ffffff" />
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.textPrimary }]}>
                      {currentUser.name || "SmartEV Driver"}
                    </Text>
                    <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                      {currentUser.email}
                    </Text>
                    {currentUser.role && (
                      <View style={[styles.roleBadge, { backgroundColor: colors.badgeBg }]}>
                        <Text style={[styles.roleText, { color: colors.badgeText }]}>
                          Role: {currentUser.role}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.divider }]} />

                <TouchableOpacity
                  style={styles.logoutBtn}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={18} color="#ef4444" style={{ marginRight: 8 }} />
                  <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.guestRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Guest Session</Text>
                  <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
                    Sign in to sync your vehicles and personalized charging routes.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.loginBtn}
                  onPress={() => router.push("/login")}
                >
                  <Text style={styles.loginBtnText}>Sign In</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.sectionLabel }]}>APPEARANCE</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {(["light", "dark", "system"] as ThemePreference[]).map((pref, idx) => {
              const label =
                pref === "light"
                  ? "Light Mode"
                  : pref === "dark"
                  ? "Dark Mode"
                  : "System Default";
              const iconName =
                pref === "light"
                  ? "sunny-outline"
                  : pref === "dark"
                  ? "moon-outline"
                  : "phone-portrait-outline";
              const isSelected = themePreference === pref;

              return (
                <React.Fragment key={pref}>
                  {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.divider }]} />}
                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => setThemePreference(pref)}
                  >
                    <View style={styles.optionLeft}>
                      <Ionicons
                        name={iconName as any}
                        size={20}
                        color={isSelected ? "#0284c7" : colors.textSecondary}
                        style={{ marginRight: 12 }}
                      />
                      <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>
                        {label}
                      </Text>
                    </View>
                    <Ionicons
                      name={isSelected ? "radio-button-on" : "radio-button-off"}
                      size={20}
                      color={isSelected ? "#0284c7" : colors.textMuted}
                    />
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* Animation Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.sectionLabel }]}>ANIMATION</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>
                  Reduce Intro Animation
                </Text>
                <Text style={[styles.cardDesc, { color: colors.textSecondary, marginTop: 2 }]}>
                  Shortens startup splash animation for faster loading.
                </Text>
              </View>
              <Switch
                value={reduceAnim}
                onValueChange={handleToggleAnim}
                trackColor={{ false: colors.border, true: "#0284c7" }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </View>

        {/* About SmartEV Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.sectionLabel }]}>ABOUT SMARTEV</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.aboutRow}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>SmartEV Platform</Text>
              <Text style={[styles.badgeText, { color: colors.textMuted }]}>Version 2.0.0</Text>
            </View>
            <Text style={[styles.aboutDescription, { color: colors.textSecondary }]}>
              An integrated intelligent electric vehicle management ecosystem combining AI-driven
              predictive diagnostics, conversational assistance, and charging optimization.
            </Text>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <Text style={[styles.moduleListHeader, { color: colors.textPrimary }]}>
              Research Modules:
            </Text>
            <View style={styles.moduleItem}>
              <Ionicons name="checkmark-circle" size={16} color="#0284c7" style={{ marginRight: 8 }} />
              <Text style={[styles.moduleText, { color: colors.textSecondary }]}>
                1. Anomaly Detection
              </Text>
            </View>
            <View style={styles.moduleItem}>
              <Ionicons name="checkmark-circle" size={16} color="#0284c7" style={{ marginRight: 8 }} />
              <Text style={[styles.moduleText, { color: colors.textSecondary }]}>
                2. Battery Health Prediction
              </Text>
            </View>
            <View style={styles.moduleItem}>
              <Ionicons name="checkmark-circle" size={16} color="#0284c7" style={{ marginRight: 8 }} />
              <Text style={[styles.moduleText, { color: colors.textSecondary }]}>
                3. EV Virtual Assistant
              </Text>
            </View>
            <View style={styles.moduleItem}>
              <Ionicons name="checkmark-circle" size={16} color="#0284c7" style={{ marginRight: 8 }} />
              <Text style={[styles.moduleText, { color: colors.textSecondary }]}>
                4. Charging Optimization and Range Prediction
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 18,
    gap: 20,
    paddingBottom: 40,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    marginBottom: 4,
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "600",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "700",
  },
  guestRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  loginBtn: {
    backgroundColor: "#0284c7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 12,
  },
  loginBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  aboutDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  moduleListHeader: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  moduleItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  moduleText: {
    fontSize: 13,
  },
});
