/* eslint-disable import/no-named-as-default-member */
import axios from "axios";
import { Platform } from "react-native";
import { tokenStorage } from "./tokenStorage";

// Automatically choose suitable backend host:
// 1. Web browser: prioritize window.location.hostname
// 2. Explicit EXPO_PUBLIC_API_URL from environment (.env / .env.local)
// 3. Physical device LAN auto-discovery from Expo runtime (Constants.expoConfig.hostUri)
// 4. Android Emulator default: 10.0.2.2
// 5. Default fallback: localhost
const getRootHost = () => {
  // 1. Web browser: use current hostname so web clients never point to a stale IP
  if (Platform.OS === "web" && typeof window !== "undefined") {
    const host = window.location?.hostname || "localhost";
    const protocol = window.location?.protocol || "http:";
    return `${protocol}//${host}:8000`;
  }

  // 2. Explicit EXPO_PUBLIC_API_URL from environment (.env / .env.local) if valid and not empty
  if (process.env.EXPO_PUBLIC_API_URL) {
    const envUrl = process.env.EXPO_PUBLIC_API_URL.replace(/\/api\/ev-optimization\/?$/, "").replace(/\/+$/, "");
    if (envUrl) {
      return envUrl;
    }
  }

  // 3. Auto-detect LAN IP on physical Android / iOS devices running Expo Go
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require("expo-constants").default || require("expo-constants");
    const hostUri = Constants?.expoConfig?.hostUri || Constants?.manifest2?.extra?.expoClient?.hostUri || Constants?.manifest?.debuggerHost;
    if (hostUri && typeof hostUri === "string") {
      const hostIp = hostUri.split(":")[0];
      if (hostIp && hostIp !== "localhost" && hostIp !== "127.0.0.1") {
        return `http://${hostIp}:8000`;
      }
    }
  } catch {}

  // 4. Android Emulator loopback
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8000";
  }

  return "http://localhost:8000";
};

export const ROOT_API_URL = getRootHost();
export const API_BASE_URL = `${ROOT_API_URL}/api/ev-optimization`;

const getWsUrl = () => {
  const wsBase = API_BASE_URL.replace(/^http:\/\//i, "ws://").replace(/^https:\/\//i, "wss://");
  return `${wsBase.replace(/\/+$/, "")}/ws`;
};

export const WS_BASE_URL = getWsUrl();

export interface ConnectorUpdateMessage {
  type: "CONNECTOR_STATUS_CHANGED";
  stationId: string;
  connectorId: string;
  status: "available" | "occupied" | "charging" | "faulted" | "out_of_service";
  ports: {
    type: string;
    available: number;
    total: number;
    powerKw: number;
    pricePerKWh?: number;
  }[];
  timestamp: string;
}

// EV Optimization sub-router client
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Root app API client (auth, components 1-3, telemetry, vehicles)
export const rootApi = axios.create({
  baseURL: `${ROOT_API_URL}/api`,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach bearer token automatically if available
const attachAuthInterceptor = async (config: any) => {
  try {
    const token = await tokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
};

// Response interceptor: automatically refresh expired access token once on 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const handleAuthErrorResponse = async (error: any, axiosInstance: typeof api) => {
  const originalRequest = error?.config;
  if (!originalRequest) {
    return Promise.reject(error);
  }

  if (
    error.response?.status === 401 &&
    !originalRequest._retry &&
    !originalRequest.url?.includes("/auth/login") &&
    !originalRequest.url?.includes("/auth/refresh")
  ) {
    originalRequest._retry = true;
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      const currentRefresh = await tokenStorage.getRefreshToken();
      if (!currentRefresh) {
        throw new Error("No refresh token available");
      }
      const refreshResp = await axios.post(`${ROOT_API_URL}/api/auth/refresh`, {
        refresh_token: currentRefresh,
      });
      const newAccessToken = refreshResp.data?.access_token;
      const newRefreshToken = refreshResp.data?.refresh_token;
      if (newAccessToken) {
        await tokenStorage.saveTokens(newAccessToken, newRefreshToken, refreshResp.data?.user);
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      }
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      await tokenStorage.clearTokens();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
  return Promise.reject(error);
};

api.interceptors.request.use(attachAuthInterceptor);
rootApi.interceptors.request.use(attachAuthInterceptor);

api.interceptors.response.use((r) => r, (err) => handleAuthErrorResponse(err, api));
rootApi.interceptors.response.use((r) => r, (err) => handleAuthErrorResponse(err, rootApi));

export interface RangePredictInput {
  soc: number;
  batteryCapacityKWh: number;
  speedKmH: number;
  temperatureC: number;
  energyConsumptionKWhPer100Km?: number;
  acOn?: boolean;
  drivingMode?: string;
  vehicleModel?: string;
}

export interface QueuePredictInput {
  stationId: string;
  totalChargers?: number;
  currentlyOccupied?: number;
  arrivalHour?: number;
  dayOfWeek?: number;
  chargingSpeedKw?: number;
}

export interface RouteOptimizeInput {
  originLat: number;
  originLon: number;
  originName?: string;
  destLat: number;
  destLon: number;
  destName?: string;
  currentSoc: number;
  batteryCapacityKWh: number;
  consumptionKWhPer100Km: number;
}

export interface ChargingEstimateInput {
  batteryCapacityKWh: number;
  currentSoc: number;
  targetSoc: number;
  chargerPowerKw: number;
  efficiency?: number;
}

export interface CostEstimateInput {
  energyKWh: number;
  pricePerKWh?: number;
  taxRate?: number;
  serviceFee?: number;
}

export interface StationFilterParams {
  maxDistanceKm?: number;
  minPowerKw?: number;
  maxPricePerKWh?: number;
  connectorType?: string;
  minRating?: number;
  onlyAvailable?: boolean;
  availableOnly?: boolean;
  userLat?: number;
  userLon?: number;
  sortBy?: string;
  search?: string;
  query?: string;
}

// -------------------------------------------------------------
// Component 4: Intelligent EV Charging & Range APIs
// -------------------------------------------------------------
export const evOptimizationApi = {
  getDashboard: async (lat = 6.9271, lon = 79.8612) => {
    const res = await api.get(`/dashboard?userLat=${lat}&userLon=${lon}`);
    return res.data;
  },

  predictRange: async (data: RangePredictInput) => {
    const res = await api.post("/range/predict", data);
    return res.data;
  },

  getStations: async (filters?: StationFilterParams) => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.maxDistanceKm) params.append("maxDistanceKm", filters.maxDistanceKm.toString());
      if (filters.minPowerKw) params.append("minPowerKw", filters.minPowerKw.toString());
      if (filters.maxPricePerKWh) params.append("maxPricePerKWh", filters.maxPricePerKWh.toString());
      if (filters.connectorType) params.append("connectorType", filters.connectorType);
      if (filters.minRating) params.append("minRating", filters.minRating.toString());
      if (filters.availableOnly !== undefined) {
        if (filters.availableOnly) params.append("availableOnly", "true");
      } else if (filters.onlyAvailable) {
        params.append("onlyAvailable", "true");
      }
      if (filters.userLat) params.append("userLat", filters.userLat.toString());
      if (filters.userLon) params.append("userLon", filters.userLon.toString());
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.search) params.append("search", filters.search);
      if (filters.query) params.append("query", filters.query);
    }
    const res = await api.get(`/stations?${params.toString()}`);
    return res.data;
  },

  getStationById: async (id: string, lat = 6.9271, lon = 79.8612) => {
    const res = await api.get(`/stations/${id}?userLat=${lat}&userLon=${lon}`);
    return res.data;
  },

  predictQueue: async (data: QueuePredictInput) => {
    const res = await api.post("/queue/predict", data);
    return res.data;
  },

  optimizeRoute: async (data: RouteOptimizeInput) => {
    const res = await api.post("/route/optimize", data);
    return res.data;
  },

  estimateChargingTime: async (data: ChargingEstimateInput) => {
    const res = await api.post("/charging/estimate", data);
    return res.data;
  },

  estimateCost: async (data: CostEstimateInput) => {
    const res = await api.post("/cost/estimate", data);
    return res.data;
  },

  getMonthlyCostSummary: async (month?: string, year?: number) => {
    let url = "/cost/monthly";
    const params = new URLSearchParams();
    if (month) params.append("month", month);
    if (year) params.append("year", year.toString());
    if (params.toString()) url += `?${params.toString()}`;
    const res = await api.get(url);
    return res.data;
  },
};

// -------------------------------------------------------------
// Authentication APIs
// -------------------------------------------------------------
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await rootApi.post("/auth/login", { email, password });
    if (res.data?.access_token) {
      await tokenStorage.saveTokens(res.data.access_token, res.data.refresh_token, res.data.user);
    }
    return res.data;
  },

  register: async (name: string, email: string, password: string, role = "customer") => {
    const res = await rootApi.post("/auth/register", { name, email, password, role });
    if (res.data?.access_token) {
      await tokenStorage.saveTokens(res.data.access_token, res.data.refresh_token, res.data.user);
    }
    return res.data;
  },

  getMe: async () => {
    const res = await rootApi.get("/auth/me");
    return res.data;
  },

  logout: async () => {
    try {
      await rootApi.post("/auth/logout");
    } catch (e) {
      // ignore
    } finally {
      await tokenStorage.clearTokens();
    }
  }
};

// -------------------------------------------------------------
// Research Components 1, 2, 3 APIs
// -------------------------------------------------------------
export const researchComponentsApi = {
  // Component 1: Failure Prediction & Performance Intelligence
  analyzeFailureRisk: async (payload: {
    motorTemperatureC: number;
    inverterEfficiency: number;
    cellVoltageDeltaV: number;
    vibrationRmsG: number;
    ambientTemperatureC?: number;
    mileageKm?: number;
    operatingHours?: number;
  }) => {
    const res = await rootApi.post("/failure-prediction/analyze", payload);
    return res.data;
  },

  getQuickFailureStatus: async () => {
    const res = await rootApi.get("/failure-prediction/quick-status");
    return res.data;
  },

  // Component 2: Adaptive Battery Health Estimation
  predictBatteryHealth: async (payload: {
    batteryCapacityKWh: number;
    totalMileageKm: number;
    chargingCycles: number;
    avgTemperatureC: number;
    fastChargingPercent: number;
    vehicleAgeYears: number;
    drivingAggressiveness?: string;
  }) => {
    const res = await rootApi.post("/battery-health/predict", payload);
    return res.data;
  },

  // Component 3: Intelligent EV Problem Diagnosis
  diagnoseProblem: async (payload: {
    description: string;
    symptomCategory?: string;
    obdCode?: string;
    warningLights?: string[];
    batterySoc?: number;
  }) => {
    const res = await rootApi.post("/diagnostics/analyze", payload);
    return res.data;
  },

  // Vehicle Management
  getUserVehicles: async () => {
    const res = await rootApi.get("/vehicles");
    return res.data;
  },

  addVehicle: async (vehicle: {
    model: string;
    manufacturer: string;
    batteryType: string;
    batteryCapacityKWh: number;
    year: number;
    vin: string;
  }) => {
    const res = await rootApi.post("/vehicles", vehicle);
    return res.data;
  },

  // Telemetry Ingestion & History
  getTelemetryHistory: async (limit = 15) => {
    const res = await rootApi.get(`/telemetry/history?limit=${limit}`);
    return res.data;
  },

  sendTelemetry: async (telemetry: any) => {
    const res = await rootApi.post("/telemetry", telemetry);
    return res.data;
  }
};

export default api;
