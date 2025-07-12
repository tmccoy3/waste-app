'use client'
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { RefreshCw, FileText, Send, AlertCircle, ArrowUp, TrendingUp, Users, DollarSign, Clock } from 'lucide-react';
import { useOptimizedDashboard } from '@/hooks/useOptimizedDashboard';
import ErrorBoundary from '@/components/ErrorBoundary';
import MetricsCards from '@/components/dashboard/MetricsCards';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import CustomerTable from '@/components/dashboard/CustomerTable';

// Data interfaces
interface Customer {
  'HOA Name': string;
  'Monthly Revenue': string;
  'Full Address': string;
  'Average Completion Time in Minutes': string;
  'Service Status': 'Serviced' | 'Pending' | 'Cancelled';
  'Unit Type': string;
  'Type': 'HOA' | 'Subscription' | 'Commercial';
  'Number of Units': string;
}

// Loading component with skeleton
const LoadingDashboard: React.FC = React.memo(() => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-slate-600">Loading dashboard...</p>
    </div>
  </div>
));
LoadingDashboard.displayName = 'LoadingDashboard';

// Error component
const ErrorDashboard: React.FC<{ error: string; onRetry: () => void }> = React.memo(({ error, onRetry }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <Card className="max-w-md w-full">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <CardTitle className="text-xl font-bold text-slate-900">
          Failed to Load Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-slate-600">{error}</p>
        <Button onClick={onRetry} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  </div>
));
ErrorDashboard.displayName = 'ErrorDashboard';

// Enhanced Header component with better layout and functionality
const DashboardHeader: React.FC<{
  search: string;
  onSearchChange: (search: string) => void;
  onRefresh: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
}> = React.memo(({ search, onSearchChange, onRefresh, onExportCSV, onExportPDF }) => {
  const handleSearchChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  }, [onSearchChange]);

  const handleExportPDF = React.useCallback(async () => {
    try {
      await onExportPDF();
    } catch (error) {
      console.error('Failed to export PDF:', error);
      // Could show toast notification here
    }
  }, [onExportPDF]);

  return (
    <Card className="bg-white shadow-sm border border-slate-200">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-3xl font-bold text-slate-900">WasteOps Intelligence</CardTitle>
            <p className="text-slate-600 mt-1">Executive Operations Dashboard</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="icon" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={onExportCSV}>
              <FileText className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleExportPDF}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search customers..."
            className="flex-1 p-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </CardContent>
    </Card>
  );
});
DashboardHeader.displayName = 'DashboardHeader';

// Enhanced placeholder tab component
const PlaceholderTab: React.FC<{ title: string; description: string; icon: React.ReactNode }> = React.memo(({ title, description, icon }) => (
  <Card className="w-full h-full bg-white shadow-sm border border-slate-200">
    <CardHeader>
      <CardTitle className="text-xl font-bold text-slate-900">{title}</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-slate-900 mb-2">{title} Coming Soon</h3>
      <p className="text-slate-600 text-center max-w-md">{description}</p>
    </CardContent>
  </Card>
));
PlaceholderTab.displayName = 'PlaceholderTab';

// Main Dashboard component with enhanced data processing
const Dashboard: React.FC = () => {
  const [localSearch, setLocalSearch] = useState('');
  const [localData, setLocalData] = useState<Customer[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const {
    data,
    loading,
    error,
    search,
    paginatedCustomers,
    paginationInfo,
    actions,
  } = useOptimizedDashboard(10);

  // Load customer data on component mount
  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        const customerData = require('../../../data/geocoded_customers.json');
        setLocalData(customerData);
        setIsDataLoaded(true);
      } catch (error) {
        console.error('Failed to load customer data:', error);
        setIsDataLoaded(true);
      }
    };

    loadCustomerData();
  }, []);

  // Enhanced data filtering and processing
  const processedData = useMemo(() => {
    if (!localData.length) return { filteredData: [], metrics: null, chartData: null };

    const searchTerm = localSearch || search || '';
    const filteredData = localData.filter(customer => 
      customer['HOA Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer['Full Address']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer['Type']?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate enhanced metrics
    const activeCustomers = filteredData.filter(c => c['Service Status'] === 'Serviced').length;
    const totalRevenue = filteredData.reduce((acc, c) => {
      const revenue = parseFloat(c['Monthly Revenue']?.replace(/[$,]/g, '') || '0');
      return acc + revenue;
    }, 0);
    
    const avgCompletionTime = filteredData.reduce((acc, c) => {
      const time = parseFloat(c['Average Completion Time in Minutes'] || '0');
      return acc + time;
    }, 0) / (filteredData.length || 1);

    const revenuePerMinute = totalRevenue / (avgCompletionTime * activeCustomers) || 0;

    const metrics = {
      activeCustomers,
      monthlyRevenue: totalRevenue,
      hoaAvgTime: avgCompletionTime,
      revenuePerMinute,
      efficiencyGain: 8.1
    };

    // Generate chart data
    const typeBreakdown = filteredData.reduce((acc, customer) => {
      const type = customer['Type'] || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const efficiencyScores = Object.entries(typeBreakdown).map(([name, count]) => ({
      name,
      value: Math.round((count / filteredData.length) * 100),
      count
    }));

    // Sample revenue trends (could be enhanced with real date-based data)
    const revenueTrends = [
      { month: 'Jan', HOA: totalRevenue * 0.8, Subscription: totalRevenue * 0.1, Commercial: totalRevenue * 0.1, growth: '+2.3%' },
      { month: 'Feb', HOA: totalRevenue * 0.82, Subscription: totalRevenue * 0.09, Commercial: totalRevenue * 0.09, growth: '+3.1%' },
      { month: 'Mar', HOA: totalRevenue * 0.85, Subscription: totalRevenue * 0.08, Commercial: totalRevenue * 0.07, growth: '+2.8%' },
      { month: 'Apr', HOA: totalRevenue * 0.87, Subscription: totalRevenue * 0.07, Commercial: totalRevenue * 0.06, growth: '+4.2%' },
      { month: 'May', HOA: totalRevenue * 0.89, Subscription: totalRevenue * 0.06, Commercial: totalRevenue * 0.05, growth: '+1.9%' },
      { month: 'Jun', HOA: totalRevenue, Subscription: totalRevenue * 0.05, Commercial: totalRevenue * 0.05, growth: '+3.5%' },
    ];

    return {
      filteredData,
      metrics,
      chartData: { revenueTrends, efficiencyScores }
    };
  }, [localData, localSearch, search]);

  // Enhanced pagination for filtered data
  const paginatedFilteredData = useMemo(() => {
    const pageSize = 10;
    const currentPage = paginationInfo?.currentPage || 1;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return processedData.filteredData.slice(startIndex, endIndex);
  }, [processedData.filteredData, paginationInfo?.currentPage]);

  // Handle search change
  const handleSearchChange = React.useCallback((searchValue: string) => {
    setLocalSearch(searchValue);
    if (actions?.setSearch) {
      actions.setSearch(searchValue);
    }
  }, [actions]);

  // Export functions
  const handleExportCSV = React.useCallback(() => {
    if (actions?.exportCSV) {
      actions.exportCSV();
    } else {
      // Fallback CSV export implementation
      const csvContent = processedData.filteredData.map(customer => 
        Object.values(customer).join(',')
      ).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'customers.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [actions, processedData.filteredData]);

  const handleExportPDF = React.useCallback(async () => {
    if (actions?.exportPDF) {
      await actions.exportPDF();
    } else {
      console.log('PDF export functionality not yet implemented');
    }
  }, [actions]);

  const handleRefresh = React.useCallback(() => {
    if (actions?.refreshData) {
      actions.refreshData();
    } else {
      window.location.reload();
    }
  }, [actions]);

  // Handle loading state
  if (loading || !isDataLoaded) {
    return <LoadingDashboard />;
  }

  // Handle error state
  if (error) {
    return <ErrorDashboard error={error} onRetry={handleRefresh} />;
  }

  const COLORS = ['#3b82f6', '#34d399', '#fbbf24', '#f87171', '#a78bfa'];

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <div className="min-h-screen bg-slate-50 text-slate-900 p-6 space-y-6">
          <DashboardHeader
            search={localSearch}
            onSearchChange={handleSearchChange}
            onRefresh={handleRefresh}
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
          />

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Customers</TabsTrigger>
              <TabsTrigger value="hoa">HOA Clusters</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="profitability">Profitability</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              <ErrorBoundary>
                {processedData.metrics && (
                  <MetricsCards metrics={processedData.metrics} />
                )}
              </ErrorBoundary>

              <ErrorBoundary>
                                 {processedData.chartData && (
                   <DashboardCharts 
                     revenueTrends={processedData.chartData.revenueTrends}
                     efficiencyScores={processedData.chartData.efficiencyScores}
                   />
                 )}
              </ErrorBoundary>

              <ErrorBoundary>
                <CustomerTable
                  customers={paginatedFilteredData}
                  search={localSearch}
                  onSearchChange={handleSearchChange}
                  currentPage={paginationInfo?.currentPage || 1}
                  totalPages={Math.ceil(processedData.filteredData.length / 10)}
                  hasNextPage={(paginationInfo?.currentPage || 1) < Math.ceil(processedData.filteredData.length / 10)}
                  hasPrevPage={(paginationInfo?.currentPage || 1) > 1}
                  onPageChange={actions?.setPage || (() => {})}
                  totalCustomers={processedData.filteredData.length}
                  pageSize={10}
                />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value="hoa">
              <PlaceholderTab
                title="HOA Clusters"
                description="HOA-specific insights and cluster analysis coming soon"
                icon={<TrendingUp className="w-16 h-16 text-blue-500" />}
              />
            </TabsContent>

            <TabsContent value="subscriptions">
              <PlaceholderTab
                title="Subscription Services"
                description="Subscription-based service analytics and metrics"
                icon={<Users className="w-16 h-16 text-green-500" />}
              />
            </TabsContent>

            <TabsContent value="profitability">
              <PlaceholderTab
                title="Profitability Analysis"
                description="Advanced profitability metrics and financial insights"
                icon={<DollarSign className="w-16 h-16 text-yellow-500" />}
              />
            </TabsContent>
          </Tabs>
        </div>
      </TooltipProvider>
    </ErrorBoundary>
  );
};

export default Dashboard; 