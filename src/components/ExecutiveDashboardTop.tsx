'use client'

import { useState, useMemo } from 'react'
import { CustomerData } from '../app/api/customers/route'
import OperationsDashboard from './OperationsDashboard'

interface ExecutiveDashboardTopProps {
  customers: CustomerData[]
  lastUpdated?: string
}

type ViewMode = 'executive' | 'operations' | 'sales'

interface ExecutiveKPIs {
  totalMonthlyRevenue: number
  activeContracts: {
    total: number
    hoa: number
    subscription: number
  }
  avgProfitPerMinute: number
  mostProfitableHOA: {
    name: string
    units: number
    revenuePerMinute: number
    monthlyRevenue: number
  } | null
}

export default function ExecutiveDashboardTop({ customers, lastUpdated }: ExecutiveDashboardTopProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(() => 'executive')
  const [contractFilter, setContractFilter] = useState<'all' | 'hoa' | 'subscription'>('all')

  // Calculate executive KPIs from real customer data (always run hooks in same order)
  const kpis = useMemo((): ExecutiveKPIs => {
    // Handle empty customers case
    if (!customers || customers.length === 0) {
      return {
        totalMonthlyRevenue: 0,
        activeContracts: { total: 0, hoa: 0, subscription: 0 },
        avgProfitPerMinute: 0,
        mostProfitableHOA: null
      }
    }
    // Total monthly revenue
    const totalMonthlyRevenue = customers.reduce((sum, customer) => sum + customer.monthlyRevenue, 0)

    // Active contracts
    const hoaCustomers = customers.filter(c => c.type === 'HOA')
    const subscriptionCustomers = customers.filter(c => c.type === 'Subscription')
    
    const activeContracts = {
      total: customers.length,
      hoa: hoaCustomers.length,
      subscription: subscriptionCustomers.length
    }

    // Average profit per minute across all customers
    const totalRevenuePerMinute = customers.reduce((sum, customer) => {
      return sum + (customer.monthlyRevenue / customer.completionTime)
    }, 0)
    const avgProfitPerMinute = totalRevenuePerMinute / customers.length

    // Most profitable HOA
    const mostProfitableHOA = hoaCustomers.reduce((best, current) => {
      const currentRevenuePerMinute = current.monthlyRevenue / current.completionTime
      const bestRevenuePerMinute = best ? (best.monthlyRevenue / best.completionTime) : 0
      
      return currentRevenuePerMinute > bestRevenuePerMinute ? current : best
    }, null as CustomerData | null)

    return {
      totalMonthlyRevenue,
      activeContracts,
      avgProfitPerMinute,
      mostProfitableHOA: mostProfitableHOA ? {
        name: mostProfitableHOA.name,
        units: mostProfitableHOA.units,
        revenuePerMinute: mostProfitableHOA.monthlyRevenue / mostProfitableHOA.completionTime,
        monthlyRevenue: mostProfitableHOA.monthlyRevenue
      } : null
    }
  }, [customers])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatCurrencyPrecise = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const getFilteredContracts = () => {
    switch (contractFilter) {
      case 'hoa': return kpis.activeContracts.hoa
      case 'subscription': return kpis.activeContracts.subscription
      default: return kpis.activeContracts.total
    }
  }

  // Operations View Component
  const renderOperationsView = () => (
    <div className="executive-dashboard-top">
      <div className="executive-header">
        <div className="header-left">
          <h1 className="executive-title">Operations Intelligence Dashboard</h1>
          <p className="executive-subtitle">
            Live operational data • {customers.length} active routes
            {lastUpdated && (
              <span className="last-updated-inline">
                • Updated {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="view-mode-selector">
          <button 
            className={`view-mode-btn ${viewMode === 'executive' ? 'active' : ''}`}
            onClick={() => setViewMode('executive')}
          >
            📊 Executive View
          </button>
          <button 
            className={`view-mode-btn ${viewMode === 'operations' ? 'active' : ''}`}
            onClick={() => setViewMode('operations')}
          >
            🔧 Operations View
          </button>
          <button 
            className={`view-mode-btn ${viewMode === 'sales' ? 'active' : ''}`}
            onClick={() => setViewMode('sales')}
          >
            📈 Sales View
          </button>
        </div>
      </div>
      
      {/* Operations Content */}
      <OperationsDashboard customers={customers.map(c => ({
        id: c.id,
        name: c.name,
        address: c.address,
        latitude: c.latitude,
        longitude: c.longitude,
        customer_type: c.type,
        unit_type: c.unitType as 'Townhome' | 'Condo' | 'Single Family',
        units: c.units,
        monthly_revenue: c.monthlyRevenue,
        completion_time_minutes: c.completionTime,
        service_days: [c.trashDays, c.recyclingDays, c.yardWasteDays].filter(Boolean)
      }))} />
    </div>
  )

  // Sales View Component
  const renderSalesView = () => (
    <div className="executive-dashboard-top">
      <div className="executive-header">
        <div className="header-left">
          <h1 className="executive-title">Sales Intelligence Dashboard</h1>
          <p className="executive-subtitle">
            Growth opportunities • Expansion analysis
            {lastUpdated && (
              <span className="last-updated-inline">
                • Updated {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="view-mode-selector">
          <button 
            className={`view-mode-btn ${viewMode === 'executive' ? 'active' : ''}`}
            onClick={() => setViewMode('executive')}
          >
            📊 Executive View
          </button>
          <button 
            className={`view-mode-btn ${viewMode === 'operations' ? 'active' : ''}`}
            onClick={() => setViewMode('operations')}
          >
            🔧 Operations View
          </button>
          <button 
            className={`view-mode-btn ${viewMode === 'sales' ? 'active' : ''}`}
            onClick={() => setViewMode('sales')}
          >
            📈 Sales View
          </button>
        </div>
      </div>
      
      {/* Sales Content */}
      <div className="sales-content">
        <div className="sales-placeholder">
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
            <h3>Sales View Coming Soon</h3>
            <p>Lead heatmap, expansion zones, and growth opportunities in development...</p>
          </div>
        </div>
      </div>
    </div>
  )

  // Handle different view modes
  if (viewMode === 'operations') {
    return renderOperationsView()
  }
  
  if (viewMode === 'sales') {
    return renderSalesView()
  }
  
  // Default to executive view

  // Show loading state if no customer data
  if (!customers || customers.length === 0) {
    return (
      <div className="executive-dashboard-top">
        <div className="executive-header">
          <div className="header-left">
            <h1 className="executive-title">Strategic Intelligence Dashboard</h1>
            <p className="executive-subtitle">Loading customer data...</p>
          </div>
        </div>
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h3>Loading Executive Dashboard</h3>
          <p>Fetching real-time business intelligence...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="executive-dashboard-top">
      {/* Header with View Mode Toggle */}
      <div className="executive-header">
        <div className="header-left">
          <h1 className="executive-title">Strategic Intelligence Dashboard</h1>
          <p className="executive-subtitle">
            Real-time business metrics • {customers.length} active accounts
            {lastUpdated && (
              <span className="last-updated-inline">
                • Updated {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="view-mode-selector">
          <button 
            className={`view-mode-btn ${viewMode === 'executive' ? 'active' : ''}`}
            onClick={() => setViewMode('executive')}
          >
            📊 Executive View
          </button>
          <button 
            className={`view-mode-btn ${viewMode === 'operations' ? 'active' : ''}`}
            onClick={() => setViewMode('operations')}
          >
            🔧 Operations View
          </button>
          <button 
            className={`view-mode-btn ${viewMode === 'sales' ? 'active' : ''}`}
            onClick={() => setViewMode('sales')}
          >
            📈 Sales View
          </button>
        </div>
      </div>

      {/* Executive KPI Cards */}
      <div className="executive-kpi-grid">
        {/* Total Monthly Revenue */}
        <div className="executive-kpi-card revenue">
          <div className="kpi-header">
            <div className="kpi-icon">💰</div>
            <div className="kpi-meta">
              <h3 className="kpi-title">Total Monthly Revenue</h3>
              <p className="kpi-subtitle">Recurring revenue stream</p>
            </div>
          </div>
          <div className="kpi-value-large">{formatCurrency(kpis.totalMonthlyRevenue)}</div>
          <div className="kpi-trend">
            <span className="trend-indicator positive">↗</span>
            <span className="trend-text">+12% vs last month</span>
          </div>
        </div>

        {/* Active Contracts */}
        <div className="executive-kpi-card contracts">
          <div className="kpi-header">
            <div className="kpi-icon">📋</div>
            <div className="kpi-meta">
              <h3 className="kpi-title">Active Contracts</h3>
              <div className="contract-filter">
                <select 
                  value={contractFilter} 
                  onChange={(e) => setContractFilter(e.target.value as any)}
                  className="filter-select-small"
                >
                  <option value="all">All Contracts</option>
                  <option value="hoa">HOA Only</option>
                  <option value="subscription">Subscriptions Only</option>
                </select>
              </div>
            </div>
          </div>
          <div className="kpi-value-large">{getFilteredContracts()}</div>
          <div className="contract-breakdown">
            <div className="breakdown-item">
              <span className="breakdown-label">HOAs</span>
              <span className="breakdown-value">{kpis.activeContracts.hoa}</span>
            </div>
            <div className="breakdown-divider">•</div>
            <div className="breakdown-item">
              <span className="breakdown-label">Subscriptions</span>
              <span className="breakdown-value">{kpis.activeContracts.subscription}</span>
            </div>
          </div>
        </div>

        {/* Average Profit per Minute */}
        <div className="executive-kpi-card efficiency">
          <div className="kpi-header">
            <div className="kpi-icon">⚡</div>
            <div className="kpi-meta">
              <h3 className="kpi-title">Avg Profit per Minute</h3>
              <p className="kpi-subtitle">Operational efficiency</p>
            </div>
          </div>
          <div className="kpi-value-large">{formatCurrencyPrecise(kpis.avgProfitPerMinute)}</div>
          <div className="efficiency-bar">
            <div className="efficiency-fill" style={{width: `${Math.min((kpis.avgProfitPerMinute / 100) * 100, 100)}%`}}></div>
          </div>
          <div className="kpi-note">Target: $75/min</div>
        </div>

        {/* Most Profitable HOA */}
        <div className="executive-kpi-card top-performer">
          <div className="kpi-header">
            <div className="kpi-icon">🏆</div>
            <div className="kpi-meta">
              <h3 className="kpi-title">Top Performing HOA</h3>
              <p className="kpi-subtitle">Highest revenue per minute</p>
            </div>
          </div>
          {kpis.mostProfitableHOA ? (
            <>
              <div className="kpi-value-medium">{kpis.mostProfitableHOA.name}</div>
              <div className="performer-stats">
                <div className="stat-row">
                  <span className="stat-label">Revenue/min:</span>
                  <span className="stat-value highlight">{formatCurrencyPrecise(kpis.mostProfitableHOA.revenuePerMinute)}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Units:</span>
                  <span className="stat-value">{kpis.mostProfitableHOA.units}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Monthly:</span>
                  <span className="stat-value">{formatCurrency(kpis.mostProfitableHOA.monthlyRevenue)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="kpi-value-medium text-muted">No HOA data available</div>
          )}
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="executive-actions">
        <button className="action-card">
          <div className="action-icon">📊</div>
          <div className="action-content">
            <h4>Profitability Report</h4>
            <p>Generate monthly P&L</p>
          </div>
        </button>
        <button className="action-card">
          <div className="action-icon">🎯</div>
          <div className="action-content">
            <h4>Route Optimization</h4>
            <p>Analyze efficiency gains</p>
          </div>
        </button>
        <button className="action-card">
          <div className="action-icon">📈</div>
          <div className="action-content">
            <h4>Growth Opportunities</h4>
            <p>Identify expansion zones</p>
          </div>
        </button>
        <button className="action-card">
          <div className="action-icon">⚠️</div>
          <div className="action-content">
            <h4>Risk Assessment</h4>
            <p>Review underperforming accounts</p>
          </div>
        </button>
      </div>
    </div>
  )
} 