import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface SearchResult {
  answer: string
  confidence: number
  sources: string[]
  timestamp: string
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      )
    }

    console.log(`🔍 AI Search query: "${query}"`)

    // Use rule-based response system
    console.log('🤖 Using intelligent rule-based response system')
    return NextResponse.json(await handleQueryWithoutAI(query))

  } catch (error) {
    console.error('❌ AI Search error:', error)
    
    // Fallback to rule-based response
    try {
      const { query } = await request.json()
      return NextResponse.json(await handleQueryWithoutAI(query))
    } catch (fallbackError) {
      return NextResponse.json(
        { 
          error: 'Search failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
  }
}

async function gatherBusinessData() {
  try {
    // Get customer data
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        hoaName: true,
        fullAddress: true,
        monthlyRevenue: true,
        avgCompletionTime: true,
        serviceStatus: true,
        customerType: true,
        city: true,
        state: true,
        numberOfUnits: true,
        createdAt: true,
        isActive: true
      }
    })

    // Calculate key metrics
    const totalCustomers = customers.length
    const activeCustomers = customers.filter(c => c.isActive).length
    const totalRevenue = customers.reduce((sum, c) => sum + (Number(c.monthlyRevenue) || 0), 0)
    const averageRevenue = totalRevenue / totalCustomers || 0
    const averageCompletionTime = customers.reduce((sum, c) => sum + (Number(c.avgCompletionTime) || 0), 0) / totalCustomers || 0
    
    // Customer types breakdown
    const hoaCustomers = customers.filter(c => c.customerType === 'HOA').length
    const subscriptionCustomers = customers.filter(c => c.customerType === 'SUBSCRIPTION').length
    
    // Service status breakdown
    const activeServices = customers.filter(c => c.serviceStatus?.toString() === 'ACTIVE').length
    const inactiveServices = customers.filter(c => c.serviceStatus?.toString() === 'INACTIVE').length
    
    // Geographic distribution
    const citiesServed = [...new Set(customers.map(c => c.city).filter(Boolean))].length
    const statesServed = [...new Set(customers.map(c => c.state).filter(Boolean))].length
    
    // Revenue analysis
    const highValueCustomers = customers.filter(c => Number(c.monthlyRevenue) > 3000).length
    const mediumValueCustomers = customers.filter(c => Number(c.monthlyRevenue) > 1500 && Number(c.monthlyRevenue) <= 3000).length
    const lowValueCustomers = customers.filter(c => Number(c.monthlyRevenue) <= 1500).length

    return {
      totalCustomers,
      activeCustomers,
      totalRevenue,
      averageRevenue,
      averageCompletionTime,
      hoaCustomers,
      subscriptionCustomers,
      activeServices,
      inactiveServices,
      citiesServed,
      statesServed,
      highValueCustomers,
      mediumValueCustomers,
      lowValueCustomers,
      customers: customers.slice(0, 10) // Include sample customers for context
    }
  } catch (error) {
    console.error('Error gathering business data:', error)
    return {
      totalCustomers: 0,
      activeCustomers: 0,
      totalRevenue: 0,
      averageRevenue: 0,
      averageCompletionTime: 0,
      hoaCustomers: 0,
      subscriptionCustomers: 0,
      activeServices: 0,
      inactiveServices: 0,
      citiesServed: 0,
      statesServed: 0,
      highValueCustomers: 0,
      mediumValueCustomers: 0,
      lowValueCustomers: 0,
      customers: []
    }
  }
}

function determineSources(query: string): string[] {
  const lowerQuery = query.toLowerCase()
  const sources: string[] = []
  
  if (lowerQuery.includes('customer') || lowerQuery.includes('revenue') || lowerQuery.includes('service')) {
    sources.push('Customer Database')
  }
  
  if (lowerQuery.includes('fleet') || lowerQuery.includes('route') || lowerQuery.includes('vehicle')) {
    sources.push('Fleet Management System')
  }
  
  if (lowerQuery.includes('financial') || lowerQuery.includes('revenue') || lowerQuery.includes('profit')) {
    sources.push('Financial Records')
  }
  
  if (lowerQuery.includes('performance') || lowerQuery.includes('metric') || lowerQuery.includes('kpi')) {
    sources.push('Performance Analytics')
  }
  
  if (sources.length === 0) {
    sources.push('General Business Data')
  }
  
  return sources
}

async function handleQueryWithoutAI(query: string): Promise<SearchResult> {
  const lowerQuery = query.toLowerCase()
  
  try {
    const businessData = await gatherBusinessData()
    
    let answer = ''
    let confidence = 80
    let sources = ['Customer Database']
    
    if (lowerQuery.includes('customer') && (lowerQuery.includes('total') || lowerQuery.includes('how many'))) {
      answer = `We currently have ${businessData.totalCustomers} total customers, with ${businessData.activeCustomers} active customers. This includes ${businessData.hoaCustomers} HOA customers and ${businessData.subscriptionCustomers} subscription customers.`
      confidence = 95
    }
    else if (lowerQuery.includes('revenue')) {
      answer = `Our total monthly revenue is $${businessData.totalRevenue.toLocaleString()}, with an average of $${businessData.averageRevenue.toFixed(2)} per customer per month.`
      confidence = 95
      sources = ['Financial Records', 'Customer Database']
    }
    else if (lowerQuery.includes('performance') || lowerQuery.includes('completion')) {
      answer = `Our average service completion time is ${businessData.averageCompletionTime.toFixed(1)} minutes per customer visit. We serve ${businessData.activeServices} active service locations across ${businessData.citiesServed} cities.`
      confidence = 85
      sources = ['Performance Analytics', 'Customer Database']
    }
    else if (lowerQuery.includes('fleet') || lowerQuery.includes('route')) {
      answer = `Our fleet operates across ${businessData.citiesServed} cities in ${businessData.statesServed} states. We have ${businessData.activeServices} active service routes with an average completion time of ${businessData.averageCompletionTime.toFixed(1)} minutes per stop.`
      confidence = 70
      sources = ['Fleet Management System', 'Performance Analytics']
    }
    else if (lowerQuery.includes('high') && lowerQuery.includes('value')) {
      answer = `We have ${businessData.highValueCustomers} high-value customers (>$3,000/month), ${businessData.mediumValueCustomers} medium-value customers ($1,500-3,000/month), and ${businessData.lowValueCustomers} customers under $1,500/month.`
      confidence = 90
      sources = ['Customer Database', 'Financial Records']
    }
    else {
      answer = `I can help you with information about our ${businessData.totalCustomers} customers, $${businessData.totalRevenue.toLocaleString()} monthly revenue, fleet operations, and performance metrics. Please ask me about specific aspects like customer count, revenue analysis, or operational efficiency.`
      confidence = 60
      sources = ['General Business Data']
    }
    
    return {
      answer,
      confidence,
      sources,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      answer: 'I apologize, but I encountered an issue accessing the business data. Please try again or contact support if the problem persists.',
      confidence: 30,
      sources: ['System Status'],
      timestamp: new Date().toISOString()
    }
  }
} 