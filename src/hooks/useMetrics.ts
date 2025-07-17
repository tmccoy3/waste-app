'use client'

import { useMemo, useCallback, useState, useEffect } from 'react'
import { CustomerData } from '../lib/api/google-sheets-customers'

interface MetricResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => void
}

interface KPIMetrics {
  totalCustomers: number
  totalRevenue: number
  avgCompletionTime: number
  revenuePerMinute: number
  hoaAvgTime: number
  subscriptionAvgTime: number
  profitabilityScore: number
}

interface MetricsCache {
  [key: string]: {
    data: any
    timestamp: number
    ttl: number
  }
}

// Simple in-memory cache (in production, use Redis)
const metricsCache: MetricsCache = {}

class MetricsService {
  private static instance: MetricsService
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService()
    }
    return MetricsService.instance
  }

  private getCacheKey(customers: CustomerData[], filters?: any): string {
    const customerIds = customers.map(c => c.id).sort().join(',')
    const filterKey = filters ? JSON.stringify(filters) : ''
    return `metrics:${customerIds}:${filterKey}`
  }

  private getFromCache<T>(key: string): T | null {
    const cached = metricsCache[key]
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      delete metricsCache[key]
      return null
    }
    
    return cached.data
  }

  private setCache<T>(key: string, data: T, ttl: number = this.cacheTimeout): void {
    metricsCache[key] = {
      data,
      timestamp: Date.now(),
      ttl
    }
  }

  // Add comprehensive data validation
  private isValidNumber(value: any): boolean {
    return typeof value === 'number' && 
           !isNaN(value) && 
           isFinite(value) && 
           value >= 0 && 
           value < Number.MAX_SAFE_INTEGER
  }

  private sanitizeNumericValue(value: any, defaultValue: number = 0): number {
    if (this.isValidNumber(value)) {
      return Number(value)
    }
    
    // Try to parse string numbers
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^\d.-]/g, ''))
      if (this.isValidNumber(parsed)) {
        return parsed
      }
    }
    
    return defaultValue
  }

  private validateCustomerData(customer: CustomerData): CustomerData {
    return {
      ...customer,
      monthlyRevenue: this.sanitizeNumericValue(customer.monthlyRevenue, 0),
      completionTime: this.sanitizeNumericValue(customer.completionTime, 0)
    }
  }

  calculateKPIMetrics(customers: CustomerData[]): KPIMetrics {
    const cacheKey = this.getCacheKey(customers)
    const cached = this.getFromCache<KPIMetrics>(cacheKey)
    
    if (cached) {
      return cached
    }

    try {
      // Validate and sanitize customer data first
      const validatedCustomers = customers.map(c => this.validateCustomerData(c))
      const metrics = this.computeKPIMetrics(validatedCustomers)
      this.setCache(cacheKey, metrics)
      return metrics
    } catch (error) {
      console.error('Error calculating KPI metrics:', error)
      return this.getDefaultMetrics()
    }
  }

  private computeKPIMetrics(customers: CustomerData[]): KPIMetrics {
    if (customers.length === 0) {
      return this.getDefaultMetrics()
    }

    // Filter out customers with invalid data
    const validCustomers = customers.filter(c => 
      this.isValidNumber(c.monthlyRevenue) && 
      this.isValidNumber(c.completionTime) &&
      c.completionTime > 0 // Avoid division by zero
    )

    if (validCustomers.length === 0) {
      return this.getDefaultMetrics()
    }

    const hoaCustomers = validCustomers.filter(c => c.type === 'HOA')
    const subscriptionCustomers = validCustomers.filter(c => c.type === 'Subscription')

    const totalRevenue = validCustomers.reduce((sum, c) => sum + c.monthlyRevenue, 0)
    const totalTime = validCustomers.reduce((sum, c) => sum + c.completionTime, 0)
    
    // Calculate monthly operational minutes (weekly service = 4.33 times per month)
    const totalMonthlyOperationalMinutes = validCustomers.reduce((sum, c) => {
      const serviceFrequency = 4.33
      const monthlyMinutes = c.completionTime * serviceFrequency
      return sum + monthlyMinutes
    }, 0)

    const revenuePerMinute = this.safeCalculateRevenuePerMinute(totalRevenue, totalMonthlyOperationalMinutes)
    const avgCompletionTime = this.safeCalculateAverage(totalTime, validCustomers.length)
    
    // Enhanced HOA and subscription time calculations with better validation
    const hoaAvgTime = hoaCustomers.length > 0 ? 
      this.safeCalculateAverage(
        hoaCustomers.reduce((sum, c) => sum + c.completionTime, 0),
        hoaCustomers.length
      ) : 0
    
    const subscriptionAvgTime = subscriptionCustomers.length > 0 ? 
      this.safeCalculateAverage(
        subscriptionCustomers.reduce((sum, c) => sum + c.completionTime, 0),
        subscriptionCustomers.length
      ) : 0

    const profitabilityScore = this.calculateProfitabilityScore(revenuePerMinute, totalRevenue)

    const result = {
      totalCustomers: validCustomers.length,
      totalRevenue,
      avgCompletionTime,
      revenuePerMinute,
      hoaAvgTime,
      subscriptionAvgTime,
      profitabilityScore
    }

    // Final validation of the result
    Object.keys(result).forEach(key => {
      if (!this.isValidNumber(result[key as keyof KPIMetrics])) {
        console.warn(`Invalid metric detected: ${key} = ${result[key as keyof KPIMetrics]}`)
        // Reset to safe default
        ;(result as any)[key] = 0
      }
    })

    return result
  }

  private safeCalculateRevenuePerMinute(revenue: number, minutes: number): number {
    if (!this.isValidNumber(revenue) || !this.isValidNumber(minutes) || minutes === 0) {
      return 0
    }
    
    const result = revenue / minutes
    
    if (!this.isValidNumber(result)) {
      return 0
    }
    
    // Round to 2 decimal places and ensure it's reasonable
    const rounded = Math.round(result * 100) / 100
    return Math.min(rounded, 999999) // Cap at reasonable maximum
  }

  private safeCalculateAverage(total: number, count: number): number {
    if (!this.isValidNumber(total) || !this.isValidNumber(count) || count === 0) {
      return 0
    }
    
    const result = total / count
    
    if (!this.isValidNumber(result)) {
      return 0
    }
    
    // Round to 1 decimal place and ensure it's reasonable
    const rounded = Math.round(result * 10) / 10
    return Math.min(rounded, 99999) // Cap at reasonable maximum for time values
  }

  private calculateProfitabilityScore(revenuePerMinute: number, totalRevenue: number): number {
    if (!this.isValidNumber(revenuePerMinute) || !this.isValidNumber(totalRevenue)) {
      return 0
    }
    
    // Profitability score based on revenue per minute and total revenue
    const revenueScore = Math.min(revenuePerMinute / 60, 1) * 50 // Max 50 points
    const volumeScore = Math.min(totalRevenue / 500000, 1) * 50 // Max 50 points
    const score = Math.round(revenueScore + volumeScore)
    
    return Math.max(0, Math.min(100, score)) // Ensure score is between 0-100
  }

  private getDefaultMetrics(): KPIMetrics {
    return {
      totalCustomers: 0,
      totalRevenue: 0,
      avgCompletionTime: 0,
      revenuePerMinute: 0,
      hoaAvgTime: 0,
      subscriptionAvgTime: 0,
      profitabilityScore: 0
    }
  }

  // Individual metric calculations
  calculateRevenuePerMinute(customers: CustomerData[]): number {
    const cacheKey = `rpm:${this.getCacheKey(customers)}`
    const cached = this.getFromCache<number>(cacheKey)
    
    if (cached !== null) return cached
    
    // Validate customer data first
    const validatedCustomers = customers.map(c => this.validateCustomerData(c))
    const validCustomers = validatedCustomers.filter(c => 
      this.isValidNumber(c.monthlyRevenue) && 
      this.isValidNumber(c.completionTime) &&
      c.completionTime > 0
    )
    
    if (validCustomers.length === 0) {
      return 0
    }
    
    const totalRevenue = validCustomers.reduce((sum, c) => sum + c.monthlyRevenue, 0)
    const totalMonthlyMinutes = validCustomers.reduce((sum, c) => {
      const serviceFrequency = 4.33
      return sum + (c.completionTime * serviceFrequency)
    }, 0)
    
    const result = this.safeCalculateRevenuePerMinute(totalRevenue, totalMonthlyMinutes)
    this.setCache(cacheKey, result)
    return result
  }

  // Clear cache (useful for testing or manual refresh)
  clearCache(): void {
    Object.keys(metricsCache).forEach(key => delete metricsCache[key])
  }
}

// Custom hooks
export function useKPIMetrics(customers: CustomerData[]): MetricResult<KPIMetrics> {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const metricsService = MetricsService.getInstance()

  const data = useMemo(() => {
    try {
      setError(null)
      return metricsService.calculateKPIMetrics(customers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate metrics')
      return null
    }
  }, [customers, metricsService])

  const refresh = useCallback(() => {
    setLoading(true)
    metricsService.clearCache()
    setLoading(false)
  }, [metricsService])

  return { data, loading, error, refresh }
}

export function useRevenuePerMinute(customers: CustomerData[]): MetricResult<number> {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const metricsService = MetricsService.getInstance()

  const data = useMemo(() => {
    try {
      setError(null)
      return metricsService.calculateRevenuePerMinute(customers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate revenue per minute')
      return null
    }
  }, [customers, metricsService])

  const refresh = useCallback(() => {
    setLoading(true)
    metricsService.clearCache()
    setLoading(false)
  }, [metricsService])

  return { data, loading, error, refresh }
}

// Utility functions
export function formatCurrency(amount: number | null | undefined, decimals = 0): string {
  if (amount === null || amount === undefined || isNaN(amount) || !isFinite(amount)) {
    return '$0'
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

export function formatNumber(num: number | null | undefined, decimals = 1): string {
  if (num === null || num === undefined || isNaN(num) || !isFinite(num)) {
    return '0'
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num)
} 