import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Modal,
  FlatList,
  Animated,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useTheme } from "../ThemeContext";

type FieldType = "numeric" | "select" | "health_range";

interface BaseField {
  label: string;
  key: string;
  type: FieldType;
  icon: keyof typeof Ionicons.glyphMap;
  helper?: string;
}

interface NumericField extends BaseField {
  type: "numeric";
  placeholder: string;
  min?: number;
  max?: number;
  suffix?: string;
  allowNegative?: boolean;
  isInteger?: boolean;
}

interface SelectField extends BaseField {
  type: "select";
  options: string[];
}

interface HealthRangeField extends BaseField {
  type: "health_range";
  placeholder: string;
  min: number;
  max: number;
}

type Field = NumericField | SelectField | HealthRangeField;

interface Section {
  title: string;
  description?: string;
  fields: Field[];
}

const getBackendBase = () => {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const host = window.location?.hostname || "localhost";
    const protocol = window.location?.protocol || "http:";
    return `${protocol}//${host}:8000`;
  }
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(":")[0];
    return `http://${ip}:8000`;
  }
  return "http://localhost:8000";
};

export function sanitizeNumericInput(
  rawText: string,
  allowNegative: boolean = false,
  isInteger: boolean = false
): string {
  if (!rawText) return "";

  // Normalize commas to decimal points, and typographic dashes to standard minus
  const text = rawText.replace(/,/g, ".").replace(/[—–]/g, "-");

  let sanitized = "";
  let hasDecimal = false;
  let hasMinus = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // Leading minus sign (only for negative-enabled fields, and only at index 0)
    if (char === "-" && allowNegative) {
      if (sanitized.length === 0 && !hasMinus) {
        sanitized += "-";
        hasMinus = true;
      }
    } else if (char === "." && !isInteger) {
      if (!hasDecimal) {
        sanitized += ".";
        hasDecimal = true;
      }
    } else if (char >= "0" && char <= "9") {
      sanitized += char;
    }
    // All other characters (letters, spaces, emojis, multiple minuses/dots, scientific notation 'e') are discarded
  }

  return sanitized;
}

export function isAcceptableNumericText(
  rawText: string,
  allowNegative: boolean = false,
  isInteger: boolean = false
): boolean {
  const text = rawText.trim().replace(/[—–]/g, "-");
  if (text === "") return true;

  // Ambiguous thousands separator (e.g. "42,000")
  if (/\d,\d{3}(\D|$)/.test(text)) return false;

  const normalized = text.replace(/,/g, ".");
  const pattern = isInteger
    ? allowNegative
      ? /^-?\d*$/
      : /^\d*$/
    : allowNegative
      ? /^-?\d*\.?\d*$/
      : /^\d*\.?\d*$/;

  return pattern.test(normalized);
}

const SECTIONS: Section[] = [
  {
    title: "Vehicle & battery profile",
    description: "Basic specifications, current SOH, age, and odometer reading.",
    fields: [
      {
        label: "Vehicle model",
        key: "vehicleModel",
        type: "select",
        icon: "car-outline",
        options: [
          "BAIC EU500",
          "Hyundai Kona Electric 64 kWh (NMC 622)",
          "Kia e-Niro / e-Soul 64 kWh (NMC)",
          "Jaguar I-PACE 400 (NMC 622)",
          "Mercedes-Benz EQC 400 (NMC 622)",
          "Nissan LEAF e+ 62 kWh (NMC 532)",
          "Other NCM/NMC EV",
        ],
        helper: "Vehicle model is profile information only and is not an ML feature.",
      },
      {
        label: "Current battery health (SOH)",
        key: "currentHealth",
        type: "health_range",
        icon: "heart-outline",
        placeholder: "e.g. 91",
        min: 60,
        max: 100,
        helper: "Current battery health percentage compared with its original capacity.",
      },
      {
        label: "Battery age",
        key: "batteryAgeYears",
        type: "numeric",
        icon: "calendar-outline",
        placeholder: "e.g. 2.5",
        min: 0,
        max: 10,
        suffix: "years",
        helper: "Enter your battery's age in years (e.g. 30 months = 2.5 years).",
      },
      {
        label: "Total odometer",
        key: "odometerKm",
        type: "numeric",
        icon: "speedometer-outline",
        placeholder: "e.g. 42000",
        min: 0,
        max: 1500000,
        suffix: "km",
        helper: "Total distance your vehicle has traveled.",
      },
      {
        label: "Battery nominal capacity",
        key: "batteryNominalCapacityKwh",
        type: "numeric",
        icon: "battery-charging-outline",
        placeholder: "e.g. 64",
        min: 10,
        max: 300,
        suffix: "kWh",
        helper:
          "Typical EV battery capacities:\n• Small EVs: approximately 21–40 kWh\n• Mid-range EVs: approximately 50–89 kWh\n• Large/long-range EVs: approximately 90–141 kWh\n(Examples only. Published specifications may vary between gross nominal and usable capacity.)",
      },
      {
        label: "Battery nominal voltage",
        key: "batteryNominalVoltageV",
        type: "numeric",
        icon: "flash-outline",
        placeholder: "e.g. 400",
        min: 100,
        max: 1000,
        suffix: "V",
        helper:
          "Typical nominal EV pack voltage:\n• 400V architecture: approximately 350–400 V\n• 800V architecture: approximately 650–800 V\nEnter the nominal pack voltage from your vehicle specifications (complete pack, not individual cells).",
      },
    ],
  },
  {
    title: "Weekly driving & charging",
    description: "Weekly usage patterns, charging frequency, SOC levels, and energy efficiency.",
    fields: [
      {
        label: "Weekly driving distance",
        key: "weeklyDrivingDistanceKm",
        type: "numeric",
        icon: "navigate-outline",
        placeholder: "e.g. 250",
        min: 0,
        max: 10000,
        suffix: "km",
        helper: "Total distance driven during a typical week.",
      },
      {
        label: "Weekly charging sessions",
        key: "weeklyChargeSessions",
        type: "numeric",
        icon: "repeat-outline",
        placeholder: "e.g. 4",
        min: 0,
        max: 15,
        suffix: "sessions",
        isInteger: true,
        helper: "Total number of AC and DC charging sessions per week.",
      },
      {
        label: "DC fast charging sessions",
        key: "dcFastChargingSessions",
        type: "numeric",
        icon: "flash",
        placeholder: "e.g. 1",
        min: 0,
        max: 15,
        suffix: "sessions",
        isInteger: true,
        helper: "Number of weekly charging sessions using DC fast charging.",
      },
      {
        label: "Weekly average SOC start",
        key: "weeklyAvgSocStartPct",
        type: "numeric",
        icon: "battery-dead-outline",
        placeholder: "e.g. 20",
        min: 0,
        max: 100,
        suffix: "%",
        helper: "Average battery percentage when charging begins.",
      },
      {
        label: "Weekly average SOC end",
        key: "weeklyAvgSocEndPct",
        type: "numeric",
        icon: "battery-full-outline",
        placeholder: "e.g. 80",
        min: 0,
        max: 100,
        suffix: "%",
        helper: "Average battery percentage when charging ends.",
      },
      {
        label: "Weekly energy consumption",
        key: "weeklyEnergyConsumptionKwhPer100km",
        type: "numeric",
        icon: "leaf-outline",
        placeholder: "e.g. 16.5",
        min: 5,
        max: 60,
        suffix: "kWh/100km",
        helper:
          "Typical EV efficiency is approximately 13–25 kWh/100 km. Actual consumption depends on vehicle model, driving speed, climate, terrain and driving conditions (reference range only).",
      },
      {
        label: "Weekly charging duration",
        key: "weeklyAvgChargeDurationMin",
        type: "numeric",
        icon: "time-outline",
        placeholder: "e.g. 45",
        min: 1,
        max: 1440,
        suffix: "min",
        helper: "Average duration of one charging session in minutes.",
      },
    ],
  },
  {
    title: "Battery measurements",
    description: "Live or recent BMS measurements for voltage, current, and thermal conditions.",
    fields: [
      {
        label: "Battery temperature",
        key: "batteryTemperatureC",
        type: "numeric",
        icon: "thermometer-outline",
        placeholder: "e.g. 28",
        min: 15,
        max: 30,
        suffix: "°C",
        allowNegative: true,
        helper: "Enter the actual battery pack temperature measured using your vehicle's BMS or OBD diagnostic system.",
      },
      {
        label: "Battery pack voltage",
        key: "batteryPackVoltageV",
        type: "numeric",
        icon: "pulse-outline",
        placeholder: "e.g. 395",
        min: 100,
        max: 1100,
        suffix: "V",
        helper:
          "Measured pack voltage from your BMS or OBD system. Approximate operating examples: 300–450 V for 400V-class systems and 600–900 V for 800V-class systems. Actual values depend on vehicle design and battery state of charge.",
      },
      {
        label: "Average charging current",
        key: "avgChargingCurrentA",
        type: "numeric",
        icon: "hardware-chip-outline",
        placeholder: "e.g. 32",
        min: 0,
        max: 1000,
        suffix: "A",
        helper: "Average charging current in amperes.",
      },
    ],
  },
  {
    title: "Driving mode",
    description: "Driving mode context for personalized recommendations.",
    fields: [
      {
        label: "Driving mode",
        key: "drivingMode",
        type: "select",
        icon: "car-sport-outline",
        options: ["Eco", "Normal", "Sport"],
        helper: "Vehicle operating mode used for personalized battery-care guidance.",
      },
    ],
  },
  {
    title: "Charging habits",
    description: "Routine charging habit for personalized battery care recommendations.",
    fields: [
      {
        label: "Charging habit",
        key: "chargingHabit",
        type: "select",
        icon: "battery-half-outline",
        options: [
          "Mostly 20-80% (if recommended by manufacturer)",
          "Follow manufacturer daily limit",
          "Often charge to 100%",
          "Often discharge below 20%",
          "Frequently near 0% or 100%",
        ],
        helper: "Your typical charging routine helps formulate customized degradation prevention tips.",
      },
    ],
  },
];

interface HealthRangeInputProps {
  value: string;
  colors: any;
  field: HealthRangeField;
  onChange: (value: string) => void;
}

function HealthRangeInput({ value, colors, field, onChange }: HealthRangeInputProps) {
  const numValue = Number(value);
  const hasNumber = value.trim() !== "" && !Number.isNaN(numValue) && value.trim() !== ".";
  const invalid = hasNumber && (numValue < field.min || numValue > field.max);
  const pct = hasNumber
    ? Math.min(Math.max((numValue - field.min) / (field.max - field.min), 0), 1)
    : 0;

  const barColor = numValue >= 90 ? "#22C55E" : numValue >= 80 ? "#EAB308" : "#EF4444";

  return (
    <View>
      <View
        style={[
          styles.input,
          styles.healthRow,
          {
            backgroundColor: colors.card,
            borderColor: invalid ? "#EF4444" : colors.border,
          },
        ]}
      >
        <TextInput
          style={{ flex: 1, fontSize: 14, color: colors.textPrimary }}
          placeholder={field.placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          value={value}
          onChangeText={(nextText) => {
            if (!isAcceptableNumericText(nextText, false, false)) return;
            onChange(sanitizeNumericInput(nextText, false, false));
          }}
          maxLength={6}
        />
        <Text style={{ fontSize: 13, color: colors.textMuted, marginLeft: 4 }}>%</Text>
        <View style={[styles.rangePill, { backgroundColor: colors.bg }]}>
          <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: "500" }}>
            {field.min}-{field.max}%
          </Text>
        </View>
      </View>

      {hasNumber && !invalid && (
        <View style={[styles.healthBarTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.healthBarFill,
              { width: `${pct * 100}%`, backgroundColor: barColor },
            ]}
          />
        </View>
      )}

      {invalid && (
        <Text style={styles.errorText}>
          Must be between {field.min}% and {field.max}%.
        </Text>
      )}

      {hasNumber && !invalid && numValue < 60 && (
        <View style={styles.criticalWarningBox}>
          <Ionicons name="warning-outline" size={16} color="#B91C1C" />
          <Text style={styles.criticalWarningText}>
            Critical battery health: SOH below 60%. Battery replacement evaluation is recommended. Prediction is disabled for this input.
          </Text>
        </View>
      )}
    </View>
  );
}

interface DropdownProps {
  value: string;
  placeholder: string;
  options: string[];
  label: string;
  colors: any;
  onChange: (value: string) => void;
}

function Dropdown({ value, placeholder, options, label, colors, onChange }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const openSheet = () => {
    setOpen(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setOpen(false));
  };

  const select = (item: string) => {
    onChange(item);
    closeSheet();
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.input,
          styles.dropdownTrigger,
          {
            backgroundColor: colors.card,
            borderColor: value ? "#534AB7" : colors.border,
            borderWidth: value ? 1 : 0.5,
          },
        ]}
        onPress={openSheet}
        activeOpacity={0.75}
      >
        <Text
          style={{
            color: value ? colors.textPrimary : colors.textMuted,
            fontSize: 14,
            flex: 1,
            fontWeight: value ? "500" : "400",
          }}
        >
          {value || placeholder}
        </Text>
        {value ? (
          <View style={styles.selectedDot} />
        ) : (
          <Ionicons name="chevron-expand-outline" size={15} color={colors.textMuted} />
        )}
      </TouchableOpacity>

      <Modal visible={open} transparent statusBarTranslucent onRequestClose={closeSheet}>
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeSheet} />
          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.card,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.sheetHandle} />
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>{label}</Text>
              <TouchableOpacity
                onPress={closeSheet}
                style={[styles.sheetClose, { backgroundColor: colors.bg }]}
              >
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item}
              contentContainerStyle={{ paddingVertical: 6 }}
              renderItem={({ item, index }) => {
                const selected = item === value;
                return (
                  <TouchableOpacity
                    style={[
                      styles.optionRow,
                      selected && { backgroundColor: "#EEEDFEaa" },
                    ]}
                    onPress={() => select(item)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.indexBadge,
                        { backgroundColor: selected ? "#534AB7" : colors.bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.indexText,
                          { color: selected ? "#fff" : colors.textMuted },
                        ]}
                      >
                        {index + 1}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.optionText,
                        {
                          color: selected ? "#534AB7" : colors.textPrimary,
                          fontWeight: selected ? "600" : "400",
                        },
                      ]}
                    >
                      {item}
                    </Text>

                    {selected && (
                      <View style={styles.checkCircle}>
                        <Ionicons name="checkmark" size={11} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => (
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
              )}
            />
            <View style={{ height: Platform.OS === "ios" ? 28 : 16 }} />
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}

export const calculateFastChargingFraction = (
  totalSessions: number,
  dcFastSessions: number
): number => {
  if (
    !Number.isInteger(totalSessions) ||
    !Number.isInteger(dcFastSessions) ||
    totalSessions < 0 ||
    dcFastSessions < 0 ||
    dcFastSessions > totalSessions
  ) {
    throw new Error("Invalid charging session values");
  }

  if (totalSessions === 0) {
    return 0;
  }

  return dcFastSessions / totalSessions;
};

function getNumericError(field: NumericField, value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;

  // Intermediate states during typing
  if (trimmed === "-" || trimmed === ".") {
    return "Please enter a valid number.";
  }

  const num = Number(trimmed);

  if (!Number.isFinite(num) || Number.isNaN(num)) {
    return "Please enter numbers only.";
  }

  if (field.isInteger) {
    if (!Number.isInteger(num) || num < 0) {
      return "Must be a non-negative whole number (integer).";
    }
  }

  if (field.key === "batteryAgeYears") {
    if (num < 0 || num > 10) {
      return "Battery age must be between 0 and 10 years.";
    }
  }

  if (field.key === "batteryTemperatureC") {
    if (
      (field.min !== undefined && num < field.min) ||
      (field.max !== undefined && num > field.max)
    ) {
      return `Battery temperature must be between ${field.min}°C and ${field.max}°C.`;
    }
  }

  if (field.min !== undefined && num < field.min) {
    return `Minimum value is ${field.min}${field.suffix ? ` ${field.suffix}` : ""}.`;
  }

  if (field.max !== undefined && num > field.max) {
    return `Maximum value is ${field.max}${field.suffix ? ` ${field.suffix}` : ""}.`;
  }

  return null;
}

function getHealthError(
  field: HealthRangeField,
  value: string
): string | null {
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }

  if (trimmed === ".") {
    return "Please enter a valid SOH percentage.";
  }

  const number = Number(trimmed);

  if (!Number.isFinite(number) || Number.isNaN(number)) {
    return "Please enter numbers only.";
  }

  if (number < field.min || number > field.max) {
    return `SOH must be between ${field.min}% and ${field.max}%.`;
  }

  return null;
}

export default function BatteryInput() {
  const router = useRouter();
  const { theme, colors, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const [form, setForm] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const allFields = useMemo(
    () => SECTIONS.flatMap((section) => section.fields),
    []
  );

  const totalFields = allFields.length;

  const filledFields = allFields.filter(
    (field) => (form[field.key] || "").trim() !== ""
  ).length;

  const progress = totalFields === 0 ? 0 : filledFields / totalFields;

  // Cross-field validation checks
  const sessionComparisonError = useMemo(() => {
    const totalRaw = (form.weeklyChargeSessions || "").trim();
    const dcRaw = (form.dcFastChargingSessions || "").trim();
    if (totalRaw !== "" && dcRaw !== "") {
      const totalNum = Number(totalRaw);
      const dcNum = Number(dcRaw);
      if (Number.isFinite(totalNum) && Number.isFinite(dcNum)) {
        if (dcNum > totalNum) {
          return "DC fast charging sessions cannot exceed total charging sessions.";
        }
        if (totalNum === 0 && dcNum > 0) {
          return "DC fast charging sessions must be 0 if total weekly charging sessions is 0.";
        }
      }
    }
    return null;
  }, [form.weeklyChargeSessions, form.dcFastChargingSessions]);

  const socComparisonError = useMemo(() => {
    const totalRaw = (form.weeklyChargeSessions || "").trim();
    const startRaw = (form.weeklyAvgSocStartPct || "").trim();
    const endRaw = (form.weeklyAvgSocEndPct || "").trim();
    const sessions = Number(totalRaw || 0);

    if (startRaw !== "" && endRaw !== "" && sessions > 0) {
      const startNum = Number(startRaw);
      const endNum = Number(endRaw);
      if (Number.isFinite(startNum) && Number.isFinite(endNum)) {
        if (endNum <= startNum) {
          return "Weekly Average SOC at End of Charge must be greater than Weekly Average SOC at Start of Charge when charging sessions are recorded.";
        }
      }
    }
    return null;
  }, [form.weeklyChargeSessions, form.weeklyAvgSocStartPct, form.weeklyAvgSocEndPct]);

  const formIsValid = useMemo(() => {
    if (filledFields !== totalFields) {
      return false;
    }

    for (const field of allFields) {
      const value = (form[field.key] || "").trim();

      if (!value) {
        return false;
      }

      if (field.type === "numeric") {
        if (getNumericError(field as NumericField, value)) {
          return false;
        }
      }

      if (field.type === "health_range") {
        if (getHealthError(field as HealthRangeField, value)) {
          return false;
        }

        if (field.key === "currentHealth" && Number(value) < 60) {
          return false;
        }
      }
    }

    if (sessionComparisonError) {
      return false;
    }

    if (socComparisonError) {
      return false;
    }

    return true;
  }, [allFields, filledFields, form, totalFields, sessionComparisonError, socComparisonError]);

  const handleChange = (key: string, value: string) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const validateForm = (): string | null => {
    for (const field of allFields) {
      const value = (form[field.key] || "").trim();
      if (!value) return `Please complete "${field.label}".`;

      if (field.type === "numeric") {
        const error = getNumericError(field as NumericField, value);
        if (error) return `${field.label}: ${error}`;
      }

      if (field.type === "health_range") {
        const error = getHealthError(field as HealthRangeField, value);
        if (error) {
          return `${field.label}: ${error}`;
        }
        if (field.key === "currentHealth" && Number(value) < 60) {
          return "Current battery SOH is below 60%. Battery replacement evaluation is recommended, and ML prediction is disabled for this input.";
        }
      }
    }

    if (sessionComparisonError) {
      return sessionComparisonError;
    }

    if (socComparisonError) {
      return socComparisonError;
    }

    return null;
  };

  const handleGenerate = async () => {
    const validationError = validateForm();

    if (validationError) {
      Alert.alert("Check your inputs", validationError);
      return;
    }

    setSubmitting(true);
    try {
      const totalSessions = Number(form.weeklyChargeSessions);
      const dcFastSessions = Number(form.dcFastChargingSessions);
      const fastChargingFraction = calculateFastChargingFraction(
        totalSessions,
        dcFastSessions
      );

      const batteryAgeYears = Number(form.batteryAgeYears);

      const requestData = {
        soh_estimated_pct: Number(form.currentHealth),
        battery_age_years: batteryAgeYears,
        odometer_km: Number(form.odometerKm),
        battery_nominal_capacity_kwh: Number(form.batteryNominalCapacityKwh),
        weekly_driving_distance_km: Number(form.weeklyDrivingDistanceKm),
        weekly_charge_sessions: totalSessions,
        weekly_fast_charge_fraction: fastChargingFraction,
        weekly_avg_soc_start_pct: Number(form.weeklyAvgSocStartPct),
        weekly_avg_soc_end_pct: Number(form.weeklyAvgSocEndPct),
        weekly_energy_consumption_kwh_per_100km: Number(form.weeklyEnergyConsumptionKwhPer100km),
        weekly_avg_charge_duration_min: Number(form.weeklyAvgChargeDurationMin),
        battery_temperature_c: Number(form.batteryTemperatureC),
        battery_pack_voltage_v: Number(form.batteryPackVoltageV),
        battery_nominal_voltage_v: Number(form.batteryNominalVoltageV),
        avg_charging_current_a: Number(form.avgChargingCurrentA),

        vehicle_model: form.vehicleModel,
        battery_age_months: batteryAgeYears * 12.0,
        current_soh: Number(form.currentHealth),
        driving_mode: form.drivingMode,
        driving_style: form.drivingMode,
        charging_habit: form.chargingHabit,
      };

      console.log("Sending prediction request:", requestData);

      const apiUrl = `${getBackendBase()}/api/battery/predict`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      console.log("Backend prediction response:", result);

      if (!response.ok) {
        Alert.alert(
          "Prediction Error",
          result.detail || "Unable to generate battery prediction."
        );
        return;
      }

      if (result.status !== "success") {
        Alert.alert(
          "Prediction Error",
          result.message || "Prediction failed."
        );
        return;
      }

      const weeklyDist = Number(form.weeklyDrivingDistanceKm);
      const weeklyCons = Number(form.weeklyEnergyConsumptionKwhPer100km);
      const estimatedWeeklyEnergyKwh =
        Number.isFinite(weeklyDist) && weeklyDist > 0 && Number.isFinite(weeklyCons) && weeklyCons > 0
          ? ((weeklyDist * weeklyCons) / 100).toFixed(1)
          : undefined;

      router.push({
        pathname: "/battery_health/result" as any,
        params: {
          formData: JSON.stringify({
            ...form,
            drivingStyle: form.drivingMode,
            weeklyFastChargeFraction: (fastChargingFraction * 100).toFixed(0),
            dcFastChargingSessions: form.dcFastChargingSessions,
            estimatedWeeklyEnergyKwh,
          }),
          prediction: JSON.stringify(result),
        },
      });
    } catch (error) {
      console.error("Connection error:", error);
      Alert.alert("Connection Error", "Cannot connect to the prediction backend. Please ensure the backend is running on port 8000.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={[
                styles.iconBtn,
                { backgroundColor: colors.iconBtn, borderColor: colors.border },
              ]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Battery data input
            </Text>

            <TouchableOpacity
              style={[
                styles.iconBtn,
                { backgroundColor: colors.iconBtn, borderColor: colors.border },
              ]}
              onPress={toggleTheme}
            >
              <Ionicons
                name={theme === "light" ? "moon-outline" : "sunny-outline"}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
            {filledFields} / {totalFields} fields completed
          </Text>

          {/* Supported Battery Chemistry Notice */}
          <View
            style={[
              styles.nmcNoticeBox,
              {
                backgroundColor: isDark ? "#1e293b" : "#F0F9FF",
                borderColor: isDark ? "#334155" : "#BAE6FD",
              },
            ]}
          >
            <View style={styles.nmcNoticeHeader}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={isDark ? "#38bdf8" : "#0284c7"}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.nmcNoticeTitle,
                  { color: isDark ? "#38bdf8" : "#0369a1" },
                ]}
              >
                Supported Battery Chemistry: NMC (NCM) Lithium-ion
              </Text>
            </View>
            <Text
              style={[
                styles.nmcNoticeDesc,
                { color: isDark ? "#94a3b8" : "#475569" },
              ]}
            >
              This battery health prediction system is designed for electric vehicles equipped with Nickel Manganese Cobalt (NMC/NCM) lithium-ion batteries. Predictions are not validated for other battery chemistries such as LFP.
            </Text>
          </View>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter recent battery measurements and your charging/driving behaviour. Technical
            values can come from a BMS/OBD report or a recent charging summary.
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.form}
            keyboardShouldPersistTaps="handled"
          >
            {SECTIONS.map((section) => (
              <View key={section.title}>
                <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                    {section.title.toUpperCase()}
                  </Text>
                  <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
                    {section.fields.filter((field) => !!form[field.key]).length}/
                    {section.fields.length}
                  </Text>
                </View>

                {!!section.description && (
                  <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                    {section.description}
                  </Text>
                )}

                {section.fields.map((field) => {
                  const value = form[field.key] || "";
                  const numericError =
                    field.type === "numeric"
                      ? getNumericError(field as NumericField, value)
                      : null;

                  const isDcFastField = field.key === "dcFastChargingSessions";
                  const isEndSocField = field.key === "weeklyAvgSocEndPct";

                  let calculatedPercentageText: string | null = null;
                  if (isDcFastField && !sessionComparisonError) {
                    const totalRaw = (form.weeklyChargeSessions || "").trim();
                    const dcRaw = value.trim();
                    if (totalRaw !== "" && dcRaw !== "") {
                      const totalNum = Number(totalRaw);
                      const dcNum = Number(dcRaw);
                      if (
                        Number.isInteger(totalNum) &&
                        Number.isInteger(dcNum) &&
                        totalNum >= 0 &&
                        dcNum >= 0 &&
                        dcNum <= totalNum
                      ) {
                        try {
                          const fraction = calculateFastChargingFraction(totalNum, dcNum);
                          calculatedPercentageText = `${(fraction * 100).toFixed(0)}%`;
                        } catch {
                          // ignore
                        }
                      }
                    }
                  }

                  const hasError =
                    !!numericError ||
                    (isDcFastField && !!sessionComparisonError) ||
                    (isEndSocField && !!socComparisonError);

                  return (
                    <View key={field.key} style={styles.fieldGroup}>
                      <View style={styles.labelRow}>
                        <Ionicons name={field.icon} size={14} color={colors.textSecondary} />
                        <Text style={[styles.label, { color: colors.textPrimary }]}>
                          {field.label}
                        </Text>
                        <View
                          style={[
                            styles.badge,
                            field.type === "select"
                              ? { backgroundColor: "#EEEDFE" }
                              : field.type === "health_range"
                                ? { backgroundColor: "#DCFCE7" }
                                : {
                                  backgroundColor: colors.card,
                                  borderWidth: 0.5,
                                  borderColor: colors.border,
                                },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              {
                                color:
                                  field.type === "select"
                                    ? "#534AB7"
                                    : field.type === "health_range"
                                      ? "#16A34A"
                                      : colors.textMuted,
                              },
                            ]}
                          >
                            {field.type === "select"
                              ? "select"
                              : field.type === "health_range"
                                ? "SOH %"
                                : "numeric"}
                          </Text>
                        </View>
                      </View>

                      {field.type === "numeric" ? (
                        <View>
                          <View
                            style={[
                              styles.input,
                              styles.numericRow,
                              {
                                backgroundColor: colors.card,
                                borderColor: hasError ? "#EF4444" : colors.border,
                              },
                            ]}
                          >
                            <TextInput
                              style={{
                                flex: 1,
                                fontSize: 14,
                                color: colors.textPrimary,
                              }}
                              placeholder={(field as NumericField).placeholder}
                              placeholderTextColor={colors.textMuted}
                              keyboardType={
                                (field as NumericField).allowNegative
                                  ? "numbers-and-punctuation"
                                  : "decimal-pad"
                              }
                              value={value}
                              onChangeText={(nextText) => {
                                const numField = field as NumericField;
                                if (
                                  !isAcceptableNumericText(
                                    nextText,
                                    !!numField.allowNegative,
                                    !!numField.isInteger
                                  )
                                ) {
                                  return;
                                }
                                const sanitized = sanitizeNumericInput(
                                  nextText,
                                  !!numField.allowNegative,
                                  !!numField.isInteger
                                );
                                handleChange(field.key, sanitized);
                              }}
                              maxLength={10}
                            />

                            {!!(field as NumericField).suffix && (
                              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                                {(field as NumericField).suffix}
                              </Text>
                            )}
                          </View>

                          {!!numericError && (
                            <Text style={styles.errorText}>{numericError}</Text>
                          )}

                          {isDcFastField && !numericError && !!sessionComparisonError && (
                            <Text style={styles.errorText}>{sessionComparisonError}</Text>
                          )}

                          {isEndSocField && !numericError && !!socComparisonError && (
                            <Text style={styles.errorText}>{socComparisonError}</Text>
                          )}

                          {!hasError &&
                            ((field as NumericField).min !== undefined ||
                              (field as NumericField).max !== undefined) && (
                              <Text
                                style={[
                                  styles.validationHint,
                                  { color: colors.textMuted },
                                ]}
                              >
                                Allowed range: {(field as NumericField).min ?? "no minimum"}
                                {" - "}
                                {(field as NumericField).max ?? "no maximum"}
                                {(field as NumericField).suffix
                                  ? ` ${(field as NumericField).suffix}`
                                  : ""}
                              </Text>
                            )}



                          {/* Read-only automatic DC Fast Charge Percentage Badge */}
                          {isDcFastField &&
                            !hasError &&
                            calculatedPercentageText !== null && (
                              <View
                                style={[
                                  styles.calculatedContainer,
                                  {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border,
                                  },
                                ]}
                              >
                                <View style={styles.calculatedLeft}>
                                  <Ionicons
                                    name="flash-outline"
                                    size={15}
                                    color="#534AB7"
                                    style={{ marginRight: 6 }}
                                  />
                                  <Text
                                    style={[
                                      styles.calculatedLabel,
                                      { color: colors.textSecondary },
                                    ]}
                                  >
                                    Fast Charging Usage:
                                  </Text>
                                </View>
                                <View style={styles.calculatedBadge}>
                                  <Text style={styles.calculatedBadgeText}>
                                    {calculatedPercentageText}
                                  </Text>
                                </View>
                              </View>
                            )}
                        </View>
                      ) : field.type === "health_range" ? (
                        <HealthRangeInput
                          value={value}
                          colors={colors}
                          field={field as HealthRangeField}
                          onChange={(nextValue) => handleChange(field.key, nextValue)}
                        />
                      ) : (
                        <Dropdown
                          value={value}
                          placeholder={`Select ${field.label.toLowerCase()}`}
                          label={field.label}
                          options={(field as SelectField).options}
                          colors={colors}
                          onChange={(nextValue) => handleChange(field.key, nextValue)}
                        />
                      )}

                      {!!field.helper && (
                        <Text style={[styles.helperText, { color: colors.textMuted }]}>
                          {field.helper}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}

            <TouchableOpacity
              style={[
                styles.ctaBtn,
                {
                  opacity: submitting ? 0.6 : formIsValid ? 1 : 0.85,
                },
              ]}
              onPress={handleGenerate}
              activeOpacity={0.85}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#EEEDFE" />
              ) : (
                <>
                  <Ionicons name="analytics-outline" size={18} color="#EEEDFE" />
                  <Text style={styles.ctaText}>Continue to analysis</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.footerNote, { color: colors.textMuted }]}>
              The 3-, 6- and 12-month forecast values come from the backend ML models.
              Weekly charging sessions and DC fast charging sessions are entered per week. The fast charging fraction is calculated automatically and sent as a decimal fraction to the backend.
            </Text>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "600" },
  progressTrack: {
    height: 3,
    borderRadius: 99,
    marginBottom: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 99,
    backgroundColor: "#534AB7",
  },
  progressLabel: { fontSize: 11, marginBottom: 12, textAlign: "right" },
  subtitle: { fontSize: 13, lineHeight: 20, marginBottom: 20 },
  form: { flex: 1 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
  },
  sectionLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.8 },
  sectionCount: { fontSize: 10, fontWeight: "500" },
  sectionDescription: { fontSize: 11, lineHeight: 17, marginBottom: 14 },
  fieldGroup: { marginBottom: 16 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 7,
  },
  label: { fontSize: 13, fontWeight: "500", flex: 1 },
  badge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  badgeText: { fontSize: 10, fontWeight: "500" },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    borderWidth: 0.5,
  },
  numericRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dropdownTrigger: { flexDirection: "row", alignItems: "center" },
  selectedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#534AB7",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 24,
    maxHeight: "75%",
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 99,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
  },
  sheetTitle: { fontSize: 14, fontWeight: "600", letterSpacing: 0.1 },
  sheetClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  indexBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  indexText: { fontSize: 10, fontWeight: "600" },
  optionText: { fontSize: 14, flex: 1 },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#534AB7",
    alignItems: "center",
    justifyContent: "center",
  },
  separator: { height: 0.5 },
  healthRow: { flexDirection: "row", alignItems: "center" },
  rangePill: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginLeft: 8,
  },
  healthBarTrack: {
    height: 5,
    borderRadius: 99,
    marginTop: 6,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
  },
  healthBarFill: { height: "100%", borderRadius: 99 },
  healthBarLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 8,
  },
  criticalWarningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 0.5,
    borderColor: "#FCA5A5",
  },
  criticalWarningText: {
    fontSize: 12,
    color: "#B91C1C",
    flex: 1,
    lineHeight: 16,
  },
  contextualBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 0.5,
  },
  contextualBadgeText: {
    fontSize: 11,
    fontWeight: "500",
    flex: 1,
  },
  nmcNoticeBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginTop: 6,
    marginBottom: 8,
  },
  nmcNoticeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  nmcNoticeTitle: {
    fontSize: 12,
    fontWeight: "600",
  },
  nmcNoticeDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  validationHint: {
    fontSize: 12,
    lineHeight: 15,
    marginTop: 5,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
  },
  ctaBtn: {
    marginTop: 10,
    backgroundColor: "#534AB7",
    borderRadius: 30,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: {
    color: "#EEEDFE",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  calculatedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  calculatedLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  calculatedLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  calculatedBadge: {
    backgroundColor: "#EEEDFE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  calculatedBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#534AB7",
  },
  footerNote: {
    textAlign: "center",
    fontSize: 10.5,
    lineHeight: 16,
    marginTop: 12,
    paddingHorizontal: 10,
  },
});