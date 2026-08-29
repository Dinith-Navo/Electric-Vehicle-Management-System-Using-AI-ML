import axios from "axios";
import { Platform } from "react-native";

// Automatically choose suitable backend host:
// - Android Emulator: 10.0.2.2
// - Web / iOS Simulator / Default: localhost
const getBaseUrl = () => {
  if (Platform.OS === "android") {
    // For Android emulator; if physical device, replace with machine LAN IP e.g. 192.168.x.x
    return "http://10.0.2.2:8000/api/ev-optimization";
  }
  return "http://localhost:8000/api/ev-optimization";
};

export const API_BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

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
}

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

export default api;
