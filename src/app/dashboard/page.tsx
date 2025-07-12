'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { RefreshCw, FileText, Send, AlertCircle } from 'lucide-react';
import { useOptimizedDashboard } from '@/hooks/useOptimizedDashboard';
import ErrorBoundary from '@/components/ErrorBoundary';
import MetricsCards from '@/components/dashboard/MetricsCards';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import CustomerTable from '@/components/dashboard/CustomerTable';

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

// Header component
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
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg shadow-sm">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">WasteOps Intelligence</h1>
        <p className="text-slate-600 mt-1">Executive Operations Dashboard</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <input 
          type="text" 
          placeholder="Search customers..." 
          className="border border-slate-300 p-2 rounded-md bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
          value={search}
          onChange={handleSearchChange}
        />
        <Button variant="outline" onClick={onRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
        <Button variant="outline" onClick={onExportCSV}>
          <FileText className="mr-2 h-4 w-4" /> Export CSV
        </Button>
        <Button variant="outline" onClick={handleExportPDF}>
          <FileText className="mr-2 h-4 w-4" /> Export PDF
        </Button>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Send className="mr-2 h-4 w-4" /> Send Alert
        </Button>
      </div>
    </header>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

// Placeholder components for other tabs
const PlaceholderTab: React.FC<{ title: string; description: string; icon: string }> = React.memo(({ title, description, icon }) => (
  <Card className="bg-white shadow-sm border border-slate-200">
    <CardHeader>
      <CardTitle className="text-xl font-bold text-slate-900">{title}</CardTitle>
      <p className="text-sm text-slate-600">{description}</p>
    </CardHeader>
    <CardContent className="p-8">
      <div className="text-center py-20">
        <div className="text-6xl mb-4">{icon}</div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">{title} Coming Soon</h3>
        <p className="text-slate-600 max-w-md mx-auto">
          {description} features are currently under development.
        </p>
      </div>
    </CardContent>
  </Card>
));

PlaceholderTab.displayName = 'PlaceholderTab';

// Main dashboard component
const Dashboard: React.FC = () => {
  const {
    data,
    loading,
    error,
    search,
    paginatedCustomers,
    paginationInfo,
    actions,
  } = useOptimizedDashboard(10);

  // Handle loading state
  if (loading) {
    return <LoadingDashboard />;
  }

  // Handle error state
  if (error) {
    return <ErrorDashboard error={error} onRetry={actions.refreshData} />;
  }

  // Handle missing data
  if (!data) {
    return <ErrorDashboard error="No data available" onRetry={actions.refreshData} />;
  }

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
          <div className="space-y-6">
            <DashboardHeader
              search={search}
              onSearchChange={actions.setSearch}
              onRefresh={actions.refreshData}
              onExportCSV={actions.exportCSV}
              onExportPDF={actions.exportPDF}
            />

            <Tabs defaultValue="dashboard" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="ceo-insights">CEO Insights</TabsTrigger>
                <TabsTrigger value="rfp-intelligence">RFP Intelligence</TabsTrigger>
                <TabsTrigger value="serviceability">Serviceability Check</TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-6">
                <ErrorBoundary>
                  <MetricsCards metrics={data.metrics} />
                </ErrorBoundary>

                <ErrorBoundary>
                  <DashboardCharts 
                    revenueTrends={data.revenueTrends}
                    efficiencyScores={data.efficiencyScores}
                  />
                </ErrorBoundary>

                <ErrorBoundary>
                  <CustomerTable
                    customers={paginatedCustomers}
                    search={search}
                    onSearchChange={actions.setSearch}
                    currentPage={paginationInfo.currentPage}
                    totalPages={paginationInfo.totalPages}
                    hasNextPage={paginationInfo.hasNextPage}
                    hasPrevPage={paginationInfo.hasPrevPage}
                    onPageChange={actions.setPage}
                    totalCustomers={paginationInfo.totalCustomers}
                    pageSize={paginationInfo.pageSize}
                  />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="ceo-insights">
                <PlaceholderTab
                  title="CEO Insights"
                  description="Strategic business intelligence and executive metrics"
                  icon="📊"
                />
              </TabsContent>

              <TabsContent value="rfp-intelligence">
                <PlaceholderTab
                  title="RFP Intelligence"
                  description="Request for Proposal analysis and competitive intelligence"
                  icon="📋"
                />
              </TabsContent>

              <TabsContent value="serviceability">
                <PlaceholderTab
                  title="Serviceability Check"
                  description="Geographic service area analysis and capacity planning"
                  icon="🗺️"
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </TooltipProvider>
    </ErrorBoundary>
  );
};

export default Dashboard; 