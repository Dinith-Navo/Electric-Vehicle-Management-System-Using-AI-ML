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
import Colors from '../../constants/Colors';

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
    _id: 'MOCK_1',
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
    _id: 'MOCK_2',
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
  theme,
}: {
  vehicle: Vehicle;
  onEdit: (v: Vehicle) => void;
  onDelete: (id: string) => void;
  theme: typeof Colors.dark;
}) {
  return (
    <View style={[styles.vehicleCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* Color stripe */}
      <View style={[styles.colorStripe, { backgroundColor: vehicle.color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.vehicleName, { color: theme.text }]}>{vehicle.make} {vehicle.model}</Text>
            <Text style={[styles.vehicleYear, { color: theme.textSecondary }]}>{vehicle.year}</Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => onEdit(vehicle)} style={[styles.actionBtn, { backgroundColor: `${theme.accent}15`, borderColor: `${theme.accent}25` }]}>
              <Ionicons name="create" size={18} color={theme.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(vehicle._id)} style={[styles.actionBtn, styles.deleteBtn, { backgroundColor: `${theme.danger}15`, borderColor: `${theme.danger}25` }]}>
              <Ionicons name="trash" size={18} color={theme.danger} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardStats}>
          <View style={styles.cardStat}>
            <Ionicons name="battery-full" size={14} color={theme.accent} />
            <Text style={[styles.cardStatText, { color: theme.textSecondary }]}>{vehicle.batteryCapacity} kWh</Text>
          </View>
          <View style={styles.cardStat}>
            <Ionicons name="speedometer" size={14} color="#8B5CF6" />
            <Text style={[styles.cardStatText, { color: theme.textSecondary }]}>{vehicle.odometer.toLocaleString()} mi</Text>
          </View>
          <View style={styles.cardStat}>
            <Ionicons name="card" size={14} color={theme.warning} />
            <Text style={[styles.cardStatText, { color: theme.textSecondary }]}>{vehicle.licensePlate}</Text>
          </View>
        </View>

        <View style={styles.vinRow}>
          <Text style={[styles.vinLabel, { color: theme.textSecondary }]}>VIN: </Text>
          <Text style={[styles.vinValue, { color: theme.textSecondary }]} numberOfLines={1}>{vehicle.vin}</Text>
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
  theme,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  theme: typeof Colors.dark;
}) {
  return (
    <View style={styles.formField}>
      <Text style={[styles.formLabel, { color: theme.textSecondary }]}>{label}</Text>
      <TextInput
        style={[styles.formInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={theme.textSecondary}
        keyboardType={keyboardType}
      />
    </View>
  );
}

function AuthGuard({ onLogin, theme, darkMode }: { onLogin: () => void; theme: typeof Colors.dark; darkMode: boolean }) {
  return (
    <View style={styles.guardContainer}>
      <LinearGradient colors={darkMode ? ['#0D1B2A', '#1A2744'] : ['#FFFFFF', '#F1F5F9']} style={[styles.guardCard, { borderColor: `${theme.accent}20` }]}>
        <View style={[styles.guardIconCircle, { backgroundColor: `${theme.accent}15` }]}>
          <Ionicons name="person-add" size={32} color={theme.accent} />
        </View>
        <Text style={[styles.guardTitle, { color: theme.text }]}>Create Account First</Text>
        <Text style={[styles.guardMessage, { color: theme.textSecondary }]}>To add and manage your electric vehicles, please sign in or create a new account.</Text>
        <TouchableOpacity onPress={onLogin} style={styles.guardBtn}>
          <LinearGradient colors={darkMode ? ['#00F0FF', '#0090A0'] : ['#0EA5E9', '#0284C7']} style={styles.guardBtnGradient}>
            <Text style={[styles.guardBtnText, { color: darkMode ? '#080F1F' : '#FFFFFF' }]}>Get Started</Text>
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
  const darkMode = useAppStore((s) => s.darkMode);
  const theme = darkMode ? Colors.dark : Colors.light;
  const vehicles = useAppStore((s) => s.vehicles);
  const addVehicle = useAppStore((s) => s.addVehicle);
  const updateVehicle = useAppStore((s) => s.updateVehicle);
  const removeVehicle = useAppStore((s) => s.removeVehicle);
  const setVehicles = useAppStore((s) => s.setVehicles);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<VehicleForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVehicles = useCallback(async () => {
    if (!token) return;
    try {
      const res = await vehicleService.getAll(token);
      if (res.success) {
        setVehicles(res.vehicles);
      }
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    }
  }, [token]);

  React.useEffect(() => {
    // If no vehicles and not fetching, show mocks for demo
    if (vehicles.length === 0 && !refreshing) {
      setVehicles(MOCK_VEHICLES);
    }
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchVehicles();
    }
  }, [isAuthenticated, fetchVehicles]);

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
        batteryCapacity: parseFloat(form.batteryCapacity) || 0,
        color: form.color,
        licensePlate: form.licensePlate,
        odometer: parseFloat(form.odometer) || 0,
      };

      if (editingVehicle) {
        // Update existing
        try {
          if (token) {
            const res = await vehicleService.update(token, editingVehicle._id, payload);
            if (res.success && res.vehicle) {
              updateVehicle(res.vehicle);
            } else {
              // Fallback if success but no vehicle returned
              updateVehicle({ ...editingVehicle, ...payload });
            }
          } else {
            updateVehicle({ ...editingVehicle, ...payload });
          }
        } catch (err) {
          console.error('Update failed:', err);
          Alert.alert('Error', 'Could not update vehicle on server. Local update applied.');
          updateVehicle({ ...editingVehicle, ...payload });
        }
      } else {
        // Create new
        try {
          console.log('[DEBUG] Creating new vehicle with payload:', payload);
          if (token) {
            const res = await vehicleService.create(token, payload);
            console.log('[DEBUG] Create API Response:', res);
            if (res.success && res.vehicle) {
              addVehicle(res.vehicle);
            } else {
              addVehicle({ _id: String(Date.now()), ...payload });
            }
          } else {
            addVehicle({ _id: String(Date.now()), ...payload });
          }
        } catch (err) {
          console.error('[DEBUG] Create API Error:', err);
          Alert.alert('Error', 'Could not save vehicle to server. Local copy created.');
          addVehicle({ _id: String(Date.now()), ...payload });
        }
      }
      setModalVisible(false);
      Alert.alert('Success', `Vehicle ${editingVehicle ? 'updated' : 'added'} successfully.`);
    } finally {
      setSaving(false);
    }
  };


  const handleDelete = (id: string) => {
    console.log('[DEBUG] handleDelete called for ID:', id);
    
    const performDelete = async () => {
      console.log('[DEBUG] Performing optimistic delete for ID:', id);
      removeVehicle(id);
      
      try {
        if (token && !id.startsWith('MOCK')) {
          console.log('[DEBUG] Calling API to delete vehicle:', id);
          const res = await vehicleService.remove(token, id);
          console.log('[DEBUG] API Response:', res);
        }
      } catch (err) {
        console.error('[DEBUG] API Delete Error:', err);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to remove this vehicle?')) {
        performDelete();
      }
    } else {
      Alert.alert('Delete Vehicle', 'Are you sure you want to remove this vehicle?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: performDelete },
      ]);
    }
  };

  const updateForm = useCallback((key: keyof VehicleForm, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
  }, []);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>My Vehicles</Text>
          </View>
          <AuthGuard onLogin={() => router.replace('/(auth)/login')} theme={theme} darkMode={darkMode} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>My Vehicles</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} registered</Text>
          </View>
          <TouchableOpacity onPress={openAdd} style={[styles.addBtn, { backgroundColor: theme.accent }]}>
            <Ionicons name="add" size={22} color={darkMode ? '#080F1F' : '#FFFFFF'} />
          </TouchableOpacity>
        </View>

        {vehicles.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="car-sport-outline" size={60} color={theme.border} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Vehicles Yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>Add your first EV to start monitoring</Text>
            <TouchableOpacity onPress={openAdd} style={[styles.emptyBtn, { backgroundColor: theme.accent }]}>
              <Text style={[styles.emptyBtnText, { color: darkMode ? '#080F1F' : '#FFFFFF' }]}>Add Vehicle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          vehicles.map((v) => (
            <VehicleCard key={v._id} vehicle={v} onEdit={openEdit} onDelete={handleDelete} theme={theme} />
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
            <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
              <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Make Selector */}
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Make</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {MAKES.map((make) => (
                    <TouchableOpacity
                      key={make}
                      onPress={() => updateForm('make', make)}
                      style={[styles.makeChip, { backgroundColor: theme.background, borderColor: theme.border }, form.make === make && { backgroundColor: `${theme.accent}15`, borderColor: theme.accent }]}
                    >
                      <Text style={[styles.makeChipText, { color: theme.textSecondary }, form.make === make && { color: theme.accent }]}>
                        {make}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <FormInput label="Model" value={form.model} onChangeText={(t) => updateForm('model', t)} theme={theme} />
                <FormInput label="Year" value={form.year} onChangeText={(t) => updateForm('year', t)} keyboardType="number-pad" theme={theme} />
                <FormInput label="VIN Number" value={form.vin} onChangeText={(t) => updateForm('vin', t)} placeholder="VIN (optional)" theme={theme} />
                <FormInput label="Battery Capacity (kWh)" value={form.batteryCapacity} onChangeText={(t) => updateForm('batteryCapacity', t)} keyboardType="decimal-pad" theme={theme} />
                <FormInput label="License Plate" value={form.licensePlate} onChangeText={(t) => updateForm('licensePlate', t)} theme={theme} />
                <FormInput label="Odometer (mi)" value={form.odometer} onChangeText={(t) => updateForm('odometer', t)} keyboardType="number-pad" theme={theme} />

                {/* Color Picker */}
                <Text style={[styles.formLabel, { color: theme.textSecondary, marginBottom: 10 }]}>Color</Text>
                <View style={styles.colorRow}>
                  {COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      onPress={() => updateForm('color', color)}
                      style={[styles.colorSwatch, { backgroundColor: color }, form.color === color && { borderWidth: 3, borderColor: theme.text }]}
                    >
                      {form.color === color && <Ionicons name="checkmark" size={14} color={color === '#FFFFFF' ? '#000' : '#FFF'} />}
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveBtn, { backgroundColor: theme.accent }]}>
                  {saving ? (
                    <ActivityIndicator color={darkMode ? '#080F1F' : '#FFFFFF'} />
                  ) : (
                    <Text style={[styles.saveBtnText, { color: darkMode ? '#080F1F' : '#FFFFFF' }]}>{editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}</Text>
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

  vehicleCard: { borderRadius: 20, marginBottom: 16, overflow: 'hidden', borderWidth: 1, flexDirection: 'row' },
  colorStripe: { width: 5 },
  cardBody: { flex: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  vehicleName: { fontSize: 17, fontWeight: '800' },
  vehicleYear: { fontSize: 13, marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  deleteBtn: { },
  cardStats: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  cardStat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardStatText: { fontSize: 12 },
  vinRow: { flexDirection: 'row', alignItems: 'center' },
  vinLabel: { fontSize: 11 },
  vinValue: { fontSize: 11, flex: 1 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingBottom: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginTop: 20, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
  emptyBtn: { marginTop: 24, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  emptyBtnText: { fontSize: 15, fontWeight: '800' },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '90%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },

  formField: { marginBottom: 14 },
  formLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  formInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },

  makeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1 },
  makeChipActive: { },
  makeChipText: { fontSize: 13, fontWeight: '600' },
  makeChipTextActive: { },

  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  colorSwatch: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  colorSwatchActive: { },

  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { fontSize: 16, fontWeight: '800' },
  
  guardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  guardCard: { width: '100%', borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1 },
  guardIconCircle: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  guardTitle: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  guardMessage: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  guardBtn: { width: '100%', borderRadius: 14, overflow: 'hidden' },
  guardBtnGradient: { paddingVertical: 16, alignItems: 'center' },
  guardBtnText: { fontSize: 16, fontWeight: '800' },
});
