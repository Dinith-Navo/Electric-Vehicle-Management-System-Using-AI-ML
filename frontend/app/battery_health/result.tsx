import React, { useEffect, useRef, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  SafeAreaView,
  Alert,
  Platform,
} from "react-native";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { useTheme } from "../ThemeContext";


// =========================================================
// TYPES
// =========================================================

type BadgeType =
  | "good"
  | "warn"
  | "info"
  | "error";


type Recommendation = {
  priority: "High" | "Medium" | "Low";
  title: string;
  message: string;
};


type BatteryFormData = {
  vehicleModel?: string;
  batteryAgeMonths?: string;
  currentHealth?: string;

  avgVoltage?: string;
  avgCurrent?: string;
  avgTemperature?: string;
  avgSocChange?: string;
  avgChargeDuration?: string;
  chargingSessions?: string;

  avgDailyDistance?: string;
  drivingStyle?: string;
  chargingFrequency?: string;
  fastChargingUsage?: string;
  chargingHabit?: string;
  temperatureExposure?: string;
};


type PredictionResponse = {
  status?: string;

  prediction_id?: string;

  current_soh?: number;

  // =====================================================
  // SOH FORECASTS
  // =====================================================

  soh_3m?: number | null;
  soh_6m?: number | null;
  soh_12m?: number | null;


  // =====================================================
  // DEGRADATION
  // =====================================================

  degradation_3m?: number | null;
  degradation_6m?: number | null;
  degradation_12m?: number | null;


  // =====================================================
  // STATUS / MODEL
  // =====================================================

  health_status?: string;

  risk_level?: string;

  model?: string;

  model_version?: string;

  feature_count?: number;


  // =====================================================
  // MODEL AVAILABILITY
  // =====================================================

  models_available?: {
    "3m": boolean;
    "6m": boolean;
    "12m": boolean;
  };


  // =====================================================
  // RECOMMENDATIONS
  // =====================================================

  recommendations?: Recommendation[];
};


// =========================================================
// HELPERS
// =========================================================

function firstParam(
  value: string | string[] | undefined
): string | undefined {

  return Array.isArray(value)
    ? value[0]
    : value;
}


function safeParse<T>(
  value: string | undefined,
  fallback: T
): T {

  if (!value) {
    return fallback;
  }

  try {

    return JSON.parse(value) as T;

  } catch {

    return fallback;
  }
}


function toNumber(
  value:
    | string
    | number
    | null
    | undefined
): number | null {

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {

    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}


function healthLabel(
  value: number | null
): string {

  if (value === null) {
    return "Unknown";
  }

  if (value >= 90) {
    return "Excellent";
  }

  if (value >= 80) {
    return "Good";
  }

  return "Degraded";
}


function healthColor(
  value: number | null
): string {

  if (value === null) {
    return "#534AB7";
  }

  if (value >= 90) {
    return "#0F6E56";
  }

  if (value >= 80) {
    return "#BA7517";
  }

  return "#A32D2D";
}



function formatSohChange(
  degradation: number | null | undefined
): string {

  const value = toNumber(degradation);

  if (value === null) {
    return "Pending";
  }

  return `${Math.abs(value).toFixed(4)}%`;
}


function escapeHtml(
  value: string | number | null | undefined
): string {

  const textValue =
    value === null || value === undefined
      ? ""
      : String(value);

  return textValue
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// =========================================================
// CARD
// =========================================================

function Card({
  children,
  colors,
  style,
}: {
  children: React.ReactNode;
  colors: any;
  style?: object;
}) {

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}


// =========================================================
// BADGE
// =========================================================

const BADGE_STYLES: Record<
  BadgeType,
  {
    bg: string;
    color: string;
    label: string;
  }
> = {

  good: {
    bg: "#E1F5EE",
    color: "#0F6E56",
    label: "Good",
  },

  warn: {
    bg: "#FAEEDA",
    color: "#854F0B",
    label: "Warning",
  },

  info: {
    bg: "#EEEDFE",
    color: "#534AB7",
    label: "Info",
  },

  error: {
    bg: "#FCEBEB",
    color: "#A32D2D",
    label: "Critical",
  },
};


function Badge({
  type,
  label,
}: {
  type: BadgeType;
  label?: string;
}) {

  const style = BADGE_STYLES[type];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: style.bg,
        },
      ]}
    >

      <Text
        style={[
          styles.badgeText,
          {
            color: style.color,
          },
        ]}
      >
        {label || style.label}
      </Text>

    </View>
  );
}


// =========================================================
// CIRCULAR CURRENT SOH
// =========================================================

function CircularProgress({
  value,
}: {
  value: number | null;
}) {

  const display =
    value === null
      ? "--"
      : `${Math.round(value)}%`;


  const safeValue =
    value === null
      ? 0
      : Math.min(
          100,
          Math.max(
            0,
            value
          )
        );


  const color =
    healthColor(value);


  const trackColor =
    value === null
      ? "#EEEDFE"
      : value >= 90
        ? "#E1F5EE"
        : value >= 80
          ? "#FAEEDA"
          : "#FCEBEB";


  const size = 140;

  const stroke = 10;


  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
      }}
    >

      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,
          borderColor: trackColor,
        }}
      />


      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: stroke,

          borderColor:
            "transparent",

          borderTopColor:
            safeValue > 0
              ? color
              : "transparent",

          borderRightColor:
            safeValue > 25
              ? color
              : "transparent",

          borderBottomColor:
            safeValue > 50
              ? color
              : "transparent",

          borderLeftColor:
            safeValue > 75
              ? color
              : "transparent",

          transform: [
            {
              rotate: "-45deg",
            },
          ],
        }}
      />


      <Text
        style={{
          fontSize: 30,
          fontWeight: "600",
          color,
        }}
      >
        {display}
      </Text>


      <Text
        style={{
          fontSize: 11,
          color: "#999",
          marginTop: 2,
        }}
      >
        Current SOH
      </Text>

    </View>
  );
}


// =========================================================
// PROGRESS BAR
// =========================================================

function ProgressBar({
  value,
  color,
  trackColor,
}: {
  value: number | null;
  color: string;
  trackColor: string;
}) {

  const anim =
    useRef(
      new Animated.Value(0)
    ).current;


  useEffect(() => {

    const target =
      value === null
        ? 0
        : Math.min(
            1,
            Math.max(
              0,
              value / 100
            )
          );


    Animated.timing(
      anim,
      {
        toValue: target,

        duration: 800,

        useNativeDriver: false,
      }
    ).start();

  }, [
    anim,
    value,
  ]);


  return (
    <View
      style={[
        styles.progressTrack,
        {
          backgroundColor:
            trackColor,
        },
      ]}
    >

      <Animated.View
        style={{
          height: "100%",

          borderRadius: 4,

          backgroundColor:
            color,

          width:
            anim.interpolate({
              inputRange: [
                0,
                1,
              ],

              outputRange: [
                "0%",
                "100%",
              ],
            }),
        }}
      />

    </View>
  );
}


// =========================================================
// METRIC ROW
// =========================================================

function MetricRow({
  label,
  value,
  colors,
  valueColor,
}: {
  label: string;
  value: string;
  colors: any;
  valueColor?: string;
}) {

  return (
    <View
      style={
        styles.metricRow
      }
    >

      <Text
        style={[
          styles.metricLabel,
          {
            color:
              colors.textSecondary,
          },
        ]}
      >
        {label}
      </Text>


      <Text
        style={[
          styles.metricValue,
          {
            color:
              valueColor ||
              colors.textPrimary,
          },
        ]}
      >
        {value}
      </Text>

    </View>
  );
}


// =========================================================
// FORECAST ROW
// =========================================================

function ForecastRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: number | null;
  colors: any;
}) {

  const color =
    healthColor(value);


  return (
    <View
      style={{
        marginTop: 14,
      }}
    >

      <View
        style={
          styles.rowBetween
        }
      >

        <Text
          style={{
            fontSize: 12,

            color:
              colors.textSecondary,
          }}
        >
          {label}
        </Text>


        <Text
          style={{
            fontSize: 13,

            fontWeight:
              "600",

            color,
          }}
        >

          {
            value === null
              ? "Pending"
              : `${value.toFixed(1)}%`
          }

        </Text>

      </View>


      <ProgressBar
        value={value}
        color={color}
        trackColor={
          colors.progressTrack
        }
      />

    </View>
  );
}


// =========================================================
// DASHBOARD
// =========================================================

function Dashboard({
  currentSOH,
  prediction,
  colors,
}: {
  currentSOH: number | null;
  prediction: PredictionResponse | null;
  colors: any;
}) {

  const soh3m =
    toNumber(
      prediction?.soh_3m
    );


  const soh6m =
    toNumber(
      prediction?.soh_6m
    );


  const soh12m =
    toNumber(
      prediction?.soh_12m
    );


  return (
    <ScrollView
      contentContainerStyle={
        styles.tabContent
      }

      showsVerticalScrollIndicator={
        false
      }
    >

      {/* ================================================= */}
      {/* FRONTEND/BACKEND STATUS MESSAGE */}
      {/* ================================================= */}

      {!prediction && (

        <Card colors={colors}>

          <View
            style={
              styles.infoRow
            }
          >

            <Ionicons
              name="server-outline"
              size={19}
              color="#534AB7"
            />


            <View
              style={{
                flex: 1,
              }}
            >

              <Text
                style={[
                  styles.cardTitle,
                  {
                    color:
                      colors.textPrimary,
                  },
                ]}
              >
                Frontend ready
              </Text>


              <Text
                style={[
                  styles.cardText,
                  {
                    color:
                      colors.textSecondary,
                  },
                ]}
              >

                No battery analysis is available yet.
                Complete a battery health assessment to view your
                3-, 6- and 12-month forecasts and personalised insights.

              </Text>

            </View>

          </View>

        </Card>
      )}


      {/* ================================================= */}
      {/* CURRENT SOH */}
      {/* ================================================= */}

      <Card colors={colors}>

        <View
          style={{
            alignItems:
              "center",

            paddingVertical:
              12,
          }}
        >

          <CircularProgress
            value={
              currentSOH
            }
          />


          <Badge
            type={
              currentSOH !== null &&
              currentSOH >= 90
                ? "good"

                : currentSOH !== null &&
                  currentSOH >= 80
                  ? "warn"

                  : "error"
            }

            label={
              healthLabel(
                currentSOH
              )
            }
          />

        </View>

      </Card>


      {/* ================================================= */}
      {/* FUTURE SOH */}
      {/* ================================================= */}

      <Card colors={colors}>

        <View
          style={
            styles.cardHeader
          }
        >

          <View
            style={
              styles.purpleIcon
            }
          >

            <Ionicons
              name="trending-down-outline"
              size={15}
              color="#534AB7"
            />

          </View>


          <View
            style={{
              flex: 1,
            }}
          >

            <Text
              style={[
                styles.cardTitle,
                {
                  color:
                    colors.textPrimary,
                },
              ]}
            >
              Future SOH forecasts
            </Text>


            <Text
              style={[
                styles.cardText,
                {
                  color:
                    colors.textSecondary,
                },
              ]}
            >
              Estimated battery health over the next 12 months.
            </Text>

          </View>

        </View>


        <ForecastRow
          label="After 3 months"
          value={soh3m}
          colors={colors}
        />


        <ForecastRow
          label="After 6 months"
          value={soh6m}
          colors={colors}
        />


        <ForecastRow
          label="After 12 months"
          value={soh12m}
          colors={colors}
        />

      </Card>


      {/* ================================================= */}
      {/* USER-FACING SOH CHANGE */}
      {/* ================================================= */}

      <Card colors={colors}>

        <View style={styles.cardHeader}>
          <View style={styles.purpleIcon}>
            <Ionicons
              name="analytics-outline"
              size={15}
              color="#534AB7"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.cardTitle,
                { color: colors.textPrimary },
              ]}
            >
              Predicted SOH change
            </Text>

            <Text
              style={[
                styles.cardText,
                { color: colors.textSecondary },
              ]}
            >
              Estimated change compared with your current battery health.
            </Text>
          </View>
        </View>

        <MetricRow
          label="After 3 months"
          value={formatSohChange(prediction?.degradation_3m)}
          colors={colors}
        />

        <View
          style={[
            styles.separator,
            { backgroundColor: colors.divider },
          ]}
        />

        <MetricRow
          label="After 6 months"
          value={formatSohChange(prediction?.degradation_6m)}
          colors={colors}
        />

        <View
          style={[
            styles.separator,
            { backgroundColor: colors.divider },
          ]}
        />

        <MetricRow
          label="After 12 months"
          value={formatSohChange(prediction?.degradation_12m)}
          colors={colors}
        />

      </Card>


      {/* ================================================= */}
      {/* BATTERY OUTLOOK */}
      {/* ================================================= */}

      <Card colors={colors}>

        <View style={styles.cardHeader}>
          <View style={styles.purpleIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={15}
              color="#534AB7"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.cardTitle,
                { color: colors.textPrimary },
              ]}
            >
              Battery outlook
            </Text>

            <Text
              style={[
                styles.cardText,
                { color: colors.textSecondary },
              ]}
            >
              A simple summary based on your current SOH and forecast.
            </Text>
          </View>
        </View>

        <MetricRow
          label="Current health"
          value={
            prediction?.health_status ||
            healthLabel(currentSOH)
          }
          colors={colors}
        />

        <View
          style={[
            styles.separator,
            { backgroundColor: colors.divider },
          ]}
        />

        <MetricRow
          label="12-month outlook"
          value={
            prediction?.risk_level
              ? `${prediction.risk_level} risk`
              : "Pending"
          }
          colors={colors}
        />

      </Card>

    </ScrollView>
  );
}


// =========================================================
// INSIGHTS
// =========================================================

function Insights({
  prediction,
  form,
  colors,
}: {
  prediction: PredictionResponse | null;
  form: BatteryFormData;
  colors: any;
}) {

  const recommendations =
    prediction?.recommendations || [];


  const usageItems = [
    {
      label: "Average daily distance",
      value: form.avgDailyDistance || "Not provided",
    },
    {
      label: "Driving style",
      value: form.drivingStyle || "Not provided",
    },
    {
      label: "Charging frequency",
      value: form.chargingFrequency || "Not provided",
    },
    {
      label: "Fast charging usage",
      value: form.fastChargingUsage || "Not provided",
    },
    {
      label: "Charging habit",
      value: form.chargingHabit || "Not provided",
    },
    {
      label: "Temperature exposure",
      value: form.temperatureExposure || "Not provided",
    },
  ];


  return (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      showsVerticalScrollIndicator={false}
    >

      <Text
        style={[
          styles.tabTitle,
          { color: colors.textPrimary },
        ]}
      >
        Battery insights
      </Text>

      <Text
        style={[
          styles.tabSubtitle,
          { color: colors.textSecondary },
        ]}
      >
        Your driving and charging profile, together with personalised
        battery-care suggestions.
      </Text>


      <Card colors={colors}>

        <Text
          style={[
            styles.cardTitle,
            {
              color: colors.textPrimary,
              marginBottom: 8,
            },
          ]}
        >
          Your usage profile
        </Text>

        {usageItems.map((item, index) => (
          <React.Fragment key={item.label}>

            {index > 0 && (
              <View
                style={[
                  styles.separator,
                  { backgroundColor: colors.divider },
                ]}
              />
            )}

            <MetricRow
              label={item.label}
              value={item.value}
              colors={colors}
            />

          </React.Fragment>
        ))}

      </Card>


      <Text
        style={[
          styles.sectionHeading,
          { color: colors.textPrimary },
        ]}
      >
        Personalised recommendations
      </Text>


      {recommendations.length === 0 ? (

        <Card colors={colors}>

          <View style={styles.infoRow}>

            <Ionicons
              name="checkmark-circle-outline"
              size={19}
              color="#0F6E56"
            />

            <Text
              style={[
                styles.cardText,
                {
                  color: colors.textSecondary,
                  flex: 1,
                },
              ]}
            >
              No additional battery-care alert is available for this
              analysis. Continue following the charging and driving
              practices shown in your usage profile.
            </Text>

          </View>

        </Card>

      ) : (

        recommendations.map((item, index) => {

          const type: BadgeType =
            item.priority === "High"
              ? "error"
              : item.priority === "Medium"
                ? "warn"
                : "good";

          return (

            <Card
              key={`${item.title}-${index}`}
              colors={colors}
            >

              <View style={styles.rowBetween}>

                <Text
                  style={[
                    styles.cardTitle,
                    {
                      color: colors.textPrimary,
                      flex: 1,
                    },
                  ]}
                >
                  {item.title}
                </Text>

                <Badge
                  type={type}
                  label={item.priority}
                />

              </View>

              <Text
                style={[
                  styles.cardText,
                  {
                    color: colors.textSecondary,
                    marginTop: 8,
                  },
                ]}
              >
                {item.message}
              </Text>

            </Card>
          );
        })
      )}

    </ScrollView>
  );
}

// =========================================================
// BEHAVIOR
// =========================================================

function Behavior({
  form,
  colors,
}: {
  form: BatteryFormData;
  colors: any;
}) {

  const items = [

    {
      icon:
        "navigate-outline" as const,

      label:
        "Average daily distance",

      value:
        form.avgDailyDistance,
    },

    {
      icon:
        "car-sport-outline" as const,

      label:
        "Driving style",

      value:
        form.drivingStyle,
    },

    {
      icon:
        "flash-outline" as const,

      label:
        "Charging frequency",

      value:
        form.chargingFrequency,
    },

    {
      icon:
        "thunderstorm-outline" as const,

      label:
        "Fast charging usage",

      value:
        form.fastChargingUsage,
    },

    {
      icon:
        "battery-half-outline" as const,

      label:
        "Charging habit",

      value:
        form.chargingHabit,
    },

    {
      icon:
        "thermometer-outline" as const,

      label:
        "Temperature exposure",

      value:
        form.temperatureExposure,
    },

  ];


  return (
    <ScrollView
      contentContainerStyle={
        styles.tabContent
      }

      showsVerticalScrollIndicator={
        false
      }
    >

      <Text
        style={[
          styles.tabTitle,
          {
            color:
              colors.textPrimary,
          },
        ]}
      >
        Usage behaviour
      </Text>


      <Text
        style={[
          styles.tabSubtitle,
          {
            color:
              colors.textSecondary,
          },
        ]}
      >
        These details help tailor your battery-care guidance
        and are shown exactly as submitted.
      </Text>


      {
        items.map(
          (
            item
          ) => (

            <Card
              key={
                item.label
              }

              colors={
                colors
              }
            >

              <View
                style={
                  styles.infoRow
                }
              >

                <View
                  style={
                    styles.purpleIcon
                  }
                >

                  <Ionicons
                    name={
                      item.icon
                    }

                    size={
                      15
                    }

                    color={
                      "#534AB7"
                    }
                  />

                </View>


                <View
                  style={{
                    flex:
                      1,
                  }}
                >

                  <Text
                    style={[
                      styles.smallLabel,
                      {
                        color:
                          colors.textSecondary,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>


                  <Text
                    style={[
                      styles.behaviorValue,
                      {
                        color:
                          colors.textPrimary,
                      },
                    ]}
                  >
                    {
                      item.value ||
                      "Not provided"
                    }
                  </Text>

                </View>

              </View>

            </Card>
          )
        )
      }

    </ScrollView>
  );
}


// =========================================================
// PREDICTION FACTORS
// =========================================================

function Factors({
  form,
  colors,
}: {
  form: BatteryFormData;
  colors: any;
}) {

  const factors = [

    {
      label:
        "Battery age",

      value:
        form.batteryAgeMonths
          ? `${form.batteryAgeMonths} months`
          : "Not provided",
    },

    {
      label:
        "Average pack voltage",

      value:
        form.avgVoltage
          ? `${form.avgVoltage} V`
          : "Not provided",
    },

    {
      label:
        "Charging current magnitude",

      value:
        form.avgCurrent
          ? `${form.avgCurrent} A`
          : "Not provided",
    },

    {
      label:
        "Average battery temperature",

      value:
        form.avgTemperature
          ? `${form.avgTemperature} °C`
          : "Not provided",
    },

    {
      label:
        "Average SOC change",

      value:
        form.avgSocChange
          ? `${form.avgSocChange}%`
          : "Not provided",
    },

    {
      label:
        "Average charge duration",

      value:
        form.avgChargeDuration
          ? `${form.avgChargeDuration} min`
          : "Not provided",
    },

    {
      label:
        "Charging sessions",

      value:
        form.chargingSessions
          ? `${form.chargingSessions} / day`
          : "Not provided",
    },

  ];


  return (
    <ScrollView
      contentContainerStyle={
        styles.tabContent
      }

      showsVerticalScrollIndicator={
        false
      }
    >

      <Text
        style={[
          styles.tabTitle,
          {
            color:
              colors.textPrimary,
          },
        ]}
      >
        Prediction factors
      </Text>


      <Text
        style={[
          styles.tabSubtitle,
          {
            color:
              colors.textSecondary,
          },
        ]}
      >
        Technical values passed to the forecasting
        backend. No artificial factor percentages are
        calculated in the frontend.
      </Text>


      <Card colors={colors}>

        {
          factors.map(
            (
              item,
              index
            ) => (

              <React.Fragment
                key={
                  item.label
                }
              >

                {
                  index > 0 && (

                    <View
                      style={[
                        styles.separator,
                        {
                          backgroundColor:
                            colors.divider,
                        },
                      ]}
                    />

                  )
                }


                <MetricRow
                  label={
                    item.label
                  }

                  value={
                    item.value
                  }

                  colors={
                    colors
                  }
                />

              </React.Fragment>
            )
          )
        }

      </Card>

    </ScrollView>
  );
}


// =========================================================
// REPORT
// =========================================================

function Report({
  form,
  currentSOH,
  prediction,
  colors,
}: {
  form: BatteryFormData;
  currentSOH: number | null;
  prediction: PredictionResponse | null;
  colors: any;
}) {

  const [generating, setGenerating] = useState(false);

  const recommendations =
    prediction?.recommendations || [];


  const handleDownload = async () => {

    if (!prediction) {

      Alert.alert(
        "Report unavailable",
        "Generate a battery health analysis before creating a report."
      );

      return;
    }


    try {

      setGenerating(true);

      const generatedAt =
        new Date().toLocaleString();


      const recommendationHtml =
        recommendations.length > 0

          ? recommendations
              .map(
                (item) => `
                  <div class="recommendation">
                    <div>
                      <span class="priority">
                        ${escapeHtml(item.priority)}
                      </span>
                      <strong>
                        ${escapeHtml(item.title)}
                      </strong>
                    </div>
                    <p>
                      ${escapeHtml(item.message)}
                    </p>
                  </div>
                `
              )
              .join("")

          : `
              <p>
                No additional battery-care alert was generated
                for this analysis.
              </p>
            `;


      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />

            <style>
              body {
                font-family: Arial, Helvetica, sans-serif;
                color: #222;
                padding: 32px;
                line-height: 1.5;
              }

              h1 {
                margin-bottom: 4px;
                color: #534AB7;
              }

              h2 {
                font-size: 17px;
                margin-top: 28px;
                margin-bottom: 10px;
                border-bottom: 1px solid #ddd;
                padding-bottom: 6px;
              }

              .subtitle {
                color: #666;
                margin-top: 0;
              }

              .summary {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
              }

              .metric {
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 10px 12px;
              }

              .label {
                color: #666;
                font-size: 12px;
              }

              .value {
                font-size: 16px;
                font-weight: bold;
                margin-top: 3px;
              }

              table {
                width: 100%;
                border-collapse: collapse;
              }

              td {
                padding: 8px 4px;
                border-bottom: 1px solid #eee;
              }

              td:last-child {
                text-align: right;
                font-weight: bold;
              }

              .recommendation {
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 10px;
              }

              .recommendation p {
                margin-bottom: 0;
              }

              .priority {
                display: inline-block;
                margin-right: 8px;
                padding: 2px 7px;
                border-radius: 12px;
                background: #EEEDFE;
                color: #534AB7;
                font-size: 11px;
                font-weight: bold;
              }

              .note {
                margin-top: 28px;
                padding: 12px;
                background: #f6f6f8;
                border-radius: 8px;
                color: #555;
                font-size: 12px;
              }
            </style>
          </head>

          <body>

            <h1>EV Battery Health Report</h1>

            <p class="subtitle">
              Generated ${escapeHtml(generatedAt)}
            </p>


            <h2>Battery health summary</h2>

            <div class="summary">

              <div class="metric">
                <div class="label">Vehicle</div>
                <div class="value">
                  ${escapeHtml(form.vehicleModel || "Not provided")}
                </div>
              </div>

              <div class="metric">
                <div class="label">Current SOH</div>
                <div class="value">
                  ${
                    currentSOH === null
                      ? "Unknown"
                      : `${currentSOH.toFixed(1)}%`
                  }
                </div>
              </div>

              <div class="metric">
                <div class="label">Current health</div>
                <div class="value">
                  ${escapeHtml(
                    prediction.health_status ||
                    healthLabel(currentSOH)
                  )}
                </div>
              </div>

              <div class="metric">
                <div class="label">12-month outlook</div>
                <div class="value">
                  ${escapeHtml(
                    prediction.risk_level
                      ? `${prediction.risk_level} risk`
                      : "Not available"
                  )}
                </div>
              </div>

            </div>


            <h2>SOH forecast</h2>

            <table>
              <tr>
                <td>After 3 months</td>
                <td>
                  ${
                    prediction.soh_3m != null
                      ? `${Number(prediction.soh_3m).toFixed(1)}%`
                      : "Pending"
                  }
                </td>
              </tr>

              <tr>
                <td>After 6 months</td>
                <td>
                  ${
                    prediction.soh_6m != null
                      ? `${Number(prediction.soh_6m).toFixed(1)}%`
                      : "Pending"
                  }
                </td>
              </tr>

              <tr>
                <td>After 12 months</td>
                <td>
                  ${
                    prediction.soh_12m != null
                      ? `${Number(prediction.soh_12m).toFixed(1)}%`
                      : "Pending"
                  }
                </td>
              </tr>
            </table>


            <h2>Predicted SOH change</h2>

            <table>
              <tr>
                <td>3-month change</td>
                <td>
                  ${escapeHtml(
                    formatSohChange(prediction.degradation_3m)
                  )}
                </td>
              </tr>

              <tr>
                <td>6-month change</td>
                <td>
                  ${escapeHtml(
                    formatSohChange(prediction.degradation_6m)
                  )}
                </td>
              </tr>

              <tr>
                <td>12-month change</td>
                <td>
                  ${escapeHtml(
                    formatSohChange(prediction.degradation_12m)
                  )}
                </td>
              </tr>
            </table>


            <h2>Your usage profile</h2>

            <table>
              <tr>
                <td>Average daily distance</td>
                <td>
                  ${escapeHtml(form.avgDailyDistance || "Not provided")}
                </td>
              </tr>

              <tr>
                <td>Driving style</td>
                <td>
                  ${escapeHtml(form.drivingStyle || "Not provided")}
                </td>
              </tr>

              <tr>
                <td>Charging frequency</td>
                <td>
                  ${escapeHtml(form.chargingFrequency || "Not provided")}
                </td>
              </tr>

              <tr>
                <td>Fast charging usage</td>
                <td>
                  ${escapeHtml(form.fastChargingUsage || "Not provided")}
                </td>
              </tr>

              <tr>
                <td>Charging habit</td>
                <td>
                  ${escapeHtml(form.chargingHabit || "Not provided")}
                </td>
              </tr>

              <tr>
                <td>Temperature exposure</td>
                <td>
                  ${escapeHtml(form.temperatureExposure || "Not provided")}
                </td>
              </tr>
            </table>


            <h2>Personalised recommendations</h2>

            ${recommendationHtml}


            <div class="note">
              This forecast is intended to support day-to-day battery
              care. For maintenance, warranty, or safety decisions,
              confirm the battery condition with your vehicle
              manufacturer or a qualified EV service centre.
            </div>

          </body>
        </html>
      `;


      if (Platform.OS === "web") {

        // =================================================
        // WEB: POLISHED, DEPENDENCY-FREE PDF DOWNLOAD
        // =================================================
        // No jsPDF / pdf-lib / html2canvas.
        // The PDF is generated directly so Expo Web remains
        // stable and the report downloads without a print dialog.
        // =================================================

        type PdfColor = [
          number,
          number,
          number
        ];

        const PAGE_WIDTH = 595;
        const PAGE_HEIGHT = 842;

        const MARGIN = 42;
        const CONTENT_WIDTH =
          PAGE_WIDTH - MARGIN * 2;

        const PURPLE: PdfColor = [
          0.325,
          0.29,
          0.718,
        ];

        const PURPLE_DARK: PdfColor = [
          0.20,
          0.17,
          0.50,
        ];

        const PURPLE_LIGHT: PdfColor = [
          0.94,
          0.93,
          0.99,
        ];

        const TEXT: PdfColor = [
          0.12,
          0.12,
          0.15,
        ];

        const MUTED: PdfColor = [
          0.40,
          0.40,
          0.45,
        ];

        const BORDER: PdfColor = [
          0.88,
          0.88,
          0.91,
        ];

        const SOFT_BG: PdfColor = [
          0.975,
          0.975,
          0.985,
        ];

        const GREEN: PdfColor = [
          0.06,
          0.43,
          0.34,
        ];

        const GREEN_LIGHT: PdfColor = [
          0.90,
          0.97,
          0.94,
        ];

        const AMBER: PdfColor = [
          0.72,
          0.42,
          0.09,
        ];

        const AMBER_LIGHT: PdfColor = [
          0.99,
          0.95,
          0.86,
        ];

        const RED: PdfColor = [
          0.64,
          0.18,
          0.18,
        ];

        const RED_LIGHT: PdfColor = [
          0.99,
          0.92,
          0.92,
        ];


        const pages: string[][] = [];

        let commands: string[] = [];

        let y =
          PAGE_HEIGHT -
          MARGIN;


        const rgbFill = (
          color: PdfColor
        ) =>
          `${color[0]} ${color[1]} ${color[2]} rg`;


        const rgbStroke = (
          color: PdfColor
        ) =>
          `${color[0]} ${color[1]} ${color[2]} RG`;


        const sanitizePdfText = (
          value: unknown
        ): string => {

          return String(
            value ?? ""
          )
            .replace(/[^\x20-\x7E]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        };


        const escapePdfText = (
          value: string
        ): string => {

          return sanitizePdfText(
            value
          )
            .replace(/\\/g, "\\\\")
            .replace(/\(/g, "\\(")
            .replace(/\)/g, "\\)");
        };


        const textCommand = (
          value: string,
          x: number,
          yPos: number,
          size = 10,
          bold = false,
          color: PdfColor = TEXT
        ): string => {

          const font =
            bold
              ? "/F2"
              : "/F1";

          return [
            "BT",
            rgbFill(color),
            `${font} ${size} Tf`,
            `1 0 0 1 ${x.toFixed(
              2
            )} ${yPos.toFixed(
              2
            )} Tm`,
            `(${escapePdfText(
              value
            )}) Tj`,
            "ET",
          ].join("\n");
        };


        const lineCommand = (
          x1: number,
          y1: number,
          x2: number,
          y2: number,
          color: PdfColor = BORDER,
          width = 0.7
        ): string => {

          return [
            rgbStroke(color),
            `${width} w`,
            `${x1.toFixed(
              2
            )} ${y1.toFixed(
              2
            )} m`,
            `${x2.toFixed(
              2
            )} ${y2.toFixed(
              2
            )} l`,
            "S",
          ].join("\n");
        };


        const rectCommand = (
          x: number,
          yPos: number,
          width: number,
          height: number,
          fillColor?: PdfColor,
          strokeColor?: PdfColor,
          strokeWidth = 0.7
        ): string => {

          const parts: string[] = [];

          if (fillColor) {
            parts.push(
              rgbFill(
                fillColor
              )
            );
          }

          if (strokeColor) {
            parts.push(
              rgbStroke(
                strokeColor
              )
            );

            parts.push(
              `${strokeWidth} w`
            );
          }

          parts.push(
            `${x.toFixed(
              2
            )} ${yPos.toFixed(
              2
            )} ${width.toFixed(
              2
            )} ${height.toFixed(
              2
            )} re`
          );

          if (
            fillColor &&
            strokeColor
          ) {
            parts.push("B");
          } else if (fillColor) {
            parts.push("f");
          } else {
            parts.push("S");
          }

          return parts.join(
            "\n"
          );
        };


        const startNewPage = () => {

          if (
            commands.length >
            0
          ) {
            pages.push(
              commands
            );
          }

          commands = [];

          y =
            PAGE_HEIGHT -
            MARGIN;
        };


        const ensureSpace = (
          requiredHeight: number
        ) => {

          if (
            y -
              requiredHeight <
            MARGIN + 28
          ) {
            startNewPage();
          }
        };


        const wrapText = (
          value: string,
          size: number,
          maxWidth: number
        ): string[] => {

          const clean =
            sanitizePdfText(
              value
            );

          if (!clean) {
            return [""];
          }

          const maxChars =
            Math.max(
              12,
              Math.floor(
                maxWidth /
                  (size * 0.52)
              )
            );

          const words =
            clean.split(" ");

          const lines: string[] = [];

          let current = "";

          for (
            const word
            of words
          ) {

            const candidate =
              current
                ? `${current} ${word}`
                : word;

            if (
              candidate.length <=
              maxChars
            ) {
              current = candidate;
            } else {
              if (current) {
                lines.push(
                  current
                );
              }

              current = word;
            }
          }

          if (current) {
            lines.push(
              current
            );
          }

          return lines;
        };


        const valueWidthApprox = (
          value: string,
          size: number
        ) =>
          Math.min(
            CONTENT_WIDTH,
            sanitizePdfText(
              value
            ).length *
              size *
              0.50
          );


        const addPageHeader = (
          title = "EV Battery Health Report"
        ) => {

          commands.push(
            rectCommand(
              0,
              PAGE_HEIGHT - 106,
              PAGE_WIDTH,
              106,
              PURPLE_DARK
            )
          );

          commands.push(
            textCommand(
              "INTELLIGENT EV DECISION SUPPORT",
              MARGIN,
              PAGE_HEIGHT - 35,
              8,
              true,
              [
                0.84,
                0.82,
                0.96,
              ]
            )
          );

          commands.push(
            textCommand(
              title,
              MARGIN,
              PAGE_HEIGHT - 61,
              22,
              true,
              [
                1,
                1,
                1,
              ]
            )
          );

          commands.push(
            textCommand(
              "Adaptive battery health prediction and personalised battery-care guidance",
              MARGIN,
              PAGE_HEIGHT - 80,
              9,
              false,
              [
                0.90,
                0.89,
                0.98,
              ]
            )
          );

          commands.push(
            textCommand(
              sanitizePdfText(
                generatedAt
              ),
              MARGIN,
              PAGE_HEIGHT - 95,
              7.5,
              false,
              [
                0.82,
                0.81,
                0.93,
              ]
            )
          );

          y =
            PAGE_HEIGHT -
            130;
        };


        const addSectionTitle = (
          title: string,
          subtitle?: string
        ) => {

          ensureSpace(
            subtitle
              ? 42
              : 31
          );

          commands.push(
            rectCommand(
              MARGIN,
              y - 1,
              4,
              17,
              PURPLE
            )
          );

          commands.push(
            textCommand(
              title,
              MARGIN + 12,
              y + 2,
              13,
              true,
              TEXT
            )
          );

          y -= 17;

          if (subtitle) {
            const subtitleLines =
              wrapText(
                subtitle,
                8.2,
                CONTENT_WIDTH - 12
              );

            for (
              const line
              of subtitleLines
            ) {

              commands.push(
                textCommand(
                  line,
                  MARGIN + 12,
                  y,
                  8.2,
                  false,
                  MUTED
                )
              );

              y -= 11;
            }
          }

          y -= 7;
        };


        const addSummaryCard = (
          x: number,
          width: number,
          label: string,
          value: string,
          accent: PdfColor,
          background: PdfColor
        ) => {

          const cardHeight = 62;

          commands.push(
            rectCommand(
              x,
              y - cardHeight,
              width,
              cardHeight,
              background,
              BORDER,
              0.5
            )
          );

          commands.push(
            rectCommand(
              x,
              y - cardHeight,
              4,
              cardHeight,
              accent
            )
          );

          commands.push(
            textCommand(
              label.toUpperCase(),
              x + 12,
              y - 19,
              7.5,
              true,
              MUTED
            )
          );

          const valueLines =
            wrapText(
              value,
              14,
              width - 24
            );

          let valueY =
            y - 41;

          for (
            const line
            of valueLines.slice(
              0,
              2
            )
          ) {
            commands.push(
              textCommand(
                line,
                x + 12,
                valueY,
                14,
                true,
                accent
              )
            );

            valueY -= 16;
          }
        };


        const addInfoRow = (
          label: string,
          value: string,
          valueColor: PdfColor = TEXT
        ) => {

          const valueLines =
            wrapText(
              value,
              9.4,
              255
            );

          const rowHeight =
            Math.max(
              25,
              valueLines.length *
                12 +
                8
            );

          ensureSpace(
            rowHeight
          );

          commands.push(
            textCommand(
              label,
              MARGIN + 10,
              y,
              9.2,
              false,
              MUTED
            )
          );

          let valueY = y;

          for (
            const line
            of valueLines
          ) {

            const approx =
              valueWidthApprox(
                line,
                9.4
              );

            commands.push(
              textCommand(
                line,
                PAGE_WIDTH -
                  MARGIN -
                  10 -
                  approx,
                valueY,
                9.4,
                true,
                valueColor
              )
            );

            valueY -= 12;
          }

          y -=
            rowHeight -
            4;

          commands.push(
            lineCommand(
              MARGIN + 10,
              y,
              PAGE_WIDTH -
                MARGIN -
                10,
              y,
              [
                0.93,
                0.93,
                0.95,
              ],
              0.5
            )
          );

          y -= 8;
        };


        const addForecastCard = (
          x: number,
          width: number,
          horizon: string,
          sohValue: number | null,
          degradationValue:
            | number
            | null
            | undefined
        ) => {

          const cardHeight = 88;

          const sohText =
            sohValue === null
              ? "Pending"
              : `${sohValue.toFixed(
                  1
                )}%`;

          const degradationText =
            formatSohChange(
              degradationValue
            );

          const barValue =
            sohValue === null
              ? 0
              : Math.max(
                  0,
                  Math.min(
                    100,
                    sohValue
                  )
                );

          const healthAccent: PdfColor =
            sohValue === null
              ? PURPLE
              : sohValue >= 90
                ? GREEN
                : sohValue >= 80
                  ? AMBER
                  : RED;

          commands.push(
            rectCommand(
              x,
              y - cardHeight,
              width,
              cardHeight,
              [
                1,
                1,
                1,
              ],
              BORDER,
              0.6
            )
          );

          commands.push(
            textCommand(
              horizon,
              x + 12,
              y - 20,
              8,
              true,
              MUTED
            )
          );

          commands.push(
            textCommand(
              sohText,
              x + 12,
              y - 43,
              18,
              true,
              healthAccent
            )
          );

          commands.push(
            textCommand(
              `SOH change: ${degradationText}`,
              x + 12,
              y - 59,
              7.5,
              false,
              MUTED
            )
          );

          const barX =
            x + 12;

          const barY =
            y - 75;

          const barWidth =
            width - 24;

          commands.push(
            rectCommand(
              barX,
              barY,
              barWidth,
              5,
              [
                0.93,
                0.93,
                0.95,
              ]
            )
          );

          if (
            barValue >
            0
          ) {
            commands.push(
              rectCommand(
                barX,
                barY,
                barWidth *
                  (barValue / 100),
                5,
                healthAccent
              )
            );
          }
        };


        const getRecommendationPalette = (
          priority: Recommendation["priority"]
        ) => {

          if (
            priority ===
            "High"
          ) {
            return {
              accent: RED,
              background:
                RED_LIGHT,
            };
          }

          if (
            priority ===
            "Medium"
          ) {
            return {
              accent:
                AMBER,
              background:
                AMBER_LIGHT,
            };
          }

          return {
            accent:
              GREEN,
            background:
              GREEN_LIGHT,
          };
        };


        const addRecommendation = (
          item: Recommendation,
          index: number
        ) => {

          const palette =
            getRecommendationPalette(
              item.priority
            );

          const title =
            `${index + 1}. ${sanitizePdfText(
              item.title
            )}`;

          const titleLines =
            wrapText(
              title,
              10.5,
              CONTENT_WIDTH - 108
            );

          const messageLines =
            wrapText(
              item.message,
              8.7,
              CONTENT_WIDTH - 34
            );

          const boxHeight =
            26 +
            titleLines.length *
              13 +
            messageLines.length *
              11 +
            12;

          ensureSpace(
            boxHeight + 10
          );

          commands.push(
            rectCommand(
              MARGIN,
              y - boxHeight,
              CONTENT_WIDTH,
              boxHeight,
              palette.background,
              BORDER,
              0.5
            )
          );

          commands.push(
            rectCommand(
              MARGIN,
              y - boxHeight,
              5,
              boxHeight,
              palette.accent
            )
          );

          const badgeWidth = 55;

          commands.push(
            rectCommand(
              PAGE_WIDTH -
                MARGIN -
                badgeWidth -
                10,
              y - 23,
              badgeWidth,
              16,
              palette.accent
            )
          );

          commands.push(
            textCommand(
              item.priority.toUpperCase(),
              PAGE_WIDTH -
                MARGIN -
                badgeWidth -
                10 +
                10,
              y - 18,
              7,
              true,
              [
                1,
                1,
                1,
              ]
            )
          );

          let innerY =
            y - 19;

          for (
            const line
            of titleLines
          ) {

            commands.push(
              textCommand(
                line,
                MARGIN + 14,
                innerY,
                10.5,
                true,
                TEXT
              )
            );

            innerY -= 13;
          }

          innerY -= 7;

          for (
            const line
            of messageLines
          ) {

            commands.push(
              textCommand(
                line,
                MARGIN + 14,
                innerY,
                8.7,
                false,
                [
                  0.25,
                  0.25,
                  0.29,
                ]
              )
            );

            innerY -= 11;
          }

          y -=
            boxHeight +
            10;
        };


        // =================================================
        // PAGE 1
        // =================================================

        addPageHeader();


        // -------------------------------------------------
        // OVERVIEW CARDS
        // -------------------------------------------------

        const currentHealth =
          prediction.health_status ||
          healthLabel(
            currentSOH
          );

        const riskText =
          prediction.risk_level
            ? `${prediction.risk_level} risk`
            : "Not available";

        const twelveMonthSOH =
          toNumber(
            prediction.soh_12m
          );

        const currentAccent: PdfColor =
          currentSOH === null
            ? PURPLE
            : currentSOH >= 90
              ? GREEN
              : currentSOH >= 80
                ? AMBER
                : RED;

        const currentBg: PdfColor =
          currentSOH === null
            ? PURPLE_LIGHT
            : currentSOH >= 90
              ? GREEN_LIGHT
              : currentSOH >= 80
                ? AMBER_LIGHT
                : RED_LIGHT;

        const cardGap = 10;

        const cardWidth =
          (CONTENT_WIDTH -
            cardGap * 2) /
          3;

        addSummaryCard(
          MARGIN,
          cardWidth,
          "Current SOH",
          currentSOH === null
            ? "Unknown"
            : `${currentSOH.toFixed(
                1
              )}%`,
          currentAccent,
          currentBg
        );

        addSummaryCard(
          MARGIN +
            cardWidth +
            cardGap,
          cardWidth,
          "Current health",
          currentHealth,
          currentAccent,
          currentBg
        );

        const riskLower =
          String(
            prediction.risk_level ||
            ""
          ).toLowerCase();

        const riskAccent: PdfColor =
          riskLower.includes(
            "high"
          )
            ? RED
            : riskLower.includes(
                  "medium"
                ) ||
                riskLower.includes(
                  "moderate"
                )
              ? AMBER
              : riskLower.includes(
                    "low"
                  )
                ? GREEN
                : PURPLE;

        const riskBg: PdfColor =
          riskAccent === RED
            ? RED_LIGHT
            : riskAccent === AMBER
              ? AMBER_LIGHT
              : riskAccent === GREEN
                ? GREEN_LIGHT
                : PURPLE_LIGHT;

        addSummaryCard(
          MARGIN +
            (cardWidth +
              cardGap) *
              2,
          cardWidth,
          "12-month outlook",
          riskText,
          riskAccent,
          riskBg
        );

        y -= 82;


        // -------------------------------------------------
        // VEHICLE PROFILE
        // -------------------------------------------------

        addSectionTitle(
          "Vehicle & battery profile",
          "Key values submitted for this battery-health assessment."
        );

        commands.push(
          rectCommand(
            MARGIN,
            y - 120,
            CONTENT_WIDTH,
            120,
            SOFT_BG,
            BORDER,
            0.5
          )
        );

        const profileStartY = y - 16;

        let leftY =
          profileStartY;

        let rightY =
          profileStartY;

        const halfWidth =
          CONTENT_WIDTH /
          2 -
          20;

        const drawProfileItem = (
          x: number,
          currentY: number,
          label: string,
          value: string
        ) => {

          commands.push(
            textCommand(
              label.toUpperCase(),
              x,
              currentY,
              7,
              true,
              MUTED
            )
          );

          const lines =
            wrapText(
              value,
              9.5,
              halfWidth
            );

          let textY =
            currentY - 14;

          for (
            const line
            of lines.slice(
              0,
              2
            )
          ) {
            commands.push(
              textCommand(
                line,
                x,
                textY,
                9.5,
                true,
                TEXT
              )
            );

            textY -= 12;
          }

          return (
            currentY - 48
          );
        };


        leftY =
          drawProfileItem(
            MARGIN + 14,
            leftY,
            "Vehicle",
            form.vehicleModel ||
              "Not provided"
          );

        leftY =
          drawProfileItem(
            MARGIN + 14,
            leftY,
            "Battery age",
            form.batteryAgeMonths
              ? `${form.batteryAgeMonths} months`
              : "Not provided"
          );


        rightY =
          drawProfileItem(
            MARGIN +
              CONTENT_WIDTH /
                2 +
              8,
            rightY,
            "Average voltage",
            form.avgVoltage
              ? `${form.avgVoltage} V`
              : "Not provided"
          );

        rightY =
          drawProfileItem(
            MARGIN +
              CONTENT_WIDTH /
                2 +
              8,
            rightY,
            "Battery temperature",
            form.avgTemperature
              ? `${form.avgTemperature} C`
              : "Not provided"
          );

        y -= 138;


        // -------------------------------------------------
        // FORECAST
        // -------------------------------------------------

        addSectionTitle(
          "SOH forecast",
          "Machine-learning forecast of future battery State of Health."
        );

        const forecastGap = 10;

        const forecastWidth =
          (CONTENT_WIDTH -
            forecastGap * 2) /
          3;

        addForecastCard(
          MARGIN,
          forecastWidth,
          "AFTER 3 MONTHS",
          toNumber(
            prediction.soh_3m
          ),
          prediction.degradation_3m
        );

        addForecastCard(
          MARGIN +
            forecastWidth +
            forecastGap,
          forecastWidth,
          "AFTER 6 MONTHS",
          toNumber(
            prediction.soh_6m
          ),
          prediction.degradation_6m
        );

        addForecastCard(
          MARGIN +
            (forecastWidth +
              forecastGap) *
              2,
          forecastWidth,
          "AFTER 12 MONTHS",
          twelveMonthSOH,
          prediction.degradation_12m
        );

        y -= 108;


        // -------------------------------------------------
        // TECHNICAL INPUTS
        // -------------------------------------------------

        addSectionTitle(
          "Prediction inputs",
          "Operational values supplied to the forecasting workflow."
        );

        commands.push(
          rectCommand(
            MARGIN,
            y - 170,
            CONTENT_WIDTH,
            170,
            [
              1,
              1,
              1,
            ],
            BORDER,
            0.5
          )
        );

        y -= 16;

        addInfoRow(
          "Average charging current",
          form.avgCurrent
            ? `${form.avgCurrent} A`
            : "Not provided"
        );

        addInfoRow(
          "Average SOC change",
          form.avgSocChange
            ? `${form.avgSocChange}%`
            : "Not provided"
        );

        addInfoRow(
          "Average charging duration",
          form.avgChargeDuration
            ? `${form.avgChargeDuration} min`
            : "Not provided"
        );

        addInfoRow(
          "Charging sessions",
          form.chargingSessions
            ? `${form.chargingSessions} / week`
            : "Not provided"
        );

        y -= 7;


        // =================================================
        // PAGE 2 / NEXT PAGE AS NEEDED
        // =================================================

        ensureSpace(
          320
        );


        // -------------------------------------------------
        // USAGE PROFILE
        // -------------------------------------------------

        addSectionTitle(
          "Usage & charging profile",
          "Behavioural information used to tailor the battery-care recommendations."
        );

        const usageRows = [
          [
            "Average daily distance",
            form.avgDailyDistance ||
              "Not provided",
          ],
          [
            "Driving style",
            form.drivingStyle ||
              "Not provided",
          ],
          [
            "Charging frequency",
            form.chargingFrequency ||
              "Not provided",
          ],
          [
            "Fast charging usage",
            form.fastChargingUsage ||
              "Not provided",
          ],
          [
            "Charging habit",
            form.chargingHabit ||
              "Not provided",
          ],
          [
            "Temperature exposure",
            form.temperatureExposure ||
              "Not provided",
          ],
        ] as const;

        commands.push(
          rectCommand(
            MARGIN,
            y - 180,
            CONTENT_WIDTH,
            180,
            SOFT_BG,
            BORDER,
            0.5
          )
        );

        y -= 16;

        usageRows.forEach(
          (
            item
          ) => {
            addInfoRow(
              item[0],
              item[1]
            );
          }
        );

        y -= 10;


        // -------------------------------------------------
        // RECOMMENDATIONS
        // -------------------------------------------------

        addSectionTitle(
          "Personalised recommendations",
          "Recommended actions based on current battery health, forecast results and submitted charging behaviour."
        );

        if (
          recommendations.length >
          0
        ) {

          recommendations.forEach(
            (
              item,
              index
            ) => {

              addRecommendation(
                item,
                index
              );
            }
          );

        } else {

          ensureSpace(65);

          commands.push(
            rectCommand(
              MARGIN,
              y - 54,
              CONTENT_WIDTH,
              54,
              GREEN_LIGHT,
              BORDER,
              0.5
            )
          );

          commands.push(
            rectCommand(
              MARGIN,
              y - 54,
              5,
              54,
              GREEN
            )
          );

          commands.push(
            textCommand(
              "No additional battery-care alert",
              MARGIN + 14,
              y - 21,
              10,
              true,
              GREEN
            )
          );

          commands.push(
            textCommand(
              "Continue following the charging and driving practices recorded in this analysis.",
              MARGIN + 14,
              y - 38,
              8.5,
              false,
              TEXT
            )
          );

          y -= 68;
        }


        // -------------------------------------------------
        // DISCLAIMER
        // -------------------------------------------------

        ensureSpace(92);

        const disclaimer =
          "This forecast is a research decision-support estimate. It does not replace a manufacturer BMS diagnostic or professional EV service-centre inspection. For maintenance, warranty or safety decisions, confirm the battery condition with the vehicle manufacturer or a qualified EV technician.";

        const disclaimerLines =
          wrapText(
            disclaimer,
            8,
            CONTENT_WIDTH - 42
          );

        const noteHeight =
          34 +
          disclaimerLines.length *
            10;

        commands.push(
          rectCommand(
            MARGIN,
            y - noteHeight,
            CONTENT_WIDTH,
            noteHeight,
            PURPLE_LIGHT,
            [
              0.83,
              0.81,
              0.94,
            ],
            0.6
          )
        );

        commands.push(
          textCommand(
            "IMPORTANT",
            MARGIN + 14,
            y - 20,
            7,
            true,
            PURPLE
          )
        );

        let disclaimerY =
          y - 37;

        for (
          const line
          of disclaimerLines
        ) {

          commands.push(
            textCommand(
              line,
              MARGIN + 14,
              disclaimerY,
              8,
              false,
              TEXT
            )
          );

          disclaimerY -= 10;
        }

        y -=
          noteHeight +
          12;


        // Save the final active page.
        if (
          commands.length >
          0
        ) {
          pages.push(
            commands
          );
        }


        // -------------------------------------------------
        // PAGE DECORATION / FOOTER
        // -------------------------------------------------

        pages.forEach(
          (
            pageCommands,
            pageIndex
          ) => {

            // Small top brand marker on continuation pages.
            if (
              pageIndex >
              0
            ) {
              pageCommands.unshift(
                rectCommand(
                  0,
                  PAGE_HEIGHT - 14,
                  PAGE_WIDTH,
                  14,
                  PURPLE_DARK
                )
              );
            }

            pageCommands.push(
              lineCommand(
                MARGIN,
                33,
                PAGE_WIDTH -
                  MARGIN,
                33,
                [
                  0.86,
                  0.85,
                  0.92,
                ],
                0.5
              )
            );

            pageCommands.push(
              textCommand(
                "EV Battery Health Decision Support System",
                MARGIN,
                19,
                7.3,
                true,
                PURPLE_DARK
              )
            );

            const pageText =
              `Page ${pageIndex + 1} of ${pages.length}`;

            const pageTextWidth =
              valueWidthApprox(
                pageText,
                7.3
              );

            pageCommands.push(
              textCommand(
                pageText,
                PAGE_WIDTH -
                  MARGIN -
                  pageTextWidth,
                19,
                7.3,
                false,
                MUTED
              )
            );
          }
        );


        // =================================================
        // BUILD VALID PDF
        // =================================================

        const encoder =
          new TextEncoder();


        const byteLength = (
          value: string
        ) =>
          encoder.encode(
            value
          ).length;


        const objectBodies:
          Record<
            number,
            string
          > = {};


        const pageObjectNumbers:
          number[] = [];


        const contentObjectNumbers:
          number[] = [];


        let nextObject = 5;


        pages.forEach(
          () => {

            pageObjectNumbers.push(
              nextObject++
            );

            contentObjectNumbers.push(
              nextObject++
            );
          }
        );


        objectBodies[1] =
          "<< /Type /Catalog /Pages 2 0 R >>";


        objectBodies[3] =
          "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";


        objectBodies[4] =
          "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";


        const kids =
          pageObjectNumbers
            .map(
              (
                objectNumber
              ) =>
                `${objectNumber} 0 R`
            )
            .join(" ");


        objectBodies[2] =
          `<< /Type /Pages /Count ${pages.length} /Kids [${kids}] >>`;


        pages.forEach(
          (
            pageCommands,
            index
          ) => {

            const pageObject =
              pageObjectNumbers[
                index
              ];

            const contentObject =
              contentObjectNumbers[
                index
              ];

            const stream =
              pageCommands.join(
                "\n"
              );


            objectBodies[
              pageObject
            ] =
              `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObject} 0 R >>`;


            objectBodies[
              contentObject
            ] =
              `<< /Length ${byteLength(
                stream
              )} >>\nstream\n${stream}\nendstream`;
          }
        );


        const totalObjects =
          nextObject - 1;


        let pdf =
          "%PDF-1.4\n";


        const offsets:
          number[] =
            new Array(
              totalObjects + 1
            ).fill(0);


        for (
          let objectNumber = 1;
          objectNumber <=
          totalObjects;
          objectNumber++
        ) {

          offsets[
            objectNumber
          ] =
            byteLength(
              pdf
            );

          pdf +=
            `${objectNumber} 0 obj\n${objectBodies[
              objectNumber
            ]}\nendobj\n`;
        }


        const xrefOffset =
          byteLength(
            pdf
          );


        pdf +=
          `xref\n0 ${totalObjects + 1}\n`;


        pdf +=
          "0000000000 65535 f \n";


        for (
          let objectNumber = 1;
          objectNumber <=
          totalObjects;
          objectNumber++
        ) {

          pdf +=
            `${String(
              offsets[
                objectNumber
              ]
            ).padStart(
              10,
              "0"
            )} 00000 n \n`;
        }


        pdf +=
          `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;


        // -------------------------------------------------
        // DIRECT DOWNLOAD
        // -------------------------------------------------

        const blob =
          new Blob(
            [
              encoder.encode(
                pdf
              ),
            ],
            {
              type:
                "application/pdf",
            }
          );


        const url =
          URL.createObjectURL(
            blob
          );


        const anchor =
          document.createElement(
            "a"
          );


        const safeDate =
          new Date()
            .toISOString()
            .slice(
              0,
              10
            );


        anchor.href =
          url;

        anchor.download =
          `EV_Battery_Health_Report_${safeDate}.pdf`;


        document.body.appendChild(
          anchor
        );

        anchor.click();

        document.body.removeChild(
          anchor
        );


        setTimeout(
          () => {

            URL.revokeObjectURL(
              url
            );

          },
          1000
        );


        return;
      }


      const { uri } =
        await Print.printToFileAsync({
          html,
        });


      const sharingAvailable =
        await Sharing.isAvailableAsync();


      if (sharingAvailable) {

        await Sharing.shareAsync(
          uri,
          {
            mimeType: "application/pdf",
            dialogTitle: "Share battery health report",
          }
        );

      } else {

        Alert.alert(
          "Report created",
          `The PDF report was created successfully.\n${uri}`
        );
      }


    } catch (error) {

      console.error(
        "Report generation error:",
        error
      );

      Alert.alert(
        "Report error",
        "Unable to create the PDF report. Please try again."
      );

    } finally {

      setGenerating(false);
    }
  };


  return (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      showsVerticalScrollIndicator={false}
    >

      <Text
        style={[
          styles.tabTitle,
          { color: colors.textPrimary },
        ]}
      >
        Battery health report
      </Text>

      <Text
        style={[
          styles.tabSubtitle,
          { color: colors.textSecondary },
        ]}
      >
        Review your current battery condition, future SOH forecast,
        usage profile and personalised battery-care guidance.
      </Text>


      <Card colors={colors}>

        <Text
          style={[
            styles.cardTitle,
            {
              color: colors.textPrimary,
              marginBottom: 8,
            },
          ]}
        >
          Health summary
        </Text>

        <MetricRow
          label="Vehicle"
          value={form.vehicleModel || "Not provided"}
          colors={colors}
        />

        <View
          style={[
            styles.separator,
            { backgroundColor: colors.divider },
          ]}
        />

        <MetricRow
          label="Current SOH"
          value={
            currentSOH === null
              ? "Unknown"
              : `${currentSOH.toFixed(1)}%`
          }
          colors={colors}
        />

        <View
          style={[
            styles.separator,
            { backgroundColor: colors.divider },
          ]}
        />

        <MetricRow
          label="Current health"
          value={
            prediction?.health_status ||
            healthLabel(currentSOH)
          }
          colors={colors}
        />

        <View
          style={[
            styles.separator,
            { backgroundColor: colors.divider },
          ]}
        />

        <MetricRow
          label="12-month outlook"
          value={
            prediction?.risk_level
              ? `${prediction.risk_level} risk`
              : "Pending"
          }
          colors={colors}
        />

      </Card>


      <Card colors={colors}>

        <Text
          style={[
            styles.cardTitle,
            {
              color: colors.textPrimary,
              marginBottom: 8,
            },
          ]}
        >
          SOH forecast
        </Text>

        <MetricRow
          label="After 3 months"
          value={
            prediction?.soh_3m != null
              ? `${Number(prediction.soh_3m).toFixed(1)}%`
              : "Pending"
          }
          colors={colors}
        />

        <View
          style={[
            styles.separator,
            { backgroundColor: colors.divider },
          ]}
        />

        <MetricRow
          label="After 6 months"
          value={
            prediction?.soh_6m != null
              ? `${Number(prediction.soh_6m).toFixed(1)}%`
              : "Pending"
          }
          colors={colors}
        />

        <View
          style={[
            styles.separator,
            { backgroundColor: colors.divider },
          ]}
        />

        <MetricRow
          label="After 12 months"
          value={
            prediction?.soh_12m != null
              ? `${Number(prediction.soh_12m).toFixed(1)}%`
              : "Pending"
          }
          colors={colors}
        />

      </Card>


      <Card colors={colors}>

        <Text
          style={[
            styles.cardTitle,
            {
              color: colors.textPrimary,
              marginBottom: 8,
            },
          ]}
        >
          Predicted SOH change
        </Text>

        <MetricRow
          label="3-month change"
          value={formatSohChange(prediction?.degradation_3m)}
          colors={colors}
        />

        <View
          style={[
            styles.separator,
            { backgroundColor: colors.divider },
          ]}
        />

        <MetricRow
          label="6-month change"
          value={formatSohChange(prediction?.degradation_6m)}
          colors={colors}
        />

        <View
          style={[
            styles.separator,
            { backgroundColor: colors.divider },
          ]}
        />

        <MetricRow
          label="12-month change"
          value={formatSohChange(prediction?.degradation_12m)}
          colors={colors}
        />

      </Card>


      {recommendations.length > 0 && (

        <Card colors={colors}>

          <Text
            style={[
              styles.cardTitle,
              {
                color: colors.textPrimary,
                marginBottom: 8,
              },
            ]}
          >
            Top recommendations
          </Text>

          {recommendations
            .slice(0, 3)
            .map((item, index) => (

              <React.Fragment
                key={`${item.title}-${index}`}
              >

                {index > 0 && (
                  <View
                    style={[
                      styles.separator,
                      { backgroundColor: colors.divider },
                    ]}
                  />
                )}

                <Text
                  style={[
                    styles.cardTitle,
                    { color: colors.textPrimary },
                  ]}
                >
                  {item.title}
                </Text>

                <Text
                  style={[
                    styles.cardText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {item.message}
                </Text>

              </React.Fragment>
            ))}

        </Card>
      )}


      <Card colors={colors}>

        <View style={styles.infoRow}>

          <Ionicons
            name="information-circle-outline"
            size={19}
            color="#534AB7"
          />

          <Text
            style={[
              styles.cardText,
              {
                color: colors.textSecondary,
                flex: 1,
              },
            ]}
          >
            This forecast is intended to support day-to-day battery
            care. For maintenance, warranty, or safety decisions,
            confirm the battery condition with your vehicle
            manufacturer or a qualified EV service centre.
          </Text>

        </View>

      </Card>


      <TouchableOpacity
        style={[
          styles.downloadBtn,
          generating && { opacity: 0.6 },
        ]}
        activeOpacity={0.85}
        disabled={generating}
        onPress={handleDownload}
      >

        <Ionicons
          name={generating ? "hourglass-outline" : "document-text-outline"}
          size={16}
          color="#EEEDFE"
        />

        <Text style={styles.downloadText}>
          {generating ? "Generating report..." : "Generate PDF report"}
        </Text>

      </TouchableOpacity>

    </ScrollView>
  );
}

// =========================================================
// TABS
// =========================================================

const TABS = [

  {
    key:
      "dashboard",

    label:
      "Dashboard",

    icon:
      "grid-outline" as const,
  },

  {
    key:
      "insights",

    label:
      "Insights",

    icon:
      "bulb-outline" as const,
  },

  {
    key:
      "behavior",

    label:
      "Usage",

    icon:
      "bar-chart-outline" as const,
  },

  {
    key:
      "factors",

    label:
      "Battery data",

    icon:
      "options-outline" as const,
  },

  {
    key:
      "report",

    label:
      "Report",

    icon:
      "document-text-outline" as const,
  },

];


// =========================================================
// MAIN RESULT COMPONENT
// =========================================================

export default function Results() {

  const router =
    useRouter();


  const params =
    useLocalSearchParams();


  const {
    theme,
    colors,
    toggleTheme,
  } = useTheme();


  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "dashboard"
  );


  // =====================================================
  // FORM DATA
  // =====================================================

  const form =
    safeParse<BatteryFormData>(
      firstParam(
        params.formData
      ),
      {}
    );


  // =====================================================
  // BACKEND PREDICTION
  // =====================================================

  const parsedPrediction =
    safeParse<
      PredictionResponse | null
    >(
      firstParam(
        params.prediction
      ),
      null
    );


  const prediction =
    parsedPrediction &&
    Object.keys(
      parsedPrediction
    ).length > 0

      ? parsedPrediction
      : null;


  // =====================================================
  // CURRENT SOH
  // =====================================================

  const currentSOH =
    toNumber(
      prediction?.current_soh ??
      form.currentHealth
    );


  const activeLabel =
    TABS.find(
      (
        tab
      ) =>
        tab.key ===
        activeTab
    )?.label ||
    "Battery health";


  // =====================================================
  // RENDER CURRENT TAB
  // =====================================================

  const renderTab =
    () => {

      switch (
        activeTab
      ) {

        case "dashboard":

          return (
            <Dashboard
              currentSOH={
                currentSOH
              }

              prediction={
                prediction
              }

              colors={
                colors
              }
            />
          );


        case "insights":

          return (
            <Insights
              prediction={
                prediction
              }

              form={
                form
              }

              colors={
                colors
              }
            />
          );


        case "behavior":

          return (
            <Behavior
              form={
                form
              }

              colors={
                colors
              }
            />
          );


        case "factors":

          return (
            <Factors
              form={
                form
              }

              colors={
                colors
              }
            />
          );


        case "report":

          return (
            <Report
              form={
                form
              }

              currentSOH={
                currentSOH
              }

              prediction={
                prediction
              }

              colors={
                colors
              }
            />
          );


        default:

          return null;
      }
    };


  // =====================================================
  // UI
  // =====================================================

  return (
    <SafeAreaView
      style={[
        styles.safe,
        {
          backgroundColor:
            colors.card,
        },
      ]}
    >

      <StatusBar
        barStyle={
          colors.statusBar
        }

        backgroundColor={
          colors.card
        }
      />


      {/* ================================================= */}
      {/* TOP BAR */}
      {/* ================================================= */}

      <View
        style={[
          styles.topBar,
          {
            backgroundColor:
              colors.card,

            borderBottomColor:
              colors.border,
          },
        ]}
      >

        <TouchableOpacity
          style={[
            styles.iconBtn,
            {
              backgroundColor:
                colors.bg,

              borderColor:
                colors.border,
            },
          ]}

          onPress={
            () =>
              router.back()
          }
        >

          <Ionicons
            name="arrow-back-outline"
            size={18}
            color={
              colors.textSecondary
            }
          />

        </TouchableOpacity>


        <View
          style={{
            alignItems:
              "center",
          }}
        >

          <Text
            style={[
              styles.topTitle,
              {
                color:
                  colors.textPrimary,
              },
            ]}
          >
            {activeLabel}
          </Text>


          <Text
            style={[
              styles.topSubtitle,
              {
                color:
                  colors.textMuted,
              },
            ]}
          >

            {
              prediction
                ? "Battery analysis ready"
                : "Battery health"
            }

          </Text>

        </View>


        <TouchableOpacity
          style={[
            styles.iconBtn,
            {
              backgroundColor:
                colors.bg,

              borderColor:
                colors.border,
            },
          ]}

          onPress={
            toggleTheme
          }
        >

          <Ionicons
            name={
              theme === "light"
                ? "moon-outline"
                : "sunny-outline"
            }

            size={
              18
            }

            color={
              colors.textSecondary
            }
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
            backgroundColor:
              colors.card,

            borderBottomColor:
              colors.border,
          },
        ]}
      >

        {
          TABS.map(
            (
              tab
            ) => {

              const active =
                activeTab ===
                tab.key;


              return (

                <TouchableOpacity
                  key={
                    tab.key
                  }

                  style={
                    styles.tabItem
                  }

                  onPress={
                    () =>
                      setActiveTab(
                        tab.key
                      )
                  }

                  activeOpacity={
                    0.75
                  }
                >

                  <Ionicons
                    name={
                      tab.icon
                    }

                    size={
                      18
                    }

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
                        color:
                          active
                            ? "#534AB7"
                            : colors.textMuted,
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>


                  {
                    active && (

                      <View
                        style={
                          styles.tabIndicator
                        }
                      />

                    )
                  }

                </TouchableOpacity>
              );
            }
          )
        }

      </View>


      {/* ================================================= */}
      {/* CURRENT TAB */}
      {/* ================================================= */}

      <View
        style={{
          flex:
            1,

          backgroundColor:
            colors.bg,
        }}
      >

        {renderTab()}

      </View>


      {/* ================================================= */}
      {/* NEW PREDICTION BUTTON */}
      {/* ================================================= */}

      <TouchableOpacity
        style={
          styles.fab
        }

        onPress={
          () =>
            router.push(
              "/battery_health/input" as any
            )
        }

        activeOpacity={
          0.85
        }
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


// =========================================================
// STYLES
// =========================================================

const styles =
  StyleSheet.create({

    safe: {
      flex: 1,
    },


    topBar: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      paddingHorizontal:
        16,

      paddingVertical:
        10,

      borderBottomWidth:
        0.5,
    },


    iconBtn: {
      width:
        36,

      height:
        36,

      borderRadius:
        18,

      borderWidth:
        0.5,

      alignItems:
        "center",

      justifyContent:
        "center",
    },


    topTitle: {
      fontSize:
        15,

      fontWeight:
        "600",
    },


    topSubtitle: {
      fontSize:
        9.5,

      marginTop:
        1,
    },


    tabBar: {
      flexDirection:
        "row",

      borderBottomWidth:
        0.5,
    },


    tabItem: {
      flex:
        1,

      alignItems:
        "center",

      paddingVertical:
        9,

      position:
        "relative",
    },


    tabLabel: {
      fontSize:
        9.5,

      marginTop:
        2,
    },


    tabIndicator: {
      position:
        "absolute",

      bottom:
        0,

      width:
        28,

      height:
        2.5,

      borderRadius:
        2,

      backgroundColor:
        "#534AB7",
    },


    tabContent: {
      padding:
        14,

      paddingBottom:
        90,
    },


    tabTitle: {
      fontSize:
        18,

      fontWeight:
        "600",

      marginBottom:
        4,
    },


    tabSubtitle: {
      fontSize:
        12,

      lineHeight:
        18,

      marginBottom:
        14,
    },


    sectionHeading: {
      fontSize:
        14,

      fontWeight:
        "600",

      marginBottom:
        10,

      marginTop:
        4,
    },


    card: {
      borderWidth:
        0.5,

      borderRadius:
        14,

      padding:
        16,

      marginBottom:
        12,
    },


    cardHeader: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap:
        10,

      marginBottom:
        4,
    },


    cardTitle: {
      fontSize:
        13,

      fontWeight:
        "600",
    },


    cardText: {
      fontSize:
        11.5,

      lineHeight:
        18,

      marginTop:
        3,
    },


    purpleIcon: {
      width:
        30,

      height:
        30,

      borderRadius:
        8,

      backgroundColor:
        "#EEEDFE",

      alignItems:
        "center",

      justifyContent:
        "center",
    },


    infoRow: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap:
        10,
    },


    rowBetween: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      gap:
        10,
    },


    twoColumn: {
      flexDirection:
        "row",

      gap:
        10,
    },


    smallLabel: {
      fontSize:
        10.5,
    },


    bigMetric: {
      fontSize:
        18,

      fontWeight:
        "600",

      marginTop:
        5,
    },


    behaviorValue: {
      fontSize:
        15,

      fontWeight:
        "600",

      marginTop:
        3,
    },


    progressTrack: {
      height:
        6,

      borderRadius:
        4,

      overflow:
        "hidden",

      marginTop:
        6,
    },


    metricRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      gap:
        12,

      paddingVertical:
        4,
    },


    metricLabel: {
      fontSize:
        11.5,

      flex:
        1,
    },


    metricValue: {
      fontSize:
        12,

      fontWeight:
        "600",

      maxWidth:
        "58%",

      textAlign:
        "right",
    },


    separator: {
      height:
        0.5,

      marginVertical:
        8,
    },


    badge: {
      alignSelf:
        "flex-start",

      borderRadius:
        20,

      paddingHorizontal:
        8,

      paddingVertical:
        3,
    },


    badgeText: {
      fontSize:
        10,

      fontWeight:
        "600",
    },


    downloadBtn: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        8,

      backgroundColor:
        "#534AB7",

      borderRadius:
        30,

      paddingVertical:
        14,

      marginTop:
        4,
    },


    downloadText: {
      fontSize:
        14,

      fontWeight:
        "600",

      color:
        "#EEEDFE",
    },


    fab: {
      position:
        "absolute",

      bottom:
        24,

      right:
        20,

      width:
        52,

      height:
        52,

      borderRadius:
        26,

      backgroundColor:
        "#534AB7",

      alignItems:
        "center",

      justifyContent:
        "center",

      zIndex:
        99,

      elevation:
        6,
    },

  });