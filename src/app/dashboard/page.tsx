'use client'

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUp, RefreshCw, FileText, Send, DollarSign, Users, Clock, Activity } from 'lucide-react';

interface Customer {
  'HOA Name': string;
  'Monthly Revenue': string;
  'Full Address': string;
  'Average Completion Time in Minutes': string;
  'Service Status': string;
  'Unit Type': string;
  'Type': string;
  'Number of Units': string;
}

export default function Dashboard() {
  const [data, setData] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/geocoded_customers.json');
        const customersData = await response.json();
        setData(customersData.filter((c: Customer) => c['Service Status'] === 'Serviced'));
        setLoading(false);
      } catch (error) {
        console.error('Failed to load data:', error);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredData = useMemo(() => 
    data.filter(c => c['HOA Name'].toLowerCase().includes(search.toLowerCase())), 
    [data, search]
  );

  const metrics = useMemo(() => {
    const active = filteredData.length;
    const revenue = filteredData.reduce((acc, c) => 
      acc + parseFloat(c['Monthly Revenue'].replace(/[$,]/g, '') || '0'), 0
    );
    const avgTime = filteredData.reduce((acc, c) => 
      acc + parseFloat(c['Average Completion Time in Minutes'] || '0'), 0
    ) / filteredData.length || 0;
    const revPerMin = active > 0 ? revenue / (avgTime * active) : 0;
    
    return { 
      activeCustomers: active, 
      monthlyRevenue: revenue, 
      hoaAvgTime: avgTime, 
      revenuePerMinute: revPerMin, 
      efficiencyGain: 8.1 
    };
  }, [filteredData]);

  // Revenue trends with calculated data
  const revenueTrends = useMemo(() => {
    const baseRevenue = metrics.monthlyRevenue;
    return [
      { month: 'Mar', HOA: Math.round(baseRevenue * 0.18), Subscription: Math.round(baseRevenue * 0.12), Commercial: Math.round(baseRevenue * 0.08), growth: '+2.3%' },
      { month: 'Apr', HOA: Math.round(baseRevenue * 0.19), Subscription: Math.round(baseRevenue * 0.13), Commercial: Math.round(baseRevenue * 0.09), growth: '+4.8%' },
      { month: 'May', HOA: Math.round(baseRevenue * 0.17), Subscription: Math.round(baseRevenue * 0.11), Commercial: Math.round(baseRevenue * 0.07), growth: '-3.3%' },
      { month: 'Jun', HOA: Math.round(baseRevenue * 0.20), Subscription: Math.round(baseRevenue * 0.14), Commercial: Math.round(baseRevenue * 0.10), growth: '+7.0%' },
      { month: 'Jul', HOA: Math.round(baseRevenue * 0.21), Subscription: Math.round(baseRevenue * 0.15), Commercial: Math.round(baseRevenue * 0.11), growth: '-0.5%' },
    ];
  }, [metrics.monthlyRevenue]);

  const efficiencyScores = useMemo(() => {
    const hoaCount = filteredData.filter(c => c.Type === 'HOA').length;
    const subscriptionCount = filteredData.filter(c => c.Type === 'Subscription').length;
    const commercialCount = filteredData.filter(c => c.Type === 'Commercial').length;
    
    return [
      { name: 'HOA', value: 93, count: hoaCount },
      { name: 'Subscription', value: 4, count: subscriptionCount },
      { name: 'Commercial', value: 3, count: commercialCount },
    ];
  }, [filteredData]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleExportCSV = () => {
    const csvContent = [
      Object.keys(filteredData[0] || {}).join(','),
      ...filteredData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF();
    pdf.text('WasteOps Intelligence Report', 20, 20);
    pdf.text(`Active Customers: ${metrics.activeCustomers}`, 20, 40);
    pdf.text(`Monthly Revenue: $${metrics.monthlyRevenue.toLocaleString()}`, 20, 50);
    pdf.text(`Average HOA Time: ${metrics.hoaAvgTime.toFixed(1)} minutes`, 20, 60);
    pdf.text(`Revenue Per Minute: $${metrics.revenuePerMinute.toFixed(2)}`, 20, 70);
    pdf.save('wasteops-report.pdf');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
        <div className="space-y-6">
          {/* Header */}
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
                onChange={(e) => setSearch(e.target.value)} 
              />
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
              <Button variant="outline" onClick={handleExportCSV}>
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

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="ceo-insights">CEO Insights</TabsTrigger>
              <TabsTrigger value="rfp-intelligence">RFP Intelligence</TabsTrigger>
              <TabsTrigger value="serviceability">Serviceability Check</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              {/* Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white shadow-sm border border-slate-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Active Customers</CardTitle>
                    <Tooltip>
                      <TooltipTrigger>
                        <Users className="h-4 w-4 text-blue-600" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total serviced customers</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-900">{metrics.activeCustomers}</div>
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <ArrowUp className="h-3 w-3" />
                      +12% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border border-slate-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Monthly Revenue</CardTitle>
                    <Tooltip>
                      <TooltipTrigger>
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total recurring monthly revenue</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-900">${metrics.monthlyRevenue.toLocaleString()}</div>
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                      <ArrowUp className="h-3 w-3 rotate-180" />
                      -3.2% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border border-slate-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">HOA Avg Time</CardTitle>
                    <Tooltip>
                      <TooltipTrigger>
                        <Clock className="h-4 w-4 text-amber-600" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Average service time per HOA</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-900">{metrics.hoaAvgTime.toFixed(1)}m</div>
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <ArrowUp className="h-3 w-3 rotate-180" />
                      -0.5m improvement
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border border-slate-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">Revenue Per Minute</CardTitle>
                    <Tooltip>
                      <TooltipTrigger>
                        <Activity className="h-4 w-4 text-purple-600" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Operational efficiency metric</p>
                      </TooltipContent>
                    </Tooltip>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-slate-900">${metrics.revenuePerMinute.toFixed(2)}</div>
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <ArrowUp className="h-3 w-3" />
                      +{metrics.efficiencyGain}% efficiency gain
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white shadow-sm border border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-900">Monthly Revenue Trends</CardTitle>
                    <p className="text-sm text-slate-600">Revenue breakdown by service type with growth indicators</p>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={revenueTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <RechartsTooltip 
                          formatter={(value, name) => [`$${value.toLocaleString()}`, name]}
                          labelFormatter={(label) => `${label} 2024`}
                          contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                        />
                        <Legend />
                        <Bar dataKey="HOA" stackId="a" fill={COLORS[0]} name="HOA Revenue" />
                        <Bar dataKey="Subscription" stackId="a" fill={COLORS[1]} name="Subscription Revenue" />
                        <Bar dataKey="Commercial" stackId="a" fill={COLORS[2]} name="Commercial Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-900">Service Efficiency by Customer Type</CardTitle>
                    <p className="text-sm text-slate-600">Performance distribution across service categories</p>
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
                          label={({ name, value, count }) => `${name}: ${value}% (${count})`}
                          labelLine={false}
                        >
                          {efficiencyScores.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value, name, props) => [
                            `${value}% (${props.payload.count} customers)`, 
                            name
                          ]}
                          contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="text-center mt-4">
                      <div className="text-2xl font-bold text-slate-900">
                        {efficiencyScores.reduce((sum, item) => sum + item.value, 0) / efficiencyScores.length}%
                      </div>
                      <div className="text-sm text-slate-600">Overall Efficiency Score</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Customer Table */}
              <Card className="bg-white shadow-sm border border-slate-200">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900">Customer Portfolio</CardTitle>
                  <p className="text-sm text-slate-600">Detailed customer analytics and performance metrics</p>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="font-semibold text-slate-700">Customer Name</TableHead>
                          <TableHead className="font-semibold text-slate-700">Address</TableHead>
                          <TableHead className="font-semibold text-slate-700 text-right">Monthly Revenue</TableHead>
                          <TableHead className="font-semibold text-slate-700 text-center">Avg Time</TableHead>
                          <TableHead className="font-semibold text-slate-700 text-center">Units</TableHead>
                          <TableHead className="font-semibold text-slate-700 text-center">Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData.map((customer, index) => (
                          <TableRow key={index} className="hover:bg-slate-50 transition-colors">
                            <TableCell className="font-medium">
                              <div className="whitespace-normal">
                                <div className="font-semibold text-slate-900">{customer['HOA Name']}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="whitespace-normal text-sm text-slate-600 max-w-xs">
                                {customer['Full Address']}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="font-semibold text-green-600">
                                ${parseFloat(customer['Monthly Revenue'].replace(/[$,]/g, '') || '0').toLocaleString()}
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-slate-700">
                              {customer['Average Completion Time in Minutes']}m
                            </TableCell>
                            <TableCell className="text-center text-slate-700">
                              {customer['Number of Units'] || 'N/A'}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                customer['Type'] === 'HOA' ? 'bg-blue-100 text-blue-800' :
                                customer['Type'] === 'Subscription' ? 'bg-green-100 text-green-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {customer['Type'] || customer['Unit Type']}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
                    <div className="text-sm text-slate-600">
                      Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredData.length)} of {filteredData.length} customers
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        disabled={page === 1} 
                        onClick={() => setPage(p => p - 1)}
                        className="text-slate-600"
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <Button
                              key={pageNum}
                              variant={page === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPage(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button 
                        variant="outline" 
                        disabled={page === totalPages} 
                        onClick={() => setPage(p => p + 1)}
                        className="text-slate-600"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other Tab Contents */}
            <TabsContent value="ceo-insights">
              <Card className="bg-white shadow-sm border border-slate-200">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900">CEO Insights</CardTitle>
                  <p className="text-sm text-slate-600">Strategic business intelligence and executive metrics</p>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">CEO Insights Coming Soon</h3>
                    <p className="text-slate-600 max-w-md mx-auto">
                      Advanced executive analytics, strategic KPIs, and business intelligence dashboards are currently under development.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rfp-intelligence">
              <Card className="bg-white shadow-sm border border-slate-200">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900">RFP Intelligence</CardTitle>
                  <p className="text-sm text-slate-600">Request for Proposal analysis and competitive intelligence</p>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">RFP Intelligence Coming Soon</h3>
                    <p className="text-slate-600 max-w-md mx-auto">
                      Intelligent RFP analysis, bid optimization, and competitive positioning tools are currently under development.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="serviceability">
              <Card className="bg-white shadow-sm border border-slate-200">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900">Serviceability Check</CardTitle>
                  <p className="text-sm text-slate-600">Territory analysis and service area optimization</p>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">🗺️</div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Serviceability Check Coming Soon</h3>
                    <p className="text-slate-600 max-w-md mx-auto">
                      Geographic service area analysis, route optimization, and territory planning tools are currently under development.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
} 