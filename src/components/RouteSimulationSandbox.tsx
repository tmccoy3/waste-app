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

interface RouteSimulationSandboxProps {
  customerData: CustomerData[]
  depotCoords: { lat: number; lng: number }
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number
  parseRevenue: (revenueStr: string) => number
}

interface SimulationCustomer {
  name: string
  address: string
  latitude: number
  longitude: number
  type: 'HOA' | 'Subscription'
  monthlyRevenue: number
  serviceTime: number
  units: number
}

interface SimulationResult {
  additionalRevenue: number
  additionalTime: number
  additionalDistance: number
  fuelCost: number
  laborCost: number
  netProfit: number
  profitMargin: number
  revenuePerMinute: number
  recommendation: 'accept' | 'negotiate' | 'decline'
  reasoning: string
}

export default function RouteSimulationSandbox({ 
  customerData, 
  depotCoords, 
  calculateDistance, 
  parseRevenue 
}: RouteSimulationSandboxProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [simulationCustomer, setSimulationCustomer] = useState<SimulationCustomer>({
    name: 'New Customer',
    address: '',
    latitude: 38.9,
    longitude: -77.3,
    type: 'HOA',
    monthlyRevenue: 1000,
    serviceTime: 20,
    units: 50
  })
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null)

  // Constants for cost calculations
  const FUEL_COST_PER_GALLON = 4.11
  const FUEL_EFFICIENCY = 6 // miles per gallon
  const DRIVER_RATE = 24 // per hour
  const HELPER_RATE = 20 // per hour

  const runSimulation = () => {
    // Find nearest existing customer for route optimization
    const nearestCustomer = customerData.reduce((nearest, customer) => {
      const distance = calculateDistance(
        simulationCustomer.latitude, simulationCustomer.longitude,
        parseFloat(customer.latitude), parseFloat(customer.longitude)
      )
      return !nearest || distance < nearest.distance 
        ? { customer, distance }
        : nearest
    }, null as { customer: CustomerData; distance: number } | null)

    // Calculate route impact
    const directDistanceFromDepot = calculateDistance(
      depotCoords.lat, depotCoords.lng,
      simulationCustomer.latitude, simulationCustomer.longitude
    )

    // Estimate additional distance (considering route optimization)
    const additionalDistance = nearestCustomer 
      ? Math.max(nearestCustomer.distance, directDistanceFromDepot * 0.3) // Route optimization saves ~70%
      : directDistanceFromDepot * 2 // Round trip if isolated

    // Calculate costs
    const fuelCost = (additionalDistance / FUEL_EFFICIENCY) * FUEL_COST_PER_GALLON
    const laborTime = simulationCustomer.serviceTime / 60 // Convert to hours
    const travelTime = additionalDistance / 25 // Assume 25 mph average
    const totalLaborTime = laborTime + travelTime
    const laborCost = totalLaborTime * (DRIVER_RATE + HELPER_RATE)

    // Calculate profit metrics
    const totalCost = fuelCost + laborCost
    const netProfit = simulationCustomer.monthlyRevenue - totalCost
    const profitMargin = (netProfit / simulationCustomer.monthlyRevenue) * 100
    const revenuePerMinute = simulationCustomer.monthlyRevenue / simulationCustomer.serviceTime

    // Determine recommendation
    let recommendation: 'accept' | 'negotiate' | 'decline' = 'accept'
    let reasoning = ''

    if (profitMargin < 20) {
      recommendation = 'decline'
      reasoning = 'Low profit margin - below 20% threshold'
    } else if (profitMargin < 40) {
      recommendation = 'negotiate'
      reasoning = 'Moderate profit margin - negotiate for better terms'
    } else if (revenuePerMinute < 50) {
      recommendation = 'negotiate'
      reasoning = 'Low revenue efficiency - negotiate higher rates'
    } else {
      recommendation = 'accept'
      reasoning = 'Strong profit potential and efficiency'
    }

    // Add specific considerations
    if (simulationCustomer.type === 'Subscription' && revenuePerMinute < 75) {
      recommendation = recommendation === 'accept' ? 'negotiate' : recommendation
      reasoning += ' • Single home subscription below efficiency target'
    }

    if (additionalDistance > 20) {
      recommendation = recommendation === 'accept' ? 'negotiate' : recommendation
      reasoning += ' • High travel distance increases costs'
    }

    if (nearestCustomer && nearestCustomer.distance < 2) {
      reasoning += ' • Excellent route synergy with existing customers'
    }

    setSimulationResult({
      additionalRevenue: simulationCustomer.monthlyRevenue,
      additionalTime: simulationCustomer.serviceTime,
      additionalDistance,
      fuelCost,
      laborCost,
      netProfit,
      profitMargin,
      revenuePerMinute,
      recommendation,
      reasoning
    })
  }

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'accept': return 'accept'
      case 'negotiate': return 'negotiate'
      case 'decline': return 'decline'
      default: return 'negotiate'
    }
  }

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case 'accept': return '✅'
      case 'negotiate': return '🤝'
      case 'decline': return '❌'
      default: return '🤝'
    }
  }

  return (
    <div className="insight-module route-simulation-module">
      <div className="module-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>🎯 Route Simulation Sandbox</h3>
        <div className="module-summary">
          <span className="simulation-summary">Test New Customers</span>
        </div>
        <button className={`expand-btn ${isExpanded ? 'expanded' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.5 6L8 9.5L11.5 6"/>
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="module-content">
          <div className="simulation-inputs">
            <div className="input-section">
              <h4>Customer Details</h4>
              <div className="input-grid">
                <div className="input-group">
                  <label>Customer Name</label>
                  <input
                    type="text"
                    value={simulationCustomer.name}
                    onChange={(e) => setSimulationCustomer(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="input-group">
                  <label>Customer Type</label>
                  <select
                    value={simulationCustomer.type}
                    onChange={(e) => setSimulationCustomer(prev => ({ 
                      ...prev, 
                      type: e.target.value as 'HOA' | 'Subscription'
                    }))}
                  >
                    <option value="HOA">HOA</option>
                    <option value="Subscription">Subscription</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Monthly Revenue ($)</label>
                  <input
                    type="number"
                    value={simulationCustomer.monthlyRevenue}
                    onChange={(e) => setSimulationCustomer(prev => ({ 
                      ...prev, 
                      monthlyRevenue: Number(e.target.value) 
                    }))}
                  />
                </div>
                <div className="input-group">
                  <label>Service Time (minutes)</label>
                  <input
                    type="number"
                    value={simulationCustomer.serviceTime}
                    onChange={(e) => setSimulationCustomer(prev => ({ 
                      ...prev, 
                      serviceTime: Number(e.target.value) 
                    }))}
                  />
                </div>
                <div className="input-group">
                  <label>Number of Units</label>
                  <input
                    type="number"
                    value={simulationCustomer.units}
                    onChange={(e) => setSimulationCustomer(prev => ({ 
                      ...prev, 
                      units: Number(e.target.value) 
                    }))}
                  />
                </div>
              </div>
            </div>

            <div className="input-section">
              <h4>Location</h4>
              <div className="input-grid">
                <div className="input-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={simulationCustomer.address}
                    onChange={(e) => setSimulationCustomer(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter address for reference"
                  />
                </div>
                <div className="input-group">
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={simulationCustomer.latitude}
                    onChange={(e) => setSimulationCustomer(prev => ({ 
                      ...prev, 
                      latitude: Number(e.target.value) 
                    }))}
                  />
                </div>
                <div className="input-group">
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={simulationCustomer.longitude}
                    onChange={(e) => setSimulationCustomer(prev => ({ 
                      ...prev, 
                      longitude: Number(e.target.value) 
                    }))}
                  />
                </div>
              </div>
            </div>

            <div className="simulation-actions">
              <button className="run-simulation-btn" onClick={runSimulation}>
                🚀 Run Simulation
              </button>
            </div>
          </div>

          {simulationResult && (
            <div className="simulation-results">
              <div className="results-header">
                <h4>Simulation Results</h4>
                <div className={`recommendation-badge ${getRecommendationColor(simulationResult.recommendation)}`}>
                  {getRecommendationIcon(simulationResult.recommendation)}
                  {simulationResult.recommendation.toUpperCase()}
                </div>
              </div>

              <div className="results-grid">
                <div className="result-section">
                  <h5>Revenue Impact</h5>
                  <div className="result-metrics">
                    <div className="metric">
                      <label>Additional Revenue</label>
                      <span className="value positive">${simulationResult.additionalRevenue.toFixed(0)}</span>
                    </div>
                    <div className="metric">
                      <label>Revenue/Minute</label>
                      <span className="value">${simulationResult.revenuePerMinute.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="result-section">
                  <h5>Cost Analysis</h5>
                  <div className="result-metrics">
                    <div className="metric">
                      <label>Fuel Cost</label>
                      <span className="value negative">${simulationResult.fuelCost.toFixed(2)}</span>
                    </div>
                    <div className="metric">
                      <label>Labor Cost</label>
                      <span className="value negative">${simulationResult.laborCost.toFixed(2)}</span>
                    </div>
                    <div className="metric">
                      <label>Additional Distance</label>
                      <span className="value">{simulationResult.additionalDistance.toFixed(1)} mi</span>
                    </div>
                  </div>
                </div>

                <div className="result-section">
                  <h5>Profitability</h5>
                  <div className="result-metrics">
                    <div className="metric">
                      <label>Net Profit</label>
                      <span className={`value ${simulationResult.netProfit > 0 ? 'positive' : 'negative'}`}>
                        ${simulationResult.netProfit.toFixed(2)}
                      </span>
                    </div>
                    <div className="metric">
                      <label>Profit Margin</label>
                      <span className={`value ${simulationResult.profitMargin > 30 ? 'positive' : 'negative'}`}>
                        {simulationResult.profitMargin.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="recommendation-details">
                <h5>Analysis & Recommendation</h5>
                <p>{simulationResult.reasoning}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 