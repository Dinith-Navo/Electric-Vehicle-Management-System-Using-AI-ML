import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { VehiclesScreen } from '../../src/screens/Vehicles/VehiclesScreen';
import { useExpoNavigation } from '../../src/utils/useExpoNavigationAdapter';
import { Ionicons } from '@expo/vector-icons';

export default function VehiclesPage() {
  const navigation = useExpoNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
      <VehiclesScreen navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  topBar: {
    paddingTop: 45,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
});
