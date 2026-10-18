import React from 'react';
import { View, Text, ScrollView, StyleSheet, Switch } from 'react-native';
import { Colors } from '../../constants/theme';

export const SettingsScreen = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>System Settings</Text>
      <Text style={styles.subtitle}>AI Engine & Notification Rules</Text>

      <View style={styles.card}>
        <Text style={styles.settingLabel}>Push Notifications (HIGH / CRITICAL)</Text>
        <Text style={styles.settingSub}>Trigger native FCM alert for serious anomalies</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginBottom: 16 },
  card: { backgroundColor: Colors.surfaceCard, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.surfaceBorder },
  settingLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  settingSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 }
});
