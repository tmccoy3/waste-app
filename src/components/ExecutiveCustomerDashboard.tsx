'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw, Search, Filter, Users, DollarSign, Clock, TrendingUp } from 'lucide-react'
import { CustomerData } from '../app/api/customers/route'

interface ExecutiveCustomerDashboardProps {
  customers: CustomerData[]
  onRefresh?: () => void
  lastUpdated?: string
}

export default function ExecutiveCustomerDashboard({ 
  customers, 
  onRefresh, 
  lastUpdated 
}: ExecutiveCustomerDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'hoa' | 'subscription'>('all')

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.address.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = activeFilter === 'all' || customer.type.toLowerCase() === activeFilter
    return matchesSearch && matchesFilter
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const hoaCustomers = customers.filter(c => c.type === 'HOA')
  const subscriptionCustomers = customers.filter(c => c.type === 'Subscription')

  const totalRevenue = customers.reduce((sum, c) => sum + c.monthlyRevenue, 0)
  const avgCompletionTime = customers.length > 0 
    ? customers.reduce((sum, c) => sum + c.completionTime, 0) / customers.length 
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Customer Operations Intelligence</h2>
          <p className="text-sm text-slate-600">
            {customers.length} Total Customers • {hoaCustomers.length} Verified HOA Clusters • {subscriptionCustomers.length} Subscriptions
          </p>
        </div>
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Company Alerts Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📣</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Company Alerts</h3>
                <p className="text-sm text-slate-600">Send instant notifications to your team's Google Chat space</p>
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Send Alert
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border">
              <span className="text-lg">🚛</span>
              <span className="text-sm text-slate-700">Missed Pick-ups</span>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border">
              <span className="text-lg">🗓️</span>
              <span className="text-sm text-slate-700">Meetings</span>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border">
              <span className="text-lg">🧑‍💼</span>
              <span className="text-sm text-slate-700">Property Manager Updates</span>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border">
              <span className="text-lg">📢</span>
              <span className="text-sm text-slate-700">General Announcements</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search customers by name, address, type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                variant={activeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('all')}
              >
                All Customers
                <Badge variant="secondary" className="ml-2">{customers.length}</Badge>
              </Button>
              <Button
                variant={activeFilter === 'hoa' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('hoa')}
              >
                HOA Clusters
                <Badge variant="secondary" className="ml-2">{hoaCustomers.length}</Badge>
              </Button>
              <Button
                variant={activeFilter === 'subscription' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('subscription')}
              >
                Subscriptions
                <Badge variant="secondary" className="ml-2">{subscriptionCustomers.length}</Badge>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {hoaCustomers.length} HOAs • {subscriptionCustomers.length} Subscriptions
            </p>
            <Badge variant="outline" className="mt-2">Active</Badge>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total recurring revenue</p>
            <Badge variant="default" className="mt-2 bg-green-100 text-green-800">Monthly</Badge>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Completion Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCompletionTime.toFixed(1)}m</div>
            <p className="text-xs text-muted-foreground mt-1">Average service time per stop</p>
            <Badge variant="secondary" className="mt-2">Average</Badge>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue per Minute</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(avgCompletionTime > 0 ? totalRevenue / avgCompletionTime / customers.length : 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Monthly operational efficiency</p>
            <div className="flex items-center space-x-1 text-xs mt-2 text-green-600">
              <TrendingUp className="h-3 w-3" />
              <span>+12.5%</span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>
            Showing {filteredCustomers.length} of {customers.length} customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No customers match your filters</h3>
              <p className="text-sm text-slate-500 mb-4">
                Try adjusting your search query or filters to see more results.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setActiveFilter('all')
                }}
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.slice(0, 12).map((customer) => (
                <Card key={customer.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 truncate">{customer.name}</h4>
                        <p className="text-sm text-slate-500 truncate">{customer.address}</p>
                      </div>
                      <Badge 
                        variant={customer.type === 'HOA' ? 'default' : 'secondary'}
                        className="ml-2 flex-shrink-0"
                      >
                        {customer.type}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-500">Revenue:</span>
                        <div className="font-medium">{formatCurrency(customer.monthlyRevenue)}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Units:</span>
                        <div className="font-medium">{customer.units}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Time:</span>
                        <div className="font-medium">{customer.completionTime}m</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Efficiency:</span>
                        <div className="font-medium">
                          {formatCurrency(customer.monthlyRevenue / customer.completionTime)}/min
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {filteredCustomers.length > 12 && (
            <div className="mt-6 text-center">
              <Button variant="outline">
                Load More ({filteredCustomers.length - 12} remaining)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {lastUpdated && (
        <div className="text-xs text-slate-500 text-center">
          Last updated: {lastUpdated}
        </div>
      )}
    </div>
  )
} 