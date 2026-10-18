import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Bell, ShieldAlert, CheckCircle2 } from 'lucide-react-native';
import { Colors } from '../../constants/theme';

export const NotificationsScreen = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Notification Center</Text>
      <Text style={styles.subtitle}>Firebase FCM Push Alerts (HIGH & CRITICAL Events)</Text>

      <View style={styles.card}>
        <View style={styles.nHeader}>
          <ShieldAlert size={18} color="#ef4444" />
          <Text style={styles.nTitle}>HIGH Severity Anomaly Alert</Text>
        </View>
        <Text style={styles.nBody}>Potential motor thermal elevation detected on vehicle EV-001.</Text>
        <Text style={styles.nTime}>Today at 1:40 PM</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginBottom: 16 },
  card: { backgroundColor: Colors.surfaceCard, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.surfaceBorder, marginBottom: 10 },
  nHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  nTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginLeft: 8 },
  nBody: { fontSize: 12, color: Colors.textSecondary, marginBottom: 6 },
  nTime: { fontSize: 10, color: Colors.textMuted }
});
