'use client'

import { ReactNode } from 'react'
import { clsx } from 'clsx'
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricCardProps {
  title: string
  value?: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  color?: 'default' | 'success' | 'warning' | 'error'
  loading?: boolean
  error?: string
  onClick?: () => void
  tooltip?: string
  className?: string
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = 'default',
  loading = false,
  error,
  onClick,
  tooltip,
  className
}: MetricCardProps) {
  const isClickable = !!onClick

  // Fallback states
  const displayValue = () => {
    if (loading) return <LoadingSkeleton />
    if (error) return <ErrorState message={error} />
    if (value === undefined || value === null || value === '') return <EmptyState />
    return value
  }

  const colorClasses = {
    default: 'bg-white border-gray-200 text-gray-900',
    success: 'bg-green-50 border-green-200 text-green-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    error: 'bg-red-50 border-red-200 text-red-900'
  }

  const trendIcons = {
    up: <TrendingUp className="w-3 h-3 text-green-500" />,
    down: <TrendingDown className="w-3 h-3 text-red-500" />,
    neutral: <Minus className="w-3 h-3 text-gray-500" />
  }

  return (
    <div 
      className={clsx(
        'p-6 rounded-xl border transition-all duration-200',
        colorClasses[color],
        isClickable && 'cursor-pointer hover:shadow-lg hover:scale-105',
        className
      )}
      onClick={onClick}
      title={tooltip}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {icon && <div className="text-gray-500">{icon}</div>}
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          </div>
          
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {displayValue()}
          </div>
          
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          
          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-2">
              {trendIcons[trend]}
              <span className={clsx(
                'text-xs font-medium',
                trend === 'up' && 'text-green-600',
                trend === 'down' && 'text-red-600',
                trend === 'neutral' && 'text-gray-600'
              )}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Fallback components
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-24"></div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-red-600">
      <AlertTriangle className="w-4 h-4" />
      <span className="text-sm">Error</span>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-gray-400 text-sm">
      No data available
    </div>
  )
} 