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

interface ExpansionOpportunityFinderProps {
  customerData: CustomerData[]
  depotCoords: { lat: number; lng: number }
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number
  parseRevenue: (revenueStr: string) => number
}

interface OpportunityZone {
  centerLat: number
  centerLng: number
  subscriptionCount: number
  avgRevenue: number
  avgDistance: number
  potentialROI: number
  nearbyHOAs: CustomerData[]
  riskLevel: 'low' | 'medium' | 'high'
  reasoning: string
}

export default function ExpansionOpportunityFinder({ 
  customerData, 
  depotCoords, 
  calculateDistance, 
  parseRevenue 
}: ExpansionOpportunityFinderProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [minROI, setMinROI] = useState(15)

  // Find opportunity zones by clustering subscriptions
  const findOpportunities = (): OpportunityZone[] => {
    const subscriptions = customerData.filter(c => c.Type === 'Subscription')
    const hoas = customerData.filter(c => c.Type === 'HOA')
    
    // Create grid zones (roughly 2-mile squares)
    const zones: { [key: string]: CustomerData[] } = {}
    
    subscriptions.forEach(sub => {
      const lat = parseFloat(sub.latitude)
      const lng = parseFloat(sub.longitude)
      
      // Round to create grid zones
      const gridLat = Math.round(lat * 25) / 25 // ~2.5 mile precision
      const gridLng = Math.round(lng * 25) / 25
      const zoneKey = `${gridLat}_${gridLng}`
      
      if (!zones[zoneKey]) zones[zoneKey] = []
      zones[zoneKey].push(sub)
    })
    
    // Analyze each zone for opportunity
    const opportunities: OpportunityZone[] = []
    
    Object.entries(zones).forEach(([zoneKey, zoneSubscriptions]) => {
      if (zoneSubscriptions.length < 3) return // Need at least 3 subscriptions
      
      const [gridLat, gridLng] = zoneKey.split('_').map(Number)
      
      // Calculate zone metrics
      const totalRevenue = zoneSubscriptions.reduce((sum, sub) => 
        sum + parseRevenue(sub['Monthly Revenue']), 0)
      const avgRevenue = totalRevenue / zoneSubscriptions.length
      
      const avgDistance = zoneSubscriptions.reduce((sum, sub) => 
        sum + calculateDistance(depotCoords.lat, depotCoords.lng, 
          parseFloat(sub.latitude), parseFloat(sub.longitude)), 0) / zoneSubscriptions.length
      
      // Find nearby HOAs within 5 miles
      const nearbyHOAs = hoas.filter(hoa => {
        const distance = calculateDistance(gridLat, gridLng, 
          parseFloat(hoa.latitude), parseFloat(hoa.longitude))
        return distance <= 5
      })
      
      // Calculate potential ROI
      const currentMonthlyRevenue = totalRevenue
      const estimatedHOARevenue = avgRevenue * zoneSubscriptions.length * 2.5 // HOAs typically 2.5x more efficient
      const revenueIncrease = estimatedHOARevenue - currentMonthlyRevenue
      const potentialROI = (revenueIncrease / currentMonthlyRevenue) * 100
      
      // Assess risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'medium'
      let reasoning = ''
      
      if (nearbyHOAs.length >= 2 && avgDistance < 15) {
        riskLevel = 'low'
        reasoning = 'Strong HOA presence nearby, reasonable distance'
      } else if (nearbyHOAs.length >= 1 && avgDistance < 20) {
        riskLevel = 'medium'
        reasoning = 'Some HOA presence, moderate distance'
      } else {
        riskLevel = 'high'
        reasoning = 'Limited HOA presence or high distance'
      }
      
      if (zoneSubscriptions.length >= 8) {
        reasoning += ', High subscription density'
        if (riskLevel === 'high') riskLevel = 'medium'
      }
      
      opportunities.push({
        centerLat: gridLat,
        centerLng: gridLng,
        subscriptionCount: zoneSubscriptions.length,
        avgRevenue,
        avgDistance,
        potentialROI,
        nearbyHOAs,
        riskLevel,
        reasoning
      })
    })
    
    return opportunities
      .filter(opp => opp.potentialROI >= minROI)
      .sort((a, b) => b.potentialROI - a.potentialROI)
  }

  const opportunities = findOpportunities()
  const lowRiskOpps = opportunities.filter(o => o.riskLevel === 'low').length
  const totalPotentialROI = opportunities.reduce((sum, o) => sum + o.potentialROI, 0)

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'low-risk'
      case 'medium': return 'medium-risk'
      case 'high': return 'high-risk'
      default: return 'medium-risk'
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return '🟢'
      case 'medium': return '🟡'
      case 'high': return '🔴'
      default: return '🟡'
    }
  }

  return (
    <div className="insight-module expansion-opportunity-module">
      <div className="module-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>💡 Expansion Opportunity Finder</h3>
        <div className="module-summary">
          <span className="opportunity-summary">{opportunities.length} Zones</span>
          <span className="opportunity-summary low-risk">{lowRiskOpps} Low Risk</span>
        </div>
        <button className={`expand-btn ${isExpanded ? 'expanded' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.5 6L8 9.5L11.5 6"/>
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="module-content">
          <div className="opportunity-controls">
            <div className="roi-filter">
              <label>Min ROI Threshold:</label>
              <input 
                type="range" 
                min="5" 
                max="50" 
                value={minROI} 
                onChange={(e) => setMinROI(Number(e.target.value))}
              />
              <span>{minROI}%</span>
            </div>
          </div>

          <div className="opportunity-summary-stats">
            <div className="summary-stat">
              <label>Total Opportunities</label>
              <span>{opportunities.length}</span>
            </div>
            <div className="summary-stat">
              <label>Avg Potential ROI</label>
              <span>{opportunities.length > 0 ? (totalPotentialROI / opportunities.length).toFixed(1) : 0}%</span>
            </div>
            <div className="summary-stat">
              <label>Low Risk Zones</label>
              <span>{lowRiskOpps}</span>
            </div>
          </div>

          <div className="opportunity-list">
            {opportunities.slice(0, 8).map((opportunity, index) => (
              <div key={index} className={`opportunity-item ${getRiskColor(opportunity.riskLevel)}`}>
                <div className="opportunity-header">
                  <div className="opportunity-location">
                    <strong>Zone {index + 1}</strong>
                    <span className="coordinates">
                      {opportunity.centerLat.toFixed(4)}, {opportunity.centerLng.toFixed(4)}
                    </span>
                  </div>
                  <div className="opportunity-risk">
                    {getRiskIcon(opportunity.riskLevel)}
                    <span className="risk-label">{opportunity.riskLevel.toUpperCase()}</span>
                  </div>
                </div>
                
                <div className="opportunity-metrics">
                  <div className="metric-row">
                    <div className="metric">
                      <label>Subscriptions</label>
                      <span>{opportunity.subscriptionCount}</span>
                    </div>
                    <div className="metric">
                      <label>Avg Revenue</label>
                      <span>${opportunity.avgRevenue.toFixed(0)}</span>
                    </div>
                    <div className="metric">
                      <label>Distance</label>
                      <span>{opportunity.avgDistance.toFixed(1)}mi</span>
                    </div>
                    <div className="metric highlight">
                      <label>Potential ROI</label>
                      <span className="roi-value">+{opportunity.potentialROI.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="opportunity-details">
                  <div className="nearby-hoas">
                    <strong>Nearby HOAs:</strong> {opportunity.nearbyHOAs.length}
                    {opportunity.nearbyHOAs.length > 0 && (
                      <span className="hoa-list">
                        {opportunity.nearbyHOAs.slice(0, 2).map(hoa => hoa['HOA Name']).join(', ')}
                        {opportunity.nearbyHOAs.length > 2 && '...'}
                      </span>
                    )}
                  </div>
                  <div className="reasoning">
                    <strong>Analysis:</strong> {opportunity.reasoning}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {opportunities.length > 8 && (
            <div className="opportunity-footer">
              <p>Showing top 8 of {opportunities.length} expansion opportunities</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 