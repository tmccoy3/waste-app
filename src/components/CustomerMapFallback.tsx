'use client'

import React, { useState, useMemo } from 'react'
import { CustomerData } from '../app/api/customers/route'

// Utility functions
const getMarkerColor = (type: 'HOA' | 'Subscription') => {
  return type === 'HOA' ? '#ef4444' : '#10b981' // Red for HOA, Green for Subscription
}

const formatRevenue = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const truncateAddress = (address: string, maxLength: number = 40) => {
  return address.length > maxLength ? address.substring(0, maxLength) + '...' : address
}

interface CustomerMapFallbackProps {
  customers: CustomerData[]
  onRefresh?: () => void
  lastUpdated?: string
}

export default function CustomerMapFallback({ customers, onRefresh, lastUpdated }: CustomerMapFallbackProps) {
  const [selectedType, setSelectedType] = useState<'all' | 'HOA' | 'Subscription'>('all')
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Filter customers based on selected type
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => 
      selectedType === 'all' || customer.type === selectedType
    )
  }, [customers, selectedType])

  // Sort customers by revenue efficiency (revenue per minute)
  const sortedCustomers = useMemo(() => {
    return [...filteredCustomers].sort((a, b) => {
      const efficiencyA = a.monthlyRevenue / a.completionTime
      const efficiencyB = b.monthlyRevenue / b.completionTime
      return efficiencyB - efficiencyA
    })
  }, [filteredCustomers])

  // Calculate summary metrics
  const metrics = useMemo(() => {
    const totalRevenue = filteredCustomers.reduce((sum, c) => sum + c.monthlyRevenue, 0)
    const totalTime = filteredCustomers.reduce((sum, c) => sum + c.completionTime, 0)
    const avgTime = filteredCustomers.length > 0 ? totalTime / filteredCustomers.length : 0
    const avgEfficiency = filteredCustomers.length > 0 ? totalRevenue / totalTime : 0
    
    return {
      totalCustomers: filteredCustomers.length,
      totalRevenue,
      avgTime: Math.round(avgTime),
      avgEfficiency
    }
  }, [filteredCustomers])

  // Get efficiency percentile for heatmap coloring
  const getEfficiencyPercentile = (customer: CustomerData) => {
    const efficiency = customer.monthlyRevenue / customer.completionTime
    const allEfficiencies = sortedCustomers.map(c => c.monthlyRevenue / c.completionTime)
    const percentile = (allEfficiencies.indexOf(efficiency) / allEfficiencies.length) * 100
    return percentile
  }

  // Get heatmap background color
  const getHeatmapColor = (customer: CustomerData) => {
    if (!showHeatmap) return 'transparent'
    const percentile = getEfficiencyPercentile(customer)
    if (percentile >= 80) return 'rgba(34, 197, 94, 0.1)' // Green for top 20%
    if (percentile >= 60) return 'rgba(234, 179, 8, 0.1)' // Yellow for 60-80%
    if (percentile >= 40) return 'rgba(249, 115, 22, 0.1)' // Orange for 40-60%
    return 'rgba(239, 68, 68, 0.1)' // Red for bottom 40%
  }

  const handleTypeChange = (newType: 'all' | 'HOA' | 'Subscription') => {
    setIsTransitioning(true)
    setTimeout(() => {
      setSelectedType(newType)
      setIsTransitioning(false)
    }, 150)
  }

  return (
    <div className="customer-executive-dashboard">
      {/* Header Controls */}
      <div className="executive-header">
        <div className="header-title">
          <h3 className="executive-title">Customer Portfolio Overview</h3>
          <p className="executive-subtitle">
            Operational intelligence for {customers.length} active customers
          </p>
        </div>
        
        <div className="header-controls">
          <div className="filter-group">
            <label className="filter-label">Customer Type:</label>
            <select 
              value={selectedType} 
              onChange={(e) => handleTypeChange(e.target.value as 'all' | 'HOA' | 'Subscription')}
              className="executive-select"
            >
              <option value="all">All Customers ({customers.length})</option>
              <option value="HOA">HOA Communities ({customers.filter(c => c.type === 'HOA').length})</option>
              <option value="Subscription">Subscription Services ({customers.filter(c => c.type === 'Subscription').length})</option>
            </select>
          </div>
          
          <div className="toggle-group">
            <label className="toggle-container">
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={(e) => setShowHeatmap(e.target.checked)}
                className="toggle-input"
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">📈 Revenue Efficiency Heatmap</span>
            </label>
          </div>
          
          {onRefresh && (
            <button onClick={onRefresh} className="refresh-button">
              🔄 Refresh Data
            </button>
          )}
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="executive-metrics">
        <div className="metric-card primary">
          <div className="metric-value">{metrics.totalCustomers}</div>
          <div className="metric-label">Active Customers</div>
          <div className="metric-change">
            {selectedType !== 'all' && (
              <span className="metric-filter">Filtered: {selectedType}</span>
            )}
          </div>
        </div>
        
        <div className="metric-card success">
          <div className="metric-value">{formatRevenue(metrics.totalRevenue)}</div>
          <div className="metric-label">Total Monthly Revenue</div>
          <div className="metric-change">
            <span className="metric-avg">Avg: {formatRevenue(metrics.totalRevenue / metrics.totalCustomers || 0)}</span>
          </div>
        </div>
        
        <div className="metric-card warning">
          <div className="metric-value">{metrics.avgTime} min</div>
          <div className="metric-label">Avg Time on Site</div>
          <div className="metric-change">
            <span className="metric-range">Range: {Math.min(...filteredCustomers.map(c => c.completionTime))}-{Math.max(...filteredCustomers.map(c => c.completionTime))} min</span>
          </div>
        </div>
        
        <div className="metric-card info">
          <div className="metric-value">{formatRevenue(metrics.avgEfficiency)}</div>
          <div className="metric-label">Revenue per Minute</div>
          <div className="metric-change">
            <span className="metric-efficiency">Operational Efficiency</span>
          </div>
        </div>
      </div>

      {/* Customer Data Table */}
      <div className={`customer-table-container ${isTransitioning ? 'transitioning' : ''}`}>
        <div className="table-header">
          <h4 className="table-title">
            {selectedType === 'all' ? 'All Customers' : `${selectedType} Customers`}
          </h4>
          {showHeatmap && (
            <div className="heatmap-legend">
              <span className="legend-item">
                <div className="legend-color high-efficiency"></div>
                <span>High Efficiency</span>
              </span>
              <span className="legend-item">
                <div className="legend-color medium-efficiency"></div>
                <span>Medium</span>
              </span>
              <span className="legend-item">
                <div className="legend-color low-efficiency"></div>
                <span>Low Efficiency</span>
              </span>
            </div>
          )}
        </div>
        
        <div className="customer-table-wrapper">
          <table className="customer-table">
            <thead>
              <tr>
                <th className="col-type">Type</th>
                <th className="col-name">Community Name</th>
                <th className="col-address">Address</th>
                <th className="col-revenue">Monthly Revenue</th>
                <th className="col-time">Time on Site</th>
                <th className="col-efficiency">Revenue/Min</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedCustomers.map((customer) => {
                const efficiency = customer.monthlyRevenue / customer.completionTime
                return (
                  <tr 
                    key={customer.id} 
                    className="customer-row"
                    style={{ backgroundColor: getHeatmapColor(customer) }}
                  >
                    <td className="col-type">
                      <span className={`type-badge ${customer.type.toLowerCase()}`}>
                        {customer.type === 'HOA' ? '🏘️' : '🏢'} {customer.type}
                      </span>
                    </td>
                    <td className="col-name">
                      <div className="customer-name">
                        <span className="name-primary">{customer.name}</span>
                        <span className="name-secondary">{customer.units} units</span>
                      </div>
                    </td>
                    <td className="col-address">
                      <span className="address-text" title={customer.address}>
                        {truncateAddress(customer.address)}
                      </span>
                    </td>
                    <td className="col-revenue">
                      <span className="revenue-amount">{formatRevenue(customer.monthlyRevenue)}</span>
                    </td>
                    <td className="col-time">
                      <span className="time-amount">{customer.completionTime} min</span>
                    </td>
                    <td className="col-efficiency">
                      <span className="efficiency-amount">
                        {formatRevenue(efficiency)}
                      </span>
                    </td>
                    <td className="col-actions">
                      <button 
                        className="action-button view-location"
                        title="View on Map"
                        onClick={() => {
                          // Future: Open map centered on this customer
                          console.log('View location for:', customer.name)
                        }}
                      >
                        📍
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="executive-footer">
        <div className="footer-info">
          {lastUpdated && (
            <span className="last-updated">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </span>
          )}
          <span className="data-source">
            Data source: Real customer records
          </span>
        </div>
      </div>
    </div>
  )
} 