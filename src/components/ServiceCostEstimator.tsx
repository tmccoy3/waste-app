'use client'

import { useState } from 'react'

interface CustomerData {
  'HOA Name': string
  'Monthly Revenue': string
  'Full Address': string
  latitude: string
  longitude: string
  Type: 'HOA' | 'Subscription'
  'Trash Collection': string
  'Recycling Collection': string
  'Yard Waste Collection': string
  'Unit Type': string
  'Number of Units': string
  'Average Completion Time in Minutes': string
  'TRUCK CAPACITY': string
  'GALLON TANKS (Diesel)': string
  'Average Cost per Gallon': string
  'WORKING HOURS': string
  'LABOR COSTS PER HOUR DRIVER': string
  'LABOR COSTS PER HOUR HELPER': string
  'Service Status': string
}

interface ServiceCostEstimatorProps {
  customerData: CustomerData[]
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number
  parseRevenue: (revenueStr: string) => number
}

interface CostAnalysis {
  customer: CustomerData
  monthlyRevenue: number
  serviceTimeMinutes: number
  laborCostPerVisit: number
  fuelCostPerVisit: number
  totalCostPerVisit: number
  visitsPerMonth: number
  monthlyCost: number
  monthlyProfit: number
  profitMargin: number
  revenuePerMinute: number
  costEfficiencyRating: 'excellent' | 'good' | 'fair' | 'poor'
}

export default function ServiceCostEstimator({ 
  customerData, 
  calculateDistance, 
  parseRevenue 
}: ServiceCostEstimatorProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [sortBy, setSortBy] = useState<'margin' | 'revenue' | 'cost' | 'efficiency'>('margin')
  const [filterType, setFilterType] = useState<'all' | 'HOA' | 'Subscription'>('all')
  const [minMargin, setMinMargin] = useState(20)

  // Constants
  const DEPOT_COORDS = { lat: 38.923867, lng: -77.235103 }
  const DRIVER_RATE = 24 // per hour
  const HELPER_RATE = 20 // per hour
  const FUEL_COST_PER_GALLON = 4.11
  const FUEL_EFFICIENCY = 6 // miles per gallon
  const AVERAGE_SPEED = 25 // mph

  // Calculate service frequency per month
  const getVisitsPerMonth = (customer: CustomerData): number => {
    const trashDays = customer['Trash Collection'] ? customer['Trash Collection'].split('/').length : 0
    const recyclingDays = customer['Recycling Collection'] ? customer['Recycling Collection'].split('/').length : 0
    const yardDays = customer['Yard Waste Collection'] ? customer['Yard Waste Collection'].split('/').length : 0
    
    // Approximate visits per month (4.33 weeks per month)
    return Math.round((trashDays + recyclingDays + yardDays) * 4.33)
  }

  // Analyze costs for all customers
  const analyzeCosts = (): CostAnalysis[] => {
    return customerData
      .filter(customer => filterType === 'all' || customer.Type === filterType)
      .map(customer => {
        const monthlyRevenue = parseRevenue(customer['Monthly Revenue'])
        const serviceTimeMinutes = parseFloat(customer['Average Completion Time in Minutes'] || '0')
        const visitsPerMonth = getVisitsPerMonth(customer)
        
        // Calculate distance from depot
        const customerLat = parseFloat(customer.latitude || '0')
        const customerLng = parseFloat(customer.longitude || '0')
        const distanceFromDepot = calculateDistance(
          DEPOT_COORDS.lat, DEPOT_COORDS.lng,
          customerLat, customerLng
        )
        
        // Labor cost calculation
        const serviceTimeHours = serviceTimeMinutes / 60
        const travelTimeHours = (distanceFromDepot * 2) / AVERAGE_SPEED // Round trip
        const totalTimeHours = serviceTimeHours + travelTimeHours
        const laborCostPerVisit = totalTimeHours * (DRIVER_RATE + HELPER_RATE)
        
        // Fuel cost calculation
        const fuelCostPerVisit = ((distanceFromDepot * 2) / FUEL_EFFICIENCY) * FUEL_COST_PER_GALLON
        
        // Total costs
        const totalCostPerVisit = laborCostPerVisit + fuelCostPerVisit
        const monthlyCost = totalCostPerVisit * visitsPerMonth
        const monthlyProfit = monthlyRevenue - monthlyCost
        const profitMargin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0
        const revenuePerMinute = serviceTimeMinutes > 0 ? monthlyRevenue / serviceTimeMinutes : 0
        
        // Cost efficiency rating
        let costEfficiencyRating: 'excellent' | 'good' | 'fair' | 'poor' = 'poor'
        if (profitMargin >= 60) {
          costEfficiencyRating = 'excellent'
        } else if (profitMargin >= 40) {
          costEfficiencyRating = 'good'
        } else if (profitMargin >= 20) {
          costEfficiencyRating = 'fair'
        }
        
        return {
          customer,
          monthlyRevenue,
          serviceTimeMinutes,
          laborCostPerVisit,
          fuelCostPerVisit,
          totalCostPerVisit,
          visitsPerMonth,
          monthlyCost,
          monthlyProfit,
          profitMargin,
          revenuePerMinute,
          costEfficiencyRating
        }
      })
      .filter(analysis => analysis.profitMargin >= minMargin - 100) // Show all but allow filtering
      .sort((a, b) => {
        switch (sortBy) {
          case 'margin':
            return b.profitMargin - a.profitMargin
          case 'revenue':
            return b.monthlyRevenue - a.monthlyRevenue
          case 'cost':
            return a.monthlyCost - b.monthlyCost
          case 'efficiency':
            return b.revenuePerMinute - a.revenuePerMinute
          default:
            return b.profitMargin - a.profitMargin
        }
      })
  }

  const costAnalyses = analyzeCosts()
  const avgProfitMargin = costAnalyses.length > 0 
    ? costAnalyses.reduce((sum, a) => sum + a.profitMargin, 0) / costAnalyses.length 
    : 0
  const totalMonthlyProfit = costAnalyses.reduce((sum, a) => sum + a.monthlyProfit, 0)
  const highMarginCount = costAnalyses.filter(a => a.profitMargin >= 50).length

  const getEfficiencyColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'excellent'
      case 'good': return 'good'
      case 'fair': return 'fair'
      case 'poor': return 'poor'
      default: return 'fair'
    }
  }

  const getEfficiencyIcon = (rating: string) => {
    switch (rating) {
      case 'excellent': return '🟢'
      case 'good': return '🔵'
      case 'fair': return '🟡'
      case 'poor': return '🔴'
      default: return '🟡'
    }
  }

  const getMarginColor = (margin: number) => {
    if (margin >= 50) return 'excellent'
    if (margin >= 30) return 'good'
    if (margin >= 10) return 'fair'
    return 'poor'
  }

  return (
    <div className="insight-module service-cost-estimator-module">
      <div className="module-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>💼 Service Cost Estimator</h3>
        <div className="module-summary">
          <span className="cost-summary">Avg Margin: {avgProfitMargin.toFixed(1)}%</span>
          <span className="cost-summary excellent">{highMarginCount} High Margin</span>
        </div>
        <button className={`expand-btn ${isExpanded ? 'expanded' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.5 6L8 9.5L11.5 6"/>
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="module-content">
          <div className="cost-controls">
            <div className="control-group">
              <label>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                <option value="margin">Profit Margin</option>
                <option value="revenue">Revenue</option>
                <option value="cost">Cost</option>
                <option value="efficiency">Revenue/Min</option>
              </select>
            </div>
            <div className="control-group">
              <label>Customer Type:</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
                <option value="all">All</option>
                <option value="HOA">HOA Only</option>
                <option value="Subscription">Subscription Only</option>
              </select>
            </div>
            <div className="control-group">
              <label>Min Margin: {minMargin}%</label>
              <input 
                type="range" 
                min="-50" 
                max="80" 
                value={minMargin} 
                onChange={(e) => setMinMargin(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="cost-summary-stats">
            <div className="summary-stat">
              <label>Total Customers</label>
              <span>{costAnalyses.length}</span>
            </div>
            <div className="summary-stat">
              <label>Avg Profit Margin</label>
              <span className={getMarginColor(avgProfitMargin)}>
                {avgProfitMargin.toFixed(1)}%
              </span>
            </div>
            <div className="summary-stat">
              <label>Total Monthly Profit</label>
              <span className={totalMonthlyProfit > 0 ? 'positive' : 'negative'}>
                ${totalMonthlyProfit.toFixed(0)}
              </span>
            </div>
            <div className="summary-stat">
              <label>High Margin (50%+)</label>
              <span>{highMarginCount}</span>
            </div>
          </div>

          <div className="cost-analysis-list">
            {costAnalyses
              .filter(analysis => analysis.profitMargin >= minMargin)
              .slice(0, 12)
              .map((analysis, index) => (
              <div key={index} className={`cost-analysis-item ${getEfficiencyColor(analysis.costEfficiencyRating)}`}>
                <div className="analysis-header">
                  <div className="customer-info">
                    <div className="customer-name">
                      {analysis.customer['HOA Name']}
                      <span className="customer-type">{analysis.customer.Type}</span>
                    </div>
                    <div className="efficiency-rating">
                      {getEfficiencyIcon(analysis.costEfficiencyRating)}
                      <span className="rating-text">{analysis.costEfficiencyRating.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="analysis-metrics">
                  <div className="metric-section">
                    <h5>Revenue</h5>
                    <div className="metric">
                      <label>Monthly</label>
                      <span className="value">${analysis.monthlyRevenue.toFixed(0)}</span>
                    </div>
                    <div className="metric">
                      <label>Per Minute</label>
                      <span className="value">${analysis.revenuePerMinute.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="metric-section">
                    <h5>Costs</h5>
                    <div className="metric">
                      <label>Per Visit</label>
                      <span className="value">${analysis.totalCostPerVisit.toFixed(2)}</span>
                    </div>
                    <div className="metric">
                      <label>Monthly</label>
                      <span className="value">${analysis.monthlyCost.toFixed(0)}</span>
                    </div>
                  </div>
                  
                  <div className="metric-section">
                    <h5>Profitability</h5>
                    <div className="metric">
                      <label>Monthly Profit</label>
                      <span className={`value ${analysis.monthlyProfit > 0 ? 'positive' : 'negative'}`}>
                        ${analysis.monthlyProfit.toFixed(0)}
                      </span>
                    </div>
                    <div className="metric highlight">
                      <label>Margin</label>
                      <span className={`value margin ${getMarginColor(analysis.profitMargin)}`}>
                        {analysis.profitMargin.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="cost-breakdown">
                  <div className="breakdown-item">
                    <span>Labor: ${analysis.laborCostPerVisit.toFixed(2)}</span>
                    <span>Fuel: ${analysis.fuelCostPerVisit.toFixed(2)}</span>
                    <span>Visits: {analysis.visitsPerMonth}/mo</span>
                    <span>Time: {analysis.serviceTimeMinutes} min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {costAnalyses.filter(a => a.profitMargin >= minMargin).length > 12 && (
            <div className="cost-footer">
              <p>Showing top 12 of {costAnalyses.filter(a => a.profitMargin >= minMargin).length} customers meeting criteria</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 