'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { 
  MultiMetricResponse, 
  ROTTERDAM_ENDPOINTS, 
  ROTTERDAM_COLORS 
} from '@/lib/rotterdam-types';

interface ChartDataPoint {
  time: string;
  timeDisplay: string;
  waveHeight: number;
  windSpeed: number;
  rainProbability: number;
}

export function MultiMetricCharts() {
  const [data, setData] = useState<MultiMetricResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(ROTTERDAM_ENDPOINTS.MULTI_METRIC);
        if (!response.ok) {
          throw new Error(`Failed to fetch multi-metric data: ${response.statusText}`);
        }
        const result: MultiMetricResponse = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-[800px] flex items-center justify-center">
        <div className="text-gray-500">Loading marine conditions...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-[800px] flex items-center justify-center">
        <div className="text-red-500">Error: {error || 'No data available'}</div>
      </div>
    );
  }

  // Transform data for charts
  const chartData: ChartDataPoint[] = data.data.map(point => ({
    time: point.time,
    timeDisplay: new Date(point.time).toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    waveHeight: point.waveHeight,
    windSpeed: point.windSpeed,
    rainProbability: point.rainProbability,
  }));

  const formatTooltip = (value: any, name: string) => {
    switch (name) {
      case 'waveHeight':
        return [`${value.toFixed(2)}m`, 'Wave Height'];
      case 'windSpeed':
        return [`${value.toFixed(1)} m/s`, 'Wind Speed'];
      case 'rainProbability':
        return [`${value.toFixed(0)}%`, 'Rain Probability'];
      default:
        return [value, name];
    }
  };

  const formatLabel = (label: string) => {
    return new Date(label).toLocaleString('en-GB', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      {/* Wave Height Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
          🌊 Wave Height
          <span className="text-sm font-normal text-gray-400">
            (Dangerous above {data.thresholds.high_waves}m)
          </span>
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="timeDisplay"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}m`}
              />
              <Tooltip
                formatter={formatTooltip}
                labelFormatter={formatLabel}
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.95)',
                  border: '1px solid #4b5563',
                  borderRadius: '6px',
                  color: '#e5e7eb',
                  backdropFilter: 'blur(4px)',
                }}
              />
              <Legend />
              
              <ReferenceLine
                y={data.thresholds.high_waves}
                stroke={ROTTERDAM_COLORS.high}
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `High Waves (${data.thresholds.high_waves}m)`,
                  position: 'top',
                  fontSize: 12,
                }}
              />
              
              <Area
                type="monotone"
                dataKey="waveHeight"
                stroke={ROTTERDAM_COLORS.wave}
                fill={ROTTERDAM_COLORS.wave}
                fillOpacity={0.3}
                strokeWidth={2}
                name="Wave Height"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Wind Speed Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
          💨 Wind Speed
          <span className="text-sm font-normal text-gray-400">
            (Strong winds above {data.thresholds.strong_wind} m/s)
          </span>
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="timeDisplay"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value} m/s`}
              />
              <Tooltip
                formatter={formatTooltip}
                labelFormatter={formatLabel}
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.95)',
                  border: '1px solid #4b5563',
                  borderRadius: '6px',
                  color: '#e5e7eb',
                  backdropFilter: 'blur(4px)',
                }}
              />
              <Legend />
              
              <ReferenceLine
                y={data.thresholds.strong_wind}
                stroke={ROTTERDAM_COLORS.high}
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `Strong Wind (${data.thresholds.strong_wind} m/s)`,
                  position: 'top',
                  fontSize: 12,
                }}
              />
              
              <Area
                type="monotone"
                dataKey="windSpeed"
                stroke={ROTTERDAM_COLORS.wind}
                fill={ROTTERDAM_COLORS.wind}
                fillOpacity={0.3}
                strokeWidth={2}
                name="Wind Speed"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rain Probability Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
          🌧️ Rain Probability
          <span className="text-sm font-normal text-gray-400">
            (High rain above {data.thresholds.high_rain}%)
          </span>
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="timeDisplay"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                formatter={formatTooltip}
                labelFormatter={formatLabel}
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.95)',
                  border: '1px solid #4b5563',
                  borderRadius: '6px',
                  color: '#e5e7eb',
                  backdropFilter: 'blur(4px)',
                }}
              />
              <Legend />
              
              <ReferenceLine
                y={data.thresholds.high_rain}
                stroke={ROTTERDAM_COLORS.high}
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `High Rain (${data.thresholds.high_rain}%)`,
                  position: 'top',
                  fontSize: 12,
                }}
              />
              
              <Bar
                dataKey="rainProbability"
                fill={ROTTERDAM_COLORS.rain}
                fillOpacity={0.8}
                name="Rain Probability"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}