import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowUp, DollarSign, Users, Clock, Activity } from 'lucide-react';
import { Metrics } from '@/lib/validations';

interface MetricsCardsProps {
  metrics: Metrics;
}

const MetricsCards: React.FC<MetricsCardsProps> = React.memo(({ metrics }) => {
  const formatCurrency = React.useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  const formatNumber = React.useCallback((num: number, decimals: number = 1) => {
    return num.toFixed(decimals);
  }, []);

  const metricsData = React.useMemo(() => [
    {
      id: 'active-customers',
      title: 'Active Customers',
      value: metrics.activeCustomers.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-l-blue-500',
      tooltip: 'Total serviced customers',
      trend: { value: '+12%', isPositive: true, label: 'from last month' },
    },
    {
      id: 'monthly-revenue',
      title: 'Monthly Revenue',
      value: formatCurrency(metrics.monthlyRevenue),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-l-green-500',
      tooltip: 'Total recurring monthly revenue',
      trend: { value: '-3.2%', isPositive: false, label: 'from last month' },
    },
    {
      id: 'avg-time',
      title: 'HOA Avg Time',
      value: `${formatNumber(metrics.hoaAvgTime)}m`,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-l-amber-500',
      tooltip: 'Average service time per HOA',
      trend: { value: '-0.5m', isPositive: true, label: 'improvement' },
    },
    {
      id: 'revenue-per-minute',
      title: 'Revenue Per Minute',
      value: formatCurrency(metrics.revenuePerMinute),
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-l-purple-500',
      tooltip: 'Operational efficiency metric',
      trend: { value: `+${formatNumber(metrics.efficiencyGain)}%`, isPositive: true, label: 'efficiency gain' },
    },
  ], [metrics, formatCurrency, formatNumber]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricsData.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card 
            key={metric.id}
            className={`bg-white shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200 ${metric.borderColor} border-l-4`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {metric.title}
              </CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`p-2 rounded-full ${metric.bgColor}`}>
                    <Icon className={`h-4 w-4 ${metric.color}`} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{metric.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 mb-1">
                {metric.value}
              </div>
              <div className={`text-xs flex items-center gap-1 ${
                metric.trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                <ArrowUp className={`h-3 w-3 ${metric.trend.isPositive ? '' : 'rotate-180'}`} />
                {metric.trend.value} {metric.trend.label}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});

MetricsCards.displayName = 'MetricsCards';

export default MetricsCards; 