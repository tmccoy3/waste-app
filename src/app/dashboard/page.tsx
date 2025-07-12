'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip,
  Legend,
  LabelList
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Clock, 
  Activity, 
  RefreshCw, 
  Send, 
  Search,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
  Building,
  Truck,
  MapPin,
  AlertCircle,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUpIcon,
  Globe
} from 'lucide-react'

// Professional color palette
const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#8b5cf6',
  muted: '#6b7280',
  chart: {
    hoa: '#3b82f6',
    subscription: '#10b981',
    commercial: '#f59e0b',
    other: '#8b5cf6'
  }
}

interface CustomerData {
  id: string
  name: string
  monthlyRevenue: number
  address: string
  type: string
  units: number
  completionTime: number
  efficiency: number
  latitude: number
  longitude: number
  serviceStatus: string
}

interface MetricsData {
  activeCustomers: { value: number; change: number; trend: 'up' | 'down' }
  monthlyRevenue: { value: number; change: number; trend: 'up' | 'down' }
  hoaAvgTime: { value: number; change: number; trend: 'up' | 'down' }
  revenuePerMinute: { value: number; change: number; trend: 'up' | 'down' }
}

const parseRevenue = (revenueStr: string): number => {
  return parseFloat(revenueStr.replace(/[$,]/g, '')) || 0
}

const calculateEfficiency = (units: number, time: number): number => {
  const baseEfficiency = 85
  const unitsPerMinute = units / time
  const efficiencyBonus = Math.min(unitsPerMinute * 2, 15)
  return Math.min(Math.round(baseEfficiency + efficiencyBonus), 100)
}

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xl">
        <p className="font-semibold text-slate-900 mb-2">{`${label} 2024`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm flex items-center gap-2" style={{ color: entry.color }}>
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
            {`${entry.name}: $${entry.value.toLocaleString()}`}
          </p>
        ))}
        <div className="border-t pt-2 mt-2">
          <p className="text-sm font-medium text-slate-900">
            Total: ${payload.reduce((sum: number, entry: any) => sum + entry.value, 0).toLocaleString()}
          </p>
        </div>
      </div>
    )
  }
  return null
}

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xl">
        <p className="font-semibold text-slate-900 mb-1">{data.name}</p>
        <p className="text-sm text-slate-600">Efficiency: {data.value}%</p>
        <p className="text-sm text-slate-600">Customers: {data.count}</p>
        <p className="text-sm text-green-600 font-medium">Revenue: ${data.revenue?.toLocaleString()}</p>
      </div>
    )
  }
  return null
}

const exportToCSV = (data: any[], filename: string) => {
  const csvContent = [
    Object.keys(data[0]).join(','),
    ...data.map(row => Object.values(row).join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

const exportToPDF = async () => {
  const { jsPDF } = await import('jspdf')
  const html2canvas = (await import('html2canvas')).default
  
  const element = document.getElementById('dashboard-content')
  if (element) {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('l', 'mm', 'a4')
    
    const imgWidth = 297
    const pageHeight = 210
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    
    let position = 0
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    
    pdf.save('wasteops-dashboard-report.pdf')
  }
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedTab, setSelectedTab] = useState('all')
  const [sortField, setSortField] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)
  const [customers, setCustomers] = useState<CustomerData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        console.log('Starting to load customer data...')
        const response = await fetch('/geocoded_customers.json')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        console.log('JSON response received, parsing...')
        const rawData = await response.json()
        console.log('Raw data loaded, processing...', rawData.length, 'items')
        
        const processedData: CustomerData[] = rawData.map((item: any, index: number) => {
          const monthlyRevenue = parseRevenue(item['Monthly Revenue'] || '0')
          const units = parseInt(item['Number of Units'] || '1')
          const completionTime = parseInt(item['Average Completion Time in Minutes'] || '30')
          
          return {
            id: `customer-${index}`,
            name: item['HOA Name'] || 'Unknown',
            monthlyRevenue,
            address: item['Full Address'] || 'Unknown',
            type: item['Type'] || 'Other',
            units,
            completionTime,
            efficiency: calculateEfficiency(units, completionTime),
            latitude: parseFloat(item['latitude'] || '0'),
            longitude: parseFloat(item['longitude'] || '0'),
            serviceStatus: item['Service Status'] || 'Unknown'
          }
        }).filter((customer: CustomerData) => customer.serviceStatus === 'Serviced' && customer.monthlyRevenue > 0)

        console.log('Processed data:', processedData.length, 'active customers')
        setCustomers(processedData)
        setLoading(false)
      } catch (error) {
        console.error('Error loading customer data:', error)
        setCustomers([
          {
            id: 'sample-1',
            name: 'Sample Customer',
            monthlyRevenue: 2500,
            address: '123 Main St, Fairfax, VA',
            type: 'HOA',
            units: 50,
            completionTime: 25,
            efficiency: 90,
            latitude: 38.8501,
            longitude: -77.3595,
            serviceStatus: 'Serviced'
          }
        ])
        setLoading(false)
      }
    }

    loadCustomerData()
  }, [])

  const metricsData: MetricsData = useMemo(() => {
    const totalCustomers = customers.length
    const totalRevenue = customers.reduce((sum, c) => sum + c.monthlyRevenue, 0)
    const hoaCustomers = customers.filter(c => c.type === 'HOA')
    const avgHoaTime = hoaCustomers.length > 0 
      ? hoaCustomers.reduce((sum, c) => sum + c.completionTime, 0) / hoaCustomers.length 
      : 0
    
    const totalTime = customers.reduce((sum, c) => sum + c.completionTime, 0)
    const revenuePerMinute = totalTime > 0 ? totalRevenue / totalTime : 0

    return {
      activeCustomers: { value: totalCustomers, change: 12, trend: 'up' },
      monthlyRevenue: { value: totalRevenue, change: -3.2, trend: 'down' },
      hoaAvgTime: { value: avgHoaTime, change: -0.5, trend: 'down' },
      revenuePerMinute: { value: revenuePerMinute, change: 8.1, trend: 'up' }
    }
  }, [customers])

  const revenueChartData = useMemo(() => {
    const monthlyData = []
    
    for (let i = 0; i < 5; i++) {
      const month = new Date()
      month.setMonth(month.getMonth() - (4 - i))
      const monthName = month.toLocaleString('default', { month: 'short' })
      
      const baseRevenue = metricsData.monthlyRevenue.value
      const variance = (Math.random() - 0.5) * 0.3
      const monthlyRevenue = baseRevenue * (1 + variance)
      
      const hoaRevenue = monthlyRevenue * 0.58
      const subscriptionRevenue = monthlyRevenue * 0.29
      const commercialRevenue = monthlyRevenue * 0.13
      
      const trends = ['+2.3%', '+4.8%', '-3.3%', '+7.0%', '-0.5%']
      
      monthlyData.push({
        month: monthName,
        revenue: monthlyRevenue,
        hoa: hoaRevenue,
        subscription: subscriptionRevenue,
        commercial: commercialRevenue,
        trend: trends[i]
      })
    }
    
    return monthlyData
  }, [metricsData.monthlyRevenue.value])

  const efficiencyData = useMemo(() => {
    const typeGroups = customers.reduce((acc, customer) => {
      if (!acc[customer.type]) {
        acc[customer.type] = { customers: [], revenue: 0 }
      }
      acc[customer.type].customers.push(customer)
      acc[customer.type].revenue += customer.monthlyRevenue
      return acc
    }, {} as Record<string, { customers: CustomerData[], revenue: number }>)

    return Object.entries(typeGroups).map(([type, data]) => ({
      name: type,
      value: Math.round(data.customers.reduce((sum, c) => sum + c.efficiency, 0) / data.customers.length),
      count: data.customers.length,
      revenue: data.revenue,
      color: COLORS.chart[type.toLowerCase() as keyof typeof COLORS.chart] || COLORS.chart.other
    }))
  }, [customers])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers.filter(customer => {
      const matchesTab = selectedTab === 'all' || customer.type === selectedTab
      const matchesSearch = searchTerm === '' || 
                           customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.address.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesTab && matchesSearch
    })

    if (sortField) {
      filtered.sort((a, b) => {
        const aVal = a[sortField as keyof CustomerData]
        const bVal = b[sortField as keyof CustomerData]
        
        if (typeof aVal === 'string') {
          return sortDirection === 'asc' 
            ? aVal.localeCompare(bVal as string)
            : (bVal as string).localeCompare(aVal)
        } else {
          return sortDirection === 'asc' 
            ? (aVal as number) - (bVal as number)
            : (bVal as number) - (aVal as number)
        }
      })
    }

    return filtered
  }, [customers, selectedTab, searchTerm, sortField, sortDirection])

  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedCustomers.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedCustomers, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredAndSortedCustomers.length / itemsPerPage)

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`
  const refreshData = () => {
    setLastUpdated(new Date())
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div id="dashboard-content" className="min-h-screen bg-slate-50">
        {/* PROFESSIONAL GRADIENT HEADER */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white shadow-2xl">
          <div className="px-8 py-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2 tracking-tight">WasteOps Intelligence</h1>
                <p className="text-lg text-blue-100 mb-4 font-medium">Executive Operations Dashboard</p>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="font-medium">Live Data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Updated: {lastUpdated.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{customers.length} Active Locations</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={refreshData} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={() => exportToCSV(customers, 'customers-export')} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button onClick={exportToPDF} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button className="bg-white text-blue-600 hover:bg-blue-50 font-medium">
                  <Send className="h-4 w-4 mr-2" />
                  Send Alert
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="bg-white border-b border-slate-200 shadow-sm">
          <div className="px-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 h-16 bg-transparent">
                <TabsTrigger 
                  value="dashboard" 
                  className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full text-slate-600 hover:text-slate-900 font-medium"
                >
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger 
                  value="ceo-insights" 
                  className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full text-slate-600 hover:text-slate-900 font-medium"
                >
                  <TrendingUpIcon className="h-4 w-4" />
                  CEO Insights
                </TabsTrigger>
                <TabsTrigger 
                  value="rfp-intelligence" 
                  className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full text-slate-600 hover:text-slate-900 font-medium"
                >
                  <Building className="h-4 w-4" />
                  RFP Intelligence
                </TabsTrigger>
                <TabsTrigger 
                  value="serviceability-check" 
                  className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-full text-slate-600 hover:text-slate-900 font-medium"
                >
                  <Globe className="h-4 w-4" />
                  Serviceability Check
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="dashboard" className="space-y-8">
              {/* PROFESSIONAL METRICS CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">Active Customers</p>
                        <div className="text-3xl font-bold text-slate-900">{metricsData.activeCustomers.value}</div>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-500">+{metricsData.activeCustomers.change}%</span>
                      <span className="text-sm text-slate-500">from last month</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">Monthly Revenue</p>
                        <div className="text-3xl font-bold text-slate-900">{formatCurrency(metricsData.monthlyRevenue.value)}</div>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-red-500">{metricsData.monthlyRevenue.change}%</span>
                      <span className="text-sm text-slate-500">from last month</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">HOA Avg Time</p>
                        <div className="text-3xl font-bold text-slate-900">{metricsData.hoaAvgTime.value.toFixed(1)}m</div>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-amber-600" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-500">{metricsData.hoaAvgTime.change}m</span>
                      <span className="text-sm text-slate-500">improvement</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">Revenue Per Minute</p>
                        <div className="text-3xl font-bold text-slate-900">${metricsData.revenuePerMinute.value.toFixed(2)}</div>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <Activity className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-500">+{metricsData.revenuePerMinute.change}%</span>
                      <span className="text-sm text-slate-500">efficiency gain</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* PROFESSIONAL CHARTS SECTION */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <Card className="xl:col-span-2 shadow-lg bg-white">
                  <CardHeader className="pb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl font-bold text-slate-900">Revenue Trends</CardTitle>
                        <CardDescription className="text-base mt-2 text-slate-600">Monthly revenue breakdown with growth indicators</CardDescription>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span>HOA</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span>Subscription</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                          <span>Commercial</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={revenueChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <RechartsTooltip content={<CustomBarTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="rect" />
                        <Bar dataKey="hoa" stackId="a" fill={COLORS.chart.hoa} name="HOA Revenue" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="subscription" stackId="a" fill={COLORS.chart.subscription} name="Subscription Revenue" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="commercial" stackId="a" fill={COLORS.chart.commercial} name="Commercial Revenue" radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="trend" position="top" style={{ fontSize: '12px', fontWeight: '600', fill: '#374151' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-lg bg-white">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-2xl font-bold text-slate-900">Service Efficiency</CardTitle>
                    <CardDescription className="text-base mt-2 text-slate-600">Performance by customer type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={efficiencyData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {efficiencyData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomPieTooltip />} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-6 text-center">
                      <div className="text-3xl font-bold text-slate-900">
                        {efficiencyData.length > 0 ? (efficiencyData.reduce((sum, item) => sum + item.value, 0) / efficiencyData.length).toFixed(1) : 0}%
                      </div>
                      <div className="text-sm text-slate-500">Overall Efficiency Score</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* PROFESSIONAL CUSTOMER TABLE */}
              <Card className="shadow-lg bg-white">
                <CardHeader className="pb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl font-bold text-slate-900">Customer Portfolio</CardTitle>
                      <CardDescription className="text-base mt-2 text-slate-600">Detailed customer analytics and performance metrics</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Search customers..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-5 h-12 mb-6 bg-slate-100">
                      <TabsTrigger value="all" className="text-sm font-medium">All ({customers.length})</TabsTrigger>
                      <TabsTrigger value="HOA" className="text-sm font-medium">HOA ({customers.filter(c => c.type === 'HOA').length})</TabsTrigger>
                      <TabsTrigger value="Subscription" className="text-sm font-medium">Subscription ({customers.filter(c => c.type === 'Subscription').length})</TabsTrigger>
                      <TabsTrigger value="Commercial" className="text-sm font-medium">Commercial ({customers.filter(c => c.type === 'Commercial').length})</TabsTrigger>
                      <TabsTrigger value="Other" className="text-sm font-medium">Other ({customers.filter(c => c.type === 'Other').length})</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value={selectedTab}>
                      <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50">
                              <TableHead 
                                className="cursor-pointer hover:bg-slate-100 font-semibold text-slate-700"
                                onClick={() => handleSort('name')}
                              >
                                <div className="flex items-center gap-2">
                                  Customer Name
                                  {sortField === 'name' && (
                                    sortDirection === 'asc' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
                                  )}
                                </div>
                              </TableHead>
                              <TableHead className="font-semibold text-slate-700">Address</TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-slate-100 font-semibold text-slate-700 text-right"
                                onClick={() => handleSort('monthlyRevenue')}
                              >
                                <div className="flex items-center justify-end gap-2">
                                  Monthly Revenue
                                  {sortField === 'monthlyRevenue' && (
                                    sortDirection === 'asc' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
                                  )}
                                </div>
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-slate-100 font-semibold text-slate-700 text-center"
                                onClick={() => handleSort('efficiency')}
                              >
                                <div className="flex items-center justify-center gap-2">
                                  Efficiency
                                  {sortField === 'efficiency' && (
                                    sortDirection === 'asc' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
                                  )}
                                </div>
                              </TableHead>
                              <TableHead className="font-semibold text-slate-700 text-center">Units</TableHead>
                              <TableHead className="font-semibold text-slate-700 text-center">Avg Time</TableHead>
                              <TableHead className="font-semibold text-slate-700 text-center">Type</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedCustomers.map((customer, index) => (
                              <TableRow key={customer.id} className="hover:bg-slate-50 transition-colors">
                                <TableCell className="font-medium">
                                  <div className="max-w-[200px]">
                                    <div className="font-semibold text-slate-900 truncate">{customer.name}</div>
                                    <div className="text-xs text-slate-500">ID: {customer.id}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="max-w-[250px] text-sm text-slate-600 leading-relaxed">
                                    {customer.address}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="font-semibold text-green-600">
                                    {formatCurrency(customer.monthlyRevenue)}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    ${(customer.monthlyRevenue / customer.units).toFixed(0)}/unit
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-3">
                                    <span className="font-semibold text-sm">{customer.efficiency}%</span>
                                    <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full transition-all duration-300 ${
                                          customer.efficiency >= 90 ? 'bg-green-500' : 
                                          customer.efficiency >= 80 ? 'bg-amber-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${customer.efficiency}%` }}
                                      />
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center font-medium text-slate-700">{customer.units}</TableCell>
                                <TableCell className="text-center font-medium text-slate-700">{customer.completionTime}m</TableCell>
                                <TableCell className="text-center">
                                  <Badge 
                                    variant={customer.type === 'HOA' ? 'default' : customer.type === 'Subscription' ? 'secondary' : 'outline'}
                                    className="font-medium"
                                  >
                                    {customer.type}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* PAGINATION */}
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
                        <div className="text-sm text-slate-600">
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedCustomers.length)} of {filteredAndSortedCustomers.length} customers
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="border-slate-300 text-slate-700 hover:bg-slate-50"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                          </Button>
                          
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              const page = i + 1
                              return (
                                <Button
                                  key={page}
                                  variant={currentPage === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPage(page)}
                                  className="w-8 h-8 p-0"
                                >
                                  {page}
                                </Button>
                              )
                            })}
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="border-slate-300 text-slate-700 hover:bg-slate-50"
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* SUMMARY FOOTER */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                    <div>
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {formatCurrency(customers.reduce((sum, c) => sum + c.monthlyRevenue, 0))}
                      </div>
                      <div className="text-sm text-slate-600 font-medium">Total Monthly Revenue</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {customers.length > 0 ? (customers.reduce((sum, c) => sum + c.efficiency, 0) / customers.length).toFixed(1) : 0}%
                      </div>
                      <div className="text-sm text-slate-600 font-medium">Average Efficiency</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {customers.reduce((sum, c) => sum + c.units, 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-600 font-medium">Total Units Served</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-amber-600 mb-2">
                        {customers.length > 0 ? (customers.reduce((sum, c) => sum + c.completionTime, 0) / customers.length).toFixed(1) : 0}m
                      </div>
                      <div className="text-sm text-slate-600 font-medium">Average Service Time</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CEO INSIGHTS TAB */}
            <TabsContent value="ceo-insights">
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-slate-900">CEO Insights</CardTitle>
                  <CardDescription className="text-base text-slate-600">Strategic business intelligence and executive metrics</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="text-center py-20">
                    <TrendingUpIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">CEO Insights Coming Soon</h3>
                    <p className="text-slate-600 max-w-md mx-auto">
                      Advanced executive analytics, strategic KPIs, and business intelligence dashboards are currently under development.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* RFP INTELLIGENCE TAB */}
            <TabsContent value="rfp-intelligence">
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-slate-900">RFP Intelligence</CardTitle>
                  <CardDescription className="text-base text-slate-600">Request for Proposal analysis and competitive intelligence</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="text-center py-20">
                    <Building className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">RFP Intelligence Coming Soon</h3>
                    <p className="text-slate-600 max-w-md mx-auto">
                      Intelligent RFP analysis, bid optimization, and competitive positioning tools are currently under development.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SERVICEABILITY CHECK TAB */}
            <TabsContent value="serviceability-check">
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-slate-900">Serviceability Check</CardTitle>
                  <CardDescription className="text-base text-slate-600">Territory analysis and service area optimization</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="text-center py-20">
                    <Globe className="h-16 w-16 text-blue-600 mx-auto mb-4" />
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
  )
} 