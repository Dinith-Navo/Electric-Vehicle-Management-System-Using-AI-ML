import { create } from 'zustand';

export interface Telemetry {
  soc: number;
  soh: number;
  temperature: number;
  voltage: number;
  current: number;
  efficiency: number;
  chargingCycles: number;
  chargingFrequency: number;
  isCharging: boolean;
  range: number;
  power: number;
}

export interface Prediction {
  batteryHealth: number;
  failureRisk: 'Low' | 'Medium' | 'High';
  predictedLife: string;
  maintenanceSuggestion: string;
  confidence: number;
  riskScore: number;
  insights: string[];
  failureProbability: number;
  remainingLifeMonths: number;
}

export interface Vehicle {
  _id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  batteryCapacity: number;
  color: string;
  licensePlate: string;
  odometer: number;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'warning' | 'critical' | 'info' | 'success';
  read: boolean;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
  memberSince: string;
}

interface AppState {
  isAuthenticated: boolean;
  token: string | null;
  userProfile: UserProfile | null;
  telemetry: Telemetry;
  prediction: Prediction;
  vehicles: Vehicle[];
  notifications: Notification[];
  darkMode: boolean;
  notificationsEnabled: boolean;
  isLiveConnected: boolean;

  login: (token: string, profile: UserProfile) => void;
  logout: () => void;
  setTelemetry: (telemetry: Partial<Telemetry>) => void;
  setPrediction: (prediction: Partial<Prediction>) => void;
  setVehicles: (vehicles: Vehicle[]) => void;
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (vehicle: Vehicle) => void;
  removeVehicle: (id: string) => void;
  setNotifications: (notifications: Notification[]) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (notification: Notification) => void;
  toggleDarkMode: () => void;
  toggleNotifications: () => void;
  setLiveConnected: (connected: boolean) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

const DEFAULT_TELEMETRY: Telemetry = {
  soc: 82,
  soh: 94,
  temperature: 31,
  voltage: 384,
  current: -12,
  efficiency: 3.8,
  chargingCycles: 156,
  chargingFrequency: 4.2,
  isCharging: false,
  range: 247,
  power: 4.6,
};

const DEFAULT_PREDICTION: Prediction = {
  batteryHealth: 88,
  failureRisk: 'Medium',
  predictedLife: '2.5 Years',
  maintenanceSuggestion: 'Reduce fast charging frequency to below 2x per week.',
  confidence: 91.4,
  riskScore: 42,
  insights: [
    'Battery degradation rate is 0.8% per month — within expected range.',
    'Temperature spikes detected during DC fast charging sessions.',
    'Regenerative braking efficiency improved by 4% this week.',
    'Charging at lower SoC levels will extend battery longevity.',
  ],
  failureProbability: 0.12,
  remainingLifeMonths: 42,
};

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: false,
  token: null,
  userProfile: null,
  telemetry: DEFAULT_TELEMETRY,
  prediction: DEFAULT_PREDICTION,
  vehicles: [],
  notifications: [],
  darkMode: true,
  notificationsEnabled: true,
  isLiveConnected: false,

  login: (token, profile) =>
    set({ isAuthenticated: true, token, userProfile: profile }),

  logout: () =>
    set({
      isAuthenticated: false,
      token: null,
      userProfile: null,
      vehicles: [],
      notifications: [],
      isLiveConnected: false,
    }),

  setTelemetry: (telemetry) =>
    set((state) => ({ telemetry: { ...state.telemetry, ...telemetry } })),

  setPrediction: (prediction) =>
    set((state) => ({ prediction: { ...state.prediction, ...prediction } })),

  setVehicles: (vehicles) => set({ vehicles }),

  addVehicle: (vehicle) =>
    set((state) => ({ vehicles: [...state.vehicles, vehicle] })),

  updateVehicle: (vehicle) =>
    set((state) => ({
      vehicles: state.vehicles.map((v) => (v._id === vehicle._id ? vehicle : v)),
    })),

  removeVehicle: (id) =>
    set((state) => ({
      vehicles: state.vehicles.filter((v) => v._id !== id),
    })),

  setNotifications: (notifications) => set({ notifications }),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n._id === id ? { ...n, read: true } : n
      ),
    })),

  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  addNotification: (notification) =>
    set((state) => ({ notifications: [notification, ...state.notifications] })),

  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

  toggleNotifications: () =>
    set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),

  setLiveConnected: (connected) => set({ isLiveConnected: connected }),

  updateProfile: (profile) =>
    set((state) => ({
      userProfile: state.userProfile
        ? { ...state.userProfile, ...profile }
        : null,
    })),
}));
