import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { io, Socket } from 'socket.io-client';
import { BASE_URL } from '../services/api';
import { telemetryService } from '../services';
import { rtdb } from '../services/firebase';
import { ref, onValue, off } from 'firebase/database';


// Derive Socket URL from API URL (strip /api)
const SOCKET_URL = BASE_URL.replace('/api', '');

/**
 * Connects to the backend Socket.IO for real-time telemetry updates.
 * Falls back to local simulation if the socket is disconnected.
 */
export function useTelemetrySimulation(enabled = true) {
  const setTelemetry = useAppStore((s) => s.setTelemetry);
  const setLiveConnected = useAppStore((s) => s.setLiveConnected);
  const logout = useAppStore((s) => s.logout);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  const token = useAppStore((s) => s.token);
  const vehicles = useAppStore((s) => s.vehicles);
  
  const socketRef = useRef<Socket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPostRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    // --- Socket.IO Integration ---
    try {
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnectionAttempts: 5,
        timeout: 10000,
      });

      socketRef.current.on('connect', () => {
        console.log('📡 Connected to Backend Telemetry');
        setLiveConnected(true);
        
        // Only authenticate if it looks like a real JWT
        if (token && token.startsWith('ey')) {
          socketRef.current?.emit('authenticate', { token });
        }


        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      });

      socketRef.current.on('telemetry_update', (data) => {
        setTelemetry(data);
      });

      socketRef.current.on('prediction_update', (data) => {
        useAppStore.getState().setPrediction(data);
      });

      socketRef.current.on('new_notification', (data) => {
        useAppStore.getState().addNotification(data);
        // Show an immediate alert for critical/warning notifications
        if (data.type === 'critical' || data.type === 'warning') {
          Alert.alert(
            `🚨 ${data.title}`,
            data.message,
            [{ text: 'View Details', onPress: () => {} }]
          );
        }
      });

      socketRef.current.on('disconnect', () => {
        console.log('📡 Socket disconnected. Reverting to simulation.');
        if (!isAuthenticated) setLiveConnected(false);
        startSimulation();
      });

      socketRef.current.on('connect_error', () => {
        if (!intervalRef.current) startSimulation();
      });

      socketRef.current.on('auth_error', (err) => {
        console.warn('📡 Socket Auth Failed:', err.message);
        setLiveConnected(false);
        // Root Fix: If the token is malformed/invalid, force a logout to clear the bad state
        logout();
      });



      // --- Firebase RTDB Listener ---
      const telemetryRef = ref(rtdb, 'battery_logs');
      onValue(telemetryRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          // Get the latest telemetry entry
          const entries = Object.values(data);
          if (entries.length > 0) {
            // Sort by createdAt or take last key
            const latest = entries[entries.length - 1] as any;
            setTelemetry(latest);
          }
        }
      });

    } catch (err) {
      console.error('Socket/Firebase init error:', err);
      startSimulation();
    }


    // --- Fallback Local Simulation ---
    function startSimulation() {
      if (intervalRef.current) return;
      
      if (isAuthenticated) {
        setLiveConnected(true);
      }

      intervalRef.current = setInterval(async () => {
        const currentTelemetry = useAppStore.getState().telemetry;
        const newData = {
          voltage: parseFloat((360 + Math.random() * 40).toFixed(1)),
          current: parseFloat((-40 + Math.random() * 10).toFixed(1)),
          temperature: parseFloat((28 + Math.random() * 12).toFixed(1)),
          soc: parseFloat(Math.max(5, Math.min(100, currentTelemetry.soc + (Math.random() - 0.52) * 0.4)).toFixed(1)),
          soh: parseFloat(Math.max(70, Math.min(100, currentTelemetry.soh - 0.0001)).toFixed(3)),
          efficiency: parseFloat((3.6 + Math.random() * 0.6).toFixed(2)),
          power: parseFloat((3 + Math.random() * 5).toFixed(1)),
          chargingCycles: currentTelemetry.chargingCycles,
          chargingFrequency: currentTelemetry.chargingFrequency,
          range: parseFloat((currentTelemetry.soc * 3.2).toFixed(1)),
          isCharging: Math.random() > 0.8,
        };

        setTelemetry(newData);

        // Periodically post to backend to seed analytics if authenticated
        const now = Date.now();
        if (isAuthenticated && token && now - lastPostRef.current > 15000) { // Post every 15s
          lastPostRef.current = now;
          try {
            await telemetryService.post(token, {
              ...newData,
              vehicleId: vehicles[0]?._id,
              source: 'simulation'
            });
          } catch (e) {
            console.warn('Simulation post failed:', e);
          }
        }
      }, 3000);
    }

    // Initial check
    if (!socketRef.current?.connected) {
      startSimulation();
    }

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, isAuthenticated, token, vehicles]);
}

