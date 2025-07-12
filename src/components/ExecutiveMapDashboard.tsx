'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { GoogleMap, LoadScript, Marker, InfoWindow, Polygon } from '@react-google-maps/api'
import { CustomerData } from '../app/api/customers/route'
import { facilities, serviceZones, calculateDistance, isPointInPolygon } from '../lib/facilities'

interface ExecutiveMapDashboardProps {
  customers: CustomerData[]
}

interface CustomerAnalysis extends CustomerData {
  distanceToDepot: number
  distanceToNearestLandfill: number
  costToServe: number
  profitMargin: number
  revenuePerMinute: number
  profitabilityTier: 'High' | 'Moderate' | 'Low'
  inServiceZone: boolean
  isViable: boolean
}

interface FilterState {
  customerType: 'All' | 'HOA' | 'Subscription'
  revenuePerMinute: [number, number]
  distance: [number, number]
  profitability: 'All' | 'High' | 'Moderate' | 'Low'
  showOnlyViable: boolean
}

const mapContainerStyle = {
  width: '100%',
  height: '600px'
}

const center = {
  lat: 38.9,
  lng: -77.3
}

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
}

const ExecutiveMapDashboard: React.FC<ExecutiveMapDashboardProps> = ({ customers }) => {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerAnalysis | null>(null)
  const [analyzedCustomers, setAnalyzedCustomers] = useState<CustomerAnalysis[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerAnalysis[]>([])
  const [filters, setFilters] = useState<FilterState>({
    customerType: 'All',
    revenuePerMinute: [0, 200],
    distance: [0, 50],
    profitability: 'All',
    showOnlyViable: true
  })
  const [showZones, setShowZones] = useState(true)

  // Constants for cost calculations
  const COST_PER_MILE = 2.50 // Fuel + wear & tear
  const COST_PER_MINUTE = 0.73 // Labor costs ($24 driver + $20 helper) / 60 minutes

  // Analyze customers with business intelligence
  useEffect(() => {
    const analyzed = customers.map(customer => {
      const distanceToDepot = calculateDistance(
        customer.latitude, customer.longitude,
        facilities.depot.coords[0], facilities.depot.coords[1]
      )

      const distanceToFairfax = calculateDistance(
        customer.latitude, customer.longitude,
        facilities.landfillFairfax.coords[0], facilities.landfillFairfax.coords[1]
      )

      const distanceToLorton = calculateDistance(
        customer.latitude, customer.longitude,
        facilities.landfillLorton.coords[0], facilities.landfillLorton.coords[1]
      )

      const distanceToNearestLandfill = Math.min(distanceToFairfax, distanceToLorton)
      
      // Calculate cost to serve
      const totalDistance = distanceToDepot + distanceToNearestLandfill
      const costToServe = (totalDistance * COST_PER_MILE) + (customer.completionTime * COST_PER_MINUTE)
      
      // Calculate profitability
      const profitMargin = customer.monthlyRevenue - costToServe
      const revenuePerMinute = customer.monthlyRevenue / customer.completionTime

      // Determine profitability tier
      let profitabilityTier: 'High' | 'Moderate' | 'Low'
      if (revenuePerMinute >= 5) profitabilityTier = 'High'
      else if (revenuePerMinute >= 2) profitabilityTier = 'Moderate'
      else profitabilityTier = 'Low'

      // Check if subscription customer is in service zone
      let inServiceZone = true
      if (customer.type === 'Subscription') {
        inServiceZone = serviceZones.some(zone => 
          isPointInPolygon(customer.latitude, customer.longitude, zone.coordinates)
        )
      }

      // Determine if customer is viable
      const isViable = customer.type === 'HOA' || inServiceZone

      return {
        ...customer,
        distanceToDepot,
        distanceToNearestLandfill,
        costToServe,
        profitMargin,
        revenuePerMinute,
        profitabilityTier,
        inServiceZone,
        isViable
      }
    })

    setAnalyzedCustomers(analyzed)
  }, [customers])

  // Apply filters
  useEffect(() => {
    let filtered = analyzedCustomers.filter(customer => {
      if (filters.customerType !== 'All' && customer.type !== filters.customerType) return false
      if (customer.revenuePerMinute < filters.revenuePerMinute[0] || customer.revenuePerMinute > filters.revenuePerMinute[1]) return false
      if (customer.distanceToDepot < filters.distance[0] || customer.distanceToDepot > filters.distance[1]) return false
      if (filters.profitability !== 'All' && customer.profitabilityTier !== filters.profitability) return false
      if (filters.showOnlyViable && !customer.isViable) return false
      return true
    })

    setFilteredCustomers(filtered)
  }, [analyzedCustomers, filters])

  const getMarkerIcon = (customer: CustomerAnalysis) => {
    if (typeof window === 'undefined' || !window.google || !window.google.maps) {
      return undefined
    }

    if (customer.type === 'HOA') {
      return {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" rx="2" fill="#dc2626" stroke="#fff" stroke-width="2"/>
            <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">H</text>
          </svg>
        `)}`,
        scaledSize: new window.google.maps.Size(24, 24),
        anchor: new window.google.maps.Point(12, 12)
      }
    } else {
      // Subscription customer
      const color = customer.isViable ? '#10b981' : '#ef4444'
      const opacity = customer.isViable ? '1' : '0.5'
      return {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="${color}" stroke="#fff" stroke-width="2" opacity="${opacity}"/>
            <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">S</text>
          </svg>
        `)}`,
        scaledSize: new window.google.maps.Size(24, 24),
        anchor: new window.google.maps.Point(12, 12)
      }
    }
  }

  const getFacilityIcon = (type: 'depot' | 'landfill') => {
    if (typeof window === 'undefined' || !window.google || !window.google.maps) {
      return undefined
    }

    const color = type === 'depot' ? '#3b82f6' : '#8b5cf6'
    const symbol = type === 'depot' ? 'D' : 'L'
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="28" height="28" rx="4" fill="${color}" stroke="#fff" stroke-width="3"/>
          <text x="16" y="22" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${symbol}</text>
        </svg>
      `)}`,
      scaledSize: new window.google.maps.Size(32, 32),
      anchor: new window.google.maps.Point(16, 16)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getProfitabilityColor = (tier: string) => {
    switch (tier) {
      case 'High': return '#10b981'
      case 'Moderate': return '#f59e0b'
      case 'Low': return '#ef4444'
      default: return '#6b7280'
    }
  }

  // Calculate summary statistics
  const totalCustomers = filteredCustomers.length
  const totalRevenue = filteredCustomers.reduce((sum, c) => sum + c.monthlyRevenue, 0)
  const avgRevenuePerMinute = totalCustomers > 0 ? totalRevenue / filteredCustomers.reduce((sum, c) => sum + c.completionTime, 0) : 0
  const totalProfit = filteredCustomers.reduce((sum, c) => sum + c.profitMargin, 0)

  // Get top/bottom performers
  const sortedByProfitability = [...filteredCustomers].sort((a, b) => b.revenuePerMinute - a.revenuePerMinute)
  const topPerformers = sortedByProfitability.slice(0, 10)
  const bottomPerformers = sortedByProfitability.slice(-10).reverse()
  const outsideZoneCustomers = filteredCustomers.filter(c => c.type === 'Subscription' && !c.inServiceZone)

  return (
    <div className="executive-map-dashboard">
      <h2>Executive Map Dashboard</h2>
      <p>Loading...</p>
    </div>
  )
}

export default ExecutiveMapDashboard 