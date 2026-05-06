import React, { useState, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
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

export default function Login() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);

  const [email, setEmail] = useState('demo@ev.com');
  const [password, setPassword] = useState('demo1234');
  const [loading, setLoading] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      shake();
      Alert.alert('Validation', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      // Try real API; if offline, use demo credentials
      let token = 'demo-token';
      let profile = {
        id: '1',
        name: 'Dinith Navodya',
        email: email,
        phone: '+94 71 123 4567',
        avatar: '',
        role: 'EV Owner',
        memberSince: '2024',
      };

      try {
        const res = await authService.login(email, password);
        token = res.access_token ?? token;
      } catch (_) {
        // Demo mode when backend is offline
        if (email !== 'demo@ev.com' || password !== 'demo1234') {
          shake();
          Alert.alert('Login Failed', 'Invalid credentials. Use demo@ev.com / demo1234 for demo mode.');
          setLoading(false);
          return;
        }
      }

      login(token, profile);
      router.replace('/(tabs)/dashboard');
    } catch (e) {
      shake();
      Alert.alert('Error', 'Login failed. Please try again.');
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
          {/* Logo */}
          <View style={styles.logoSection}>
            <LinearGradient colors={['#00F0FF', '#0070A0']} style={styles.logoCircle}>
              <Ionicons name="flash" size={36} color="#080F1F" />
            </LinearGradient>
            <Text style={styles.appName}>PSEVPIFPS</Text>
            <Text style={styles.appTagline}>AI EV Performance Intelligence</Text>
          </View>

          {/* Card */}
          <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSubtitle}>Sign in to your EV dashboard</Text>

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
              placeholder="••••••••"
              secureTextEntry
            />

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogin} disabled={loading} style={styles.loginBtn}>
              <LinearGradient
                colors={loading ? ['#1E293B', '#1E293B'] : ['#00F0FF', '#007A90']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="log-in" size={20} color="#080F1F" />
                    <Text style={styles.loginBtnText}>Sign In</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Demo hint */}
            <View style={styles.demoHint}>
              <Ionicons name="information-circle" size={14} color="#475569" />
              <Text style={styles.demoHintText}>Demo: demo@ev.com / demo1234</Text>
            </View>
          </Animated.View>

          {/* Sign Up Link */}
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.signupLink}>Create Account</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#080F1F' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },

  logoSection: { alignItems: 'center', marginBottom: 40 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  appName: { color: '#00F0FF', fontSize: 28, fontWeight: '900', letterSpacing: 3 },
  appTagline: { color: '#475569', fontSize: 13, marginTop: 6, letterSpacing: 0.5 },

  card: { backgroundColor: '#0D1B2A', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#1E293B' },
  cardTitle: { color: '#F8FAFC', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  cardSubtitle: { color: '#94A3B8', fontSize: 13, marginBottom: 24 },

  inputGroup: { marginBottom: 16 },
  inputLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#080F1F', borderRadius: 12, borderWidth: 1, borderColor: '#1E293B', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  inputWrapperFocused: { borderColor: '#00F0FF', backgroundColor: 'rgba(0,240,255,0.04)' },
  input: { flex: 1, color: '#F8FAFC', fontSize: 15 },

  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { color: '#00F0FF', fontSize: 13, fontWeight: '600' },

  loginBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  loginBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  loginBtnText: { color: '#080F1F', fontSize: 16, fontWeight: '800' },

  demoHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  demoHintText: { color: '#475569', fontSize: 12 },

  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  signupText: { color: '#94A3B8', fontSize: 14 },
  signupLink: { color: '#00F0FF', fontSize: 14, fontWeight: '700' },
});
