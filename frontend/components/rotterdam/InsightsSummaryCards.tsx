'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Waves, Wind, TrendingUp } from 'lucide-react';
import { InsightsSummary, ROTTERDAM_COLORS } from '@/lib/rotterdam-types';

interface InsightsSummaryCardsProps {
  summary: InsightsSummary;
}

export function InsightsSummaryCards({ summary }: InsightsSummaryCardsProps) {
  // Determine risk level color based on max risk
  const getRiskColor = (risk: number) => {
    if (risk >= 0.7) return ROTTERDAM_COLORS.dangerous;
    if (risk >= 0.5) return ROTTERDAM_COLORS.high;
    if (risk >= 0.3) return ROTTERDAM_COLORS.moderate;
    return ROTTERDAM_COLORS.safe;
  };

  const riskColor = getRiskColor(summary.max_risk);
  const riskPercentage = (summary.max_risk * 100).toFixed(1);

  // Format the max risk time
  const formatRiskTime = (timeStr: string) => {
    try {
      return new Date(timeStr).toLocaleString('en-GB', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Max Risk Score */}
      <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-200">Max Risk Score</CardTitle>
          <AlertTriangle 
            className="h-4 w-4" 
            style={{ color: riskColor }}
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" style={{ color: riskColor }}>
            {riskPercentage}%
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {formatRiskTime(summary.max_risk_time)}
          </p>
        </CardContent>
      </Card>

      {/* Storm Hours */}
      <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-200">Storm Hours</CardTitle>
          <AlertTriangle 
            className="h-4 w-4" 
            style={{ 
              color: summary.storm_hours.length > 0 ? ROTTERDAM_COLORS.dangerous : ROTTERDAM_COLORS.safe 
            }}
          />
        </CardHeader>
        <CardContent>
          <div 
            className="text-2xl font-bold"
            style={{ 
              color: summary.storm_hours.length > 0 ? ROTTERDAM_COLORS.dangerous : ROTTERDAM_COLORS.safe 
            }}
          >
            {summary.storm_hours.length}
          </div>
          <p className="text-xs text-gray-400">
            {summary.storm_hours.length === 0 
              ? 'No dangerous conditions' 
              : `${summary.storm_hours.length} dangerous period${summary.storm_hours.length > 1 ? 's' : ''}`
            }
          </p>
        </CardContent>
      </Card>

      {/* Average Wave Height */}
      <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-200">Avg Wave Height</CardTitle>
          <Waves className="h-4 w-4 text-cyan-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-cyan-400">
            {summary.avg_wave_height.toFixed(2)}m
          </div>
          <p className="text-xs text-gray-400">
            {summary.avg_wave_height >= 3.0 
              ? 'High waves expected' 
              : summary.avg_wave_height >= 2.0 
                ? 'Moderate waves' 
                : 'Calm seas'
            }
          </p>
        </CardContent>
      </Card>

      {/* Average Wind Speed */}
      <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-200">Avg Wind Speed</CardTitle>
          <Wind className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-300">
            {summary.avg_wind_speed.toFixed(1)} m/s
          </div>
          <p className="text-xs text-gray-400">
            {summary.avg_wind_speed >= 10.0 
              ? 'Strong winds expected' 
              : summary.avg_wind_speed >= 7.0 
                ? 'Moderate winds' 
                : 'Light winds'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
}