import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";

// Extracted tabs
import {
  DashboardTab,
  InsightsTab,
  UsageTab,
  BatteryDataTab,
  ReportTab,
} from "../../components/battery_health_result/tabs";

// Extracted types, utilities, styles
import {
  BatteryFormData,
  PredictionResponse,
  BadgeType,
  Recommendation,
} from "../../components/battery_health_result/types";
import {
  safeParse,
  firstParam,
  toNumber,
} from "../../components/battery_health_result/utils";
import { styles } from "../../components/battery_health_result/styles";

export type { BadgeType, Recommendation, BatteryFormData, PredictionResponse };

export const TABS = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "grid-outline" as const,
  },
  {
    key: "insights",
    label: "Insights",
    icon: "bulb-outline" as const,
  },
  {
    key: "behavior",
    label: "Usage",
    icon: "bar-chart-outline" as const,
  },
  {
    key: "factors",
    label: "Battery data",
    icon: "options-outline" as const,
  },
  {
    key: "report",
    label: "Report",
    icon: "document-text-outline" as const,
  },
];


export default function Results() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme, colors, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("dashboard");


  const form = safeParse<BatteryFormData>(
    firstParam(params.formData),
    {}
  );


  const parsedPrediction = safeParse<PredictionResponse | null>(
    firstParam(params.prediction),
    null
  );

  const prediction =
    parsedPrediction && Object.keys(parsedPrediction).length > 0
      ? parsedPrediction
      : null;

  const currentSOH = toNumber(
    prediction?.current_soh ?? form.currentHealth
  );

  const activeLabel =
    TABS.find((tab) => tab.key === activeTab)?.label || "Battery health";


  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardTab
            currentSOH={currentSOH}
            prediction={prediction}
            colors={colors}
          />
        );

      case "insights":
        return (
          <InsightsTab
            prediction={prediction}
            form={form}
            colors={colors}
          />
        );

      case "behavior":
        return (
          <UsageTab
            form={form}
            colors={colors}
          />
        );

      case "factors":
        return (
          <BatteryDataTab
            form={form}
            colors={colors}
          />
        );

      case "report":
        return (
          <ReportTab
            form={form}
            currentSOH={currentSOH}
            prediction={prediction}
            colors={colors}
          />
        );

      default:
        return null;
    }
  };


  return (
    <SafeAreaView
      style={[
        styles.safe,
        {
          backgroundColor: colors.card,
        },
      ]}
    >
      <StatusBar
        barStyle={colors.statusBar}
        backgroundColor={colors.card}
      />

      {/* ================================================= */}
      {/* TOP BAR */}
      {/* ================================================= */}

      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.iconBtn,
            {
              backgroundColor: colors.bg,
              borderColor: colors.border,
            },
          ]}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back-outline"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <View
          style={{
            alignItems: "center",
          }}
        >
          <Text
            style={[
              styles.topTitle,
              {
                color: colors.textPrimary,
              },
            ]}
          >
            {activeLabel}
          </Text>

          <Text
            style={[
              styles.topSubtitle,
              {
                color: colors.textMuted,
              },
            ]}
          >
            {prediction
              ? "Battery analysis ready"
              : "Battery health"}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.iconBtn,
            {
              backgroundColor: colors.bg,
              borderColor: colors.border,
            },
          ]}
          onPress={toggleTheme}
        >
          <Ionicons
            name={
              theme === "light"
                ? "moon-outline"
                : "sunny-outline"
            }
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* ================================================= */}
      {/* TAB BAR */}
      {/* ================================================= */}

      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={tab.icon}
                size={18}
                color={
                  active
                    ? "#534AB7"
                    : colors.textMuted
                }
              />

              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: active
                      ? "#534AB7"
                      : colors.textMuted,
                  },
                ]}
              >
                {tab.label}
              </Text>

              {active && (
                <View style={styles.tabIndicator} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ================================================= */}
      {/* CURRENT TAB */}
      {/* ================================================= */}

      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
        }}
      >
        {renderTab()}
      </View>

      {/* ================================================= */}
      {/* NEW PREDICTION BUTTON */}
      {/* ================================================= */}

      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          router.push("/battery_health/input" as any)
        }
        activeOpacity={0.85}
      >
        <Ionicons
          name="add"
          size={26}
          color="#EEEDFE"
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}