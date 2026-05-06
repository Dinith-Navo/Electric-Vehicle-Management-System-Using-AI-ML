import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';
import { authService } from '../../services';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

function InputField({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: {
  icon: any;
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}>
        <Ionicons name={icon} size={18} color={focused ? '#00F0FF' : '#475569'} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#475569"
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'none'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color="#475569" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function Register() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Validation', 'All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Validation', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Validation', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      let token = `demo-token-${Date.now()}`;
      try {
        const res = await authService.register(name, email, password);
        token = res.access_token ?? token;
      } catch (_) {
        // Use local registration in demo mode
      }

      login(token, {
        id: String(Date.now()),
        name,
        email,
        phone: '',
        avatar: '',
        role: 'EV Owner',
        memberSince: new Date().getFullYear().toString(),
      });

      router.replace('/(tabs)/dashboard');
    } catch (e) {
      Alert.alert('Error', 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#94A3B8" />
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.logoSection}>
            <LinearGradient colors={['#00F0FF', '#0070A0']} style={styles.logoCircle}>
              <Ionicons name="person-add" size={32} color="#080F1F" />
            </LinearGradient>
            <Text style={styles.appName}>Create Account</Text>
            <Text style={styles.appTagline}>Join the AI EV Intelligence Platform</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <InputField
              icon="person"
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              autoCapitalize="words"
            />
            <InputField
              icon="mail"
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
            />
            <InputField
              icon="lock-closed"
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 6 characters"
              secureTextEntry
            />
            <InputField
              icon="shield-checkmark"
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat password"
              secureTextEntry
            />

            <TouchableOpacity onPress={handleRegister} disabled={loading} style={styles.registerBtn}>
              <LinearGradient
                colors={loading ? ['#1E293B', '#1E293B'] : ['#00F0FF', '#007A90']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.registerBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="rocket" size={20} color="#080F1F" />
                    <Text style={styles.registerBtnText}>Create Account</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#080F1F' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#0D1B2A', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#1E293B' },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  appName: { color: '#F8FAFC', fontSize: 24, fontWeight: '800', marginBottom: 4 },
  appTagline: { color: '#475569', fontSize: 13, letterSpacing: 0.3 },
  card: { backgroundColor: '#0D1B2A', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#1E293B' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#080F1F', borderRadius: 12, borderWidth: 1, borderColor: '#1E293B', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  inputWrapperFocused: { borderColor: '#00F0FF', backgroundColor: 'rgba(0,240,255,0.04)' },
  input: { flex: 1, color: '#F8FAFC', fontSize: 15 },
  registerBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  registerBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  registerBtnText: { color: '#080F1F', fontSize: 16, fontWeight: '800' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginText: { color: '#94A3B8', fontSize: 14 },
  loginLink: { color: '#00F0FF', fontSize: 14, fontWeight: '700' },
});
