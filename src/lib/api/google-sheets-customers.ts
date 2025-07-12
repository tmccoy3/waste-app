// Google Sheets API integration for customer data
// Note: Google APIs are imported dynamically in server-side functions only
export interface CustomerData {
  id: string
  communityName: string
  latitude: number
  longitude: number
  type: 'HOA' | 'Subscription'
  timeOnSite: number // minutes
  monthlyRevenue: number
}

export interface GoogleSheetsCustomerResponse {
  success: boolean
  data: CustomerData[]
  error?: string
  lastUpdated?: string
}

// Google Sheets configuration
const SPREADSHEET_NAME = 'WasteOp App Data of CSW Customers (Master)'
const SHEET_NAME = 'Sheet1'
const RANGE = `${SHEET_NAME}!A:F` // Community Name, Latitude, Longitude, Type, Time on Site, Monthly Revenue

export async function fetchCustomerDataFromSheets(): Promise<GoogleSheetsCustomerResponse> {
  // This function is now a placeholder - actual Google Sheets logic moved to API route
  // to avoid client-side compilation issues with googleapis
  console.warn('fetchCustomerDataFromSheets called from client-side, returning demo data')
  return getDemoCustomerData()
}

// Helper function to return demo data
function getDemoCustomerData(): GoogleSheetsCustomerResponse {
  const demoCustomerData: CustomerData[] = [
    {
      id: '1',
      communityName: 'Oakwood Community HOA',
      latitude: 38.9072,
      longitude: -77.0369,
      type: 'HOA',
      timeOnSite: 45,
      monthlyRevenue: 2890
    },
    {
      id: '2',
      communityName: 'Riverside Apartments',
      latitude: 38.8951,
      longitude: -77.0364,
      type: 'Subscription',
      timeOnSite: 32,
      monthlyRevenue: 1650
    },
    {
      id: '3',
      communityName: 'Pine Valley Estates',
      latitude: 38.9169,
      longitude: -77.0462,
      type: 'HOA',
      timeOnSite: 58,
      monthlyRevenue: 3200
    },
    {
      id: '4',
      communityName: 'Sunset Manor',
      latitude: 38.8893,
      longitude: -77.0502,
      type: 'Subscription',
      timeOnSite: 28,
      monthlyRevenue: 1950
    },
    {
      id: '5',
      communityName: 'Green Hills Complex',
      latitude: 38.9234,
      longitude: -77.0456,
      type: 'HOA',
      timeOnSite: 52,
      monthlyRevenue: 2750
    },
    {
      id: '6',
      communityName: 'Cedar Grove Homes',
      latitude: 38.8967,
      longitude: -77.0623,
      type: 'Subscription',
      timeOnSite: 35,
      monthlyRevenue: 1425
    },
    {
      id: '7',
      communityName: 'Maple Ridge Community',
      latitude: 38.9145,
      longitude: -77.0389,
      type: 'HOA',
      timeOnSite: 48,
      monthlyRevenue: 2950
    },
    {
      id: '8',
      communityName: 'Willow Creek Estates',
      latitude: 38.8823,
      longitude: -77.0445,
      type: 'Subscription',
      timeOnSite: 41,
      monthlyRevenue: 2100
    }
  ]

  return {
    success: true,
    data: demoCustomerData,
    lastUpdated: new Date().toISOString()
  }
}

// Helper function to validate customer data
export function validateCustomerData(data: any[]): CustomerData[] {
  return data
    .map((row, index) => {
      try {
        // Assuming columns: Community Name, Latitude, Longitude, Type, Time on Site, Monthly Revenue
        const [communityName, latitude, longitude, type, timeOnSite, monthlyRevenue] = row

        // Validate required fields
        if (!communityName || !latitude || !longitude) {
          console.warn(`Skipping row ${index + 1}: Missing required fields`)
          return null
        }

        // Validate coordinates
        const lat = parseFloat(latitude)
        const lng = parseFloat(longitude)
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          console.warn(`Skipping row ${index + 1}: Invalid coordinates`)
          return null
        }

        // Validate type
        const customerType = type?.toString().toLowerCase()
        const validType = customerType === 'hoa' ? 'HOA' : customerType === 'subscription' ? 'Subscription' : null
        if (!validType) {
          console.warn(`Skipping row ${index + 1}: Invalid type "${type}"`)
          return null
        }

        return {
          id: `customer-${index + 1}`,
          communityName: communityName.toString(),
          latitude: lat,
          longitude: lng,
          type: validType,
          timeOnSite: parseFloat(timeOnSite) || 0,
          monthlyRevenue: parseFloat(monthlyRevenue) || 0
        }
      } catch (error) {
        console.warn(`Error processing row ${index + 1}:`, error)
        return null
      }
    })
    .filter((customer): customer is CustomerData => customer !== null)
}

// Function to get marker color based on customer type
export function getMarkerColor(type: 'HOA' | 'Subscription'): string {
  return type === 'HOA' ? '#dc2626' : '#16a34a' // Red for HOA, Green for Subscription
}

// Function to format currency
export function formatRevenue(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
} 