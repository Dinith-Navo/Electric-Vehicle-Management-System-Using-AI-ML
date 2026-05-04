import { create } from 'zustand';

export interface Telemetry {
  soc: number;
  soh: number;
  temp: number;
  voltage: number;
  current: number;
  efficiency: number;
}

export interface Prediction {
  batteryHealth: number;
  failureRisk: string;
  predictedLife: string;
  maintenanceSuggestion: string;
}

interface AppState {
  isAuthenticated: boolean;
  userRole: string | null;
  telemetry: Telemetry;
  prediction: Prediction;
  login: (role: string) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: false,
  userRole: null,
  telemetry: { soc: 82, soh: 94, temp: 31, voltage: 384, current: -12, efficiency: 3.8 },
  prediction: {
    batteryHealth: 88,
    failureRisk: "Medium",
    predictedLife: "2.5 Years",
    maintenanceSuggestion: "Reduce fast charging frequency"
  },
  login: (role) => set({ isAuthenticated: true, userRole: role }),
  logout: () => set({ isAuthenticated: false, userRole: null }),
}));
