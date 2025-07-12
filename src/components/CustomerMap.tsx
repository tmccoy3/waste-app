'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { GoogleMap, LoadScript, Marker, InfoWindow, MarkerClusterer } from '@react-google-maps/api'
import { CustomerData } from '../app/api/customers/route'
import { facilities } from '../lib/facilities'
import CustomerMapFallback from './CustomerMapFallback'

// Utility functions
const getMarkerColor = (type: 'HOA' | 'Subscription') => {
  return type === 'HOA' ? '#dc2626' : '#10b981' // Red for HOA, Green for Subscription
}

const formatRevenue = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// Calculate revenue per minute for profitability analysis
const calculateRevenuePerMinute = (revenue: number, timeOnSite: number) => {
  return timeOnSite > 0 ? revenue / timeOnSite : 0
}

// Get profitability tag and color
const getProfitabilityTag = (revenuePerMinute: number) => {
  if (revenuePerMinute > 5) return { tag: '🟢 Efficient', color: '#10b981' }
  if (revenuePerMinute >= 2) return { tag: '🟡 Moderate', color: '#f59e0b' }
  return { tag: '🔴 Inefficient', color: '#dc2626' }
}

// Map styling and configuration
const mapContainerStyle = {
  width: '100%',
  height: '600px'
}

// Center on Washington DC area (where your customers are located)
const center = {
  lat: 38.9072,
  lng: -77.0369
}

const mapOptions = {
  zoom: 11,
  mapTypeId: 'roadmap' as google.maps.MapTypeId,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
}

interface CustomerMapProps {
  googleMapsApiKey: string
  customers: CustomerData[]
  onRefresh?: () => void
  lastUpdated?: string
}

export default function CustomerMap({ googleMapsApiKey, customers, onRefresh, lastUpdated }: CustomerMapProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null)
  const [selectedFacility, setSelectedFacility] = useState<any>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'HOA' | 'Subscription'>('all')
  const [showClustering, setShowClustering] = useState(true)
  const [showFacilities, setShowFacilities] = useState(true)

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  // Filter customers based on selected type
  const filteredCustomers = customers.filter(customer => 
    filterType === 'all' || customer.type === filterType
  )

  // Calculate KPI metrics
  const totalRevenue = filteredCustomers.reduce((sum, c) => sum + c.monthlyRevenue, 0)
  const avgTimeOnSite = filteredCustomers.length > 0 
    ? Math.round(filteredCustomers.reduce((sum, c) => sum + c.completionTime, 0) / filteredCustomers.length)
    : 0
  const avgRevenuePerMinute = filteredCustomers.length > 0
    ? filteredCustomers.reduce((sum, c) => sum + calculateRevenuePerMinute(c.monthlyRevenue, c.completionTime), 0) / filteredCustomers.length
    : 0
  const totalLocations = filteredCustomers.length

  const handleMarkerClick = (customer: CustomerData) => {
    setSelectedCustomer(customer)
    setSelectedFacility(null)
  }

  const handleFacilityClick = (facility: any) => {
    setSelectedFacility(facility)
    setSelectedCustomer(null)
  }

  const handleInfoWindowClose = () => {
    setSelectedCustomer(null)
    setSelectedFacility(null)
  }

  // Create custom marker icon based on customer type and profitability
  const createMarkerIcon = (customer: CustomerData) => {
    if (typeof window === 'undefined' || !window.google || !window.google.maps || !window.google.maps.Size || !window.google.maps.Point) return undefined
    
    const revenuePerMinute = calculateRevenuePerMinute(customer.monthlyRevenue, customer.completionTime)
    const profitability = getProfitabilityTag(revenuePerMinute)
    const color = customer.type === 'HOA' ? '#dc2626' : '#10b981'
    const size = Math.max(24, Math.min(36, customer.monthlyRevenue / 150)) // Size based on revenue
    
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="${color}" stroke="${profitability.color}" stroke-width="2"/>
          <text x="12" y="16" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="8" font-weight="bold">
            ${customer.type === 'HOA' ? 'H' : 'S'}
          </text>
        </svg>
      `)}`,
      scaledSize: typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.Size 
        ? new window.google.maps.Size(size, size) 
        : undefined,
      anchor: typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.Point 
        ? new window.google.maps.Point(size/2, size/2) 
        : undefined
    }
  }

  // Create facility marker icon
  const createFacilityIcon = (facilityType: string) => {
    if (typeof window === 'undefined' || !window.google || !window.google.maps || !window.google.maps.Size || !window.google.maps.Point) return undefined
    
    const iconMap = {
      trucks: '🚛',
      landfill_fairfax: '🏭',
      landfill_lorton: '🏭'
    }
    
    const icon = iconMap[facilityType as keyof typeof iconMap] || '📍'
    
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="11" fill="#6b7280" stroke="white" stroke-width="2"/>
          <text x="12" y="16" text-anchor="middle" font-size="12">
            ${icon}
          </text>
        </svg>
      `)}`,
      scaledSize: typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.Size 
        ? new window.google.maps.Size(32, 32) 
        : undefined,
      anchor: typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.Point 
        ? new window.google.maps.Point(16, 16) 
        : undefined
    }
  }

  // Show fallback if no API key or invalid key
  if (!googleMapsApiKey || googleMapsApiKey === 'demo-key' || googleMapsApiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE' || googleMapsApiKey === 'AIzaSyAv5h95Svf5AqHPh5YxSEbpMhjVeYXab_s') {
    return (
      <CustomerMapFallback 
        customers={customers}
        onRefresh={onRefresh}
        lastUpdated={lastUpdated}
      />
    )
  }

  return (
    <div className="customer-map-container">
      {/* KPI Summary */}
      <div className="kpi-summary">
        <h3 className="kpi-title">📊 Service Overview</h3>
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-value">{formatRevenue(totalRevenue)}</div>
            <div className="kpi-label">Total Monthly Revenue</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{avgTimeOnSite} min</div>
            <div className="kpi-label">Avg. Time on Site</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">${avgRevenuePerMinute.toFixed(2)}/min</div>
            <div className="kpi-label">Avg. Revenue per Minute</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{totalLocations}</div>
            <div className="kpi-label">Total Serviced Locations</div>
          </div>
        </div>
      </div>

      {/* Map Controls */}
      <div className="map-controls">
        <div className="map-filters">
          <label className="filter-label">Filter by Type:</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value as 'all' | 'HOA' | 'Subscription')}
            className="filter-select"
          >
            <option value="all">All Customers ({customers.length})</option>
            <option value="HOA">HOA ({customers.filter(c => c.type === 'HOA').length})</option>
            <option value="Subscription">Subscription ({customers.filter(c => c.type === 'Subscription').length})</option>
          </select>
        </div>
        
        <div className="map-actions">
          <button 
            onClick={() => setShowClustering(!showClustering)}
            className="toggle-btn"
            aria-label={`${showClustering ? 'Turn off' : 'Turn on'} map clustering`}
          >
            {showClustering ? '🔗 Clustering ON' : '📍 Clustering OFF'}
          </button>
          <button 
            onClick={() => setShowFacilities(!showFacilities)}
            className="toggle-btn"
            aria-label={`${showFacilities ? 'Hide' : 'Show'} facilities on map`}
          >
            {showFacilities ? '🏭 Facilities ON' : '🏭 Facilities OFF'}
          </button>
          {onRefresh && (
            <button onClick={onRefresh} className="refresh-btn" aria-label="Refresh map data">
              🔄 Refresh Data
            </button>
          )}
        </div>
      </div>

      {/* Google Map */}
      <LoadScript googleMapsApiKey={googleMapsApiKey}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          options={mapOptions}
          onLoad={onLoad}
          onUnmount={onUnmount}
        >
          {/* Customer Markers */}
          {showClustering ? (
            <MarkerClusterer>
              {(clusterer) => (
                <>
                  {typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.Size && filteredCustomers.map((customer) => (
                    <Marker
                      key={customer.id}
                      position={{ lat: customer.latitude, lng: customer.longitude }}
                      title={customer.name}
                      icon={createMarkerIcon(customer)}
                      onClick={() => handleMarkerClick(customer)}
                      clusterer={clusterer}
                    />
                  ))}
                </>
              )}
            </MarkerClusterer>
          ) : (
            <>
              {typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.Size && filteredCustomers.map((customer) => (
                <Marker
                  key={customer.id}
                  position={{ lat: customer.latitude, lng: customer.longitude }}
                  title={customer.name}
                  icon={createMarkerIcon(customer)}
                  onClick={() => handleMarkerClick(customer)}
                />
              ))}
            </>
          )}

          {/* Facility Markers */}
          {showFacilities && typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.Size && 
            Object.entries(facilities).map(([key, facility]) => (
              <Marker
                key={key}
                position={{ lat: facility.coords[0], lng: facility.coords[1] }}
                title={facility.name}
                icon={createFacilityIcon(key)}
                onClick={() => handleFacilityClick({ ...facility, type: key })}
              />
            ))
          }

          {/* Customer Info Window */}
          {selectedCustomer && (
            <InfoWindow
              position={{ lat: selectedCustomer.latitude, lng: selectedCustomer.longitude }}
              onCloseClick={handleInfoWindowClose}
            >
              <div className="customer-info-window">
                <h3 className="customer-info-title">{selectedCustomer.name}</h3>
                <div className="customer-info-badge">
                  <span className={`customer-type-badge ${selectedCustomer.type.toLowerCase()}`}>
                    {selectedCustomer.type === 'HOA' ? '🔴 HOA' : '🟢 Subscription'}
                  </span>
                </div>
                <div className="customer-info-stats">
                  <div className="customer-stat">
                    <span className="customer-stat-label">Monthly Revenue:</span>
                    <span className="customer-stat-value">{formatRevenue(selectedCustomer.monthlyRevenue)}</span>
                  </div>
                  <div className="customer-stat">
                    <span className="customer-stat-label">Time on Site:</span>
                    <span className="customer-stat-value">{selectedCustomer.completionTime} min</span>
                  </div>
                  <div className="customer-stat">
                    <span className="customer-stat-label">Units:</span>
                    <span className="customer-stat-value">{selectedCustomer.units}</span>
                  </div>
                  <div className="customer-stat">
                    <span className="customer-stat-label">Revenue/Min:</span>
                    <span className="customer-stat-value">
                      ${calculateRevenuePerMinute(selectedCustomer.monthlyRevenue, selectedCustomer.completionTime).toFixed(2)}
                    </span>
                  </div>
                  <div className="profitability-tag">
                    {getProfitabilityTag(calculateRevenuePerMinute(selectedCustomer.monthlyRevenue, selectedCustomer.completionTime)).tag}
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}

          {/* Facility Info Window */}
          {selectedFacility && (
            <InfoWindow
              position={{ lat: selectedFacility.coords[0], lng: selectedFacility.coords[1] }}
              onCloseClick={handleInfoWindowClose}
            >
              <div className="facility-info-window">
                <h3 className="facility-info-title">{selectedFacility.name}</h3>
                <div className="facility-info-address">{selectedFacility.address}</div>
                <div className="facility-info-type">
                  {selectedFacility.type === 'trucks' ? '🚛 Vehicle Depot' : '🏭 Waste Facility'}
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>

      {/* Profitability Analysis Legend */}
      <div className="profitability-legend">
        <h4 className="legend-title">🔍 Profitability Analysis</h4>
        <div className="legend-items">
                     <div className="legend-item">
             <div className="legend-marker efficient"></div>
             <span className="legend-label">🟢 Efficient (&gt;$5/min)</span>
           </div>
           <div className="legend-item">
             <div className="legend-marker moderate"></div>
             <span className="legend-label">🟡 Moderate ($2-5/min)</span>
           </div>
           <div className="legend-item">
             <div className="legend-marker inefficient"></div>
             <span className="legend-label">🔴 Inefficient (&lt;$2/min)</span>
           </div>
        </div>
      </div>

      {/* Map Legend */}
      <div className="customer-map-legend">
        <h4 className="legend-title">Customer Types</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-marker hoa"></div>
            <span className="legend-label">🔴 HOA Communities</span>
            <span className="legend-count">({customers.filter(c => c.type === 'HOA').length})</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker subscription"></div>
            <span className="legend-label">🟢 Subscription Services</span>
            <span className="legend-count">({customers.filter(c => c.type === 'Subscription').length})</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker facility"></div>
            <span className="legend-label">🏭 Facilities</span>
            <span className="legend-count">({Object.keys(facilities).length})</span>
          </div>
        </div>
        <div className="legend-note">
          <small>💡 Marker size indicates monthly revenue • Border color shows profitability</small>
        </div>
        {lastUpdated && (
          <div className="legend-updated">
            <small>Last updated: {new Date(lastUpdated).toLocaleString()}</small>
          </div>
        )}
      </div>
    </div>
  )
} 