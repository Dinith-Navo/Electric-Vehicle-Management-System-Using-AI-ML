import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Car, BatteryCharging, ShieldAlert, CheckCircle2, Zap, Thermometer, Compass, Sparkles } from 'lucide-react-native';
import { useVehicleStore } from '../../store/useVehicleStore';
import { Colors } from '../../constants/theme';

export const VehiclesScreen = ({ navigation }: { navigation?: any } = {}) => {
  const { selectedVehicleId, fleet, setSelectedVehicleId } = useVehicleStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>SRI LANKA EV FLEET & BATTERY REGISTRY</Text>
        </View>
        <Text style={styles.title}>National Telematics Fleet</Text>
        <Text style={styles.subtitle}>
          Connected Sri Lankan commercial, mass transit, and passenger EV fleet units.
        </Text>
      </View>

      {fleet.map((vehicle) => {
        const isSelected = vehicle.id === selectedVehicleId;
        return (
          <TouchableOpacity
            key={vehicle.id}
            style={[styles.card, isSelected && styles.selectedCard]}
            onPress={() => setSelectedVehicleId(vehicle.id)}
          >
            {/* Top row: Plate + Type Badge */}
            <View style={styles.vHeader}>
              <View style={styles.plateBadge}>
                <Text style={styles.plateText}>{vehicle.plate}</Text>
              </View>
              <View style={[styles.typeBadge, isSelected && styles.typeBadgeActive]}>
                <Text style={[styles.typeText, isSelected && styles.typeTextActive]}>
                  {isSelected ? 'ACTIVE VEHICLE' : vehicle.type}
                </Text>
              </View>
            </View>

            {/* Vehicle Name & Manufacturer */}
            <Text style={styles.vName}>{vehicle.name}</Text>
            <Text style={styles.vSub}>
              {vehicle.manufacturer} • {vehicle.model} ({vehicle.year})
            </Text>

            {/* Battery & Tech Specs Grid */}
            <View style={styles.specGrid}>
              <View style={styles.specItem}>
                <Zap size={14} color="#38bdf8" />
                <Text style={styles.specLabel}>Capacity</Text>
                <Text style={styles.specValue}>{vehicle.packCapacityKwh} kWh</Text>
              </View>
              <View style={styles.specItem}>
                <BatteryCharging size={14} color="#10b981" />
                <Text style={styles.specLabel}>Health Status</Text>
                <Text style={styles.specValue}>{vehicle.sohText}</Text>
              </View>
              <View style={styles.specItem}>
                <Thermometer size={14} color="#f59e0b" />
                <Text style={styles.specLabel}>Chemistry</Text>
                <Text style={styles.specValue} numberOfLines={1}>{vehicle.batteryChemistry.split(' ')[0]}</Text>
              </View>
            </View>

            {/* Sri Lanka Specific Context */}
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Primary Route:</Text>
              <Text style={styles.detailVal}>{vehicle.corridor}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Repack / Conversion:</Text>
              <Text style={styles.detailVal}>{vehicle.repackStatus}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>CEB Tariff Plan:</Text>
              <Text style={styles.detailVal}>{vehicle.cebTariffPlan}</Text>
            </View>

            {/* Climate Vulnerability Callout */}
            <View style={styles.vulnerabilityBox}>
              <ShieldAlert size={14} color="#f97316" style={{ marginRight: 6 }} />
              <Text style={styles.vulnerabilityText}>{vehicle.climateVulnerability}</Text>
            </View>

            {isSelected && (
              <View style={styles.activeFooter}>
                <CheckCircle2 size={16} color={Colors.background} style={{ marginRight: 6 }} />
                <Text style={styles.activeFooterText}>Transmitting Live Telemetry to SL-MADE Engine</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 16 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
    marginBottom: 6
  },
  badgeText: { color: '#06b6d4', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    marginBottom: 14
  },
  selectedCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: 'rgba(6, 182, 212, 0.04)'
  },
  vHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  plateBadge: {
    backgroundColor: '#050a12',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#1e3a5f'
  },
  plateText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 1
  },
  typeBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  typeBadgeActive: {
    backgroundColor: Colors.primary
  },
  typeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted
  },
  typeTextActive: {
    color: Colors.background
  },
  vName: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginTop: 4 },
  vSub: { fontSize: 12, color: Colors.textSecondary, marginBottom: 12 },

  specGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#050a12',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12
  },
  specItem: {
    alignItems: 'center',
    width: '32%'
  },
  specLabel: { fontSize: 9, color: Colors.textMuted, marginTop: 2 },
  specValue: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary, marginTop: 1 },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  detailKey: { fontSize: 11, color: Colors.textMuted },
  detailVal: { fontSize: 11, fontWeight: '600', color: Colors.textPrimary, flex: 1, textAlign: 'right', marginLeft: 8 },

  vulnerabilityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.25)'
  },
  vulnerabilityText: { fontSize: 10, color: '#f97316', flex: 1, fontWeight: '600' },

  activeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 12
  },
  activeFooterText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.background
  }
});
