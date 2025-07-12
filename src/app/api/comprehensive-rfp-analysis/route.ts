import { NextRequest, NextResponse } from 'next/server';
import { performComprehensiveRFPAnalysis, quickRFPAnalysis } from '../../../lib/comprehensive-rfp-analysis';
import fs from 'fs';
import path from 'path';

// Simple customer data loader
async function loadCustomerData(): Promise<any[]> {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'geocoded_customers.json');
    const data = fs.readFileSync(dataPath, 'utf8');
    const allCustomers = JSON.parse(data);
    
    // Filter to include only HOA customers for RFP analysis
    const hoaCustomers = allCustomers.filter((customer: any) => customer.Type === 'HOA');
    
    console.log(`📊 Loaded ${allCustomers.length} total customers, filtered to ${hoaCustomers.length} HOA customers for analysis`);
    
    return hoaCustomers;
  } catch (error) {
    console.warn('Could not load customer data, using empty array:', error);
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Starting comprehensive RFP analysis API...');
    const body = await req.json();
    
    // Support both comprehensive and quick analysis modes
    const mode = body.mode || 'comprehensive';
    
    if (mode === 'quick') {
      // Quick analysis for backwards compatibility
      const {
        homes,
        trashFrequency = 2,
        recyclingFrequency = 1,
        yardwasteFrequency = 1,
        address = '',
        communityType = 'single_family'
      } = body;
      
      console.log(`📊 Quick analysis: ${homes} homes, ${trashFrequency}x trash, ${recyclingFrequency}x recycling, ${yardwasteFrequency}x yard waste`);
      
      const result = await quickRFPAnalysis(
        homes,
        trashFrequency,
        recyclingFrequency,
        yardwasteFrequency,
        address,
        communityType
      );
      
      return NextResponse.json({
        success: true,
        mode: 'quick',
        data: result,
        message: 'Quick RFP analysis completed successfully'
      });
    }
    
    // Comprehensive analysis mode
    const {
      homes,
      communityName = 'RFP Analysis',
      address = '',
      communityType = 'single_family',
      trashFrequency = 2,
      recyclingFrequency = 1,
      yardwasteFrequency = 1,
      lat,
      lng,
      accessType = 'curbside',
      specialInstructions = []
    } = body;
    
    console.log(`🔍 Comprehensive analysis: ${communityName} - ${homes} homes`);
    console.log(`📍 Location: ${address}${lat && lng ? ` (${lat}, ${lng})` : ''}`);
    console.log(`🗑️ Service: ${trashFrequency}x trash, ${recyclingFrequency}x recycling, ${yardwasteFrequency}x yard waste`);
    
    // Load existing customer data
    const customers = await loadCustomerData();
    
    // Prepare RFP input
    const rfpInput = {
      homes,
      communityName,
      address,
      communityType,
      trashFrequency,
      recyclingFrequency,
      yardwasteFrequency,
      lat,
      lng,
      accessType,
      specialInstructions
    };
    
    // Prepare existing operation data
    const existingOperation = {
      customers: customers.map((c: any) => ({
        id: c.id || c.name,
        address: c.address,
        lat: c.lat,
        lng: c.lng,
        homes: c.homes || 100 // estimate if not available
      })),
      fleetUtilization: {
        currentTrucks: 3,
        hoursPerTruck: 8.5, // average from Timeero data
        stopsPerTruck: 180,
        utilizationPercent: 78 // based on current operations
      }
    };
    
    console.log(`👥 Analyzing against ${existingOperation.customers.length} existing HOA customers`);
    
    // Perform comprehensive analysis
    const result = await performComprehensiveRFPAnalysis(rfpInput, existingOperation);
    
    console.log(`✅ Analysis complete: ${result.recommendation.shouldBid ? 'RECOMMEND BID' : 'DO NOT BID'}`);
    console.log(`📊 Serviceability Score: ${result.recommendation.serviceabilityScore}/100`);
    console.log(`💰 Estimated Price: $${result.pricingAnalysis.finalPrice.toFixed(2)}/home/month`);
    console.log(`🚛 Fleet Load: ${result.fleetAnalysis.fleetLoadPercent.toFixed(1)}%`);
    
    return NextResponse.json({
      success: true,
      mode: 'comprehensive',
      data: result,
      message: `Comprehensive RFP analysis completed successfully. ${result.recommendation.shouldBid ? 'Recommend bidding' : 'Do not recommend bidding'}.`
    });
    
  } catch (error) {
    console.error('💥 Comprehensive RFP analysis error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform comprehensive RFP analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Return API documentation and capabilities
    return NextResponse.json({
      success: true,
      api: 'Comprehensive RFP Analysis',
      version: '2.0',
      capabilities: [
        'Dynamic fleet requirement modeling',
        'Real-time route distance and cost calculation',
        'Customer similarity scoring and pricing insights',
        'Tiered pricing with volume discounts and route optimization',
        'Market benchmarking against existing customer profiles',
        'Comprehensive serviceability scoring (0-100)',
        'Risk assessment and recommendation confidence levels'
      ],
      endpoints: {
        'POST /': 'Perform comprehensive or quick RFP analysis',
        'GET /': 'Get API documentation'
      },
      modes: {
        comprehensive: {
          description: 'Full analysis with all advanced features',
          required_fields: ['homes', 'communityName', 'address'],
          optional_fields: ['communityType', 'trashFrequency', 'recyclingFrequency', 'yardwasteFrequency', 'lat', 'lng', 'accessType', 'specialInstructions']
        },
        quick: {
          description: 'Simplified analysis for backwards compatibility',
          required_fields: ['homes'],
          optional_fields: ['trashFrequency', 'recyclingFrequency', 'yardwasteFrequency', 'address', 'communityType']
        }
      },
      sample_request: {
        mode: 'comprehensive',
        homes: 150,
        communityName: 'Sunset Village',
        address: '123 Main St, Anytown, VA 22192',
        communityType: 'single_family',
        trashFrequency: 2,
        recyclingFrequency: 1,
        yardwasteFrequency: 1,
        lat: 38.7849,
        lng: -77.3057,
        accessType: 'curbside',
        specialInstructions: ['narrow_streets']
      }
    });
    
  } catch (error) {
    console.error('💥 API documentation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load API documentation' },
      { status: 500 }
    );
  }
} 