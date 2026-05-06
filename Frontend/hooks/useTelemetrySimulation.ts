import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { io, Socket } from 'socket.io-client';
import { BASE_URL } from '../services/api';

// Derive Socket URL from API URL (strip /api)
const SOCKET_URL = BASE_URL.replace('/api', '');

/**
 * Connects to the backend Socket.IO for real-time telemetry updates.
 * Falls back to local simulation if the socket is disconnected.
 */
export function useTelemetrySimulation(enabled = true) {
  const setTelemetry = useAppStore((s) => s.setTelemetry);
  const setLiveConnected = useAppStore((s) => s.setLiveConnected);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const token = useAppStore((s) => s.token);
  
  const socketRef = useRef<Socket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        
        if (token) {
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
      });

      socketRef.current.on('disconnect', () => {
        console.log('📡 Socket disconnected. Reverting to simulation.');
        // Only set offline if not authenticated, or keep "Online" if we want to show active system
        if (!isAuthenticated) setLiveConnected(false);
        startSimulation();
      });

      socketRef.current.on('connect_error', () => {
        if (!intervalRef.current) startSimulation();
      });

    } catch (err) {
      console.error('Socket init error:', err);
      startSimulation();
    }

    // --- Fallback Local Simulation ---
    function startSimulation() {
      if (intervalRef.current) return;
      
      // If authenticated, we show "Online" as the system is active in demo/sim mode
      if (isAuthenticated) {
        setLiveConnected(true);
      }

      intervalRef.current = setInterval(() => {
        const currentTelemetry = useAppStore.getState().telemetry;
        setTelemetry({
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
        });
      }, 3000);
    }

    // Initial check
    if (!socketRef.current?.connected) {
      startSimulation();
    }

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Don't reset live connected here if we want it to persist during navigation
    };
  }, [enabled, isAuthenticated, token]);
}
