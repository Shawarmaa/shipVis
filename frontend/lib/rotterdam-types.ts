// Rotterdam Maritime Dashboard API Types

export interface RiskTimelinePoint {
  time: string;
  risk_score: number;
  is_storm: boolean;
}

export interface RiskTimelineResponse {
  city: string;
  storm_threshold: number;
  timeline: RiskTimelinePoint[];
}

export interface MultiMetricDataPoint {
  time: string;
  waveHeight: number;
  windSpeed: number;
  rainProbability: number;
}

export interface MultiMetricThresholds {
  high_waves: number;
  strong_wind: number;
  high_rain: number;
}

export interface MultiMetricResponse {
  city: string;
  thresholds: MultiMetricThresholds;
  data: MultiMetricDataPoint[];
}

export interface RiskDistribution {
  Safe: number;
  Moderate: number;
  High: number;
  Dangerous: number;
}

export interface RiskPercentages {
  Safe: number;
  Moderate: number;
  High: number;
  Dangerous: number;
}

export interface RiskDistributionResponse {
  city: string;
  total_hours: number;
  distribution: RiskDistribution;
  percentages: RiskPercentages;
}

export interface InsightsDataPoint {
  time: string;
  waveHeight: number;
  windSpeed: number;
  pop: number;
  risk_score: number;
  cross_angle: number;
  storm_flag: boolean;
  temperature: number;
  pressure: number;
  seaLevel: number;
}

export interface InsightsSummary {
  max_risk: number;
  max_risk_time: string;
  storm_hours: string[];
  avg_wave_height: number;
  avg_wind_speed: number;
}

export interface InsightsResponse {
  city: string;
  insights: InsightsDataPoint[];
  summary: InsightsSummary;
}

// API endpoint URLs
export const ROTTERDAM_API_BASE = 'http://localhost:8000/rotterdam';

export const ROTTERDAM_ENDPOINTS = {
  RISK_TIMELINE: `${ROTTERDAM_API_BASE}/risk-timeline`,
  MULTI_METRIC: `${ROTTERDAM_API_BASE}/multi-metric`,
  RISK_DISTRIBUTION: `${ROTTERDAM_API_BASE}/risk-distribution`,
  INSIGHTS: `${ROTTERDAM_API_BASE}/insights`,
} as const;

// Color scheme for charts - Blue theme
export const ROTTERDAM_COLORS = {
  safe: '#06D6A0',
  moderate: '#FFD60A',
  high: '#FF6B35',
  dangerous: '#E63946',
  wave: '#3B82F6',      // Blue
  wind: '#60A5FA',      // Light blue
  rain: '#1D4ED8',      // Dark blue
  risk: '#2563EB',      // Medium blue
  threshold: '#E63946',
} as const;