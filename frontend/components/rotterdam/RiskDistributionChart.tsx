'use client';

import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { 
  RiskDistributionResponse, 
  ROTTERDAM_ENDPOINTS, 
  ROTTERDAM_COLORS 
} from '@/lib/rotterdam-types';

interface ChartDataPoint {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

const RISK_COLORS = {
  Safe: ROTTERDAM_COLORS.safe,
  Moderate: ROTTERDAM_COLORS.moderate,
  High: ROTTERDAM_COLORS.high,
  Dangerous: ROTTERDAM_COLORS.dangerous,
};

export function RiskDistributionChart() {
  const [data, setData] = useState<RiskDistributionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(ROTTERDAM_ENDPOINTS.RISK_DISTRIBUTION);
        if (!response.ok) {
          throw new Error(`Failed to fetch risk distribution: ${response.statusText}`);
        }
        const result: RiskDistributionResponse = await response.json();
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
        <div className="text-gray-500">Loading risk distribution...</div>
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
  const chartData: ChartDataPoint[] = Object.entries(data.distribution).map(([name, value]) => ({
    name,
    value,
    percentage: data.percentages[name as keyof typeof data.percentages],
    color: RISK_COLORS[name as keyof typeof RISK_COLORS],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900/95 p-3 border border-gray-600 rounded-lg shadow-lg backdrop-blur-sm">
          <p className="font-medium text-white">{data.name}</p>
          <p className="text-sm text-gray-300">
            {data.value} hours ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    if (percentage < 5) return null; // Don't show labels for small slices
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${percentage.toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={100}
            innerRadius={40}
            fill="#8884d8"
            dataKey="value"
            stroke="#fff"
            strokeWidth={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry: any) => {
              const hours = data?.distribution[value as keyof typeof data.distribution] || 0;
              return (
                <span style={{ color: '#e5e7eb' }}>
                  {value}: {hours}h
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Summary stats */}
      <div className="mt-4 text-center text-sm text-gray-300">
        <p>Total forecast period: {data.total_hours} hours</p>
        <div className="mt-2 flex justify-center gap-4 flex-wrap">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-200">{item.name}: {item.value}h</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}