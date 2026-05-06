import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { useAppStore } from '../../store/useAppStore';

function TabIcon({
  name,
  color,
  focused,
  label,
  badge,
}: {
  name: any;
  color: string;
  focused: boolean;
  label: string;
  badge?: number;
}) {
  return (
    <View style={styles.iconContainer}>
      <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
        <Ionicons name={name} size={22} color={color} />
        {badge != null && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const notifications = useAppStore((s) => s.notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0D1B2A',
          borderTopWidth: 1,
          borderTopColor: '#1E293B',
          height: 70,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: '#00F0FF',
        tabBarInactiveTintColor: '#475569',
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-insights"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="pulse" color={color} focused={focused} label="AI" />
          ),
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="car-sport" color={color} focused={focused} label="Vehicles" />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="stats-chart" color={color} focused={focused} label="Analytics" />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="notifications"
              color={color}
              focused={focused}
              label="Alerts"
              badge={unreadCount}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person" color={color} focused={focused} label="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  iconWrapper: {
    width: 40,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
  },
  label: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
});
