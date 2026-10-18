import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Car, ShieldCheck } from 'lucide-react-native';
import { useVehicleStore } from '../../store/useVehicleStore';
import { Colors } from '../../constants/theme';

export const VehiclesScreen = ({ navigation }: { navigation?: any } = {}) => {
  const { selectedVehicleId } = useVehicleStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Vehicle Fleet Management</Text>
      <Text style={styles.subtitle}>Connected EV Telematics Units</Text>

      <View style={styles.card}>
        <View style={styles.vHeader}>
          <Car size={24} color={Colors.primary} />
          <Text style={styles.vName}>Model E Performance ({selectedVehicleId})</Text>
        </View>
        <Text style={styles.vSub}>Status: <Text style={{ color: '#10b981', fontWeight: '700' }}>ACTIVE</Text></Text>
        <Text style={styles.vSub}>Manufacturer: Apex Motors | Model: E-GT (2026)</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginBottom: 16 },
  card: { backgroundColor: Colors.surfaceCard, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.surfaceBorder },
  vHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  vName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginLeft: 10 },
  vSub: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 }
});
