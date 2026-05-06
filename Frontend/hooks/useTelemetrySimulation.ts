import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000'; // Update with your server IP for physical devices

/**
 * Connects to the backend Socket.IO for real-time telemetry updates.
 * Falls back to local simulation if the socket is disconnected.
 */
export function useTelemetrySimulation(enabled = true) {
  const setTelemetry = useAppStore((s) => s.setTelemetry);
  const setLiveConnected = useAppStore((s) => s.setLiveConnected);
  const telemetry = useAppStore((s) => s.telemetry);
  const socketRef = useRef<Socket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // --- Socket.IO Integration ---
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      console.log('📡 Connected to Backend Telemetry');
      setLiveConnected(true);
      // Stop local simulation when socket is active
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    });

    socketRef.current.on('telemetry_update', (data) => {
      console.log('⚡ Received Live Telemetry:', data);
      setTelemetry(data);
    });

    socketRef.current.on('disconnect', () => {
      console.log('📡 Socket disconnected. Reverting to simulation.');
      setLiveConnected(false);
      startSimulation();
    });

    // --- Fallback Local Simulation ---
    const startSimulation = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => {
        setTelemetry({
          voltage: parseFloat((350 + Math.random() * 50).toFixed(1)),
          current: parseFloat((-50 + Math.random() * 10).toFixed(1)),
          temperature: parseFloat((25 + Math.random() * 15).toFixed(1)),
          soc: parseFloat(Math.max(10, Math.min(100, useAppStore.getState().telemetry.soc + (Math.random() - 0.52) * 0.5)).toFixed(1)),
          soh: parseFloat(Math.max(70, Math.min(100, useAppStore.getState().telemetry.soh - 0.001)).toFixed(2)),
          efficiency: parseFloat((3.5 + Math.random() * 0.8).toFixed(2)),
          power: parseFloat((2 + Math.random() * 6).toFixed(1)),
          chargingCycles: useAppStore.getState().telemetry.chargingCycles,
          chargingFrequency: useAppStore.getState().telemetry.chargingFrequency,
          range: parseFloat((useAppStore.getState().telemetry.soc * 3.2).toFixed(1)),
          isCharging: Math.random() > 0.7,
        });
      }, 3000);
    };

    // Start simulation initially until socket connects
    startSimulation();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (intervalRef.current) clearInterval(intervalRef.current);
      setLiveConnected(false);
    };
  }, [enabled]);
}
