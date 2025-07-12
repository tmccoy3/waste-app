'use client'

interface CustomerData {
  id: string
  name: string
  address: string
  type: 'HOA' | 'Subscription'
  latitude: number
  longitude: number
  units: number
  completionTime: number
  monthlyRevenue: number
  trashDays: string
  recyclingDays: string
  yardWasteDays: string
  unitType: string
  serviceStatus: string
  truckCapacity: string
  laborCosts: {
    driver: number
    helper: number
  }
  operationalCosts: {
    diesel: {
      gallons: string
      costPerGallon: number
    }
    workingHours: string
  }
}

interface Analytics {
  totalCustomers: number
  hoaCount: number
  subscriptionCount: number
  totalMonthlyRevenue: number
  hoaRevenue: number
  subscriptionRevenue: number
  avgRevenuePerMinute: number
  avgRouteTime: number
  mostProfitableHOA: CustomerData | undefined
  lowProfitabilitySubscriptions: number
}

interface KPICardsProps {
  analytics: Analytics
  customerData: CustomerData[]
}

export default function KPICards({ analytics, customerData }: KPICardsProps) {
  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || !isFinite(amount)) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number, decimals = 1) => {
    if (isNaN(num) || !isFinite(num)) return '0'
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num)
  }

  return (
    <div className="kpi-cards-grid">
      {/* Total Monthly Revenue */}
      <div className="kpi-card revenue-card">
        <div className="kpi-header">
          <h3>💰 Total Monthly Revenue</h3>
          <div className="kpi-trend positive">+12.3%</div>
        </div>
        <div className="kpi-value">{formatCurrency(analytics.totalMonthlyRevenue)}</div>
        <div className="kpi-breakdown">
          <div className="breakdown-item">
            <span>HOAs: {formatCurrency(analytics.hoaRevenue)}</span>
            <span className="percentage">
              {analytics.totalMonthlyRevenue > 0 ? ((analytics.hoaRevenue / analytics.totalMonthlyRevenue) * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
          <div className="breakdown-item">
            <span>Subscriptions: {formatCurrency(analytics.subscriptionRevenue)}</span>
            <span className="percentage">
              {analytics.totalMonthlyRevenue > 0 ? ((analytics.subscriptionRevenue / analytics.totalMonthlyRevenue) * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
        </div>
      </div>

      {/* Average Revenue per Minute */}
      <div className="kpi-card efficiency-card">
        <div className="kpi-header">
          <h3>⚡ Avg Revenue/Minute</h3>
          <div className="kpi-trend positive">+8.7%</div>
        </div>
        <div className="kpi-value">${formatNumber(analytics.avgRevenuePerMinute, 2)}</div>
        <div className="kpi-subtitle">
          Excluding service zones
        </div>
        <div className="kpi-detail">
          Target: $75/min • Current: {analytics.avgRevenuePerMinute > 75 ? '✅' : '⚠️'}
        </div>
      </div>

      {/* Average Route Time */}
      <div className="kpi-card time-card">
        <div className="kpi-header">
          <h3>🕒 Avg Route Time</h3>
          <div className="kpi-trend neutral">-2.1%</div>
        </div>
        <div className="kpi-value">{formatNumber(analytics.avgRouteTime)} min</div>
        <div className="kpi-subtitle">
          Per customer site
        </div>
        <div className="kpi-detail">
          HOA avg: {formatNumber(analytics.hoaCount > 0 ? customerData.filter(c => c.type === 'HOA').reduce((sum, c) => sum + (c.completionTime || 0), 0) / analytics.hoaCount : 0)} min
        </div>
      </div>

      {/* Customer Mix */}
      <div className="kpi-card customers-card">
        <div className="kpi-header">
          <h3>🏢 Customer Portfolio</h3>
          <div className="kpi-trend positive">+5 HOAs</div>
        </div>
        <div className="kpi-value">{analytics.totalCustomers}</div>
        <div className="kpi-breakdown">
          <div className="breakdown-item">
            <span>HOA Contracts: {analytics.hoaCount}</span>
            <span className="percentage">
              {analytics.totalCustomers > 0 ? ((analytics.hoaCount / analytics.totalCustomers) * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
          <div className="breakdown-item">
            <span>Subscriptions: {analytics.subscriptionCount}</span>
            <span className="percentage">
              {analytics.totalCustomers > 0 ? ((analytics.subscriptionCount / analytics.totalCustomers) * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
        </div>
      </div>

      {/* Most Profitable HOA */}
      <div className="kpi-card profitable-card">
        <div className="kpi-header">
          <h3>🏆 Most Profitable HOA</h3>
          <div className="kpi-trend positive">Top Performer</div>
        </div>
        <div className="kpi-value">
          {analytics.mostProfitableHOA ? 
            `$${formatNumber(
              (analytics.mostProfitableHOA.monthlyRevenue || 0) / 
              (analytics.mostProfitableHOA.completionTime || 1)
            )}/min` : 
            'N/A'
          }
        </div>
        <div className="kpi-subtitle">
          {analytics.mostProfitableHOA ? analytics.mostProfitableHOA.name : 'No data'}
        </div>
        <div className="kpi-detail">
          {analytics.mostProfitableHOA && 
            `$${formatNumber(analytics.mostProfitableHOA.monthlyRevenue || 0)} • ${analytics.mostProfitableHOA.completionTime || 0} min`
          }
        </div>
      </div>

      {/* Subscription Waste Index */}
      <div className="kpi-card waste-card">
        <div className="kpi-header">
          <h3>⚠️ Low-Profit Subscriptions</h3>
          <div className="kpi-trend warning">Risk Alert</div>
        </div>
        <div className="kpi-value">{analytics.lowProfitabilitySubscriptions}</div>
        <div className="kpi-subtitle">
          Below $75/min threshold
        </div>
        <div className="kpi-detail">
          {analytics.subscriptionCount > 0 ? ((analytics.lowProfitabilitySubscriptions / analytics.subscriptionCount) * 100).toFixed(1) : '0.0'}% of subscriptions
        </div>
      </div>
    </div>
  )
} 