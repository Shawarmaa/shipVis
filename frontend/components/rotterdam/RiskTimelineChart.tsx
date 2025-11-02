'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Dot,
} from 'recharts';
import { 
  RiskTimelineResponse, 
  ROTTERDAM_ENDPOINTS, 
  ROTTERDAM_COLORS 
} from '@/lib/rotterdam-types';

interface ChartDataPoint {
  time: string;
  timeDisplay: string;
  risk_score: number;
  is_storm: boolean;
  storm_threshold: number;
}

export function RiskTimelineChart() {
  const [data, setData] = useState<RiskTimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(ROTTERDAM_ENDPOINTS.RISK_TIMELINE);
        if (!response.ok) {
          throw new Error(`Failed to fetch risk timeline: ${response.statusText}`);
        }
        const result: RiskTimelineResponse = await response.json();
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
      <div className="h-80 flex items-center justify-center">
        <div className="text-gray-500">Loading risk timeline...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-red-500">Error: {error || 'No data available'}</div>
      </div>
    );
  }

  // Transform data for chart
  const chartData: ChartDataPoint[] = data.timeline.map(point => ({
    time: point.time,
    timeDisplay: new Date(point.time).toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    risk_score: point.risk_score,
    is_storm: point.is_storm,
    storm_threshold: data.storm_threshold,
  }));

  // Custom dot component for storm markers
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.is_storm) {
      return (
        <Dot
          cx={cx}
          cy={cy}
          r={6}
          fill={ROTTERDAM_COLORS.dangerous}
          stroke="#fff"
          strokeWidth={2}
        />
      );
    }
    return null;
  };

  const formatTooltip = (value: any, name: string, props: any) => {
    if (name === 'risk_score') {
      return [
        `${(value * 100).toFixed(1)}%`,
        'Risk Score'
      ];
    }
    return [value, name];
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
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
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
            domain={[0, 1]}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
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
          
          {/* Storm threshold line */}
          <ReferenceLine
            y={data.storm_threshold}
            stroke={ROTTERDAM_COLORS.threshold}
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: `Storm Threshold (${(data.storm_threshold * 100).toFixed(0)}%)`,
              position: 'top',
              fontSize: 12,
            }}
          />
          
          {/* Risk score line */}
          <Line
            type="monotone"
            dataKey="risk_score"
            stroke={ROTTERDAM_COLORS.risk}
            strokeWidth={3}
            fill={ROTTERDAM_COLORS.risk}
            fillOpacity={0.1}
            dot={<CustomDot />}
            activeDot={{ r: 6, stroke: ROTTERDAM_COLORS.risk, strokeWidth: 2, fill: '#fff' }}
            name="Risk Score"
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Legend for storm markers */}
      <div className="mt-4 flex justify-center">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full border-2 border-white"
              style={{ backgroundColor: ROTTERDAM_COLORS.dangerous }}
            />
            <span>Storm Conditions</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-0.5"
              style={{ backgroundColor: ROTTERDAM_COLORS.threshold }}
            />
            <span>Danger Threshold</span>
          </div>
        </div>
      </div>
    </div>
  );
}