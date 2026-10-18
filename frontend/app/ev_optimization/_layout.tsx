import React from "react";
import { Stack } from "expo-router";

export default function EVOptimizationLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="range_prediction" />
      <Stack.Screen name="charging_stations" />
      <Stack.Screen name="queue_prediction" />
      <Stack.Screen name="route_optimization" />
      <Stack.Screen name="charging_estimator" />
      <Stack.Screen name="cost_analysis" />
    </Stack>
  );
}
