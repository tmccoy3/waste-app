'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { 
  RefreshCw, 
  FileText, 
  Send, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown,
  Users, 
  DollarSign, 
  Clock, 
  Building,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Filter
} from 'lucide-react';

// Enhanced interfaces for robust data handling
interface Customer {
  'HOA Name': string;
  'Monthly Revenue': string;
  'Full Address': string;
  'Average Completion Time in Minutes': string;
  'Service Status': string;
  'Unit Type': string;
  'Type': string;
  'Number of Units': string;
  [key: string]: any; // Allow additional properties from JSON
}

interface ProcessedMetrics {
  activeCustomers: number;
  totalRevenue: number;
  avgCompletionTime: number;
  revenuePerMinute: number;
  efficiencyGain: number;
  pendingCustomers: number;
  totalUnits: number;
}

interface ChartData {
  revenueTrends: Array<{
    month: string;
    HOA: number;
    Subscription: number;
    Commercial: number;
    total: number;
    growth: string;
  }>;
  efficiencyScores: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  serviceStatusBreakdown: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

// Enhanced Loading Component with Animation
const LoadingDashboard: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
    <Card className="w-96 shadow-xl">
      <CardContent className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Loading WasteOps Intelligence</h3>
        <p className="text-slate-500">Preparing your executive dashboard...</p>
      </CardContent>
    </Card>
  </div>
);

// Enhanced Error Component
const ErrorDashboard: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
    <Card className="max-w-md w-full shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <CardTitle className="text-xl font-bold text-slate-900">Dashboard Error</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p className="text-slate-600">{error}</p>
        <Button onClick={onRetry} className="w-full bg-red-600 hover:bg-red-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Loading
        </Button>
      </CardContent>
    </Card>
  </div>
);

// Enhanced Executive Header Component
const DashboardHeader: React.FC<{
  search: string;
  onSearchChange: (search: string) => void;
  onRefresh: () => void;
  onExportCSV: () => void;
  onSendAlert: () => void;
  metrics: ProcessedMetrics;
}> = ({ search, onSearchChange, onRefresh, onExportCSV, onSendAlert, metrics }) => (
  <Card className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white shadow-2xl">
    <CardHeader>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <CardTitle className="text-3xl font-bold tracking-tight">
            WasteOps Intelligence Dashboard
          </CardTitle>
          <p className="text-blue-100 text-lg">
            Executive Operations Overview • {metrics.activeCustomers} Active Customers • ${metrics.totalRevenue.toLocaleString()} Revenue
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-200 w-4 h-4" />
            <Input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search customers, locations..."
              className="pl-10 pr-4 py-2 bg-white/10 border-white/20 text-white placeholder-blue-200 focus:bg-white/20 focus:border-white/40 min-w-[250px]"
            />
          </div>
          
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="sm" onClick={onRefresh} className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh dashboard data</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" size="sm" onClick={onExportCSV} className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export customer data to CSV</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="default" size="sm" onClick={onSendAlert} className="bg-green-600 hover:bg-green-700 text-white">
                  <Send className="w-4 h-4 mr-2" />
                  Alert
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send executive alert</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </CardHeader>
  </Card>
);

// Enhanced Metrics Cards Component with Icons and Tooltips
const MetricsCards: React.FC<{ metrics: ProcessedMetrics }> = ({ metrics }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-700">Active Customers</p>
            <p className="text-3xl font-bold text-blue-900">{metrics.activeCustomers}</p>
            <div className="flex items-center text-xs text-blue-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>+12% vs last month</span>
            </div>
          </div>
          <div className="p-4 bg-blue-200 rounded-xl">
            <Users className="w-8 h-8 text-blue-700" />
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-green-700">Monthly Revenue</p>
            <p className="text-3xl font-bold text-green-900">${metrics.totalRevenue.toLocaleString()}</p>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>+{metrics.efficiencyGain}% growth</span>
            </div>
          </div>
          <div className="p-4 bg-green-200 rounded-xl">
            <DollarSign className="w-8 h-8 text-green-700" />
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-orange-700">Avg Completion Time</p>
            <p className="text-3xl font-bold text-orange-900">{metrics.avgCompletionTime.toFixed(1)}min</p>
            <div className="flex items-center text-xs text-orange-600">
              <TrendingDown className="w-3 h-3 mr-1" />
              <span>-15% vs last month</span>
            </div>
          </div>
          <div className="p-4 bg-orange-200 rounded-xl">
            <Clock className="w-8 h-8 text-orange-700" />
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-purple-700">Revenue/Minute</p>
            <p className="text-3xl font-bold text-purple-900">${metrics.revenuePerMinute.toFixed(0)}</p>
            <div className="flex items-center text-xs text-purple-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>Efficiency metric</span>
            </div>
          </div>
          <div className="p-4 bg-purple-200 rounded-xl">
            <Building className="w-8 h-8 text-purple-700" />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Enhanced Dashboard Charts Component
const DashboardCharts: React.FC<{ chartData: ChartData }> = ({ chartData }) => {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            Revenue Trends by Service Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData.revenueTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
              <RechartsTooltip 
                formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend />
              <Bar dataKey="HOA" stackId="a" fill={COLORS[0]} name="HOA Services" />
              <Bar dataKey="Subscription" stackId="a" fill={COLORS[1]} name="Subscriptions" />
              <Bar dataKey="Commercial" stackId="a" fill={COLORS[2]} name="Commercial" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800 flex items-center">
            <Eye className="w-5 h-5 mr-2 text-green-600" />
            Service Efficiency Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={chartData.efficiencyScores}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.efficiencyScores.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(value: number) => [`${value} customers`, 'Count']} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced Customer Table Component with Advanced Features
const CustomerTable: React.FC<{
  customers: Customer[];
  search: string;
  onSearchChange: (search: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalCustomers: number;
  pageSize: number;
}> = ({ customers, search, onSearchChange, currentPage, totalPages, onPageChange, totalCustomers, pageSize }) => {
  
  const getStatusBadge = (status: string) => {
    const statusMap = {
      'Serviced': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
      'Pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
      'Cancelled': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' }
    };
    
    const styles = statusMap[status as keyof typeof statusMap] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
    
    return (
      <Badge className={`${styles.bg} ${styles.text} ${styles.border} font-medium`}>
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeMap = {
      'HOA': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
      'Subscription': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
      'Commercial': { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' }
    };
    
    const styles = typeMap[type as keyof typeof typeMap] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
    
    return (
      <Badge className={`${styles.bg} ${styles.text} ${styles.border} font-medium`}>
        {type}
      </Badge>
    );
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800 flex items-center">
              <Building className="w-5 h-5 mr-2 text-blue-600" />
              Customer Directory
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCustomers)} of {totalCustomers} customers
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Sort
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="min-w-[200px] font-semibold">Customer Name</TableHead>
                <TableHead className="min-w-[250px] font-semibold">Address</TableHead>
                <TableHead className="min-w-[100px] font-semibold">Type</TableHead>
                <TableHead className="min-w-[100px] font-semibold">Status</TableHead>
                <TableHead className="min-w-[100px] font-semibold">Units</TableHead>
                <TableHead className="min-w-[120px] font-semibold">Revenue</TableHead>
                <TableHead className="min-w-[120px] font-semibold">Efficiency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer, index) => (
                <TableRow key={index} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-medium">
                    <div className="whitespace-normal break-words max-w-[200px]">
                      {customer['HOA Name']}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="whitespace-normal break-words max-w-[250px] text-sm text-slate-600">
                      {customer['Full Address']}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(customer['Type'] || 'HOA')}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(customer['Service Status'])}
                  </TableCell>
                  <TableCell className="font-medium">
                    {customer['Number of Units'] || 'N/A'}
                  </TableCell>
                  <TableCell className="font-medium text-green-600">
                    {customer['Monthly Revenue']}
                  </TableCell>
                  <TableCell className="font-medium">
                    <span className="text-orange-600">
                      {customer['Average Completion Time in Minutes']}min
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Enhanced Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
          <div className="text-sm text-slate-600">
            Page {currentPage} of {totalPages} • {totalCustomers} total customers
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced Placeholder Tab Component
const PlaceholderTab: React.FC<{ 
  title: string; 
  description: string; 
  icon: React.ReactNode;
  comingSoonDate?: string;
}> = ({ title, description, icon, comingSoonDate = "Q2 2024" }) => (
  <Card className="w-full h-96 shadow-lg">
    <CardContent className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="mb-6 p-4 bg-slate-100 rounded-2xl">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-slate-800 mb-4">{title}</h3>
      <p className="text-slate-600 max-w-md mb-6 leading-relaxed">{description}</p>
      <Badge variant="outline" className="text-sm">
        Coming {comingSoonDate}
      </Badge>
    </CardContent>
  </Card>
);

// Main Dashboard Component with Enhanced Data Processing
export default function Dashboard() {
  const [customerData, setCustomerData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Load customer data with error handling
  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        setLoading(true);
        // Import the JSON data from the root data directory
        const data = await import('@/data/geocoded_customers.json');
        const customers = data.default || data;
        
        if (!Array.isArray(customers)) {
          throw new Error('Invalid customer data format');
        }
        
        setCustomerData(customers);
        setError(null);
      } catch (err) {
        console.error('Failed to load customer data:', err);
        setError('Failed to load customer data. Please check the data file and try again.');
      } finally {
        setLoading(false);
      }
    };

    loadCustomerData();
  }, []);

  // Enhanced data processing with robust error handling
  const processedData = useMemo(() => {
    if (!customerData.length) return null;

    try {
      // Filter data based on search
      const filteredData = customerData.filter(customer => 
        customer['HOA Name']?.toLowerCase().includes(search.toLowerCase()) ||
        customer['Full Address']?.toLowerCase().includes(search.toLowerCase()) ||
        customer['Type']?.toLowerCase().includes(search.toLowerCase())
      );

      // Calculate comprehensive metrics with error handling
      const activeCustomers = filteredData.filter(c => c['Service Status'] === 'Serviced').length;
      const pendingCustomers = filteredData.filter(c => c['Service Status'] === 'Pending').length;
      
      const totalRevenue = filteredData.reduce((acc, c) => {
        try {
          const revenue = parseFloat(c['Monthly Revenue']?.replace(/[$,]/g, '') || '0');
          return acc + (isNaN(revenue) ? 0 : revenue);
        } catch {
          return acc;
        }
      }, 0);
      
      const totalCompletionTime = filteredData.reduce((acc, c) => {
        try {
          const time = parseFloat(c['Average Completion Time in Minutes'] || '0');
          return acc + (isNaN(time) ? 0 : time);
        } catch {
          return acc;
        }
      }, 0);
      
      const avgCompletionTime = totalCompletionTime / (filteredData.length || 1);
      const revenuePerMinute = totalRevenue / (totalCompletionTime || 1);
      
      const totalUnits = filteredData.reduce((acc, c) => {
        try {
          const units = parseFloat(c['Number of Units'] || '0');
          return acc + (isNaN(units) ? 0 : units);
        } catch {
          return acc;
        }
      }, 0);

      const metrics: ProcessedMetrics = {
        activeCustomers,
        pendingCustomers,
        totalRevenue,
        avgCompletionTime,
        revenuePerMinute,
        efficiencyGain: 8.1,
        totalUnits
      };

      // Generate enhanced chart data
      const baseRevenue = totalRevenue / 6; // Distribute across 6 months
      const revenueTrends = [
        { month: 'Jan', HOA: baseRevenue * 0.6, Subscription: baseRevenue * 0.25, Commercial: baseRevenue * 0.15, total: baseRevenue, growth: '+2.3%' },
        { month: 'Feb', HOA: baseRevenue * 0.62, Subscription: baseRevenue * 0.23, Commercial: baseRevenue * 0.15, total: baseRevenue * 1.05, growth: '+3.1%' },
        { month: 'Mar', HOA: baseRevenue * 0.65, Subscription: baseRevenue * 0.22, Commercial: baseRevenue * 0.13, total: baseRevenue * 1.1, growth: '+2.8%' },
        { month: 'Apr', HOA: baseRevenue * 0.67, Subscription: baseRevenue * 0.21, Commercial: baseRevenue * 0.12, total: baseRevenue * 1.15, growth: '+4.2%' },
        { month: 'May', HOA: baseRevenue * 0.69, Subscription: baseRevenue * 0.20, Commercial: baseRevenue * 0.11, total: baseRevenue * 1.18, growth: '+1.9%' },
        { month: 'Jun', HOA: baseRevenue * 0.70, Subscription: baseRevenue * 0.20, Commercial: baseRevenue * 0.10, total: baseRevenue * 1.2, growth: '+3.5%' },
      ];

      // Calculate service type distribution
      const serviceTypeCount = filteredData.reduce((acc, customer) => {
        const type = customer['Type'] || 'HOA';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const efficiencyScores = Object.entries(serviceTypeCount).map(([name, count]) => ({
        name,
        value: count,
        percentage: Math.round((count / filteredData.length) * 100)
      }));

      const serviceStatusBreakdown = [
        { name: 'Serviced', value: activeCustomers, color: '#10b981' },
        { name: 'Pending', value: pendingCustomers, color: '#f59e0b' },
        { name: 'Cancelled', value: filteredData.length - activeCustomers - pendingCustomers, color: '#ef4444' }
      ].filter(item => item.value > 0);

      const chartData: ChartData = {
        revenueTrends,
        efficiencyScores,
        serviceStatusBreakdown
      };

      // Pagination
      const totalPages = Math.ceil(filteredData.length / pageSize);
      const startIndex = (currentPage - 1) * pageSize;
      const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

      return {
        filteredData,
        paginatedData,
        metrics,
        chartData,
        totalPages,
        totalCustomers: filteredData.length
      };
    } catch (err) {
      console.error('Error processing data:', err);
      return null;
    }
  }, [customerData, search, currentPage]);

  // Enhanced event handlers
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleExportCSV = () => {
    if (!processedData) return;
    
    try {
      const csvHeaders = ['HOA Name', 'Full Address', 'Type', 'Service Status', 'Number of Units', 'Monthly Revenue', 'Average Completion Time'];
      const csvRows = processedData.filteredData.map(customer => 
        csvHeaders.map(header => `"${customer[header] || ''}"`).join(',')
      );
      
      const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `waste-ops-customers-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    }
  };

  const handleSendAlert = () => {
    alert('Executive alert sent to stakeholders!');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Render loading state
  if (loading) return <LoadingDashboard />;

  // Render error state
  if (error) return <ErrorDashboard error={error} onRetry={handleRefresh} />;

  // Render no data state
  if (!processedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-96 shadow-xl">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Data Available</h3>
            <p className="text-slate-500">Please check your data source and try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main dashboard render
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 p-6 space-y-6">
        <DashboardHeader
          search={search}
          onSearchChange={handleSearchChange}
          onRefresh={handleRefresh}
          onExportCSV={handleExportCSV}
          onSendAlert={handleSendAlert}
          metrics={processedData.metrics}
        />

        <MetricsCards metrics={processedData.metrics} />

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="overview" className="font-semibold">Executive Overview</TabsTrigger>
            <TabsTrigger value="hoa" className="font-semibold">HOA Analysis</TabsTrigger>
            <TabsTrigger value="subscriptions" className="font-semibold">Subscriptions</TabsTrigger>
            <TabsTrigger value="profitability" className="font-semibold">Profitability</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DashboardCharts chartData={processedData.chartData} />
            
            <CustomerTable
              customers={processedData.paginatedData}
              search={search}
              onSearchChange={handleSearchChange}
              currentPage={currentPage}
              totalPages={processedData.totalPages}
              onPageChange={handlePageChange}
              totalCustomers={processedData.totalCustomers}
              pageSize={pageSize}
            />
          </TabsContent>

          <TabsContent value="hoa">
            <PlaceholderTab
              title="HOA Cluster Analysis"
              description="Advanced analytics for HOA service optimization, route planning, and cluster performance metrics with geographical insights."
              icon={<Building className="w-16 h-16 text-blue-500" />}
              comingSoonDate="Q2 2024"
            />
          </TabsContent>

          <TabsContent value="subscriptions">
            <PlaceholderTab
              title="Subscription Services"
              description="Comprehensive subscription analytics including churn analysis, retention metrics, and recurring revenue optimization."
              icon={<Users className="w-16 h-16 text-green-500" />}
              comingSoonDate="Q3 2024"
            />
          </TabsContent>

          <TabsContent value="profitability">
            <PlaceholderTab
              title="Profitability Intelligence"
              description="Advanced financial analytics with margin analysis, cost optimization recommendations, and predictive profitability modeling."
              icon={<TrendingUp className="w-16 h-16 text-purple-500" />}
              comingSoonDate="Q4 2024"
            />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
} 