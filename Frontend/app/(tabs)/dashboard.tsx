import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';

export default function Dashboard() {
  const telemetry = useAppStore((state) => state.telemetry);

  return (
    <ScrollView className="flex-1 bg-bgPrimary px-4 pt-12">
      <View className="mb-8 flex-row justify-between items-center">
        <View>
          <Text className="text-textMain text-3xl font-bold tracking-wider">Dashboard</Text>
          <Text className="text-accent text-sm font-medium mt-1">Live Telemetry Active</Text>
        </View>
        <Ionicons name="battery-charging" size={32} color="#00F0FF" />
      </View>

      {/* Main Glassmorphic Cards */}
      <View className="flex-row flex-wrap justify-between gap-y-4 mb-6">
        <View className="w-[48%] bg-bgSecondary border border-accent/20 p-5 rounded-2xl shadow-lg shadow-black">
          <Ionicons name="flash" size={20} color="#10B981" />
          <Text className="text-textMuted text-xs mt-3 mb-1">State of Charge</Text>
          <Text className="text-success text-3xl font-bold">{telemetry.soc}%</Text>
        </View>

        <View className="w-[48%] bg-bgSecondary border border-accent/20 p-5 rounded-2xl shadow-lg shadow-black">
          <Ionicons name="heart-half" size={20} color="#00F0FF" />
          <Text className="text-textMuted text-xs mt-3 mb-1">State of Health</Text>
          <Text className="text-accent text-3xl font-bold">{telemetry.soh}%</Text>
        </View>

        <View className="w-[48%] bg-bgSecondary border border-accent/20 p-5 rounded-2xl shadow-lg shadow-black">
          <Ionicons name="thermometer" size={20} color="#F59E0B" />
          <Text className="text-textMuted text-xs mt-3 mb-1">Pack Temp</Text>
          <Text className="text-textMain text-3xl font-bold">{telemetry.temp}°C</Text>
        </View>

        <View className="w-[48%] bg-bgSecondary border border-accent/20 p-5 rounded-2xl shadow-lg shadow-black">
          <Ionicons name="speedometer" size={20} color="#E94560" />
          <Text className="text-textMuted text-xs mt-3 mb-1">Pack Voltage</Text>
          <Text className="text-textMain text-3xl font-bold">{telemetry.voltage}V</Text>
        </View>
      </View>

      <View className="bg-bgSecondary border border-accent/20 p-5 rounded-2xl mb-6 shadow-lg shadow-black">
        <View className="flex-row justify-between mb-4">
          <Text className="text-textMuted font-bold uppercase tracking-wider">Driving Efficiency</Text>
          <Ionicons name="leaf" size={16} color="#10B981" />
        </View>
        <View className="flex-row items-end">
          <Text className="text-textMain text-4xl font-bold">{telemetry.efficiency}</Text>
          <Text className="text-textMuted ml-2 mb-1">mi / kWh</Text>
        </View>
        <Text className="text-success text-xs mt-2">+0.2 from last week</Text>
      </View>

      <View className="h-10"></View>
    </ScrollView>
  );
}
