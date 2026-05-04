import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Analytics() {
  return (
    <ScrollView className="flex-1 bg-bgPrimary px-4 pt-12">
      <View className="mb-8">
        <Text className="text-textMain text-3xl font-bold tracking-wider">Analytics</Text>
        <Text className="text-textMuted text-sm font-medium mt-1">Charging & Driving Behavior</Text>
      </View>

      <View className="bg-bgSecondary border border-accent/20 p-5 rounded-2xl mb-4">
        <View className="flex-row items-center mb-4">
          <Ionicons name="battery-charging" size={24} color="#00F0FF" />
          <Text className="text-textMain font-bold ml-2 text-lg">Charging History</Text>
        </View>
        <Text className="text-textMuted mb-2">Last 7 Days</Text>
        <View className="flex-row justify-between items-end h-32 border-b border-textMuted/20 pb-2">
          {/* Mock Bar Chart using View heights */}
          <View className="w-8 bg-accent/40 rounded-t-md" style={{ height: '40%' }} />
          <View className="w-8 bg-accent/60 rounded-t-md" style={{ height: '70%' }} />
          <View className="w-8 bg-accent/80 rounded-t-md" style={{ height: '50%' }} />
          <View className="w-8 bg-accent rounded-t-md" style={{ height: '90%' }} />
          <View className="w-8 bg-accent/50 rounded-t-md" style={{ height: '60%' }} />
        </View>
        <View className="flex-row justify-between mt-2">
          <Text className="text-textMuted text-xs">Mon</Text>
          <Text className="text-textMuted text-xs">Tue</Text>
          <Text className="text-textMuted text-xs">Wed</Text>
          <Text className="text-textMuted text-xs">Thu</Text>
          <Text className="text-textMuted text-xs">Fri</Text>
        </View>
      </View>

      <View className="bg-bgSecondary border border-accent/20 p-5 rounded-2xl">
        <View className="flex-row items-center mb-4">
          <Ionicons name="speedometer" size={24} color="#E94560" />
          <Text className="text-textMain font-bold ml-2 text-lg">Driving Behavior</Text>
        </View>
        <Text className="text-textMuted leading-relaxed">
          Aggressive acceleration detected on Tuesday. Smooth regenerative braking efficiency has improved by 4% this week.
        </Text>
      </View>
    </ScrollView>
  );
}
