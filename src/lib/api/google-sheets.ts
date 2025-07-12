// Google Sheets API Integration
// Documentation: https://developers.google.com/sheets/api

interface GoogleSheetsConfig {
  apiKey: string
  serviceAccountKey: any
  spreadsheetId: string
}

interface Customer {
  id: string
  name: string
  type: 'HOA' | 'Subscription' | 'One-time'
  address: string
  zone: string
  contactEmail: string
  contactPhone: string
  serviceDay: string
  monthlyRate: number
  status: 'active' | 'inactive' | 'pending'
  profitability: 'high' | 'medium' | 'low'
  notes?: string
}

interface Route {
  id: string
  name: string
  zone: string
  serviceDay: string
  customerIds: string[]
  estimatedTime: number
  actualTime?: number
  efficiency: 'high' | 'medium' | 'low'
  driverId?: string
  notes?: string
}

interface CommunityData {
  name: string;
  address: string;
  zipCode: string;
  numUnits: number;
  avgTimeMinutes: number;
  monthlyRevenue: number;
}

interface CustomerData {
  totalCustomers: number
  activeSubscriptions: number
  customersByZone: {
    zone: string
    count: number
    profitability: 'high' | 'medium' | 'low'
  }[]
}

class GoogleSheetsAPI {
  private config: GoogleSheetsConfig
  private baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets'

  constructor(config: GoogleSheetsConfig) {
    this.config = config
  }

  private async getAccessToken(): Promise<string> {
    // Using service account authentication
    const jwt = require('jsonwebtoken')
    
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iss: this.config.serviceAccountKey.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    }

    const token = jwt.sign(payload, this.config.serviceAccountKey.private_key, { algorithm: 'RS256' })
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: token
      })
    })

    const data = await response.json()
    return data.access_token
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const accessToken = await this.getAccessToken()
    const url = `${this.baseUrl}/${this.config.spreadsheetId}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Read customer data from the "Customers" sheet
  async getCustomers(): Promise<Customer[]> {
    const range = 'Customers!A:M' // Adjust range based on your sheet structure
    const response = await this.makeRequest(`/values/${range}`)
    
    if (!response.values || response.values.length < 2) {
      return []
    }

    // Skip header row and map data
    const [headers, ...rows] = response.values
    
    return rows.map((row: any[], index: number) => ({
      id: row[0] || `customer_${index}`,
      name: row[1] || '',
      type: this.mapCustomerType(row[2]),
      address: row[3] || '',
      zone: row[4] || '',
      contactEmail: row[5] || '',
      contactPhone: row[6] || '',
      serviceDay: row[7] || '',
      monthlyRate: parseFloat(row[8]) || 0,
      status: this.mapStatus(row[9]),
      profitability: this.mapProfitability(row[10]),
      notes: row[11] || ''
    })).filter((customer: Customer) => customer.name) // Filter out empty rows
  }

  // Read route data from the "Routes" sheet
  async getRoutes(): Promise<Route[]> {
    const range = 'Routes!A:I'
    const response = await this.makeRequest(`/values/${range}`)
    
    if (!response.values || response.values.length < 2) {
      return []
    }

    const [headers, ...rows] = response.values
    
    return rows.map((row: any[], index: number) => ({
      id: row[0] || `route_${index}`,
      name: row[1] || '',
      zone: row[2] || '',
      serviceDay: row[3] || '',
      customerIds: row[4] ? row[4].split(',').map((id: string) => id.trim()) : [],
      estimatedTime: parseInt(row[5]) || 0,
      actualTime: row[6] ? parseInt(row[6]) : undefined,
      efficiency: this.mapEfficiency(row[7]),
      driverId: row[8] || undefined,
      notes: row[9] || ''
    })).filter((route: Route) => route.name)
  }

  // Read community data from the first worksheet
  async getCommunityData(): Promise<CommunityData[]> {
    try {
      // Read from the first worksheet with headers: Community Name, Address, Zip Code, Number of Units, Average Time (min), Monthly Revenue
      const range = 'A:F'  // Read columns A through F
      const response = await this.makeRequest(`/values/${range}`)
      
      if (!response.values || response.values.length < 2) {
        return []
      }

      // Skip header row and map data
      const [headers, ...rows] = response.values
      
      return rows.map((row: any[], index: number) => ({
        name: row[0] || '',
        address: row[1] || '',
        zipCode: row[2] || '',
        numUnits: parseInt(row[3]) || 0,
        avgTimeMinutes: parseInt(row[4]) || 0,
        monthlyRevenue: parseFloat(row[5]) || 0
             })).filter((community: CommunityData) => community.name) // Filter out empty rows
    } catch (error) {
      console.error('Error fetching Google Sheets community data:', error)
      throw error
    }
  }

  // Get comprehensive customer data for dashboard
  async getCustomerData(): Promise<CustomerData> {
    try {
      const customers = await this.getCustomers()
      
      const totalCustomers = customers.length
      const activeSubscriptions = customers.filter(c => 
        c.status === 'active' && (c.type === 'HOA' || c.type === 'Subscription')
      ).length

      // Group customers by zone and calculate profitability
      const zoneMap = new Map<string, { count: number; profitabilities: string[] }>()
      
      customers.forEach(customer => {
        if (!customer.zone) return
        
        const existing = zoneMap.get(customer.zone) || { count: 0, profitabilities: [] }
        existing.count++
        existing.profitabilities.push(customer.profitability)
        zoneMap.set(customer.zone, existing)
      })

      const customersByZone = Array.from(zoneMap.entries()).map(([zone, data]) => ({
        zone,
        count: data.count,
        profitability: this.calculateZoneProfitability(data.profitabilities)
      }))

      return {
        totalCustomers,
        activeSubscriptions,
        customersByZone
      }
    } catch (error) {
      console.error('Error fetching Google Sheets customer data:', error)
      throw error
    }
  }

  // Add a new customer to the sheet
  async addCustomer(customer: Omit<Customer, 'id'>): Promise<void> {
    const range = 'Customers!A:M'
    const values = [[
      '', // ID will be auto-generated
      customer.name,
      customer.type,
      customer.address,
      customer.zone,
      customer.contactEmail,
      customer.contactPhone,
      customer.serviceDay,
      customer.monthlyRate,
      customer.status,
      customer.profitability,
      customer.notes || ''
    ]]

    await this.makeRequest(`/values/${range}:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      body: JSON.stringify({ values })
    })
  }

  // Update customer profitability based on analysis
  async updateCustomerProfitability(customerId: string, profitability: 'high' | 'medium' | 'low'): Promise<void> {
    // This would require finding the customer row and updating the profitability column
    // Implementation depends on how you want to identify rows (by ID, name, etc.)
    console.log(`Updating customer ${customerId} profitability to ${profitability}`)
  }

  // Helper methods
  private mapCustomerType(value: string): Customer['type'] {
    switch (value?.toLowerCase()) {
      case 'hoa': return 'HOA'
      case 'subscription': return 'Subscription'
      case 'one-time': return 'One-time'
      default: return 'One-time'
    }
  }

  private mapStatus(value: string): Customer['status'] {
    switch (value?.toLowerCase()) {
      case 'active': return 'active'
      case 'inactive': return 'inactive'
      case 'pending': return 'pending'
      default: return 'active'
    }
  }

  private mapProfitability(value: string): Customer['profitability'] {
    switch (value?.toLowerCase()) {
      case 'high': return 'high'
      case 'medium': return 'medium'
      case 'low': return 'low'
      default: return 'medium'
    }
  }

  private mapEfficiency(value: string): Route['efficiency'] {
    switch (value?.toLowerCase()) {
      case 'high': return 'high'
      case 'medium': return 'medium'
      case 'low': return 'low'
      default: return 'medium'
    }
  }

  private calculateZoneProfitability(profitabilities: string[]): 'high' | 'medium' | 'low' {
    const counts = { high: 0, medium: 0, low: 0 }
    profitabilities.forEach(p => {
      if (p in counts) counts[p as keyof typeof counts]++
    })

    if (counts.high >= counts.medium && counts.high >= counts.low) return 'high'
    if (counts.medium >= counts.low) return 'medium'
    return 'low'
  }
}

// Export singleton instance
export const googleSheetsAPI = new GoogleSheetsAPI({
  apiKey: process.env.GOOGLE_SHEETS_API_KEY || '',
  serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY) : {},
  spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID || '',
})

export type { CustomerData, Customer, Route } 