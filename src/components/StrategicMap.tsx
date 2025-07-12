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

interface StrategicMapProps {
  customerData: CustomerData[]
  depotCoords: { lat: number; lng: number }
  landfillCoords: Array<{ lat: number; lng: number }>
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number
  parseRevenue: (revenueStr: string) => number
}

interface MapCustomer {
  customer: CustomerData
  lat: number
  lng: number
  revenue: number
  revenuePerMinute: number
  distanceFromDepot: number
  profitabilityScore: number
  riskLevel: 'low' | 'medium' | 'high'
}

export default function StrategicMap({ 
  customerData, 
  depotCoords, 
  landfillCoords, 
  calculateDistance, 
  parseRevenue 
}: StrategicMapProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'HOA' | 'Subscription' | 'red-flags'>('all')
  const [selectedCustomer, setSelectedCustomer] = useState<MapCustomer | null>(null)

  // Process customers for map display
  const processCustomersForMap = (): MapCustomer[] => {
    return customerData.map(customer => {
      const lat = parseFloat(customer.latitude)
      const lng = parseFloat(customer.longitude)
      const revenue = parseRevenue(customer['Monthly Revenue'])
      const serviceTime = parseFloat(customer['Average Completion Time in Minutes'])
      const revenuePerMinute = serviceTime > 0 ? revenue / serviceTime : 0
      const distanceFromDepot = calculateDistance(depotCoords.lat, depotCoords.lng, lat, lng)
      
      // Calculate profitability score (0-100)
      let profitabilityScore = 50 // Base score
      
      // Revenue per minute factor (0-40 points)
      if (revenuePerMinute >= 100) profitabilityScore += 40
      else if (revenuePerMinute >= 75) profitabilityScore += 30
      else if (revenuePerMinute >= 50) profitabilityScore += 20
      else if (revenuePerMinute >= 25) profitabilityScore += 10
      else profitabilityScore -= 20
      
      // Distance factor (-20 to +10 points)
      if (distanceFromDepot <= 10) profitabilityScore += 10
      else if (distanceFromDepot <= 15) profitabilityScore += 5
      else if (distanceFromDepot > 25) profitabilityScore -= 20
      else if (distanceFromDepot > 20) profitabilityScore -= 10
      
      // Customer type factor
      if (customer.Type === 'HOA') {
        profitabilityScore += 10 // HOAs typically more efficient
      }
      
      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'medium'
      if (profitabilityScore >= 70) riskLevel = 'low'
      else if (profitabilityScore <= 40) riskLevel = 'high'
      
      return {
        customer,
        lat,
        lng,
        revenue,
        revenuePerMinute,
        distanceFromDepot,
        profitabilityScore: Math.max(0, Math.min(100, profitabilityScore)),
        riskLevel
      }
    })
  }

  const mapCustomers = processCustomersForMap()
  
  // Filter customers based on selected filter
  const filteredCustomers = mapCustomers.filter(mc => {
    switch (filterType) {
      case 'HOA':
        return mc.customer.Type === 'HOA'
      case 'Subscription':
        return mc.customer.Type === 'Subscription'
      case 'red-flags':
        return mc.riskLevel === 'high' || mc.revenuePerMinute < 30
      default:
        return true
    }
  })

  // Calculate map bounds
  const bounds = filteredCustomers.length > 0 ? {
    minLat: Math.min(...filteredCustomers.map(c => c.lat)),
    maxLat: Math.max(...filteredCustomers.map(c => c.lat)),
    minLng: Math.min(...filteredCustomers.map(c => c.lng)),
    maxLng: Math.max(...filteredCustomers.map(c => c.lng))
  } : {
    minLat: 38.7,
    maxLat: 39.0,
    minLng: -77.5,
    maxLng: -77.0
  }

  // Add padding to bounds
  const latPadding = (bounds.maxLat - bounds.minLat) * 0.1
  const lngPadding = (bounds.maxLng - bounds.minLng) * 0.1
  const paddedBounds = {
    minLat: bounds.minLat - latPadding,
    maxLat: bounds.maxLat + latPadding,
    minLng: bounds.minLng - lngPadding,
    maxLng: bounds.maxLng + lngPadding
  }

  // Convert coordinates to SVG positions
  const coordToSVG = (lat: number, lng: number) => {
    const x = ((lng - paddedBounds.minLng) / (paddedBounds.maxLng - paddedBounds.minLng)) * 800
    const y = ((paddedBounds.maxLat - lat) / (paddedBounds.maxLat - paddedBounds.minLat)) * 600
    return { x, y }
  }

  const getProfitabilityColor = (score: number) => {
    if (score >= 70) return '#10B981' // Green
    if (score >= 50) return '#3B82F6' // Blue
    if (score >= 30) return '#F59E0B' // Orange
    return '#EF4444' // Red
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#10B981'
      case 'medium': return '#F59E0B'
      case 'high': return '#EF4444'
      default: return '#6B7280'
    }
  }

  const getCustomerSize = (customer: MapCustomer) => {
    // Size based on revenue
    if (customer.revenue >= 3000) return 8
    if (customer.revenue >= 1000) return 6
    if (customer.revenue >= 500) return 5
    return 4
  }

  const customerCounts = {
    total: mapCustomers.length,
    hoa: mapCustomers.filter(c => c.customer.Type === 'HOA').length,
    subscription: mapCustomers.filter(c => c.customer.Type === 'Subscription').length,
    redFlags: mapCustomers.filter(c => c.riskLevel === 'high' || c.revenuePerMinute < 30).length
  }

  return (
    <div className="insight-module strategic-map-module">
      <div className="module-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>🗺️ Strategic Map</h3>
        <div className="module-summary">
          <span className="map-summary">{filteredCustomers.length} Customers</span>
          <span className="map-summary red-flags">{customerCounts.redFlags} Red Flags</span>
        </div>
        <button className={`expand-btn ${isExpanded ? 'expanded' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.5 6L8 9.5L11.5 6"/>
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="module-content">
          <div className="map-controls">
            <div className="filter-controls">
              <label>Filter:</label>
              <div className="filter-buttons">
                <button 
                  className={filterType === 'all' ? 'active' : ''}
                  onClick={() => setFilterType('all')}
                >
                  All ({customerCounts.total})
                </button>
                <button 
                  className={filterType === 'HOA' ? 'active' : ''}
                  onClick={() => setFilterType('HOA')}
                >
                  HOA ({customerCounts.hoa})
                </button>
                <button 
                  className={filterType === 'Subscription' ? 'active' : ''}
                  onClick={() => setFilterType('Subscription')}
                >
                  Subscription ({customerCounts.subscription})
                </button>
                <button 
                  className={filterType === 'red-flags' ? 'active red-flag' : 'red-flag'}
                  onClick={() => setFilterType('red-flags')}
                >
                  Red Flags ({customerCounts.redFlags})
                </button>
              </div>
            </div>
          </div>

          <div className="map-container">
            <div className="map-legend">
              <div className="legend-section">
                <h5>Profitability</h5>
                <div className="legend-items">
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#10B981' }}></div>
                    <span>Excellent (70+)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#3B82F6' }}></div>
                    <span>Good (50-69)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#F59E0B' }}></div>
                    <span>Fair (30-49)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#EF4444' }}></div>
                    <span>Poor (&lt;30)</span>
                  </div>
                </div>
              </div>
              <div className="legend-section">
                <h5>Locations</h5>
                <div className="legend-items">
                  <div className="legend-item">
                    <div className="legend-marker depot"></div>
                    <span>Depot</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-marker landfill"></div>
                    <span>Landfills</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="map-svg-container">
              <svg width="800" height="600" className="strategic-map-svg">
                {/* Grid lines */}
                <defs>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#E5E7EB" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* Depot */}
                {(() => {
                  const depotPos = coordToSVG(depotCoords.lat, depotCoords.lng)
                  return (
                    <g>
                      <circle
                        cx={depotPos.x}
                        cy={depotPos.y}
                        r="12"
                        fill="#7C3AED"
                        stroke="#FFFFFF"
                        strokeWidth="3"
                      />
                      <text
                        x={depotPos.x}
                        y={depotPos.y - 18}
                        textAnchor="middle"
                        className="map-label depot-label"
                      >
                        🏢 Depot
                      </text>
                    </g>
                  )
                })()}

                {/* Landfills */}
                {landfillCoords.map((landfill, index) => {
                  const landfillPos = coordToSVG(landfill.lat, landfill.lng)
                  return (
                    <g key={index}>
                      <rect
                        x={landfillPos.x - 8}
                        y={landfillPos.y - 8}
                        width="16"
                        height="16"
                        fill="#78716C"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <text
                        x={landfillPos.x}
                        y={landfillPos.y - 15}
                        textAnchor="middle"
                        className="map-label landfill-label"
                      >
                        🏭 {index === 0 ? 'Fairfax' : 'Lorton'}
                      </text>
                    </g>
                  )
                })}

                {/* Customers */}
                {filteredCustomers.map((mapCustomer, index) => {
                  const pos = coordToSVG(mapCustomer.lat, mapCustomer.lng)
                  const size = getCustomerSize(mapCustomer)
                  const color = getProfitabilityColor(mapCustomer.profitabilityScore)
                  
                  return (
                    <circle
                      key={index}
                      cx={pos.x}
                      cy={pos.y}
                      r={size}
                      fill={color}
                      stroke={mapCustomer.customer.Type === 'HOA' ? '#1F2937' : '#FFFFFF'}
                      strokeWidth={mapCustomer.customer.Type === 'HOA' ? '2' : '1'}
                      className="customer-marker"
                      onClick={() => setSelectedCustomer(mapCustomer)}
                      style={{ cursor: 'pointer' }}
                    />
                  )
                })}
              </svg>
            </div>
          </div>

          {selectedCustomer && (
            <div className="customer-details-popup">
              <div className="popup-header">
                <h4>{selectedCustomer.customer['HOA Name']}</h4>
                <button onClick={() => setSelectedCustomer(null)}>×</button>
              </div>
              <div className="popup-content">
                <div className="detail-row">
                  <span>Type:</span>
                  <span className={`customer-type ${selectedCustomer.customer.Type.toLowerCase()}`}>
                    {selectedCustomer.customer.Type}
                  </span>
                </div>
                <div className="detail-row">
                  <span>Monthly Revenue:</span>
                  <span>${selectedCustomer.revenue.toFixed(0)}</span>
                </div>
                <div className="detail-row">
                  <span>Revenue/Minute:</span>
                  <span>${selectedCustomer.revenuePerMinute.toFixed(1)}</span>
                </div>
                <div className="detail-row">
                  <span>Distance from Depot:</span>
                  <span>{selectedCustomer.distanceFromDepot.toFixed(1)} miles</span>
                </div>
                <div className="detail-row">
                  <span>Profitability Score:</span>
                  <span className="profitability-score" style={{ 
                    color: getProfitabilityColor(selectedCustomer.profitabilityScore) 
                  }}>
                    {selectedCustomer.profitabilityScore.toFixed(0)}/100
                  </span>
                </div>
                <div className="detail-row">
                  <span>Risk Level:</span>
                  <span className={`risk-level ${selectedCustomer.riskLevel}`}>
                    {selectedCustomer.riskLevel.toUpperCase()}
                  </span>
                </div>
                <div className="detail-row">
                  <span>Address:</span>
                  <span className="address">{selectedCustomer.customer['Full Address']}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 