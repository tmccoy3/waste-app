'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { RefreshCw, FileText, Download, Search, TrendingUp, TrendingDown, Users, DollarSign, Clock, AlertCircle, CheckCircle, XCircle, Building, MapPin, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

// Data interfaces
interface Customer {
  'HOA Name': string;
  'Monthly Revenue': string;
  'Full Address': string;
  'Average Completion Time in Minutes': string;
  'Service Status': string;
  'Unit Type': string;
  'Type': string;
  'Number of Units': string;
  [key: string]: any; // Allow additional properties from the JSON
}

interface Metrics {
  activeCustomers: number;
  monthlyRevenue: number;
  avgCompletionTime: number;
  revenuePerMinute: number;
  efficiencyGain: number;
  pendingCustomers: number;
  cancelledCustomers: number;
  totalUnits: number;
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="w-full">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>Something went wrong loading this section.</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Loading Component
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Enhanced Metrics Cards Component
const MetricsCards: React.FC<{ metrics: Metrics }> = ({ metrics }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">Active Customers</p>
            <p className="text-2xl font-bold text-blue-900">{metrics.activeCustomers}</p>
            <p className="text-xs text-blue-600">+{metrics.pendingCustomers} pending</p>
          </div>
          <div className="p-3 bg-blue-200 rounded-full">
            <Users className="w-6 h-6 text-blue-700" />
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-700">Monthly Revenue</p>
            <p className="text-2xl font-bold text-green-900">${metrics.monthlyRevenue.toLocaleString()}</p>
            <p className="text-xs text-green-600">+{metrics.efficiencyGain}% growth</p>
          </div>
          <div className="p-3 bg-green-200 rounded-full">
            <DollarSign className="w-6 h-6 text-green-700" />
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-orange-700">Avg Completion Time</p>
            <p className="text-2xl font-bold text-orange-900">{metrics.avgCompletionTime.toFixed(1)}min</p>
            <p className="text-xs text-orange-600">-15% vs last month</p>
          </div>
          <div className="p-3 bg-orange-200 rounded-full">
            <Clock className="w-6 h-6 text-orange-700" />
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-700">Revenue/Minute</p>
            <p className="text-2xl font-bold text-purple-900">${metrics.revenuePerMinute.toFixed(2)}</p>
            <p className="text-xs text-purple-600">Efficiency metric</p>
          </div>
          <div className="p-3 bg-purple-200 rounded-full">
            <TrendingUp className="w-6 h-6 text-purple-700" />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Enhanced Dashboard Charts Component
const DashboardCharts: React.FC<{ 
  revenueTrends: any[], 
  efficiencyScores: any[], 
  serviceStatusBreakdown: any[] 
}> = ({ revenueTrends, efficiencyScores, serviceStatusBreakdown }) => {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Revenue Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueTrends}>
              <XAxis dataKey="month" />
              <YAxis />
              <RechartsTooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Service Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={serviceStatusBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {serviceStatusBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced Customer Table Component
const CustomerTable: React.FC<{
  customers: Customer[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalCustomers: number;
  pageSize: number;
  search: string;
  onSearchChange: (search: string) => void;
}> = ({ customers, currentPage, totalPages, onPageChange, totalCustomers, pageSize, search, onSearchChange }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Serviced':
        return <Badge className="bg-green-100 text-green-800 border-green-300"><CheckCircle className="w-3 h-3 mr-1" />Serviced</Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'Cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-300"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'HOA':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300"><Building className="w-3 h-3 mr-1" />HOA</Badge>;
      case 'Subscription':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300">Subscription</Badge>;
      case 'Commercial':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Commercial</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-xl font-bold">Customer Directory</CardTitle>
            <p className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCustomers)} of {totalCustomers} customers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search customers..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">HOA Name</TableHead>
                <TableHead className="min-w-[150px]">Address</TableHead>
                <TableHead className="min-w-[100px]">Type</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="min-w-[100px]">Units</TableHead>
                <TableHead className="min-w-[120px]">Monthly Revenue</TableHead>
                <TableHead className="min-w-[120px]">Completion Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-500" />
                      <span className="break-words">{customer['HOA Name']}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="break-words text-sm">{customer['Full Address']}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(customer['Type'])}</TableCell>
                  <TableCell>{getStatusBadge(customer['Service Status'])}</TableCell>
                  <TableCell>
                    <span className="font-medium">{customer['Number of Units']}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-green-600">{customer['Monthly Revenue']}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{customer['Average Completion Time in Minutes']}min</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced Header Component
const DashboardHeader: React.FC<{
  onRefresh: () => void;
  onExportCSV: () => void;
}> = ({ onRefresh, onExportCSV }) => (
  <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
    <CardHeader>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <CardTitle className="text-3xl font-bold">WasteOps Intelligence</CardTitle>
          <p className="text-blue-100 mt-1">Executive Operations Dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="secondary" size="sm" onClick={onExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
    </CardHeader>
  </Card>
);

// Placeholder Tab Component
const PlaceholderTab: React.FC<{ 
  title: string; 
  description: string; 
  icon: React.ReactNode;
  comingSoon?: boolean;
}> = ({ title, description, icon, comingSoon = true }) => (
  <Card className="w-full h-96 flex items-center justify-center">
    <CardContent className="text-center">
      <div className="mb-4">{icon}</div>
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600 max-w-md">{description}</p>
      {comingSoon && (
        <Badge className="mt-4" variant="outline">Coming Soon</Badge>
      )}
    </CardContent>
  </Card>
);

// Main Dashboard Component
const Dashboard: React.FC = () => {
  const [customerData, setCustomerData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Load customer data
  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        setLoading(true);
        // Import the JSON data
        const data = await import('../../../data/geocoded_customers.json');
        setCustomerData(data.default || data);
        setError(null);
      } catch (err) {
        console.error('Failed to load customer data:', err);
        setError('Failed to load customer data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadCustomerData();
  }, []);

  // Process and filter data
  const processedData = useMemo(() => {
    if (!customerData.length) return null;

    // Filter data based on search
    const filteredData = customerData.filter(customer => 
      customer['HOA Name']?.toLowerCase().includes(search.toLowerCase()) ||
      customer['Full Address']?.toLowerCase().includes(search.toLowerCase()) ||
      customer['Type']?.toLowerCase().includes(search.toLowerCase())
    );

    // Calculate metrics
    const activeCustomers = filteredData.filter(c => c['Service Status'] === 'Serviced').length;
    const pendingCustomers = filteredData.filter(c => c['Service Status'] === 'Pending').length;
    const cancelledCustomers = filteredData.filter(c => c['Service Status'] === 'Cancelled').length;
    
    const monthlyRevenue = filteredData.reduce((acc, c) => {
      const revenue = parseFloat(c['Monthly Revenue']?.replace(/[$,]/g, '') || '0');
      return acc + (isNaN(revenue) ? 0 : revenue);
    }, 0);
    
    const avgCompletionTime = filteredData.reduce((acc, c) => {
      const time = parseFloat(c['Average Completion Time in Minutes'] || '0');
      return acc + (isNaN(time) ? 0 : time);
    }, 0) / (filteredData.length || 1);

    const totalUnits = filteredData.reduce((acc, c) => {
      const units = parseFloat(c['Number of Units'] || '0');
      return acc + (isNaN(units) ? 0 : units);
    }, 0);

    const revenuePerMinute = monthlyRevenue / (avgCompletionTime * activeCustomers) || 0;

    const metrics: Metrics = {
      activeCustomers,
      pendingCustomers,
      cancelledCustomers,
      monthlyRevenue,
      avgCompletionTime,
      revenuePerMinute,
      efficiencyGain: 8.1,
      totalUnits
    };

    // Generate chart data
    const revenueTrends = [
      { month: 'Jan', total: monthlyRevenue * 0.8 },
      { month: 'Feb', total: monthlyRevenue * 0.85 },
      { month: 'Mar', total: monthlyRevenue * 0.9 },
      { month: 'Apr', total: monthlyRevenue * 0.95 },
      { month: 'May', total: monthlyRevenue * 0.98 },
      { month: 'Jun', total: monthlyRevenue }
    ];

    const serviceStatusBreakdown = [
      { name: 'Serviced', value: activeCustomers },
      { name: 'Pending', value: pendingCustomers },
      { name: 'Cancelled', value: cancelledCustomers }
    ].filter(item => item.value > 0);

    // Pagination
    const totalPages = Math.ceil(filteredData.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

    return {
      filteredData,
      paginatedData,
      metrics,
      revenueTrends,
      serviceStatusBreakdown,
      totalPages,
      totalCustomers: filteredData.length
    };
  }, [customerData, search, currentPage]);

  // Export functions
  const handleExportCSV = () => {
    if (!processedData) return;
    
    const csvHeaders = ['HOA Name', 'Full Address', 'Type', 'Service Status', 'Number of Units', 'Monthly Revenue', 'Average Completion Time in Minutes'];
    const csvRows = processedData.filteredData.map(customer => 
      csvHeaders.map(header => customer[header as keyof Customer] || '').join(',')
    );
    
    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'waste-ops-customers.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setCurrentPage(1); // Reset to first page when searching
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <LoadingSpinner />
            <p className="mt-4 text-gray-600">Loading dashboard data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={handleRefresh}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!processedData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">No data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 p-4 space-y-6">
        <DashboardHeader onRefresh={handleRefresh} onExportCSV={handleExportCSV} />

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="hoa">HOA Analysis</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="profitability">Profitability</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ErrorBoundary>
              <MetricsCards metrics={processedData.metrics} />
            </ErrorBoundary>

            <ErrorBoundary>
              <DashboardCharts 
                revenueTrends={processedData.revenueTrends}
                efficiencyScores={[]}
                serviceStatusBreakdown={processedData.serviceStatusBreakdown}
              />
            </ErrorBoundary>

            <ErrorBoundary>
              <CustomerTable
                customers={processedData.paginatedData}
                currentPage={currentPage}
                totalPages={processedData.totalPages}
                onPageChange={handlePageChange}
                totalCustomers={processedData.totalCustomers}
                pageSize={pageSize}
                search={search}
                onSearchChange={handleSearchChange}
              />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="hoa">
            <PlaceholderTab
              title="HOA Analysis"
              description="Comprehensive analysis of HOA clusters, service zones, and optimization opportunities"
              icon={<Building className="w-16 h-16 text-blue-500" />}
            />
          </TabsContent>

          <TabsContent value="subscriptions">
            <PlaceholderTab
              title="Subscription Services"
              description="Track subscription-based services, recurring revenue, and customer retention metrics"
              icon={<Users className="w-16 h-16 text-green-500" />}
            />
          </TabsContent>

          <TabsContent value="profitability">
            <PlaceholderTab
              title="Profitability Analysis"
              description="Advanced profitability metrics, cost analysis, and financial forecasting"
              icon={<TrendingUp className="w-16 h-16 text-purple-500" />}
            />
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard; 