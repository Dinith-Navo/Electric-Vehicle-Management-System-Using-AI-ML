import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../store/useAppStore';

export default function Login() {
  const router = useRouter();
  const login = useAppStore((state) => state.login);

  const handleLogin = () => {
    login('EV_OWNER');
    router.replace('/(tabs)/dashboard');
  };

  return (
    <View className="flex-1 bg-bgPrimary justify-center px-6">
      <View className="items-center mb-12">
        <Text className="text-accent text-4xl font-bold tracking-widest">PSEVPIFPS</Text>
        <Text className="text-textMuted text-base mt-2">AI Performance Intelligence</Text>
      </View>

      <View className="space-y-4">
        <View className="bg-bgSecondary rounded-xl border border-accent/20 px-4 py-3">
          <Text className="text-textMuted text-xs mb-1">Email Address</Text>
          <TextInput 
            className="text-textMain text-base"
            placeholder="owner@ev.com"
            placeholderTextColor="#64748B"
          />
        </View>

        <View className="bg-bgSecondary rounded-xl border border-accent/20 px-4 py-3">
          <Text className="text-textMuted text-xs mb-1">Password</Text>
          <TextInput 
            className="text-textMain text-base"
            placeholder="••••••••"
            placeholderTextColor="#64748B"
            secureTextEntry
          />
        </View>
      </View>

      <TouchableOpacity 
        onPress={handleLogin}
        className="bg-accent rounded-xl py-4 mt-8 shadow-lg shadow-accent/20 items-center"
      >
        <Text className="text-bgPrimary font-bold text-lg">Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}
