import React, { useState } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "./ThemeContext";

const fields = [
  { label: "Battery Capacity (kWh)", placeholder: "e.g. 75", key: "capacity" },
  { label: "Total Mileage (km)", placeholder: "e.g. 45000", key: "mileage" },
  { label: "Charging Cycles", placeholder: "e.g. 350", key: "cycles" },
  { label: "Average Temperature (°C)", placeholder: "e.g. 25", key: "temp" },
  { label: "Fast Charging Usage (%)", placeholder: "e.g. 30", key: "fastCharge" },
  { label: "Vehicle Age (years)", placeholder: "e.g. 3", key: "age" },
];

export default function BatteryInput() {
  const router = useRouter();
  const { theme, toggleTheme, colors } = useTheme();
  const [form, setForm] = useState<Record<string, string>>({});

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = () => {
    router.push({
      pathname: "/battery_health/results" as any,
      params: form,
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.toggleBg }]}
          >
            <Text style={[styles.backArrow, { color: colors.backArrow }]}>←</Text>
          </TouchableOpacity>
 
          <Text style={[styles.headerTitle, { color: colors.title }]}>
            Battery Data Input
          </Text>
 
          <TouchableOpacity
            style={[styles.themeToggle, { backgroundColor: colors.toggleBg }]}
            onPress={toggleTheme}
          >
            <Text style={styles.themeIcon}>{theme === "dark" ? "☀️" : "🌙"}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.subtitle, { color: colors.subtitle }]}>
          Enter your EV battery information to get health predictions
        </Text>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.form}>
          {fields.map((field) => (
            <View key={field.key} style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.label }]}>
                {field.label}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    color: colors.inputText,
                    borderColor: colors.cardBorder,
                  },
                ]}
                placeholder={field.placeholder}
                placeholderTextColor={colors.placeholder}
                keyboardType="numeric"
                value={form[field.key] || ""}
                onChangeText={(val) => handleChange(field.key, val)}
              />
            </View>
          ))}

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/battery_health/result" as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Generate Prediction  →</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: 20,
  },
  backArrow: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  themeToggle: {
    padding: 8,
    borderRadius: 20,
  },
  themeIcon: {
    fontSize: 18,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  form: {
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
  },
  button: {
    marginTop: 10,
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
    letterSpacing: 0.3,
  },
});