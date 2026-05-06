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

export default function Register() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const darkMode = useAppStore((s) => s.darkMode);
  const theme = darkMode ? Colors.dark : Colors.light;

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
              <Ionicons name="person-add" size={32} color={darkMode ? '#080F1F' : '#FFFFFF'} />
            </LinearGradient>
            <Text style={[styles.appName, { color: theme.accent }]}>PSEVPIFPS</Text>
            <Text style={[styles.appTagline, { color: theme.textSecondary }]}>Join the Future of EV Intelligence</Text>
          </View>
 
          {/* Card */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Create Account</Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Start monitoring your EV performance</Text>
 
            <InputField
              icon="person"
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="John Doe"
              theme={theme}
            />
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
              placeholder="Min. 6 characters"
              secureTextEntry
              theme={theme}
            />
            <InputField
              icon="shield-checkmark"
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat password"
              secureTextEntry
              theme={theme}
            />
 
            <TouchableOpacity onPress={handleRegister} disabled={loading} style={styles.registerBtn}>
              <LinearGradient
                colors={loading ? [theme.border, theme.border] : (darkMode ? ['#00F0FF', '#007A90'] : ['#0EA5E9', '#0284C7'])}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.registerBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator color={theme.text} />
                ) : (
                  <>
                    <Ionicons name="rocket" size={20} color={darkMode ? '#080F1F' : '#FFFFFF'} />
                    <Text style={[styles.registerBtnText, { color: darkMode ? '#080F1F' : '#FFFFFF' }]}>Sign Up</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
 
          {/* Sign In Link */}
          <View style={styles.loginRow}>
            <Text style={[styles.signupText, { color: theme.textSecondary }]}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={[styles.signupLink, { color: theme.accent }]}>Sign In</Text>
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

  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoCircle: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  appName: { fontSize: 28, fontWeight: '900', letterSpacing: 3 },
  appTagline: { fontSize: 13, marginTop: 6, letterSpacing: 0.5 },

  card: { borderRadius: 24, padding: 24, borderWidth: 1 },
  cardTitle: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, marginBottom: 24 },

  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  input: { flex: 1, fontSize: 15 },

  registerBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8, marginBottom: 8 },
  registerBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  registerBtnText: { fontSize: 16, fontWeight: '800' },

  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  signupText: { fontSize: 14 },
  signupLink: { fontSize: 14, fontWeight: '700' },
});
