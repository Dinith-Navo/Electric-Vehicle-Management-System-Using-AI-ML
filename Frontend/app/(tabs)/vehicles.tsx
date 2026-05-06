import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore, Vehicle } from '../../store/useAppStore';
import { vehicleService } from '../../services';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#FFFFFF'];
const MAKES = ['Tesla', 'Nissan', 'BMW', 'Rivian', 'Lucid', 'Hyundai', 'Volkswagen', 'Audi', 'Chevrolet', 'Ford'];

interface VehicleForm {
  make: string;
  model: string;
  year: string;
  vin: string;
  batteryCapacity: string;
  color: string;
  licensePlate: string;
  odometer: string;
}

const EMPTY_FORM: VehicleForm = {
  make: 'Tesla',
  model: 'Model 3',
  year: '2023',
  vin: '',
  batteryCapacity: '75',
  color: '#10B981',
  licensePlate: '',
  odometer: '0',
};

const MOCK_VEHICLES: Vehicle[] = [
  {
    _id: '1',
    make: 'Tesla',
    model: 'Model 3 Long Range',
    year: 2023,
    vin: 'VIN5YJ3E1EA1NF000001',
    batteryCapacity: 82,
    color: '#EF4444',
    licensePlate: 'EV-2023-TL',
    odometer: 12540,
  },
  {
    _id: '2',
    make: 'Rivian',
    model: 'R1T Adventure',
    year: 2022,
    vin: 'VINRV1T12345678',
    batteryCapacity: 135,
    color: '#10B981',
    licensePlate: 'EV-2022-RV',
    odometer: 28900,
  },
];

function VehicleCard({
  vehicle,
  onEdit,
  onDelete,
}: {
  vehicle: Vehicle;
  onEdit: (v: Vehicle) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <View style={styles.vehicleCard}>
      {/* Color stripe */}
      <View style={[styles.colorStripe, { backgroundColor: vehicle.color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.vehicleName}>{vehicle.make} {vehicle.model}</Text>
            <Text style={styles.vehicleYear}>{vehicle.year}</Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => onEdit(vehicle)} style={styles.actionBtn}>
              <Ionicons name="create" size={18} color="#00F0FF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(vehicle._id)} style={[styles.actionBtn, styles.deleteBtn]}>
              <Ionicons name="trash" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardStats}>
          <View style={styles.cardStat}>
            <Ionicons name="battery-full" size={14} color="#00F0FF" />
            <Text style={styles.cardStatText}>{vehicle.batteryCapacity} kWh</Text>
          </View>
          <View style={styles.cardStat}>
            <Ionicons name="speedometer" size={14} color="#8B5CF6" />
            <Text style={styles.cardStatText}>{vehicle.odometer.toLocaleString()} mi</Text>
          </View>
          <View style={styles.cardStat}>
            <Ionicons name="card" size={14} color="#F59E0B" />
            <Text style={styles.cardStatText}>{vehicle.licensePlate}</Text>
          </View>
        </View>

        <View style={styles.vinRow}>
          <Text style={styles.vinLabel}>VIN: </Text>
          <Text style={styles.vinValue} numberOfLines={1}>{vehicle.vin}</Text>
        </View>
      </View>
    </View>
  );
}

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={styles.formInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor="#475569"
        keyboardType={keyboardType}
      />
    </View>
  );
}

function AuthGuard({ onLogin }: { onLogin: () => void }) {
  return (
    <View style={styles.guardContainer}>
      <LinearGradient colors={['#0D1B2A', '#1A2744']} style={styles.guardCard}>
        <View style={styles.guardIconCircle}>
          <Ionicons name="person-add" size={32} color="#00F0FF" />
        </View>
        <Text style={styles.guardTitle}>Create Account First</Text>
        <Text style={styles.guardMessage}>To add and manage your electric vehicles, please sign in or create a new account.</Text>
        <TouchableOpacity onPress={onLogin} style={styles.guardBtn}>
          <LinearGradient colors={['#00F0FF', '#0090A0']} style={styles.guardBtnGradient}>
            <Text style={styles.guardBtnText}>Get Started</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

export default function Vehicles() {
  const router = useRouter();
  const token = useAppStore((s) => s.token);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const vehicles = useAppStore((s) => s.vehicles.length > 0 ? s.vehicles : MOCK_VEHICLES);
  const addVehicle = useAppStore((s) => s.addVehicle);
  const updateVehicle = useAppStore((s) => s.updateVehicle);
  const removeVehicle = useAppStore((s) => s.removeVehicle);
  const setVehicles = useAppStore((s) => s.setVehicles);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<VehicleForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (vehicles === MOCK_VEHICLES) {
      setVehicles(MOCK_VEHICLES);
    }
  }, []);

  const openAdd = () => {
    setEditingVehicle(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setForm({
      make: v.make,
      model: v.model,
      year: String(v.year),
      vin: v.vin,
      batteryCapacity: String(v.batteryCapacity),
      color: v.color,
      licensePlate: v.licensePlate,
      odometer: String(v.odometer),
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.make || !form.model || !form.year) {
      Alert.alert('Validation', 'Make, model, and year are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        make: form.make,
        model: form.model,
        year: parseInt(form.year),
        vin: form.vin || `VIN${Date.now()}`,
        batteryCapacity: parseFloat(form.batteryCapacity),
        color: form.color,
        licensePlate: form.licensePlate,
        odometer: parseFloat(form.odometer),
      };

      if (editingVehicle) {
        const updated: Vehicle = { ...editingVehicle, ...payload };
        // Try API, fallback to local
        try {
          if (token) await vehicleService.update(token, editingVehicle._id, payload);
        } catch (_) {}
        updateVehicle(updated);
      } else {
        const newVehicle: Vehicle = { _id: String(Date.now()), ...payload };
        try {
          if (token) {
            const res = await vehicleService.create(token, payload);
            newVehicle._id = res.id ?? newVehicle._id;
          }
        } catch (_) {}
        addVehicle(newVehicle);
      }
      setModalVisible(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Vehicle', 'Are you sure you want to remove this vehicle?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (token) await vehicleService.remove(token, id);
          } catch (_) {}
          removeVehicle(id);
        },
      },
    ]);
  };

  const updateForm = useCallback((key: keyof VehicleForm, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
  }, []);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>My Vehicles</Text>
          </View>
          <AuthGuard onLogin={() => router.replace('/(auth)/login')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Vehicles</Text>
            <Text style={styles.subtitle}>{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} registered</Text>
          </View>
          <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
            <Ionicons name="add" size={22} color="#080F1F" />
          </TouchableOpacity>
        </View>

        {vehicles.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="car-sport-outline" size={60} color="#1E293B" />
            <Text style={styles.emptyTitle}>No Vehicles Yet</Text>
            <Text style={styles.emptySubtitle}>Add your first EV to start monitoring</Text>
            <TouchableOpacity onPress={openAdd} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>Add Vehicle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          vehicles.map((v) => (
            <VehicleCard key={v._id} vehicle={v} onEdit={openEdit} onDelete={handleDelete} />
          ))
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent presentationStyle="pageSheet">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Make Selector */}
                <Text style={styles.formLabel}>Make</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {MAKES.map((make) => (
                    <TouchableOpacity
                      key={make}
                      onPress={() => updateForm('make', make)}
                      style={[styles.makeChip, form.make === make && styles.makeChipActive]}
                    >
                      <Text style={[styles.makeChipText, form.make === make && styles.makeChipTextActive]}>
                        {make}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <FormInput label="Model" value={form.model} onChangeText={(t) => updateForm('model', t)} />
                <FormInput label="Year" value={form.year} onChangeText={(t) => updateForm('year', t)} keyboardType="number-pad" />
                <FormInput label="VIN Number" value={form.vin} onChangeText={(t) => updateForm('vin', t)} placeholder="VIN (optional)" />
                <FormInput label="Battery Capacity (kWh)" value={form.batteryCapacity} onChangeText={(t) => updateForm('batteryCapacity', t)} keyboardType="decimal-pad" />
                <FormInput label="License Plate" value={form.licensePlate} onChangeText={(t) => updateForm('licensePlate', t)} />
                <FormInput label="Odometer (mi)" value={form.odometer} onChangeText={(t) => updateForm('odometer', t)} keyboardType="number-pad" />

                {/* Color Picker */}
                <Text style={[styles.formLabel, { marginBottom: 10 }]}>Color</Text>
                <View style={styles.colorRow}>
                  {COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      onPress={() => updateForm('color', color)}
                      style={[styles.colorSwatch, { backgroundColor: color }, form.color === color && styles.colorSwatchActive]}
                    >
                      {form.color === color && <Ionicons name="checkmark" size={14} color="#080F1F" />}
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
                  {saving ? (
                    <ActivityIndicator color="#080F1F" />
                  ) : (
                    <Text style={styles.saveBtnText}>{editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}</Text>
                  )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#080F1F' },
  container: { flex: 1, backgroundColor: '#080F1F', paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 20 },
  title: { color: '#F8FAFC', fontSize: 26, fontWeight: '800' },
  subtitle: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#00F0FF', alignItems: 'center', justifyContent: 'center' },

  vehicleCard: { backgroundColor: '#0D1B2A', borderRadius: 20, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#1E293B', flexDirection: 'row' },
  colorStripe: { width: 5 },
  cardBody: { flex: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  vehicleName: { color: '#F8FAFC', fontSize: 17, fontWeight: '800' },
  vehicleYear: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,240,255,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,240,255,0.2)' },
  deleteBtn: { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' },
  cardStats: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  cardStat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardStatText: { color: '#94A3B8', fontSize: 12 },
  vinRow: { flexDirection: 'row', alignItems: 'center' },
  vinLabel: { color: '#475569', fontSize: 11 },
  vinValue: { color: '#94A3B8', fontSize: 11, flex: 1 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingBottom: 40 },
  emptyTitle: { color: '#F8FAFC', fontSize: 20, fontWeight: '800', marginTop: 20, marginBottom: 8 },
  emptySubtitle: { color: '#475569', fontSize: 14, textAlign: 'center' },
  emptyBtn: { marginTop: 24, backgroundColor: '#00F0FF', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  emptyBtnText: { color: '#080F1F', fontSize: 15, fontWeight: '800' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: { backgroundColor: '#0D1B2A', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '90%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#1E293B', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#F8FAFC', fontSize: 20, fontWeight: '800' },

  formField: { marginBottom: 14 },
  formLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  formInput: { backgroundColor: '#080F1F', borderRadius: 12, borderWidth: 1, borderColor: '#1E293B', paddingHorizontal: 14, paddingVertical: 12, color: '#F8FAFC', fontSize: 15 },

  makeChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#080F1F', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#1E293B' },
  makeChipActive: { backgroundColor: 'rgba(0,240,255,0.15)', borderColor: '#00F0FF' },
  makeChipText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  makeChipTextActive: { color: '#00F0FF' },

  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  colorSwatch: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  colorSwatchActive: { borderWidth: 3, borderColor: '#F8FAFC' },

  saveBtn: { backgroundColor: '#00F0FF', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#080F1F', fontSize: 16, fontWeight: '800' },
  
  guardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  guardCard: { width: '100%', borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,240,255,0.2)' },
  guardIconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(0,240,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  guardTitle: { color: '#F8FAFC', fontSize: 22, fontWeight: '800', marginBottom: 12 },
  guardMessage: { color: '#94A3B8', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  guardBtn: { width: '100%', borderRadius: 14, overflow: 'hidden' },
  guardBtnGradient: { paddingVertical: 16, alignItems: 'center' },
  guardBtnText: { color: '#080F1F', fontSize: 16, fontWeight: '800' },
});
