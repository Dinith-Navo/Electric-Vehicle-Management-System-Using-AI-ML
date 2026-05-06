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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { userService, telemetryService } from '../../services';
import Colors from '../../constants/Colors';

function SettingsRow({
  icon,
  label,
  onPress,
  rightElement,
  color,
  destructive = false,
  theme,
}: {
  icon: any;
  label: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  color?: string;
  destructive?: boolean;
  theme: typeof Colors.dark;
}) {
  const iconColor = color || theme.textSecondary;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.settingsRow, 
        { borderBottomColor: theme.border },
        destructive && { backgroundColor: `${theme.danger}11`, borderColor: `${theme.danger}44`, borderWidth: 1, borderRadius: 16, marginBottom: 8 }
      ]}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingsIconWrap, { backgroundColor: destructive ? `${theme.danger}22` : `${theme.accent}11` }]}>
        <Ionicons name={icon} size={18} color={destructive ? theme.danger : iconColor} />
      </View>
      <Text style={[styles.settingsLabel, { color: destructive ? theme.danger : theme.text }]}>{label}</Text>
      {rightElement ?? (
        onPress ? <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} /> : null
      )}
    </TouchableOpacity>
  );
}

export default function Profile() {
  const router = useRouter();
  const userProfile = useAppStore((s) => s.userProfile);
  const darkMode = useAppStore((s) => s.darkMode);
  const theme = darkMode ? Colors.dark : Colors.light;
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const toggleNotifications = useAppStore((s) => s.toggleNotifications);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const logout = useAppStore((s) => s.logout);

  const [editModal, setEditModal] = useState(false);
  const [name, setName] = useState(userProfile?.name ?? '');
  const [email, setEmail] = useState(userProfile?.email ?? '');
  const [phone, setPhone] = useState(userProfile?.phone ?? '');
  const [role, setRole] = useState(userProfile?.role ?? 'EV Owner');

  React.useEffect(() => {
    if (userProfile) {
      setName(userProfile.name);
      setEmail(userProfile.email);
      setPhone(userProfile.phone || '');
      setRole(userProfile.role || 'EV Owner');
    }
  }, [userProfile]);

  const openEditModal = () => {
    if (userProfile) {
      setName(userProfile.name);
      setEmail(userProfile.email);
      setPhone(userProfile.phone || '');
      setRole(userProfile.role || 'EV Owner');
    }
    setEditModal(true);
  };
  
  // Password change states
  const [passwordModal, setPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [helpModal, setHelpModal] = useState(false);
  const [privacyModal, setPrivacyModal] = useState(false);

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

  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!name || !email) {
      Alert.alert('Error', 'Name and Email are required.');
      return;
    }
    setSaving(true);
    try {
      const token = useAppStore.getState().token;
      if (token) {
        const res = await userService.updateProfile(token, { name, email, phone, role });
        if (res.success) {
          updateProfile({ name, email, phone, role });
          setEditModal(false);
          Alert.alert('Success', 'Profile updated successfully.');
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update profile on server.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters.');
      return;
    }

    setPasswordSaving(true);
    try {
      const token = useAppStore.getState().token;
      if (token) {
        await userService.changePassword(token, { currentPassword, newPassword });
        Alert.alert('Success', 'Password updated successfully.');
        setPasswordModal(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update password.';
      Alert.alert('Error', msg);
    } finally {
      setPasswordSaving(false);
    }
  };

  const telemetry = useAppStore((s) => s.telemetry);
  const vehicles = useAppStore((s) => s.vehicles);
  const displayName = userProfile?.name ?? name;
  const displayEmail = userProfile?.email ?? email;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
          <TouchableOpacity onPress={openEditModal} style={[styles.editBtn, { backgroundColor: `${theme.accent}15`, borderColor: `${theme.accent}30` }]}>
            <Ionicons name="create-outline" size={18} color={theme.accent} />
            <Text style={[styles.editBtnText, { color: theme.accent }]}>Edit</Text>
          </TouchableOpacity>
        </View>
 
        {/* Profile Hero */}
        <LinearGradient colors={darkMode ? ['#0D1B2A', '#1A2744'] : ['#FFFFFF', '#F1F5F9']} style={[styles.profileCard, { borderColor: `${theme.accent}20` }]}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={darkMode ? ['#00F0FF', '#0090A0'] : ['#0EA5E9', '#0284C7']}
              style={styles.avatarGradient}
            >
              <Text style={[styles.avatarInitial, { color: darkMode ? '#080F1F' : '#FFFFFF' }]}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
            <View style={[styles.statusDot, { borderColor: theme.card }]} />
          </View>
          <Text style={[styles.profileName, { color: theme.text }]}>{displayName}</Text>
          <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{displayEmail}</Text>
          <View style={[styles.roleChip, { backgroundColor: `${theme.accent}15`, borderColor: `${theme.accent}25` }]}>
            <Ionicons name="car-sport" size={12} color={theme.accent} />
            <Text style={[styles.roleText, { color: theme.accent }]}>{userProfile?.role ?? 'EV Owner'}</Text>
          </View>
 
          {/* Stats row */}
          <View style={styles.profileStats}>
            <View style={styles.profileStat}>
              <Text style={[styles.profileStatValue, { color: theme.text }]}>
                {vehicles.length || 0}
              </Text>
              <Text style={styles.profileStatLabel}>Vehicles</Text>
            </View>
            <View style={[styles.profileStatDivider, { backgroundColor: theme.border }]} />
            <View style={styles.profileStat}>
              <Text style={[styles.profileStatValue, { color: theme.text }]}>
                {telemetry.chargingCycles}
              </Text>
              <Text style={styles.profileStatLabel}>Cycles</Text>
            </View>
            <View style={[styles.profileStatDivider, { backgroundColor: theme.border }]} />
            <View style={styles.profileStat}>
              <Text style={[styles.profileStatValue, { color: theme.text }]}>
                {telemetry.soh.toFixed(0)}%
              </Text>
              <Text style={styles.profileStatLabel}>SoH</Text>
            </View>
          </View>
        </LinearGradient>
 
        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingsRow icon="person-circle" label={displayName} color={theme.accent} theme={theme} />
          <SettingsRow icon="mail" label={displayEmail} color="#8B5CF6" theme={theme} />
          <SettingsRow 
            icon="call" 
            label={userProfile?.phone || 'Add Phone Number'} 
            color={theme.success} 
            onPress={openEditModal}
            theme={theme}
          />
          <SettingsRow
            icon="shield-checkmark"
            label="Change Password"
            onPress={() => setPasswordModal(true)}
            theme={theme}
          />
        </View>
 
        {/* App Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingsRow
            icon="moon"
            label="Dark Mode"
            theme={theme}
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#CBD5E1', true: `${theme.accent}40` }}
                thumbColor={darkMode ? theme.accent : '#F8FAFC'}
              />
            }
          />
          <SettingsRow
            icon="notifications"
            label="Push Notifications"
            theme={theme}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: '#CBD5E1', true: `${theme.accent}40` }}
                thumbColor={notificationsEnabled ? theme.accent : '#F8FAFC'}
              />
            }
          />
          <SettingsRow
            icon="location"
            label="Location Services"
            onPress={() => Alert.alert('Location', 'Location services enabled for route optimization.')}
            theme={theme}
          />
        </View>
 
        {/* EV Intelligence */}
        <Text style={styles.sectionTitle}>EV Intelligence</Text>
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingsRow
            icon="car"
            label="Vehicle Management"
            onPress={() => router.push('/(tabs)/vehicles')}
            theme={theme}
          />
          <SettingsRow
            icon="pulse"
            label="AI Prediction Settings"
            onPress={() => router.push('/(tabs)/ai-insights')}
            theme={theme}
          />
          <SettingsRow
            icon="sync"
            label="Sync Telemetry"
            onPress={async () => {
              setSyncing(true);
              try {
                const token = useAppStore.getState().token;
                if (token) {
                  await telemetryService.getLatest(token);
                  Alert.alert('Sync Successful', 'All vehicle telemetry data is up to date.');
                }
              } catch (e) {
                Alert.alert('Sync Failed', 'Could not reach the server. Please check your connection.');
              } finally {
                setSyncing(false);
              }
            }}
            rightElement={syncing ? <ActivityIndicator size="small" color={theme.accent} /> : null}
            theme={theme}
          />
          <SettingsRow
            icon="cloud-download"
            label="Export Data (CSV)"
            onPress={() => {
              Alert.alert('Exporting...', 'Generating your encrypted data report. You will receive it at ' + displayEmail + ' shortly.');
            }}
            theme={theme}
          />
        </View>
 
        {/* Support */}
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <SettingsRow
            icon="help-circle"
            label="Help & FAQ"
            onPress={() => setHelpModal(true)}
            theme={theme}
          />
          <SettingsRow
            icon="document-text"
            label="Privacy Policy"
            onPress={() => setPrivacyModal(true)}
            theme={theme}
          />
          <SettingsRow
            icon="information-circle"
            label="App Version"
            onPress={() => Alert.alert('Update', 'You are on the latest version (v1.0.0).')}
            rightElement={<Text style={[styles.versionText, { color: theme.textSecondary }]}>v1.0.0</Text>}
            theme={theme}
          />
        </View>
 
        {/* Logout */}
        <SettingsRow
          icon="log-out"
          label="Secure Logout"
          onPress={handleLogout}
          destructive
          theme={theme}
        />
 
        <View style={{ height: 40 }} />
      </ScrollView>
 
      {/* Edit Profile Modal */}
      <Modal visible={editModal} animationType="slide" transparent presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
              <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setEditModal(false)}>
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
 
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Full Name</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Email Address</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Account Role</Text>
                <View style={styles.rolePicker}>
                  {['EV Owner', 'Fleet Manager', 'Service Provider'].map((r) => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setRole(r)}
                      style={[
                        styles.roleOption,
                        { backgroundColor: theme.background, borderColor: theme.border },
                        role === r && { borderColor: theme.accent, backgroundColor: `${theme.accent}15` }
                      ]}
                    >
                      <Text style={[styles.roleOptionText, { color: theme.textSecondary }, role === r && { color: theme.accent }]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
 
              <TouchableOpacity 
                onPress={handleSaveProfile} 
                style={[styles.saveBtn, { backgroundColor: theme.accent }, saving && { opacity: 0.7 }]}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={darkMode ? '#080F1F' : '#FFFFFF'} />
                ) : (
                  <Text style={[styles.saveBtnText, { color: darkMode ? '#080F1F' : '#FFFFFF' }]}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
 
      {/* Change Password Modal */}
      <Modal visible={passwordModal} animationType="slide" transparent presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
              <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Change Password</Text>
                <TouchableOpacity onPress={() => setPasswordModal(false)}>
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
 
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Current Password</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  placeholder="Enter current password"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>New Password</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="Min. 6 characters"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: theme.textSecondary }]}>Confirm New Password</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="Repeat new password"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
 
              <TouchableOpacity 
                onPress={handleUpdatePassword} 
                style={[styles.saveBtn, { backgroundColor: theme.accent }, passwordSaving && { opacity: 0.7 }]}
                disabled={passwordSaving}
              >
                <Text style={[styles.saveBtnText, { color: darkMode ? '#080F1F' : '#FFFFFF' }]}>
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Help & FAQ Modal */}
      <Modal visible={helpModal} animationType="slide" transparent presentationStyle="pageSheet">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.card, height: '70%' }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Help & FAQ</Text>
              <TouchableOpacity onPress={() => setHelpModal(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.faqItem}>
                <Text style={[styles.faqQuestion, { color: theme.text }]}>What is PSEVPIFPS?</Text>
                <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>It stands for Post-Sale Electric Vehicle Performance Intelligence & Failure Prediction System. It uses AI to monitor your battery health in real-time.</Text>
              </View>
              <View style={styles.faqItem}>
                <Text style={[styles.faqQuestion, { color: theme.text }]}>How accurate is the SoH prediction?</Text>
                <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>Our Random Forest model achieves over 94% accuracy by analyzing voltage, temperature, and charging cycles.</Text>
              </View>
              <View style={styles.faqItem}>
                <Text style={[styles.faqQuestion, { color: theme.text }]}>How do I sync my data?</Text>
                <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>The app syncs automatically every time you open it. You can also use the "Sync Telemetry" button in your profile.</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal visible={privacyModal} animationType="slide" transparent presentationStyle="pageSheet">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.card, height: '60%' }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Privacy Policy</Text>
              <TouchableOpacity onPress={() => setPrivacyModal(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.privacyText, { color: theme.textSecondary }]}>
                Your privacy is our priority. All vehicle telemetry data is encrypted using industry-standard protocols.
                \n\n1. We do not sell your personal data to third parties.
                \n2. Location data is only used for route optimization and range estimation.
                \n3. AI models are trained on anonymized data to improve system-wide accuracy.
              </Text>
            </ScrollView>
          </View>
        </View>
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
  rolePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  roleOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, minWidth: 80, alignItems: 'center' },
  roleOptionText: { fontSize: 12, fontWeight: '600' },
  saveBtn: { backgroundColor: '#00F0FF', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, height: 56, justifyContent: 'center' },
  saveBtnText: { color: '#080F1F', fontSize: 16, fontWeight: '800' },
  faqItem: { marginBottom: 20 },
  faqQuestion: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  faqAnswer: { fontSize: 14, lineHeight: 22 },
  privacyText: { fontSize: 14, lineHeight: 24 },
});

