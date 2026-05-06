import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Switch,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

function SettingsRow({
  icon,
  label,
  onPress,
  rightElement,
  color = '#94A3B8',
  destructive = false,
}: {
  icon: any;
  label: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  color?: string;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.settingsRow, destructive && styles.destructiveRow]}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingsIconWrap, { backgroundColor: destructive ? 'rgba(239,68,68,0.1)' : 'rgba(0,240,255,0.08)' }]}>
        <Ionicons name={icon} size={18} color={destructive ? '#EF4444' : color} />
      </View>
      <Text style={[styles.settingsLabel, destructive && { color: '#EF4444' }]}>{label}</Text>
      {rightElement ?? (
        onPress ? <Ionicons name="chevron-forward" size={16} color="#475569" /> : null
      )}
    </TouchableOpacity>
  );
}

export default function Profile() {
  const router = useRouter();
  const userProfile = useAppStore((s) => s.userProfile);
  const darkMode = useAppStore((s) => s.darkMode);
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const toggleNotifications = useAppStore((s) => s.toggleNotifications);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const logout = useAppStore((s) => s.logout);

  const [editModal, setEditModal] = useState(false);
  const [name, setName] = useState(userProfile?.name ?? 'Dinith Navodya');
  const [email, setEmail] = useState(userProfile?.email ?? 'dinith@ev.com');
  const [phone, setPhone] = useState(userProfile?.phone ?? '+94 71 123 4567');

  const handleLogout = () => {
    const performLogout = () => {
      logout();
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        performLogout();
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ]);
    }
  };

  const handleSaveProfile = () => {
    updateProfile({ name, email, phone });
    setEditModal(false);
  };

  const displayName = userProfile?.name ?? name;
  const displayEmail = userProfile?.email ?? email;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity onPress={() => setEditModal(true)} style={styles.editBtn}>
            <Ionicons name="create-outline" size={18} color="#00F0FF" />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Hero */}
        <LinearGradient colors={['#0D1B2A', '#1A2744']} style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#00F0FF', '#0090A0']}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarInitial}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
            <View style={styles.statusDot} />
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{displayEmail}</Text>
          <View style={styles.roleChip}>
            <Ionicons name="car-sport" size={12} color="#00F0FF" />
            <Text style={styles.roleText}>{userProfile?.role ?? 'EV Owner'}</Text>
          </View>

          {/* Stats row */}
          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>2</Text>
              <Text style={styles.profileStatLabel}>Vehicles</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>156</Text>
              <Text style={styles.profileStatLabel}>Cycles</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>94%</Text>
              <Text style={styles.profileStatLabel}>SoH</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.sectionCard}>
          <SettingsRow icon="person-circle" label={displayName} color="#00F0FF" />
          <SettingsRow icon="mail" label={displayEmail} color="#8B5CF6" />
          <SettingsRow icon="call" label={userProfile?.phone ?? phone} color="#10B981" />
          <SettingsRow
            icon="shield-checkmark"
            label="Change Password"
            onPress={() => Alert.alert('Change Password', 'Password change email sent to ' + displayEmail)}
          />
        </View>

        {/* App Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.sectionCard}>
          <SettingsRow
            icon="moon"
            label="Dark Mode"
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#1E293B', true: 'rgba(0,240,255,0.3)' }}
                thumbColor={darkMode ? '#00F0FF' : '#475569'}
              />
            }
          />
          <SettingsRow
            icon="notifications"
            label="Push Notifications"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: '#1E293B', true: 'rgba(0,240,255,0.3)' }}
                thumbColor={notificationsEnabled ? '#00F0FF' : '#475569'}
              />
            }
          />
          <SettingsRow
            icon="location"
            label="Location Services"
            onPress={() => Alert.alert('Location', 'Location services enabled for route optimization.')}
          />
        </View>

        {/* EV Intelligence */}
        <Text style={styles.sectionTitle}>EV Intelligence</Text>
        <View style={styles.sectionCard}>
          <SettingsRow
            icon="car"
            label="Vehicle Management"
            onPress={() => router.push('/(tabs)/vehicles')}
          />
          <SettingsRow
            icon="pulse"
            label="AI Prediction Settings"
            onPress={() => Alert.alert('AI Settings', 'Random Forest model v2.1 active. Auto-predictions every 6 hours.')}
          />
          <SettingsRow
            icon="sync"
            label="Sync Telemetry"
            onPress={() => Alert.alert('Sync', 'Telemetry synced successfully!')}
          />
          <SettingsRow
            icon="cloud-download"
            label="Export Data (CSV)"
            onPress={() => Alert.alert('Export', 'Export initiated. Data will be emailed to ' + displayEmail)}
          />
        </View>

        {/* Support */}
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.sectionCard}>
          <SettingsRow
            icon="help-circle"
            label="Help & FAQ"
            onPress={() => Alert.alert('Help', 'PSEVPIFPS v1.0 — AI-powered EV management system.')}
          />
          <SettingsRow
            icon="document-text"
            label="Privacy Policy"
            onPress={() => Alert.alert('Privacy', 'Your data is encrypted and never sold.')}
          />
          <SettingsRow
            icon="information-circle"
            label="App Version"
            rightElement={<Text style={styles.versionText}>v1.0.0</Text>}
          />
        </View>

        {/* Logout */}
        <SettingsRow
          icon="log-out"
          label="Secure Logout"
          onPress={handleLogout}
          destructive
        />

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModal} animationType="slide" transparent presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setEditModal(false)}>
                  <Ionicons name="close" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>Full Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#475569"
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Email Address</Text>
                <TextInput
                  style={styles.formInput}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#475569"
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor="#475569"
                />
              </View>

              <TouchableOpacity onPress={handleSaveProfile} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
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
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,240,255,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,240,255,0.3)' },
  editBtnText: { color: '#00F0FF', fontSize: 13, fontWeight: '600' },

  profileCard: { borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(0,240,255,0.12)' },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatarGradient: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#080F1F', fontSize: 36, fontWeight: '900' },
  statusDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#0D1B2A' },
  profileName: { color: '#F8FAFC', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  profileEmail: { color: '#94A3B8', fontSize: 14, marginBottom: 10 },
  roleChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,240,255,0.1)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,240,255,0.25)', marginBottom: 20 },
  roleText: { color: '#00F0FF', fontSize: 12, fontWeight: '700' },
  profileStats: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  profileStat: { flex: 1, alignItems: 'center' },
  profileStatValue: { color: '#F8FAFC', fontSize: 20, fontWeight: '800' },
  profileStatLabel: { color: '#475569', fontSize: 11, marginTop: 2 },
  profileStatDivider: { width: 1, height: 30, backgroundColor: '#1E293B' },

  sectionTitle: { color: '#475569', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  sectionCard: { backgroundColor: '#0D1B2A', borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#1E293B', overflow: 'hidden' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1E293B', gap: 12 },
  destructiveRow: { backgroundColor: 'rgba(239,68,68,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)', marginBottom: 8 },
  settingsIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingsLabel: { color: '#F8FAFC', fontSize: 14, flex: 1 },
  versionText: { color: '#475569', fontSize: 13 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: { backgroundColor: '#0D1B2A', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#1E293B', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#F8FAFC', fontSize: 20, fontWeight: '800' },
  formField: { marginBottom: 14 },
  formLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  formInput: { backgroundColor: '#080F1F', borderRadius: 12, borderWidth: 1, borderColor: '#1E293B', paddingHorizontal: 14, paddingVertical: 12, color: '#F8FAFC', fontSize: 15 },
  saveBtn: { backgroundColor: '#00F0FF', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#080F1F', fontSize: 16, fontWeight: '800' },
});
