import api, { withAuth, ML_URL } from './api';
import axios from 'axios';

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authService = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  register: async (name: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { name, email, password });
    return res.data;
  },
};

// ─── Vehicles ─────────────────────────────────────────────────────────────────
export const vehicleService = {
  getAll: async (token: string) => {
    const res = await withAuth(token).get('/vehicles');
    return res.data;
  },
  create: async (token: string, data: object) => {
    const res = await withAuth(token).post('/vehicles', data);
    return res.data;
  },
  update: async (token: string, id: string, data: object) => {
    const res = await withAuth(token).put(`/vehicles/${id}`, data);
    return res.data;
  },
  remove: async (token: string, id: string) => {
    const res = await withAuth(token).delete(`/vehicles/${id}`);
    return res.data;
  },
};

// ─── Telemetry ────────────────────────────────────────────────────────────────
export const telemetryService = {
  getLatest: async (token: string, vehicleId?: string) => {
    const url = vehicleId ? `/telemetry?vehicleId=${vehicleId}` : '/telemetry';
    const res = await withAuth(token).get(url);
    return res.data;
  },
  getHistory: async (token: string, days = 7, vehicleId?: string) => {
    const url = vehicleId
      ? `/telemetry/history?days=${days}&vehicleId=${vehicleId}`
      : `/telemetry/history?days=${days}`;
    const res = await withAuth(token).get(url);
    return res.data;
  },
  post: async (token: string, data: object) => {
    const res = await withAuth(token).post('/telemetry', data);
    return res.data;
  },
};

// ─── ML Predictions ───────────────────────────────────────────────────────────
export const predictionService = {
  predictSoH: async (payload: {
    voltage: number;
    current: number;
    temperature: number;
    charging_cycles: number;
    charging_frequency: number;
  }) => {
    try {
      const res = await axios.post(`${ML_URL}/predict-soh`, payload, {
        timeout: 8000,
      });
      return res.data;
    } catch (err) {
      // Fallback mock when ML service is offline
      return {
        predicted_soh: 88.5,
        health_status: 'Good',
        risk_level: 'Medium',
        confidence: 91.4,
        risk_score: 42,
        recommendations: [
          'Reduce DC fast charging frequency.',
          'Keep SoC between 20-80% for longevity.',
          'Avoid deep discharge cycles.',
        ],
      };
    }
  },
  getHistory: async (token: string) => {
    const res = await withAuth(token).get('/predictions');
    return res.data;
  },
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationService = {
  getAll: async (token: string) => {
    const res = await withAuth(token).get('/notifications');
    return res.data;
  },
  markRead: async (token: string, id: string) => {
    const res = await withAuth(token).patch(`/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async (token: string) => {
    const res = await withAuth(token).patch('/notifications/read-all');
    return res.data;
  },
};

// ─── User Profile ─────────────────────────────────────────────────────────────
export const userService = {
  getProfile: async (token: string) => {
    const res = await withAuth(token).get('/users/me');
    return res.data;
  },
  updateProfile: async (token: string, data: object) => {
    const res = await withAuth(token).put('/users/me', data);
    return res.data;
  },
};
