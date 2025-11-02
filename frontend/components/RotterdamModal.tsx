'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RiskTimelineChart } from '@/components/rotterdam/RiskTimelineChart';
import { MultiMetricCharts } from '@/components/rotterdam/MultiMetricCharts';
import { RiskDistributionChart } from '@/components/rotterdam/RiskDistributionChart';
import { InsightsSummaryCards } from '@/components/rotterdam/InsightsSummaryCards';
import { 
  InsightsResponse, 
  ROTTERDAM_ENDPOINTS,
  type InsightsSummary 
} from '@/lib/rotterdam-types';

interface RotterdamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RotterdamModal({ isOpen, onClose }: RotterdamModalProps) {
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchInsights = async () => {
      try {
        setLoading(true);
        const response = await fetch(ROTTERDAM_ENDPOINTS.INSIGHTS);
        if (!response.ok) {
          throw new Error(`Failed to fetch insights: ${response.statusText}`);
        }
        const data: InsightsResponse = await response.json();
        setInsights(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [isOpen]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-white">Loading Rotterdam Maritime Dashboard...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <Card className="w-full max-w-md bg-gray-900/95 border-gray-700">
            <CardHeader>
              <CardTitle className="text-red-400">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-200">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </CardContent>
          </Card>
        </div>
      );
    }

    const hasStormWarning = insights?.summary.storm_hours.length > 0;

    return (
      <div className="space-y-6">
        {/* Storm Warning Banner */}
        {hasStormWarning && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 storm-warning">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-800 dark:text-red-200">
                    ⚠️ Storm Warning
                  </h3>
                  <p className="text-red-700 dark:text-red-300">
                    {insights?.summary.storm_hours.length} hours of dangerous conditions ahead! 
                    Peak risk: {insights?.summary.max_risk.toFixed(3)} at {' '}
                    {insights?.summary.max_risk_time ? 
                      new Date(insights.summary.max_risk_time).toLocaleString() : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        {insights?.summary && (
          <InsightsSummaryCards summary={insights.summary} />
        )}

        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Timeline */}
          <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">🚨 Risk Forecast - Next 5 Days</CardTitle>
              <CardDescription className="text-gray-300">
                Risk score over time with storm threshold
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RiskTimelineChart />
            </CardContent>
          </Card>

          {/* Risk Distribution */}
          <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">⚠️ Risk Distribution</CardTitle>
              <CardDescription className="text-gray-300">
                Time distribution across risk levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RiskDistributionChart />
            </CardContent>
          </Card>
        </div>

        {/* Multi-Metric Charts */}
        <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">🌊 Marine Conditions</CardTitle>
            <CardDescription className="text-gray-300">
              Wave height, wind speed, and rain probability over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MultiMetricCharts />
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rotterdam Maritime Dashboard"
      className="w-[95vw] max-w-7xl"
    >
      <div className="p-6">
        <div className="mb-4">
          <p className="text-gray-400">
            Marine weather conditions and risk analysis
          </p>
        </div>
        {renderContent()}
      </div>
    </Modal>
  );
}