'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

interface RefreshIntegrationsButtonProps {
  className?: string
}

export default function RefreshIntegrationsButton({ className = '' }: RefreshIntegrationsButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setStatus('idle')
    
    try {
      console.log('🔄 Starting SaaS integrations refresh...')
      
      // Call the sync-all endpoint
      const response = await fetch('/api/sync-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        console.log('✅ All integrations refreshed successfully')
        setStatus('success')
        setLastRefresh(new Date().toLocaleString())
        
        // Wait a moment to show success status, then reload
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        console.error('❌ Failed to refresh integrations:', data.error)
        setStatus('error')
      }
    } catch (error) {
      console.error('❌ Error refreshing integrations:', error)
      setStatus('error')
    } finally {
      setIsRefreshing(false)
    }
  }

  const getButtonIcon = () => {
    if (isRefreshing) return <RefreshCw className="h-4 w-4 animate-spin" />
    if (status === 'success') return <CheckCircle className="h-4 w-4" />
    if (status === 'error') return <AlertCircle className="h-4 w-4" />
    return <RefreshCw className="h-4 w-4" />
  }

  const getButtonText = () => {
    if (isRefreshing) return 'Refreshing...'
    if (status === 'success') return 'Refreshed!'
    if (status === 'error') return 'Failed - Retry'
    return 'Refresh Integrations'
  }

  const getButtonVariant = () => {
    if (status === 'success') return 'default'
    if (status === 'error') return 'destructive'
    return 'outline'
  }

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      <Button
        onClick={handleRefresh}
        disabled={isRefreshing}
        variant={getButtonVariant()}
        className="flex items-center space-x-2"
      >
        {getButtonIcon()}
        <span>{getButtonText()}</span>
      </Button>
      
      {/* Status indicators */}
      <div className="text-xs text-gray-500 text-center">
        {isRefreshing && (
          <div className="flex items-center space-x-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Syncing Timeero, FreshBooks, Stripe, Google Sheets...</span>
          </div>
        )}
        
        {status === 'success' && lastRefresh && (
          <div className="flex items-center space-x-1 text-green-600">
            <CheckCircle className="h-3 w-3" />
            <span>Last updated: {lastRefresh}</span>
          </div>
        )}
        
        {status === 'error' && (
          <div className="flex items-center space-x-1 text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span>Failed to refresh integrations</span>
          </div>
        )}
        
        {status === 'idle' && (
          <span>Click to refresh all SaaS integrations</span>
        )}
      </div>
    </div>
  )
} 