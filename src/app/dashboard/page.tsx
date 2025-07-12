'use client';
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { RefreshCw, FileText, Send, AlertCircle, ArrowUp } from 'lucide-react';
import { useOptimizedDashboard } from '@/hooks/useOptimizedDashboard';
import ErrorBoundary from '@/components/ErrorBoundary';
import MetricsCards from '@/components/dashboard/MetricsCards';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import CustomerTable from '@/components/dashboard/CustomerTable';

interface Customer {
  'HOA Name': string;
  'Monthly Revenue': string;
  'Full Address': string;
  'Average Completion Time in Minutes': string;
  'Service Status': string;
  'Unit Type': string;
}

const customersData: Customer[] = require('@/data/geocoded_customers.json');

const LoadingDashboard: React.FC = () => (
  <div className="flex items-center justify-center h-screen">
    Loading dashboard...
  </div>
);

const ErrorDashboard: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center h-screen gap-4">
    <AlertCircle className="w-12 h-12 text-red-500" />
    <h2 className="text-2xl font-bold">Failed to Load Dashboard</h2>
    <p className="text-gray-500">{error}</p>
    <Button onClick={onRetry} variant="outline">
      <RefreshCw className="mr-2 h-4 w-4" /> Retry
    </Button>
  </div>
);

const PlaceholderTab: React.FC<{ title: string; description: string; icon: React.ReactNode }> = ({ title, description, icon }) => (
  <Card className="w-full h-full">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col items-center justify-center gap-4">
      <div className="text-4xl">{icon}</div>
      <p className="text-gray-500 text-center">{description}</p>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const [data, setData] = useState<Customer[]>(customersData);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { loading, error, actions } = useOptimizedDashboard();

  const filteredData = useMemo(() => data.filter(c => c['HOA Name'].toLowerCase().includes(search.toLowerCase())), [data, search]);

  const metrics = useMemo(() => {
    const active = filteredData.filter(c => c['Service Status'] === 'Serviced').length;
    const revenue = filteredData.reduce((acc, c) => acc + parseFloat(c['Monthly Revenue'].replace(/[,]/g, '')) || 0, 0);
    const avgTime = filteredData.reduce((acc, c) => acc + parseFloat(c['Average Completion Time in Minutes'] || '0'), 0) / filteredData.length || 0;
    const revPerMin = revenue / (avgTime * active) || 0;
    return { activeCustomers: active, monthlyRevenue: revenue, hoaAvgTime: avgTime, revenuePerMinute: revPerMin, efficiencyGain: 8.1 };
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

  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  const handleExportCSV = () => {
    // Implement with json2csv or csv-export lib
    const csv = 'Name,Address,Revenue,Efficiency,Type\n' + paginatedData.map(c => `${c['HOA Name']},${c['Full Address']},${c['Monthly Revenue']},${c['Average Completion Time in Minutes']},${c['Unit Type']}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers.csv';
    a.click();
  };

  if (loading) return <LoadingDashboard />;
  if (error) return <ErrorDashboard error={error} onRetry={() => actions?.refreshData?.()} />;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">WasteOps Intelligence</h1>
        <div className="flex gap-2 items-center">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." className="border p-2 rounded flex-1 max-w-xs" />
          <Button variant="outline" onClick={() => actions?.refreshData?.()}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
          <Button variant="outline" onClick={handleExportCSV}><FileText className="mr-2 h-4 w-4" /> Export CSV</Button>
          <Button variant="outline"><FileText className="mr-2 h-4 w-4" /> Export PDF</Button>
          <Button variant="default"><Send className="mr-2 h-4 w-4" /> Send Alert</Button>
        </div>
      </header>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Customers</TabsTrigger>
          <TabsTrigger value="hoa">HOA Clusters</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="profitability">Profitability Levels</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                <Tooltip>
                  <TooltipTrigger><ArrowUp className="h-4 w-4 text-green-500" /></TooltipTrigger>
                  <TooltipContent>+12% from last month</TooltipContent>
                </Tooltip>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold whitespace-normal">{metrics.activeCustomers}</div>
              </CardContent>
            </Card>
            {/* Add similar Cards for Monthly Revenue, HOA Avg Time, Revenue Per Minute */}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={revenueTrends}>
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

            <Card>
              <CardHeader>
                <CardTitle>Service Efficiency by Customer Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie data={efficiencyScores} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
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

          <Card>
            <CardHeader>
              <CardTitle>Customer Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Efficiency</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell className="whitespace-normal">{customer['HOA Name']}</TableCell>
                      <TableCell className="whitespace-normal">{customer['Full Address']}</TableCell>
                      <TableCell>${parseFloat(customer['Monthly Revenue'].replace(/[,]/g, '')).toLocaleString()}</TableCell>
                      <TableCell>{customer['Average Completion Time in Minutes']} min</TableCell>
                      <TableCell>{customer['Unit Type']}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-center gap-2 mt-4">
                <Button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button disabled={page * pageSize >= filteredData.length} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Add content for other tabs, e.g., PlaceholderTab for HOA */}
        <TabsContent value="hoa">
          <PlaceholderTab title="HOA Clusters" description="HOA-specific insights coming soon" icon={<AlertCircle className="h-12 w-12 text-blue-500" />} />
        </TabsContent>
        {/* Similar for subscriptions and profitability */}
      </Tabs>
    </div>
  );
} 