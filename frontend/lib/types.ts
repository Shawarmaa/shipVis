export interface ShipData {
  mmsi: number;
  ship_name: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  heading: number;
  nav_status: number;
  timestamp: string;
  destination: string;
  call_sign: string;
  ship_type: number;
  status?: 'N/A' | 'DOCK' | 'DELAY' | 'NO_DOCK';
  risk_score?: number;
  risk_factors?: { [key: string]: string | number };
}

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';