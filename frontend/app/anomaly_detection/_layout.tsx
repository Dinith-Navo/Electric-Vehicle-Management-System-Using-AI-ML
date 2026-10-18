import React from "react";
import { Stack } from "expo-router";

export default function AnomalyLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="live_monitoring" />
      <Stack.Screen name="ai_analysis" />
      <Stack.Screen name="simulator" />
      <Stack.Screen name="anomaly_list" />
      <Stack.Screen name="anomaly_detail" />
      <Stack.Screen name="research_mode" />
      <Stack.Screen name="model_comparison" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="vehicles" />
    </Stack>
  );
}
