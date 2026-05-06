import axios from 'axios';

// For Expo Go on physical device, use your machine's LAN IP.
// For emulator, use 10.0.2.2 (Android) or localhost (iOS)
export const BASE_URL = 'http://192.168.8.104:5000/api';
export const ML_URL = 'http://192.168.8.104:8000';

console.log('[API] Using BASE_URL:', BASE_URL);


const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to inject JWT token
api.interceptors.request.use(
  (config) => {
    // Token is passed per-call from the store
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

export const withAuth = (token: string) =>
  axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
