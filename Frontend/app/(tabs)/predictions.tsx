import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';

export default function Predictions() {
  const prediction = useAppStore((state) => state.prediction);

  const getRiskColor = (risk: string) => {
    if (risk === 'High') return 'text-critical';
    if (risk === 'Medium') return 'text-warning';
    return 'text-success';
  };

  return (
    <ScrollView className="flex-1 bg-bgPrimary px-4 pt-12">
      <View className="mb-8">
        <Text className="text-textMain text-3xl font-bold tracking-wider">AI Insights</Text>
        <Text className="text-accent text-sm font-medium mt-1">LSTM & Random Forest Output</Text>
      </View>

      <View className="bg-bgSecondary border border-warning/40 p-5 rounded-2xl mb-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-warning font-bold text-lg">Failure Prediction Active</Text>
          <Ionicons name="warning" size={24} color="#F59E0B" />
        </View>
        <Text className="text-textMuted text-sm leading-relaxed mb-4">
          Based on recent telemetry, the AI models predict a <Text className={`font-bold ${getRiskColor(prediction.failureRisk)}`}>{prediction.failureRisk} Risk</Text> of component degradation.
        </Text>
        
        <View className="bg-bgPrimary p-4 rounded-xl border border-white/5">
          <Text className="text-textMuted text-xs mb-1">Estimated Remaining Life</Text>
          <Text className="text-textMain font-bold text-2xl">{prediction.predictedLife}</Text>
        </View>
      </View>

      <View className="bg-bgSecondary border border-accent/20 p-5 rounded-2xl mb-4">
        <Text className="text-accent font-bold text-sm uppercase tracking-wider mb-3">Maintenance Suggestion</Text>
        <View className="flex-row items-center">
          <Ionicons name="build" size={20} color="#00F0FF" />
          <Text className="text-textMain ml-3 flex-1">{prediction.maintenanceSuggestion}</Text>
        </View>
      </View>
      
      <View className="bg-bgSecondary border border-accent/20 p-5 rounded-2xl">
        <Text className="text-accent font-bold text-sm uppercase tracking-wider mb-3">Anomaly Detection</Text>
        <Text className="text-textMuted">No severe anomalies detected in the charging port or motor bearings in the last 72 hours.</Text>
      </View>

      <View className="h-10"></View>
    </ScrollView>
  );
}
