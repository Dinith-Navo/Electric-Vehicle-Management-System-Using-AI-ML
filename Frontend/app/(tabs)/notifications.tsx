import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Animated,
  Alert,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useAppStore, Notification } from '../../store/useAppStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { notificationService } from '../../services';
import Colors from '../../constants/Colors';

function NotificationCard({ item, onRead, theme }: { item: Notification; onRead: (id: string) => void; theme: typeof Colors.dark }) {
  const TYPE_CONFIG = {
    critical: { icon: 'alert-circle' as const, color: theme.danger, bg: `${theme.danger}22` },
    warning: { icon: 'warning' as const, color: theme.warning, bg: `${theme.warning}22` },
    success: { icon: 'checkmark-circle' as const, color: theme.success, bg: `${theme.success}22` },
    info: { icon: 'information-circle' as const, color: theme.accent, bg: `${theme.accent}22` },
  };

  const config = TYPE_CONFIG[item.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.info;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      return date.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <Animated.View style={{ opacity }}>
      <TouchableOpacity
        onPress={() => onRead(item._id)}
        style={[
          styles.notifCard, 
          { backgroundColor: theme.card, borderColor: theme.border },
          !item.read && { borderColor: `${theme.accent}44`, backgroundColor: `${theme.accent}08` }
        ]}
        activeOpacity={0.7}
      >
        <View style={[styles.notifIcon, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon} size={20} color={config.color} />
        </View>
        <View style={styles.notifContent}>
          <View style={styles.notifHeader}>
            <Text style={[styles.notifTitle, { color: theme.text }]}>{item.title}</Text>
            <View style={[styles.priorityBadge, { borderColor: item.priority === 'high' ? theme.danger : theme.textSecondary }]}>
              <Text style={[styles.priorityText, { color: item.priority === 'high' ? theme.danger : theme.textSecondary }]}>
                {(item.priority || 'medium').toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={[styles.notifMessage, { color: theme.textSecondary }]}>{item.message}</Text>
          <Text style={[styles.notifTime, { color: theme.textSecondary }]}>{formatDate(item.timestamp)}</Text>
        </View>
        {!item.read && <View style={[styles.unreadDot, { backgroundColor: theme.accent }]} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

function AuthGuard({ onLogin, theme, darkMode }: { onLogin: () => void; theme: typeof Colors.dark; darkMode: boolean }) {
  return (
    <View style={styles.guardContainer}>
      <LinearGradient colors={darkMode ? ['#0D1B2A', '#1A2744'] : ['#FFFFFF', '#F1F5F9']} style={[styles.guardCard, { borderColor: `${theme.accent}33` }]}>
        <View style={[styles.guardIconCircle, { backgroundColor: `${theme.accent}15` }]}>
          <Ionicons name="notifications-off" size={32} color={theme.accent} />
        </View>
        <Text style={[styles.guardTitle, { color: theme.text }]}>Unlock Live Alerts</Text>
        <Text style={[styles.guardMessage, { color: theme.textSecondary }]}>Sign in to receive real-time failure predictions and critical battery health notifications.</Text>
        <TouchableOpacity onPress={onLogin} style={styles.guardBtn}>
          <LinearGradient colors={darkMode ? ['#00F0FF', '#0090A0'] : ['#0EA5E9', '#0284C7']} style={styles.guardBtnGradient}>
            <Text style={[styles.guardBtnText, { color: darkMode ? '#080F1F' : '#FFFFFF' }]}>Join Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

export default function Notifications() {
  const router = useRouter();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const token = useAppStore((s) => s.token);
  const notifications = useAppStore((s) => s.notifications);
  const darkMode = useAppStore((s) => s.darkMode);
  const theme = darkMode ? Colors.dark : Colors.light;
  const setNotifications = useAppStore((s) => s.setNotifications);
  const markAsReadLocally = useAppStore((s) => s.markNotificationRead);
  const markAllReadLocally = useAppStore((s) => s.markAllNotificationsRead);

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchNotifications();
    }
  }, [isAuthenticated, token]);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const data = await notificationService.getAll(token);
      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      } else if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleMarkRead = async (id: string) => {
    markAsReadLocally(id); // Optimistic update
    if (token) {
      try {
        await notificationService.markRead(token, id);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
  };

  const handleMarkAllRead = async () => {
    markAllReadLocally(); // Optimistic update
    Alert.alert('Success', 'All notifications have been marked as read.');
    if (token) {

      try {
        await notificationService.markAllRead(token);
      } catch (error) {
        console.error('Failed to mark all notifications as read:', error);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const filteredNotifs = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Alerts</Text>
          </View>
          <AuthGuard onLogin={() => router.replace('/login')} theme={theme} darkMode={darkMode} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>Alerts</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{notifications.filter(n => !n.read).length} Unread Notifications</Text>
          </View>
          <TouchableOpacity onPress={handleMarkAllRead} style={[styles.clearBtn, { backgroundColor: `${theme.accent}15` }]}>
            <Text style={[styles.clearBtnText, { color: theme.accent }]}>Mark all read</Text>
          </TouchableOpacity>
        </View>
 
        {/* Filter */}
        <View style={styles.filterBar}>
          <TouchableOpacity
            onPress={() => setFilter('all')}
            style={[styles.filterTab, { backgroundColor: theme.card, borderColor: theme.border }, filter === 'all' && { backgroundColor: theme.border, borderColor: theme.accent }]}
          >
            <Text style={[styles.filterText, { color: theme.textSecondary }, filter === 'all' && { color: theme.accent }]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('unread')}
            style={[styles.filterTab, { backgroundColor: theme.card, borderColor: theme.border }, filter === 'unread' && { backgroundColor: theme.border, borderColor: theme.accent }]}
          >
            <Text style={[styles.filterText, { color: theme.textSecondary }, filter === 'unread' && { color: theme.accent }]}>Unread</Text>
          </TouchableOpacity>
        </View>
 
        {/* List */}
        <FlatList
          data={filteredNotifs}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <NotificationCard item={item} onRead={handleMarkRead} theme={theme} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={64} color={theme.border} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No notifications found</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#080F1F' },
  container: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 20 },
  title: { color: '#F8FAFC', fontSize: 26, fontWeight: '800' },
  subtitle: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
  clearBtn: { backgroundColor: 'rgba(0,240,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  clearBtnText: { color: '#00F0FF', fontSize: 12, fontWeight: '700' },

  filterBar: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#0D1B2A', borderWidth: 1, borderColor: '#1E293B' },
  filterActive: { backgroundColor: '#1E293B', borderColor: '#00F0FF' },
  filterText: { color: '#475569', fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#00F0FF' },

  listContent: { paddingBottom: 20 },
  notifCard: { flexDirection: 'row', backgroundColor: '#0D1B2A', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1E293B', alignItems: 'flex-start' },
  unreadCard: { borderColor: 'rgba(0,240,255,0.3)', backgroundColor: 'rgba(0,240,255,0.02)' },
  notifIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '700' },
  priorityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  priorityText: { fontSize: 8, fontWeight: '900' },
  notifMessage: { color: '#94A3B8', fontSize: 13, lineHeight: 18, marginBottom: 8 },
  notifTime: { color: '#475569', fontSize: 11 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00F0FF', marginLeft: 8, marginTop: 4 },

  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: '#475569', fontSize: 16, marginTop: 16 },

  guardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  guardCard: { width: '100%', borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,240,255,0.2)' },
  guardIconCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(0,240,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  guardTitle: { color: '#F8FAFC', fontSize: 22, fontWeight: '800', marginBottom: 12 },
  guardMessage: { color: '#94A3B8', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  guardBtn: { width: '100%', borderRadius: 14, overflow: 'hidden' },
  guardBtnGradient: { paddingVertical: 16, alignItems: 'center' },
  guardBtnText: { color: '#080F1F', fontSize: 16, fontWeight: '800' },
});
