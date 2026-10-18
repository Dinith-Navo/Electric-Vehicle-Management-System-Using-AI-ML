import axios from 'axios';
import Constants from 'expo-constants';
import { Telemetry } from '../types/telemetry';
import { 
  AnomalyResponse, 
  StandardApiResponse, 
  GenomeRecord, 
  GenomeMatch, 
  AdversarialCampaignResult, 
  DigitalTwinDeviation 
} from '../types/anomaly';

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
  },

  getGenomeStrains: async (): Promise<GenomeRecord[]> => {
    const res = await apiClient.get<StandardApiResponse<GenomeRecord[]>>('/anomaly/genome/strains');
    return res.data.data || [];
  },

  matchFingerprint: async (embeddingVector: number[]): Promise<GenomeMatch[]> => {
    const res = await apiClient.post<StandardApiResponse<GenomeMatch[]>>('/anomaly/genome/match', {
      embeddingVector,
      topK: 3,
      threshold: 0.45
    });
    return res.data.data || [];
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

export const adversarialApi = {
  runCampaign: async (attackType: string = 'FGSM', epsilon: number = 0.20, steps: number = 6): Promise<AdversarialCampaignResult> => {
    const res = await apiClient.post<StandardApiResponse<AdversarialCampaignResult>>('/adversarial/test', {
      attackType,
      epsilon,
      steps
    });
    return res.data.data!;
  },

  getRobustnessReport: async (): Promise<AdversarialCampaignResult> => {
    const res = await apiClient.get<StandardApiResponse<AdversarialCampaignResult>>('/adversarial/robustness-report');
    return res.data.data!;
  }
};

export const vehiclesApi = {
  getTwinProfile: async (vehicleId: string = 'EV-001'): Promise<any> => {
    const res = await apiClient.get<StandardApiResponse<any>>(`/vehicles/${vehicleId}/twin-profile`);
    return res.data.data;
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

export const assistantApi = {
  chat: async (
    messageOrPayload: string | { message: string; history?: any[]; user_id?: string; language?: string; model?: string },
    history?: any[]
  ) => {
    const payload = typeof messageOrPayload === 'string'
      ? { message: messageOrPayload, history: history || [] }
      : messageOrPayload;
    const res = await apiClient.post<StandardApiResponse<any>>('/assistant/chat', payload);
    return res.data.data;
  },
  transcribe: async (formData: any) => {
    const res = await apiClient.post<StandardApiResponse<any>>('/assistant/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.data;
  },
  getHealth: async () => {
    const res = await apiClient.get<StandardApiResponse<any>>('/assistant/health');
    return res.data.data;
  }
};
