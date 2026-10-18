import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Activity, ShieldAlert, Cpu } from 'lucide-react-native';

import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { LiveMonitoringScreen } from '../screens/Monitoring/LiveMonitoringScreen';
import { AIAnalysisScreen } from '../screens/Monitoring/AIAnalysisScreen';
import { AnomalyListScreen } from '../screens/Anomalies/AnomalyListScreen';
import { AnomalyDetailScreen } from '../screens/Anomalies/AnomalyDetailScreen';
import { AnomalyDNAScreen } from '../screens/Anomalies/AnomalyDNAScreen';
import { ResearchModeScreen } from '../screens/Research/ResearchModeScreen';
import { ModelComparisonScreen } from '../screens/Research/ModelComparisonScreen';
import { AdversarialLabScreen } from '../screens/Research/AdversarialLabScreen';
import { SimulatorScreen } from '../screens/Simulator/SimulatorScreen';
import { Colors } from '../constants/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MonitoringStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LiveMonitoring" component={LiveMonitoringScreen} />
      <Stack.Screen name="AIAnalysis" component={AIAnalysisScreen} />
      <Stack.Screen name="Simulator" component={SimulatorScreen} />
    </Stack.Navigator>
  );
}

function AnomalyStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AnomalyList" component={AnomalyListScreen} />
      <Stack.Screen name="AnomalyDetail" component={AnomalyDetailScreen} />
      <Stack.Screen name="AnomalyDNA" component={AnomalyDNAScreen} />
    </Stack.Navigator>
  );
}

function ResearchStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ResearchHome" component={ResearchModeScreen} />
      <Stack.Screen name="ModelComparison" component={ModelComparisonScreen} />
      <Stack.Screen name="AdversarialLab" component={AdversarialLabScreen} />
    </Stack.Navigator>
  );
}

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.surfaceBorder,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8
        }
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />
        }}
      />
      <Tab.Screen
        name="LiveTab"
        component={MonitoringStack}
        options={{
          tabBarLabel: 'Live Stream',
          tabBarIcon: ({ color, size }) => <Activity size={size} color={color} />
        }}
      />
      <Tab.Screen
        name="AnomaliesTab"
        component={AnomalyStack}
        options={{
          tabBarLabel: 'Forensics Vault',
          tabBarIcon: ({ color, size }) => <ShieldAlert size={size} color={color} />
        }}
      />
      <Tab.Screen
        name="ResearchTab"
        component={ResearchStack}
        options={{
          tabBarLabel: 'AI Research',
          tabBarIcon: ({ color, size }) => <Cpu size={size} color={color} />
        }}
      />
    </Tab.Navigator>
  );
}
