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

interface ProfitabilityRiskReportProps {
  customerData: CustomerData[]
  depotCoords: { lat: number; lng: number }
  landfillCoords: Array<{ lat: number; lng: number }>
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number
  parseRevenue: (revenueStr: string) => number
}

interface RiskCustomer {
  customer: CustomerData
  revenuePerMinute: number
  distanceFromDepot: number
  distanceToNearestLandfill: number
  riskScore: number
  recommendedAction: 'reprice' | 'phase-out' | 'bundle'
  reason: string
}

export default function ProfitabilityRiskReport({ 
  customerData, 
  depotCoords, 
  landfillCoords, 
  calculateDistance, 
  parseRevenue 
}: ProfitabilityRiskReportProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [sortBy, setSortBy] = useState<'risk' | 'revenue' | 'distance'>('risk')

  // Calculate risk analysis
  const analyzeRisks = (): RiskCustomer[] => {
    return customerData
      .map(customer => {
        const revenue = parseRevenue(customer['Monthly Revenue'])
        const timeMinutes = parseFloat(customer['Average Completion Time in Minutes'])
        const revenuePerMinute = timeMinutes > 0 ? revenue / timeMinutes : 0
        
        const customerLat = parseFloat(customer.latitude)
        const customerLng = parseFloat(customer.longitude)
        
        const distanceFromDepot = calculateDistance(
          depotCoords.lat, depotCoords.lng, 
          customerLat, customerLng
        )
        
        const distanceToNearestLandfill = Math.min(
          ...landfillCoords.map(landfill => 
            calculateDistance(customerLat, customerLng, landfill.lat, landfill.lng)
          )
        )
        
        // Risk scoring algorithm
        let riskScore = 0
        let recommendedAction: 'reprice' | 'phase-out' | 'bundle' = 'reprice'
        let reason = ''
        
        // Low revenue per minute (high risk)
        if (revenuePerMinute < 30) {
          riskScore += 40
          recommendedAction = 'phase-out'
          reason = 'Very low revenue efficiency'
        } else if (revenuePerMinute < 50) {
          riskScore += 25
          recommendedAction = 'reprice'
          reason = 'Below target revenue efficiency'
        } else if (revenuePerMinute < 75) {
          riskScore += 15
          reason = 'Marginal revenue efficiency'
        }
        
        // Distance penalty
        if (distanceFromDepot > 20) {
          riskScore += 20
          if (recommendedAction === 'reprice') recommendedAction = 'bundle'
          reason += reason ? ' + High travel cost' : 'High travel cost'
        } else if (distanceFromDepot > 15) {
          riskScore += 10
          reason += reason ? ' + Moderate travel cost' : 'Moderate travel cost'
        }
        
        // Subscription vs HOA consideration
        if (customer.Type === 'Subscription' && revenuePerMinute < 60) {
          riskScore += 10
          reason += reason ? ' + Single home inefficiency' : 'Single home inefficiency'
        }
        
        return {
          customer,
          revenuePerMinute,
          distanceFromDepot,
          distanceToNearestLandfill,
          riskScore,
          recommendedAction,
          reason
        }
      })
      .filter(risk => risk.riskScore > 15) // Only show meaningful risks
      .sort((a, b) => {
        switch (sortBy) {
          case 'risk':
            return b.riskScore - a.riskScore
          case 'revenue':
            return a.revenuePerMinute - b.revenuePerMinute
          case 'distance':
            return b.distanceFromDepot - a.distanceFromDepot
          default:
            return b.riskScore - a.riskScore
        }
      })
  }

  const riskCustomers = analyzeRisks()
  const highRiskCount = riskCustomers.filter(r => r.riskScore >= 50).length
  const mediumRiskCount = riskCustomers.filter(r => r.riskScore >= 30 && r.riskScore < 50).length

  const getRiskColor = (score: number) => {
    if (score >= 50) return 'high-risk'
    if (score >= 30) return 'medium-risk'
    return 'low-risk'
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'reprice': return '💰'
      case 'phase-out': return '❌'
      case 'bundle': return '📦'
      default: return '⚠️'
    }
  }

  return (
    <div className="insight-module profitability-risk-module">
      <div className="module-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>⚠️ Profitability Risk Report</h3>
        <div className="module-summary">
          <span className="risk-summary high-risk">{highRiskCount} High Risk</span>
          <span className="risk-summary medium-risk">{mediumRiskCount} Medium Risk</span>
        </div>
        <button className={`expand-btn ${isExpanded ? 'expanded' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.5 6L8 9.5L11.5 6"/>
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="module-content">
          <div className="risk-controls">
            <div className="sort-controls">
              <label>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                <option value="risk">Risk Score</option>
                <option value="revenue">Revenue/Min</option>
                <option value="distance">Distance</option>
              </select>
            </div>
          </div>

          <div className="risk-list">
            {riskCustomers.slice(0, 10).map((risk, index) => (
              <div key={index} className={`risk-item ${getRiskColor(risk.riskScore)}`}>
                <div className="risk-customer-info">
                  <div className="customer-name">
                    {risk.customer['HOA Name']}
                    <span className="customer-type">{risk.customer.Type}</span>
                  </div>
                  <div className="customer-address">
                    {risk.customer['Full Address']}
                  </div>
                </div>
                
                <div className="risk-metrics">
                  <div className="metric">
                    <label>Revenue/Min</label>
                    <span className="value">${risk.revenuePerMinute.toFixed(1)}</span>
                  </div>
                  <div className="metric">
                    <label>Distance</label>
                    <span className="value">{risk.distanceFromDepot.toFixed(1)}mi</span>
                  </div>
                  <div className="metric">
                    <label>Risk Score</label>
                    <span className={`value risk-score ${getRiskColor(risk.riskScore)}`}>
                      {risk.riskScore}
                    </span>
                  </div>
                </div>
                
                <div className="risk-recommendation">
                  <div className="action">
                    {getActionIcon(risk.recommendedAction)}
                    <span className="action-text">
                      {risk.recommendedAction.toUpperCase()}
                    </span>
                  </div>
                  <div className="reason">{risk.reason}</div>
                </div>
              </div>
            ))}
          </div>

          {riskCustomers.length > 10 && (
            <div className="risk-footer">
              <p>Showing top 10 of {riskCustomers.length} at-risk customers</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 