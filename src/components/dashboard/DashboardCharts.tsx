import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { RevenueTrend, EfficiencyScore } from '@/lib/validations';

interface DashboardChartsProps {
  revenueTrends: RevenueTrend[];
  efficiencyScores: EfficiencyScore[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

const DashboardCharts: React.FC<DashboardChartsProps> = React.memo(({ revenueTrends, efficiencyScores }) => {
  // Memoized tooltip formatter for bar chart
  const barTooltipFormatter = React.useCallback((value: number, name: string) => {
    return [`$${value.toLocaleString()}`, name];
  }, []);

  // Memoized label formatter for bar chart
  const barLabelFormatter = React.useCallback((label: string) => {
    return `${label} 2024`;
  }, []);

  // Memoized tick formatter for Y-axis
  const yAxisFormatter = React.useCallback((value: number) => {
    return `$${(value / 1000).toFixed(0)}k`;
  }, []);

  // Memoized pie chart label formatter
  const pieChartLabel = React.useCallback(({ name, value, count }: { name: string; value: number; count: number }) => {
    return `${name}: ${value}% (${count})`;
  }, []);

  // Memoized pie chart tooltip formatter
  const pieTooltipFormatter = React.useCallback((value: number, name: string, props: any) => {
    return [`${value}% (${props.payload.count} customers)`, name];
  }, []);

  // Memoized overall efficiency score
  const overallEfficiencyScore = React.useMemo(() => {
    const totalScore = efficiencyScores.reduce((sum, item) => sum + item.value, 0);
    return Math.round(totalScore / efficiencyScores.length);
  }, [efficiencyScores]);

  // Memoized tooltip content style
  const tooltipContentStyle = React.useMemo(() => ({
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
  }), []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Revenue Trends Chart */}
      <Card className="bg-white shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900">
            Monthly Revenue Trends
          </CardTitle>
          <p className="text-sm text-slate-600">
            Revenue breakdown by service type with growth indicators
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={revenueTrends} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: '#64748b' }} 
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#64748b' }} 
                tickFormatter={yAxisFormatter}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={{ stroke: '#e2e8f0' }}
              />
              <RechartsTooltip 
                formatter={barTooltipFormatter}
                labelFormatter={barLabelFormatter}
                contentStyle={tooltipContentStyle}
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="rect"
              />
              <Bar 
                dataKey="HOA" 
                stackId="a" 
                fill={COLORS[0]} 
                name="HOA Revenue"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="Subscription" 
                stackId="a" 
                fill={COLORS[1]} 
                name="Subscription Revenue"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="Commercial" 
                stackId="a" 
                fill={COLORS[2]} 
                name="Commercial Revenue"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Efficiency Distribution Chart */}
      <Card className="bg-white shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-900">
            Service Efficiency by Customer Type
          </CardTitle>
          <p className="text-sm text-slate-600">
            Performance distribution across service categories
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie 
                data={efficiencyScores} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                outerRadius={120}
                label={pieChartLabel}
                labelLine={false}
                stroke="#ffffff"
                strokeWidth={2}
              >
                {efficiencyScores.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              <RechartsTooltip 
                formatter={pieTooltipFormatter}
                contentStyle={tooltipContentStyle}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center mt-4 p-4 bg-slate-50 rounded-lg">
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {overallEfficiencyScore}%
            </div>
            <div className="text-sm text-slate-600">
              Overall Efficiency Score
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Based on {efficiencyScores.reduce((sum, item) => sum + item.count, 0)} customers
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

DashboardCharts.displayName = 'DashboardCharts';

export default DashboardCharts; 