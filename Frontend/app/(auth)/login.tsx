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
import Colors from '../../constants/Colors';

function InputField({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  theme,
}: {
  icon: any;
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  theme: typeof Colors.dark;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{label}</Text>
      <View style={[styles.inputWrapper, { backgroundColor: theme.background, borderColor: theme.border }, focused && { borderColor: theme.accent, backgroundColor: `${theme.accent}05` }]}>
        <Ionicons name={icon} size={18} color={focused ? theme.accent : theme.textSecondary} />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'none'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function Login() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const darkMode = useAppStore((s) => s.darkMode);
  const theme = darkMode ? Colors.dark : Colors.light;

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
        token = res.access_token;
        if (res.user) {
          profile = res.user;
        }
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
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
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
            <LinearGradient colors={darkMode ? ['#00F0FF', '#0070A0'] : ['#0EA5E9', '#0284C7']} style={styles.logoCircle}>
              <Ionicons name="flash" size={36} color={darkMode ? '#080F1F' : '#FFFFFF'} />
            </LinearGradient>
            <Text style={[styles.appName, { color: theme.accent }]}>PSEVPIFPS</Text>
            <Text style={[styles.appTagline, { color: theme.textSecondary }]}>AI EV Performance Intelligence</Text>
          </View>
 
          {/* Card */}
          <Animated.View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, transform: [{ translateX: shakeAnim }] }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Welcome Back</Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Sign in to your EV dashboard</Text>
 
            <InputField
              icon="mail"
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              keyboardType="email-address"
              theme={theme}
            />
            <InputField
              icon="lock-closed"
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              theme={theme}
            />
 
            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={[styles.forgotText, { color: theme.accent }]}>Forgot Password?</Text>
            </TouchableOpacity>
 
            <TouchableOpacity onPress={handleLogin} disabled={loading} style={styles.loginBtn}>
              <LinearGradient
                colors={loading ? [theme.border, theme.border] : (darkMode ? ['#00F0FF', '#007A90'] : ['#0EA5E9', '#0284C7'])}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator color={theme.text} />
                ) : (
                  <>
                    <Ionicons name="log-in" size={20} color={darkMode ? '#080F1F' : '#FFFFFF'} />
                    <Text style={[styles.loginBtnText, { color: darkMode ? '#080F1F' : '#FFFFFF' }]}>Sign In</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
 
            {/* Demo hint */}
            <View style={styles.demoHint}>
              <Ionicons name="information-circle" size={14} color={theme.textSecondary} />
              <Text style={[styles.demoHintText, { color: theme.textSecondary }]}>Demo: demo@ev.com / demo1234</Text>
            </View>
          </Animated.View>
 
          {/* Sign Up Link */}
          <View style={styles.signupRow}>
            <Text style={[styles.signupText, { color: theme.textSecondary }]}>Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={[styles.signupLink, { color: theme.accent }]}>Create Account</Text>
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
  appName: { fontSize: 28, fontWeight: '900', letterSpacing: 3 },
  appTagline: { fontSize: 13, marginTop: 6, letterSpacing: 0.5 },

  card: { borderRadius: 24, padding: 24, borderWidth: 1 },
  cardTitle: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, marginBottom: 24 },

  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  input: { flex: 1, fontSize: 15 },

  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { fontSize: 13, fontWeight: '600' },

  loginBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  loginBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  loginBtnText: { fontSize: 16, fontWeight: '800' },

  demoHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  demoHintText: { fontSize: 12 },

  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  signupText: { fontSize: 14 },
  signupLink: { fontSize: 14, fontWeight: '700' },
});
