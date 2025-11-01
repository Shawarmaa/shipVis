import { useEffect, useRef, useState } from 'react';
import { ShipData, WebSocketStatus } from './types';

interface UseWebSocketReturn {
  status: WebSocketStatus;
  lastMessage: ShipData | null;
  error: string | null;
}

export function useWebSocket(url: string): UseWebSocketReturn {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<ShipData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setStatus('connecting');
    setError(null);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        console.log('WebSocket connected to ship tracking');
      };

      ws.onmessage = (event) => {
        try {
          const shipData: ShipData = JSON.parse(event.data);
          setLastMessage(shipData);
          console.log('Ship data received:', shipData);
        } catch (err) {
          console.error('Failed to parse ship data:', err);
        }
      };

      ws.onclose = () => {
        setStatus('disconnected');
        console.log('WebSocket disconnected');
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 3000);
      };

      ws.onerror = (err) => {
        setStatus('error');
        setError('WebSocket connection error');
        console.error('WebSocket error:', err);
      };
    } catch (err) {
      setStatus('error');
      setError('Failed to create WebSocket connection');
      console.error('WebSocket creation error:', err);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url]);

  return { status, lastMessage, error };
}