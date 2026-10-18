import { useEffect, useRef, useState, useCallback } from "react";
import { WS_BASE_URL, ConnectorUpdateMessage } from "./apiClient";

interface UseStationWebSocketProps {
  onConnectorUpdate?: (update: ConnectorUpdateMessage) => void;
  onReconnect?: () => void;
  enabled?: boolean;
}

export function useStationWebSocket({
  onConnectorUpdate,
  onReconnect,
  enabled = true,
}: UseStationWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<any>(null);
  const pingInterval = useRef<any>(null);
  const isConnectedRef = useRef(false);
  const isManuallyClosed = useRef(false);
  const onConnectorUpdateRef = useRef(onConnectorUpdate);
  onConnectorUpdateRef.current = onConnectorUpdate;

  const onReconnectRef = useRef(onReconnect);
  onReconnectRef.current = onReconnect;

  const connect = useCallback(() => {
    if (!enabled) return;

    try {
      isManuallyClosed.current = false;
      // Clean WS URL with zero query tokens
      const ws = new WebSocket(WS_BASE_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        // First message: Subscribe to public customer station availability channel
        ws.send(JSON.stringify({ type: "SUBSCRIBE_CUSTOMER" }));

        // Heartbeat ping
        if (pingInterval.current) clearInterval(pingInterval.current);
        pingInterval.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "PING" }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "SUBSCRIBED") {
            setIsConnected(true);
            isConnectedRef.current = true;
            if (reconnectAttempts.current > 0 && onReconnectRef.current) {
              onReconnectRef.current();
            }
            reconnectAttempts.current = 0;
          } else if (msg.type === "CONNECTOR_STATUS_CHANGED") {
            if (onConnectorUpdateRef.current) {
              onConnectorUpdateRef.current(msg as ConnectorUpdateMessage);
            }
          }
        } catch {
          // Ignore malformed payloads
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
        isConnectedRef.current = false;
      };

      ws.onclose = () => {
        setIsConnected(false);
        isConnectedRef.current = false;
        if (pingInterval.current) clearInterval(pingInterval.current);

        if (!isManuallyClosed.current && enabled) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 15000);
          reconnectAttempts.current += 1;
          reconnectTimer.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch {
      setIsConnected(false);
      isConnectedRef.current = false;
    }
  }, [enabled]);

  useEffect(() => {
    connect();

    return () => {
      isManuallyClosed.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (pingInterval.current) clearInterval(pingInterval.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { isConnected };
}
