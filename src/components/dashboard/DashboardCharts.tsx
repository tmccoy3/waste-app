import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardChartsProps {
  revenueTrends: any[];
  efficiencyScores: any[];
}

const DashboardCharts: React.FC<DashboardChartsProps> = React.memo(({ revenueTrends, efficiencyScores }) => {
  // Calculate basic metrics
  const totalRevenue = revenueTrends.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalScores = efficiencyScores.length;
  const avgEfficiency = efficiencyScores.reduce((sum, item) => sum + (item.score || 0), 0) / (totalScores || 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-[#ffffff] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Revenue Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-4 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              ${totalRevenue.toFixed(0)}
            </div>
            <p className="text-sm text-muted-foreground">
              Total Revenue from {revenueTrends.length} data points
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#ffffff] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Efficiency Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-4 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {avgEfficiency.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">
              Average Efficiency from {totalScores} metrics
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

DashboardCharts.displayName = 'DashboardCharts';

export default DashboardCharts; 