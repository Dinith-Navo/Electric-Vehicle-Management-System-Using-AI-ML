import axios from 'axios';
import Constants from 'expo-constants';
import { Telemetry } from '../types/telemetry';
import { AnomalyResponse, StandardApiResponse } from '../types/anomaly';

const getBackendUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:8000/api/v1`;
  }
  return 'http://localhost:8000/api/v1';
};

export const API_BASE_URL = getBackendUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

export const anomalyApi = {
  detect: async (telemetry: Telemetry): Promise<AnomalyResponse> => {
    const res = await apiClient.post<StandardApiResponse<AnomalyResponse>>('/anomaly/detect', telemetry);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.error?.message || 'Failed to analyze telemetry');
    }
    return res.data.data;
  },

  list: async (vehicleId?: string, limit: number = 50): Promise<AnomalyResponse[]> => {
    const res = await apiClient.get<StandardApiResponse<AnomalyResponse[]>>('/anomaly/list', {
      params: { vehicleId, limit }
    });
    return res.data.data || [];
  },

  getById: async (anomalyId: string): Promise<AnomalyResponse> => {
    const res = await apiClient.get<StandardApiResponse<AnomalyResponse>>(`/anomaly/${anomalyId}`);
    if (!res.data.data) throw new Error('Anomaly record not found');
    return res.data.data;
  }
};

export const telemetryApi = {
  getLatest: async (vehicleId: string = 'EV-001'): Promise<Telemetry> => {
    const res = await apiClient.get<StandardApiResponse<Telemetry>>('/telemetry/latest', {
      params: { vehicleId }
    });
    return res.data.data!;
  },

  store: async (telemetry: Telemetry): Promise<void> => {
    await apiClient.post('/telemetry', telemetry);
  }
};

export const analyticsApi = {
  getSummary: async (vehicleId: string = 'EV-001') => {
    const res = await apiClient.get<StandardApiResponse<any>>('/analytics/summary', {
      params: { vehicleId }
    });
    return res.data.data;
  },

  getTrends: async (vehicleId: string = 'EV-001') => {
    const res = await apiClient.get<StandardApiResponse<any>>('/analytics/trends', {
      params: { vehicleId }
    });
    return res.data.data;
  }
};

export const researchApi = {
  getModelComparison: async () => {
    const res = await apiClient.get<StandardApiResponse<any>>('/research/model-comparison');
    return res.data.data;
  },

  getAblationStudy: async () => {
    const res = await apiClient.get<StandardApiResponse<any>>('/research/ablation');
    return res.data.data;
  },

  inspectPipeline: async (telemetry: Telemetry) => {
    const res = await apiClient.post<StandardApiResponse<any>>('/research/inspect', telemetry);
    return res.data.data;
  }
};
