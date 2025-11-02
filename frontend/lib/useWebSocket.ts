import { useEffect, useRef, useState } from 'react';
import { ShipData, WebSocketStatus } from './types';

interface UseWebSocketReturn {
  status: WebSocketStatus;
  lastMessage: ShipData | null;
  vessels: Map<number, ShipData>;
  error: string | null;
}

export function useWebSocket(url: string): UseWebSocketReturn {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<ShipData | null>(null);
  const [vessels, setVessels] = useState<Map<number, ShipData>>(new Map());
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
          const rawData = JSON.parse(event.data);
          
          // Map the raw WebSocket data to our ShipData interface
          const shipData: ShipData = {
            mmsi: rawData.UserID || rawData.mmsi,
            ship_name: rawData.ship_name || '',
            latitude: rawData.Latitude || rawData.latitude,
            longitude: rawData.Longitude || rawData.longitude,
            speed: rawData.Sog || rawData.speed || 0,
            course: rawData.Cog || rawData.course || 0,
            heading: rawData.TrueHeading !== 511 ? rawData.TrueHeading : rawData.heading || 0,
            nav_status: rawData.NavigationalStatus || rawData.nav_status || 0,
            timestamp: rawData.timestamp || new Date().toISOString(),
            destination: rawData.destination || '',
            call_sign: rawData.call_sign || '',
            ship_type: rawData.ship_type || 0
          };

          // Only update if we have valid coordinates and MMSI
          if (shipData.mmsi && shipData.latitude && shipData.longitude) {
            setLastMessage(shipData);
            setVessels(prev => {
              // Use functional update to prevent unnecessary re-renders
              if (prev.has(shipData.mmsi)) {
                const existing = prev.get(shipData.mmsi);
                // Only update if position or status actually changed
                if (existing && 
                    existing.latitude === shipData.latitude && 
                    existing.longitude === shipData.longitude &&
                    existing.speed === shipData.speed &&
                    existing.nav_status === shipData.nav_status) {
                  return prev; // No change, return same reference
                }
              }
              
              const newVessels = new Map(prev);
              newVessels.set(shipData.mmsi, shipData);
              return newVessels;
            });
          }
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

  return { status, lastMessage, vessels, error };
}