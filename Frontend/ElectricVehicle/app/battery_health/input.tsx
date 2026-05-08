import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, StatusBar, KeyboardAvoidingView, Platform, SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";

const fields = [
  { label: "Battery capacity (kWh)",     placeholder: "e.g. 75",    key: "capacity"   },
  { label: "Total mileage (km)",         placeholder: "e.g. 45000", key: "mileage"    },
  { label: "Charging cycles",            placeholder: "e.g. 350",   key: "cycles"     },
  { label: "Average temperature (°C)",   placeholder: "e.g. 25",    key: "temp"       },
  { label: "Fast charging usage (%)",    placeholder: "e.g. 30",    key: "fastCharge" },
  { label: "Vehicle age (years)",        placeholder: "e.g. 3",     key: "age"        },
];

export default function BatteryInput() {
  const router = useRouter();
  const { theme, colors, toggleTheme } = useTheme();
  const [form, setForm] = useState<Record<string, string>>({});

  const handleChange = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleGenerate = () => {
    router.push({
      pathname: "/battery_health/result" as any,
      params: form,
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.bg} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.container, { backgroundColor: colors.bg }]}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.iconBtn, borderColor: colors.border }]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Battery data input
            </Text>

            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.iconBtn, borderColor: colors.border }]}
              onPress={toggleTheme}
            >
              <Ionicons
                name={theme === "light" ? "moon-outline" : "sunny-outline"}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your EV battery information to get health predictions
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.form}>
            {fields.map((field) => (
              <View key={field.key} style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>
                  {field.label}
                </Text>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: colors.card,
                    color:           colors.textPrimary,
                    borderColor:     colors.border,
                  }]}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={form[field.key] || ""}
                  onChangeText={(val) => handleChange(field.key, val)}
                />
              </View>
            ))}

            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={handleGenerate}
              activeOpacity={0.85}
            >
              <Ionicons name="analytics-outline" size={18} color="#EEEDFE" />
              <Text style={styles.ctaText}>Generate prediction</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1 },
  container:   { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  iconBtn:     { width: 36, height: 36, borderRadius: 18, borderWidth: 0.5, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "600" },
  subtitle:    { fontSize: 13, lineHeight: 20, marginBottom: 22 },
  form:        { flex: 1 },
  fieldGroup:  { marginBottom: 16 },
  label:       { fontSize: 13, fontWeight: "500", marginBottom: 7 },
  input:       { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, borderWidth: 0.5 },
  ctaBtn:      { marginTop: 10, backgroundColor: "#534AB7", borderRadius: 30, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  ctaText:     { color: "#EEEDFE", fontSize: 15, fontWeight: "600", letterSpacing: 0.2 },
});