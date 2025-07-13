'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUp, ArrowUpDown, RefreshCw, FileText, Send, AlertCircle } from 'lucide-react';
// Static import for better reliability
import customersData from '@/data/geocoded_customers.json';

interface Customer {
  'HOA Name': string;
  'Monthly Revenue': string;
  'Full Address': string;
  'Average Completion Time in Minutes': string;
  'Service Status': string;
  'Unit Type': string;
  'Type': string;
  'Number of Units': string;
  [key: string]: any;
}

export default function Dashboard() {
  const [data, setData] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [sortColumn, setSortColumn] = useState('HOA Name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Use static import data directly
      const customers = customersData as Customer[];
      
      // Set Service Status based on existing data structure
      const processedCustomers = customers.map(customer => ({
        ...customer,
        'Service Status': customer['Service Status'] || 'Serviced' // Default to Serviced if not specified
      }));
      
      setData(processedCustomers);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load customer data');
      setIsLoading(false);
    }
  }, []);

  const filteredData = useMemo(() => 
    data.filter(c => c['HOA Name'].toLowerCase().includes(search.toLowerCase())), 
    [data, search]
  );

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let aValue = a[sortColumn];
      let bValue = b[sortColumn];
      if (sortColumn === 'Monthly Revenue' || sortColumn === 'Average Completion Time in Minutes') {
        aValue = parseFloat(String(aValue).replace(/[,$]/g, '')) || 0;
        bValue = parseFloat(String(bValue).replace(/[,$]/g, '')) || 0;
      }
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection]);

  const paginatedData = sortedData.slice((page - 1) * pageSize, page * pageSize);

  const metrics = useMemo(() => {
    const active = filteredData.filter(c => c['Service Status'] === 'Serviced').length;
    const revenue = filteredData.reduce((acc, c) => {
      const revenueStr = String(c['Monthly Revenue'] || '0').replace(/[,$]/g, '');
      return acc + (parseFloat(revenueStr) || 0);
    }, 0);
    const avgTime = filteredData.reduce((acc, c) => {
      const timeStr = String(c['Average Completion Time in Minutes'] || '0');
      return acc + (parseFloat(timeStr) || 0);
    }, 0) / filteredData.length || 0;
    const revPerMin = revenue / (avgTime * active) || 0;
    return { 
      activeCustomers: active, 
      monthlyRevenue: revenue, 
      hoaAvgTime: avgTime, 
      revenuePerMinute: revPerMin, 
      efficiencyGain: 8.1 
    };
  }, [filteredData]);

  const revenueTrends = useMemo(() => [
    { month: 'Mar', HOA: 50000, Subscription: 75000, Commercial: 50000, growth: 2.3 },
    { month: 'Apr', HOA: 55000, Subscription: 80000, Commercial: 55000, growth: 4.8 },
    { month: 'May', HOA: 60000, Subscription: 85000, Commercial: 60000, growth: -3.3 },
    { month: 'Jun', HOA: 65000, Subscription: 90000, Commercial: 65000, growth: 7.0 },
    { month: 'Jul', HOA: 70000, Subscription: 95000, Commercial: 70000, growth: -0.5 },
  ], []);

  const efficiencyScores = useMemo(() => [
    { name: 'HOA', value: 93 },
    { name: 'Subscription', value: 4 },
    { name: 'Commercial', value: 3 },
  ], []);

  const COLORS = ['#3b82f6', '#34d399', '#fbbf24'];

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['HOA Name', 'Address', 'Monthly Revenue', 'Completion Time', 'Service Status', 'Unit Type'],
      ...filteredData.map(c => [
        c['HOA Name'],
        c['Full Address'],
        c['Monthly Revenue'],
        c['Average Completion Time in Minutes'],
        c['Service Status'],
        c['Unit Type']
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waste-ops-customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen">
      <RefreshCw className="h-8 w-8 animate-spin mr-2" />
      Loading dashboard...
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <AlertCircle className="h-8 w-8 text-red-500" />
      <p className="text-red-500">{error}</p>
      <Button onClick={handleRefresh} variant="outline">
        <RefreshCw className="mr-2 h-4 w-4" />
        Retry
      </Button>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50 text-gray-900 p-6 space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">WasteOps Intelligence</h1>
            <p className="text-gray-600 mt-1">Comprehensive operations dashboard</p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <Input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search customers..." 
              className="w-64" 
            />
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <FileText className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" /> Export PDF
            </Button>
            <Button variant="default">
              <Send className="mr-2 h-4 w-4" /> Send Alert
            </Button>
          </div>
        </header>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Customers</TabsTrigger>
            <TabsTrigger value="hoa">HOA Clusters</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="profitability">Profitability</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Active Customers</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <ArrowUp className="h-4 w-4 text-green-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Currently serviced customers</p>
                    </TooltipContent>
                  </Tooltip>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{metrics.activeCustomers}</div>
                  <p className="text-xs text-gray-500">+12% from last month</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Monthly Revenue</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <ArrowUp className="h-4 w-4 text-green-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total recurring monthly revenue</p>
                    </TooltipContent>
                  </Tooltip>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    ${metrics.monthlyRevenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500">+8% from last month</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Avg Completion Time</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <ArrowUp className="h-4 w-4 text-blue-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Average service completion time</p>
                    </TooltipContent>
                  </Tooltip>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics.hoaAvgTime.toFixed(1)} min
                  </div>
                  <p className="text-xs text-gray-500">-5% improvement</p>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Revenue/Minute</CardTitle>
                  <Tooltip>
                    <TooltipTrigger>
                      <ArrowUp className="h-4 w-4 text-green-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Revenue efficiency per minute</p>
                    </TooltipContent>
                  </Tooltip>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    ${metrics.revenuePerMinute.toFixed(0)}
                  </div>
                  <p className="text-xs text-gray-500">+{metrics.efficiencyGain}% efficiency</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Monthly Revenue Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={revenueTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="HOA" stackId="a" fill={COLORS[0]} />
                      <Bar dataKey="Subscription" stackId="a" fill={COLORS[1]} />
                      <Bar dataKey="Commercial" stackId="a" fill={COLORS[2]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Service Efficiency by Customer Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie 
                        data={efficiencyScores} 
                        cx="50%" 
                        cy="50%" 
                        labelLine={false} 
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} 
                        outerRadius={80} 
                        fill="#8884d8" 
                        dataKey="value"
                      >
                        {efficiencyScores.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Customer Table */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Customer Management</CardTitle>
                <p className="text-sm text-gray-500">
                  {filteredData.length} customers found
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          onClick={() => handleSort('HOA Name')} 
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <div className="flex items-center">
                            Name 
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead 
                          onClick={() => handleSort('Monthly Revenue')} 
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <div className="flex items-center">
                            Revenue 
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead 
                          onClick={() => handleSort('Average Completion Time in Minutes')} 
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <div className="flex items-center">
                            Efficiency 
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((customer, index) => (
                        <TableRow key={index} className="hover:bg-gray-50">
                          <TableCell className="font-medium whitespace-normal">
                            {customer['HOA Name']}
                          </TableCell>
                          <TableCell className="whitespace-normal max-w-xs">
                            {customer['Full Address']}
                          </TableCell>
                          <TableCell className="font-medium">
                            ${parseFloat(String(customer['Monthly Revenue'] || '0').replace(/[,$]/g, '')).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {customer['Average Completion Time in Minutes'] || 'N/A'} min
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {customer['Unit Type']}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              customer['Service Status'] === 'Serviced' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {customer['Service Status']}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination */}
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-500">
                    Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, sortedData.length)} of {sortedData.length} customers
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={page === 1} 
                      onClick={() => setPage(p => p - 1)}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-3 py-1 text-sm">
                      Page {page} of {Math.ceil(sortedData.length / pageSize)}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={page * pageSize >= sortedData.length} 
                      onClick={() => setPage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hoa" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>HOA Clusters</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">HOA cluster analysis coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Subscription analytics coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profitability" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profitability Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Profitability metrics coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
} 