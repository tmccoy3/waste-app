import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export interface CustomerData {
  id: string
  name: string
  address: string
  type: 'HOA' | 'Subscription'
  latitude: number
  longitude: number
  units: number
  completionTime: number
  monthlyRevenue: number
  trashDays: string
  recyclingDays: string
  yardWasteDays: string
  unitType: string
  serviceStatus: string
  truckCapacity: string
  laborCosts: {
    driver: number
    helper: number
  }
  operationalCosts: {
    diesel: {
      gallons: number
      costPerGallon: number
    }
    workingHours: number
  }
}

// Calculate monthly revenue based on units and service type
function calculateMonthlyRevenue(units: number, unitType: string): number {
  const baseRates = {
    'Townhomes': 45,
    'Condos': 35,
    'Apartments': 25,
    'Gas Station': 150,
    'Commercial': 200
  }
  
  const rate = baseRates[unitType as keyof typeof baseRates] || 40
  return units * rate
}

// Parse currency string to number
function parseCurrency(currencyString: string): number {
  if (!currencyString || typeof currencyString !== 'string') return 0;
  return parseFloat(currencyString.replace(/[$,]/g, '')) || 0;
}

// Parse numeric string to number
function parseNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

// Convert raw customer data to our format
function transformCustomerData(rawData: any[]): CustomerData[] {
  return rawData.map((customer, index) => {
    // Debug logging for the first customer
    if (index === 0) {
      console.log('First customer data structure:', Object.keys(customer));
    }
    
    return {
      id: `customer-${index + 1}`,
      name: customer['HOA Name'] || 'Unknown',
      address: customer['Full Address'] || '',
      type: customer['Type'] === 'HOA' ? 'HOA' : 'Subscription',
      latitude: parseNumber(customer['latitude']) || 0,
      longitude: parseNumber(customer['longitude']) || 0,
      units: parseNumber(customer['Number of Units']) || 0,
      completionTime: parseNumber(customer['Average Completion Time in Minutes']) || 0,
      monthlyRevenue: parseCurrency(customer['Monthly Revenue']) || 0,
      trashDays: customer['Trash Collection'] || '',
      recyclingDays: customer['Recycling Collection'] || '',
      yardWasteDays: customer['Yard Waste Collection'] || '',
      unitType: customer['Unit Type'] || '',
      serviceStatus: customer['Service Status'] || 'Active',
      truckCapacity: customer['TRUCK CAPACITY'] || '25 yd',
      laborCosts: {
        driver: parseCurrency(customer['LABOR COSTS PER HOUR DRIVER']) || 24,
        helper: parseCurrency(customer['LABOR COSTS PER HOUR HELPER']) || 20
      },
      operationalCosts: {
        diesel: {
          gallons: parseNumber(customer['GALLON TANKS (Diesel)']) || 100,
          costPerGallon: parseCurrency(customer['Average Cost per Gallon']) || 4.11
        },
        workingHours: parseNumber(customer['WORKING HOURS']) || 10
      }
    };
  });
}

// Demo data fallback
function getDemoCustomerData(): CustomerData[] {
  return [
    {
      id: 'demo-1',
      name: 'Pine Valley Estates',
      address: '123 Pine Valley Dr, Fairfax, VA 22030',
      type: 'HOA',
      latitude: 38.8462,
      longitude: -77.3064,
      units: 145,
      completionTime: 58,
      monthlyRevenue: 3200,
      trashDays: 'Tuesday/Friday',
      recyclingDays: 'Wednesday',
      yardWasteDays: 'Tuesday/Friday',
      unitType: 'Townhomes',
      serviceStatus: 'Active',
      truckCapacity: '25 yd',
      laborCosts: { driver: 24, helper: 20 },
      operationalCosts: {
        diesel: { gallons: 100, costPerGallon: 4.11 },
        workingHours: 10
      }
    },
    {
      id: 'demo-2',
      name: 'Maple Ridge Community',
      address: '456 Maple Ridge Blvd, Vienna, VA 22182',
      type: 'HOA',
      latitude: 38.9012,
      longitude: -77.2653,
      units: 89,
      completionTime: 48,
      monthlyRevenue: 2950,
      trashDays: 'Monday/Thursday',
      recyclingDays: 'Tuesday',
      yardWasteDays: 'Monday/Thursday',
      unitType: 'Condos',
      serviceStatus: 'Active',
      truckCapacity: '25 yd',
      laborCosts: { driver: 24, helper: 20 },
      operationalCosts: {
        diesel: { gallons: 100, costPerGallon: 4.11 },
        workingHours: 10
      }
    }
  ]
}

export async function GET() {
  try {
    console.log('Loading customer data from geocoded_customers.json...')
    
    // Try to load the real customer data
    try {
      const dataPath = join(process.cwd(), 'data', 'geocoded_customers.json')
      const rawData = JSON.parse(readFileSync(dataPath, 'utf8'))
      const customers = transformCustomerData(rawData)
      
      console.log(`Successfully loaded ${customers.length} customer records`)
      
      return NextResponse.json({
        success: true,
        count: customers.length,
        data: customers,
        source: 'geocoded_customers.json',
        lastUpdated: new Date().toISOString()
      })
    } catch (fileError) {
      console.error('Failed to load geocoded_customers.json:', fileError)
      
      // Fallback to demo data
      const demoCustomers = getDemoCustomerData()
      
      return NextResponse.json({
        success: true,
        count: demoCustomers.length,
        data: demoCustomers,
        source: 'demo_data',
        lastUpdated: new Date().toISOString(),
        note: 'Using demo data - geocoded_customers.json not found'
      })
    }
  } catch (error) {
    console.error('Error in customer API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch customer data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 