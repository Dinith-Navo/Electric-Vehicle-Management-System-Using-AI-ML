import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Profile() {
  const logout = useAppStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView className="flex-1 bg-bgPrimary px-4 pt-12">
      <View className="mb-8">
        <Text className="text-textMain text-3xl font-bold tracking-wider">Profile</Text>
        <Text className="text-textMuted text-sm font-medium mt-1">Manage your account & EV</Text>
      </View>

      <View className="items-center mb-8">
        <View className="w-24 h-24 bg-bgSecondary rounded-full border-2 border-accent items-center justify-center mb-4">
          <Ionicons name="person" size={48} color="#00F0FF" />
        </View>
        <Text className="text-textMain text-xl font-bold">EV Owner</Text>
        <Text className="text-textMuted">owner@ev.com</Text>
      </View>

      <View className="space-y-4 mb-8">
        <TouchableOpacity className="bg-bgSecondary border border-white/5 p-4 rounded-xl flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Ionicons name="car" size={20} color="#F8FAFC" />
            <Text className="text-textMain ml-3 font-medium">Vehicle Management</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity className="bg-bgSecondary border border-white/5 p-4 rounded-xl flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Ionicons name="notifications" size={20} color="#F8FAFC" />
            <Text className="text-textMain ml-3 font-medium">Notification Preferences</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity className="bg-bgSecondary border border-white/5 p-4 rounded-xl flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Ionicons name="moon" size={20} color="#F8FAFC" />
            <Text className="text-textMain ml-3 font-medium">Dark Mode</Text>
          </View>
          <Ionicons name="toggle" size={28} color="#00F0FF" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        onPress={handleLogout}
        className="bg-critical/20 border border-critical p-4 rounded-xl items-center flex-row justify-center"
      >
        <Ionicons name="log-out" size={20} color="#EF4444" />
        <Text className="text-critical font-bold ml-2">Secure Logout</Text>
      </TouchableOpacity>
      
      <View className="h-10"></View>
    </ScrollView>
  );
}
