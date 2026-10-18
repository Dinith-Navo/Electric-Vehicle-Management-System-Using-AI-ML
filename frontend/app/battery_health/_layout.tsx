import React from "react";
import { Stack } from "expo-router";

export default function BatteryHealthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="battery_health_main" />
      <Stack.Screen name="input" />
      <Stack.Screen name="result" />
    </Stack>
  );
}
