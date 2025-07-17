import { NextRequest, NextResponse } from 'next/server'
import { DataSyncService } from '@/lib/services/data-sync'

/**
 * POST /api/sync-all
 * 
 * Refresh all SaaS integrations for high-level data synchronization.
 * This endpoint orchestrates a complete data sync across all connected services:
 * - FreshBooks: AR/AP and invoice data
 * - Stripe: Payment processing and transaction data
 * - Timeero: Employee time tracking and clock-in/out data
 * - Google Sheets: Collaboration and reporting data
 * 
 * Used for comprehensive dashboard updates and real-time data refresh.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting comprehensive SaaS data sync...')
    
    // Initialize the data sync service
    const service = new DataSyncService()
    
    // Execute all sync operations in parallel for optimal performance
    // Each service handles its own error recovery and retry logic
    await Promise.all([
      service.syncTimeero(),      // Employee time tracking data
      service.syncFreshBooks(),   // Accounting and invoice data
      service.syncStripe(),       // Payment processing data
      service.syncGoogleSheets()  // Collaboration and reporting data
    ])
    
    console.log('✅ All SaaS integrations synchronized successfully')
    
    // Return success response with sync completion timestamp
    return NextResponse.json({ 
      success: true, 
      message: 'All SaaS integrations synchronized successfully',
      timestamp: new Date().toISOString(),
      services: ['Timeero', 'FreshBooks', 'Stripe', 'Google Sheets']
    })
    
  } catch (error) {
    console.error('❌ Error during SaaS sync:', error)
    
    // Return error response with details for debugging
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to sync SaaS integrations',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
} 