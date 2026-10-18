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
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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


const SECTIONS: Section[] = [
  {
    title: "Vehicle profile",
    description: "Basic information about the EV and its current battery condition.",
    fields: [
      {
        label: "Vehicle model",
        key: "vehicleModel",
        type: "select",
        icon: "car-outline",
        options: [
          "BAIC EU500 / research dataset platform",
          "Hyundai Kona Electric 64 kWh (NMC 622)",
          "Kia e-Niro / e-Soul 64 kWh (NMC)",
          "Jaguar I-PACE 400 (NMC 622)",
          "Mercedes-Benz EQC 400 (NMC 622)",
          "Nissan LEAF e+ 62 kWh (NMC 532)",
          "Other NCM/NMC EV",
        ],
        helper: "Vehicle model is profile information only and is not an ML feature. Battery chemistry can vary by model year/market, so verify the exact vehicle variant when needed.",
      },
      {
        label: "Battery age (months)",
        key: "batteryAgeMonths",
        type: "numeric",
        icon: "calendar-outline",
        placeholder: "e.g. 40",
        min: 0,
        max: 240,
        suffix: "months",
        helper: "At 96 months (8 years) or more, the app will recommend a professional battery inspection and replacement evaluation. Battery age alone does not prove failure.",
      },
      {
        label: "Current battery health (SOH)",
        key: "currentHealth",
        type: "health_range",
        icon: "heart-outline",
        placeholder: "e.g. 91",
        min: 60,
        max: 100,
        helper: "Allowed range: 60-100%. If SOH is below 60%, prediction is blocked and battery replacement evaluation is recommended.",
      },
    ],
  },
  {
    title: "Battery prediction data",
    description:
      "Use recent charging/BMS values. These fields are prepared to match the features used by the forecasting backend.",
    fields: [
      {
        label: "Average pack voltage",
        key: "avgVoltage",
        type: "numeric",
        icon: "flash-outline",
        placeholder: "e.g. 350",
        min: 100,
        max: 1000,
        suffix: "V",
      },
      {
        label: "Average charging current magnitude",
        key: "avgCurrent",
        type: "numeric",
        icon: "pulse-outline",
        placeholder: "e.g. 70",
        min: 0,
        max: 1000,
        suffix: "A",
        helper: "Enter the positive magnitude. The backend will apply the same convention used during model training.",
      },
      {
        label: "Average battery temperature",
        key: "avgTemperature",
        type: "numeric",
        icon: "thermometer-outline",
        placeholder: "e.g. 34",
        min: -20,
        max: 80,
        suffix: "°C",
      },
      {
        label: "Average SOC change per charge",
        key: "avgSocChange",
        type: "numeric",
        icon: "battery-half-outline",
        placeholder: "e.g. 45",
        min: 1,
        max: 100,
        suffix: "%",
      },
      {
        label: "Average charging duration",
        key: "avgChargeDuration",
        type: "numeric",
        icon: "time-outline",
        placeholder: "e.g. 55",
        min: 1,
        max: 1000,
        suffix: "min",
      },
      {
        label: "Average charging sessions per week",
        key: "chargingSessions",
        type: "numeric",
        icon: "repeat-outline",
        placeholder: "e.g. 7",
        min: 1,
        max: 70,
        suffix: "/week",
        helper:
          "Enter the average number of charging sessions per week. Before prediction, the frontend divides this value by 7 so the model receives average charging sessions per day.",
      },
    ],
  },
  {
    title: "Driving behaviour",
    description: "Context for the battery report. Core battery-care recommendations are driven mainly by SOH, battery age, charging habits, fast-charging use and temperature exposure.",
    fields: [
      {
        label: "Average daily distance",
        key: "avgDailyDistance",
        type: "select",
        icon: "navigate-outline",
        options: ["<20 km", "20-50 km", "50-100 km", ">100 km"],
      },
      {
        label: "Driving style",
        key: "drivingStyle",
        type: "select",
        icon: "car-sport-outline",
        options: ["Smooth", "Normal", "Aggressive"],
      },
    ],
  },
  {
    title: "Charging habits",
    description: "Used by the recommendation engine, not as a substitute for ML training features.",
    fields: [
      {
        label: "Charging frequency",
        key: "chargingFrequency",
        type: "select",
        icon: "flash-outline",
        options: ["1-2 times/week", "3-5 times/week", "6-9 times/week", "Daily / as needed"],
      },
      {
        label: "Fast charging usage",
        key: "fastChargingUsage",
        type: "select",
        icon: "thunderstorm-outline",
        options: ["Never", "Rarely", "Sometimes", "Frequently", "Always"],
      },
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
      },
      {
        label: "Temperature exposure",
        key: "temperatureExposure",
        type: "select",
        icon: "thermometer-outline",
        options: ["Cool", "Moderate", "Hot"],
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
  const hasNumber = value.trim() !== "" && !Number.isNaN(numValue);
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
          onChangeText={onChange}
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
          <Text style={[styles.healthBarLabel, { color: barColor }]}> 
            {numValue >= 90 ? "Excellent" : numValue >= 80 ? "Good" : numValue >= 70 ? "Degraded" : "Critical"}
          </Text>
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

function getNumericError(field: NumericField, value: string): string | null {
  if (value.trim() === "") return null;

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "Enter a valid number.";
  }

  if (
    field.min !== undefined &&
    number < field.min
  ) {
    return `Minimum value is ${field.min}${field.suffix ? ` ${field.suffix}` : ""}.`;
  }

  if (
    field.max !== undefined &&
    number > field.max
  ) {
    return `Maximum value is ${field.max}${field.suffix ? ` ${field.suffix}` : ""}.`;
  }

  return null;
}


function getHealthError(
  field: HealthRangeField,
  value: string
): string | null {

  if (value.trim() === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "Enter a valid SOH percentage.";
  }

  if (
    number < field.min ||
    number > field.max
  ) {
    return `SOH must be between ${field.min}% and ${field.max}%.`;
  }

  return null;
}


export default function BatteryInput() {
  const router = useRouter();
  const { theme, colors, toggleTheme } = useTheme();
  const [form, setForm] = useState<Record<string, string>>({});

  const allFields = useMemo(
    () => SECTIONS.flatMap((section) => section.fields),
    []
  );

  const totalFields = allFields.length;

  const filledFields = allFields.filter(
    (field) =>
      (form[field.key] || "").trim() !== ""
  ).length;

  const progress =
    totalFields === 0
      ? 0
      : filledFields / totalFields;


  const formIsValid = useMemo(() => {

    if (filledFields !== totalFields) {
      return false;
    }

    for (const field of allFields) {

      const value =
        (form[field.key] || "").trim();

      if (!value) {
        return false;
      }

      if (field.type === "numeric") {

        if (
          getNumericError(
            field as NumericField,
            value
          )
        ) {
          return false;
        }
      }

      if (field.type === "health_range") {

        if (
          getHealthError(
            field as HealthRangeField,
            value
          )
        ) {
          return false;
        }

        if (
          field.key === "currentHealth" &&
          Number(value) < 60
        ) {
          return false;
        }
      }
    }

    return true;

  }, [
    allFields,
    filledFields,
    form,
    totalFields,
  ]);


  const handleChange = (
    key: string,
    value: string
  ) => {

    setForm(
      (previous) => ({
        ...previous,
        [key]: value,
      })
    );
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
        const error = getHealthError(
          field as HealthRangeField,
          value
        );

        if (error) {
          return `${field.label}: ${error}`;
        }

        if (
          field.key === "currentHealth" &&
          Number(value) < 60
        ) {
          return "Current battery SOH is below 60%. Battery replacement evaluation is recommended, and ML prediction is disabled for this input.";
        }
      }
    }
    return null;
  };

const handleGenerate = async () => {
  const validationError = validateForm();

  if (validationError) {
    Alert.alert(
      "Check your inputs",
      validationError
    );
    return;
  }

  try {
    // =====================================================
    // Full request for:
    // 3M + 6M + 12M ML forecasts + recommendations
    // =====================================================

    const weeklySessions =
      Number(form.chargingSessions);

    const requestData = {
      // Profile value saved to Firestore.
      // It is NOT an ML feature.
      vehicle_model:
        form.vehicleModel,

      current_soh: Number(
        form.currentHealth
      ),

      battery_age_months: Number(
        form.batteryAgeMonths
      ),

      // =================================================
      // 7 ML FEATURES
      // =================================================
      avg_voltage: Number(
        form.avgVoltage
      ),

      avg_current: Number(
        form.avgCurrent
      ),

      avg_temperature: Number(
        form.avgTemperature
      ),

      avg_soc_change: Number(
        form.avgSocChange
      ),

      avg_charge_duration: Number(
        form.avgChargeDuration
      ),

      // User enters sessions/week.
      // Model receives average sessions/day.
      charging_sessions:
        weeklySessions / 7.0,

      // Keep the ORIGINAL frontend value for Firestore.
      charging_sessions_per_week:
        weeklySessions,

      // =================================================
      // RECOMMENDATION / PROFILE INPUTS
      // =================================================
      driving_style:
        form.drivingStyle,

      avg_daily_distance:
        form.avgDailyDistance,

      charging_frequency:
        form.chargingFrequency,

      fast_charging_usage:
        form.fastChargingUsage,

      charging_habit:
        form.chargingHabit,

      temperature_exposure:
        form.temperatureExposure,
    };


    console.log(
      "Sending prediction request:",
      requestData
    );


    // =====================================================
    // Combined backend endpoint
    // 3M + 6M + 12M + recommendations
    // =====================================================

    const response = await fetch(
      "http://127.0.0.1:8000/api/battery/predict",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(
          requestData
        ),
      }
    );


    const result = await response.json();

    console.log(
      "Backend prediction response:",
      result
    );


    // =====================================================
    // Error handling
    // =====================================================

    if (!response.ok) {
      Alert.alert(
        "Prediction Error",
        result.detail ||
          "Unable to generate battery prediction."
      );

      return;
    }


    if (result.status !== "success") {
      Alert.alert(
        "Prediction Error",
        result.message ||
          "Prediction failed."
      );

      return;
    }


    // =====================================================
    // Send backend result directly to result page
    // =====================================================

    router.push({
      pathname:
        "/battery_health/result" as any,

      params: {
        formData:
          JSON.stringify(form),

        prediction:
          JSON.stringify(result),
      },
    });

  } catch (error) {

    console.error(
      "Connection error:",
      error
    );

    Alert.alert(
      "Connection Error",
      "Cannot connect to the prediction backend."
    );
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
                                borderColor: numericError ? "#EF4444" : colors.border,
                              },
                            ]}
                          >
                            <TextInput
                              style={{
                                flex: 1,
                                fontSize: 14,
                                color: colors.textPrimary,
                              }}
                              placeholder={
                                (field as NumericField).placeholder
                              }
                              placeholderTextColor={
                                colors.textMuted
                              }
                              keyboardType={
                                (field as NumericField).min !== undefined &&
                                (field as NumericField).min! < 0
                                  ? "numbers-and-punctuation"
                                  : "decimal-pad"
                              }
                              value={value}
                              onChangeText={
                                (nextValue) =>
                                  handleChange(
                                    field.key,
                                    nextValue
                                  )
                              }
                              maxLength={10}
                            />

                            {!!(field as NumericField).suffix && (
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: colors.textMuted,
                                }}
                              >
                                {(field as NumericField).suffix}
                              </Text>
                            )}

                          </View>

                          {!!numericError && (
                            <Text style={styles.errorText}>
                              {numericError}
                            </Text>
                          )}

                          {!numericError &&
                            ((field as NumericField).min !== undefined ||
                              (field as NumericField).max !== undefined) && (
                              <Text
                                style={[
                                  styles.validationHint,
                                  { color: colors.textMuted },
                                ]}
                              >
                                Allowed range:{" "}
                                {(field as NumericField).min ?? "no minimum"}
                                {" - "}
                                {(field as NumericField).max ?? "no maximum"}
                                {(field as NumericField).suffix
                                  ? ` ${(field as NumericField).suffix}`
                                  : ""}
                              </Text>
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
                  opacity:
                    formIsValid
                      ? 1
                      : 0.5,
                },
              ]}
              onPress={handleGenerate}
              activeOpacity={0.85}
              disabled={!formIsValid}
            >
              <Ionicons name="analytics-outline" size={18} color="#EEEDFE" />
              <Text style={styles.ctaText}>Continue to analysis</Text>
            </TouchableOpacity>

            <Text style={[styles.footerNote, { color: colors.textMuted }]}> 
              The 3-, 6- and 12-month forecast values come from the backend ML models.
              Charging sessions are entered per week and converted to average sessions per day before prediction.
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
    paddingVertical: 14,
    gap: 12,
  },
  indexBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  indexText: { fontSize: 11, fontWeight: "600" },
  optionText: { flex: 1, fontSize: 14 },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#534AB7",
    alignItems: "center",
    justifyContent: "center",
  },
  separator: { height: 0.5, marginHorizontal: 20 },
  healthRow: { flexDirection: "row", alignItems: "center" },
  rangePill: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginLeft: 8,
  },
  healthBarTrack: {
    height: 4,
    borderRadius: 99,
    marginTop: 8,
    overflow: "hidden",
    position: "relative",
  },
  healthBarFill: { height: "100%", borderRadius: 99 },
  healthBarLabel: {
    position: "absolute",
    right: 0,
    top: -14,
    fontSize: 10,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 11,
    color: "#EF4444",
    marginTop: 5,
  },
  criticalWarningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#FEE2E2",
    borderWidth: 0.5,
    borderColor: "#FCA5A5",
  },
  criticalWarningText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 15,
    color: "#991B1B",
    fontWeight: "500",
  },
  ageWarningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#FEF3C7",
    borderWidth: 0.5,
    borderColor: "#FCD34D",
  },
  ageWarningText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 15,
    color: "#92400E",
    fontWeight: "500",
  },
  validationHint: {
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
  },
  helperText: {
    fontSize: 10.5,
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
  footerNote: {
    textAlign: "center",
    fontSize: 10.5,
    lineHeight: 16,
    marginTop: 12,
    paddingHorizontal: 10,
  },
});