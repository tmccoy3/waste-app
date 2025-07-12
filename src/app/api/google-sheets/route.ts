import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

interface CommunityData {
  name: string;
  address: string;
  zipCode: string;
  numUnits: number;
  avgTimeMinutes: number;
  monthlyRevenue: number;
}

async function initializeGoogleSheetsClient() {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID

  if (!serviceAccountKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not configured')
  }

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SPREADSHEET_ID not configured')
  }

  // Parse the service account key (it should be a JSON string)
  let credentials
  try {
    credentials = JSON.parse(serviceAccountKey)
  } catch (error) {
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_KEY format - must be valid JSON')
  }

  // Create JWT client for service account authentication
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  })

  // Initialize the Google Sheets API client
  const sheets = google.sheets({ version: 'v4', auth })

  return { sheets, spreadsheetId }
}

async function readCommunityData(): Promise<CommunityData[]> {
  try {
    console.log('🔍 Initializing Google Sheets client...')
    const { sheets, spreadsheetId } = await initializeGoogleSheetsClient()

    console.log(`📊 Reading community data from spreadsheet: ${spreadsheetId}`)
    
    // Read from the first worksheet, columns A:F
    // Expected headers: Community Name, Address, Zip Code, Number of Units, Average Time (min), Monthly Revenue
    const range = 'A:F'
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    })

    const values = response.data.values

    if (!values || values.length < 2) {
      console.log('⚠️  No data found in Google Sheet')
      return []
    }

    // Skip header row and map data
    const [headers, ...rows] = values
    console.log(`📋 Found headers: ${headers.join(', ')}`)
    console.log(`📊 Processing ${rows.length} data rows...`)

    const communities = rows.map((row: any[], index: number) => {
      const community: CommunityData = {
        name: row[0] || '',
        address: row[1] || '',
        zipCode: row[2] || '',
        numUnits: parseInt(row[3]) || 0,
        avgTimeMinutes: parseInt(row[4]) || 0,
        monthlyRevenue: parseFloat(row[5]) || 0
      }
      
      if (community.name) {
        console.log(`✅ Processed: ${community.name} - ${community.numUnits} units, $${community.monthlyRevenue}/month`)
      }
      
      return community
    }).filter((community: CommunityData) => community.name) // Filter out empty rows

    console.log(`🎉 Successfully loaded ${communities.length} communities from Google Sheets`)
    
    return communities

  } catch (error) {
    console.error('🚨 Error reading Google Sheets community data:', error)
    throw error
  }
}

function generateDemoCommunityData(): CommunityData[] {
  console.log('📊 Generating demo community data for Operations Intelligence')
  
  const demoData: CommunityData[] = [
    {
      name: "Sunset Valley HOA",
      address: "1234 Sunset Blvd, Austin, TX",
      zipCode: "78746",
      numUnits: 150,
      avgTimeMinutes: 45,
      monthlyRevenue: 4500
    },
    {
      name: "Pine Ridge Apartments",
      address: "5678 Pine Ridge Dr, Austin, TX", 
      zipCode: "78731",
      numUnits: 200,
      avgTimeMinutes: 55,
      monthlyRevenue: 6000
    },
    {
      name: "Metro Construction Corp",
      address: "9012 Industrial Blvd, Austin, TX",
      zipCode: "78745", 
      numUnits: 1,
      avgTimeMinutes: 120,
      monthlyRevenue: 2800
    },
    {
      name: "Riverside Shopping Center",
      address: "3456 Riverside Dr, Austin, TX",
      zipCode: "78741",
      numUnits: 8,
      avgTimeMinutes: 90,
      monthlyRevenue: 3200
    },
    {
      name: "Oak Hills Community",
      address: "7890 Oak Hills Blvd, Austin, TX",
      zipCode: "78735",
      numUnits: 180,
      avgTimeMinutes: 50,
      monthlyRevenue: 5400
    },
    {
      name: "Cedar Point Business Park",
      address: "2468 Cedar Point Way, Austin, TX",
      zipCode: "78758",
      numUnits: 12,
      avgTimeMinutes: 75,
      monthlyRevenue: 4800
    }
  ]

  return demoData
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'communities':
        console.log('🚀 Google Sheets Community Data Integration Started')
        
        try {
          // Attempt to read real data from Google Sheets
          const communities = await readCommunityData()
          
          console.log('✅ LIVE DATA: Google Sheets integration successful!')
          
          return NextResponse.json({
            communities,
            _metadata: {
              dataSource: 'live',
              totalCommunities: communities.length,
              totalUnits: communities.reduce((sum, c) => sum + c.numUnits, 0),
              totalMonthlyRevenue: communities.reduce((sum, c) => sum + c.monthlyRevenue, 0),
              avgTimePerCommunity: Math.round(communities.reduce((sum, c) => sum + c.avgTimeMinutes, 0) / communities.length),
              message: '✅ Successfully loaded community data from Google Sheets!',
              lastUpdated: new Date().toISOString()
            }
          })
          
        } catch (error) {
          console.log('⚠️  Google Sheets access failed:', error)
          console.log('📊 FALLBACK: Using demo data due to Google Sheets integration error')
          
          const demoCommunities = generateDemoCommunityData()
          
          return NextResponse.json({
            communities: demoCommunities,
            _metadata: {
              dataSource: 'demo',
              totalCommunities: demoCommunities.length,
              totalUnits: demoCommunities.reduce((sum, c) => sum + c.numUnits, 0),
              totalMonthlyRevenue: demoCommunities.reduce((sum, c) => sum + c.monthlyRevenue, 0),
              avgTimePerCommunity: Math.round(demoCommunities.reduce((sum, c) => sum + c.avgTimeMinutes, 0) / demoCommunities.length),
              error: error instanceof Error ? error.message : 'Unknown error',
              fallbackReason: 'Google Sheets API integration error - using demo data to ensure dashboard functionality',
              message: '⚠️ Using demo data - Google Sheets integration failed',
              lastUpdated: new Date().toISOString()
            }
          })
        }

      case 'test':
        // Test endpoint for Google Sheets authentication
        try {
          const { sheets, spreadsheetId } = await initializeGoogleSheetsClient()
          
          // Test by reading spreadsheet metadata
          const metadata = await sheets.spreadsheets.get({
            spreadsheetId,
            fields: 'properties'
          })
          
          return NextResponse.json({
            status: 'connected',
            spreadsheetTitle: metadata.data.properties?.title,
            spreadsheetId,
            message: 'Google Sheets authentication successful'
          })
        } catch (error) {
          return NextResponse.json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 401 })
        }

      default:
        return NextResponse.json({ 
          error: 'Invalid action', 
          availableActions: ['communities', 'test'] 
        }, { status: 400 })
    }
  } catch (error) {
    console.error('🚨 Google Sheets API Integration Error:', error)
    
    // Always provide demo data as ultimate fallback
    console.log('📊 ULTIMATE FALLBACK: Using demo data due to integration error')
    const demoCommunities = generateDemoCommunityData()
    
    return NextResponse.json({
      communities: demoCommunities,
      _metadata: {
        dataSource: 'demo',
        totalCommunities: demoCommunities.length,
        totalUnits: demoCommunities.reduce((sum, c) => sum + c.numUnits, 0),
        totalMonthlyRevenue: demoCommunities.reduce((sum, c) => sum + c.monthlyRevenue, 0),
        avgTimePerCommunity: Math.round(demoCommunities.reduce((sum, c) => sum + c.avgTimeMinutes, 0) / demoCommunities.length),
        error: error instanceof Error ? error.message : 'Unknown error',
        fallbackReason: 'API integration error - using demo data to ensure dashboard functionality',
        message: '⚠️ Using demo data due to API integration error',
        service: 'Google Sheets API',
        timestamp: new Date().toISOString()
      }
    })
  }
} 