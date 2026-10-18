import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { MainTabNavigator } from '../../src/navigation/MainTabNavigator';
import { Colors } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AnomalyDetectionMain() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/')}>
          <Ionicons name="arrow-back" size={18} color="#38bdf8" />
          <Text style={styles.backText}>SmartEV Home</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Anomaly Detection</Text>
        <View style={{ width: 80 }} />
      </View>
      <MainTabNavigator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  backText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
});
