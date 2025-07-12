import { NextRequest, NextResponse } from 'next/server';
import { 
  pricingService,
  PricingRequest,
  PricingServiceError,
  createRFPRequest 
} from '../../../services/pricing';

/**
 * New Consolidated Pricing Service API
 * POST /api/pricing-service
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Parse the incoming request data
    const {
      communityName,
      locationName,
      homes,
      unitType = 'Single Family Homes',
      services = {
        trash: { frequency: 'weekly', required: true },
        recycling: { frequency: 'bi-weekly', required: true },
        yardWaste: { frequency: 'weekly', required: false }
      },
      accessType = 'curbside',
      isGated = false,
      hasSpecialContainers = false,
      specialRequirements = [],
      contractLength = 3,
      fuelSurchargeAllowed = true,
      coordinates
    } = body;

    // Validate required fields
    if (!communityName || !locationName || !homes) {
      return NextResponse.json(
        { error: 'Missing required fields: communityName, locationName, homes' },
        { status: 400 }
      );
    }

    // Create pricing request
    const pricingRequest: PricingRequest = {
      communityName,
      locationName,
      homes,
      unitType,
      services,
      accessType,
      isGated,
      hasSpecialContainers,
      specialRequirements,
      contractLength,
      startDate: new Date().toISOString(),
      fuelSurchargeAllowed,
      coordinates
    };

    console.log(`🎯 Processing pricing request for ${communityName} (${homes} homes)`);

    // Calculate pricing using the new service
    const pricingResponse = await pricingService.calculatePricing(pricingRequest);

    console.log(`💰 Pricing calculated: $${pricingResponse.pricing.pricePerUnit.toFixed(2)}/unit (${(pricingResponse.pricing.marginPercent * 100).toFixed(1)}% margin)`);

    return NextResponse.json({
      success: true,
      data: pricingResponse,
      // Legacy compatibility fields for existing UI
      legacy: {
        suggestedPricePerHome: pricingResponse.pricing.pricePerUnit,
        estimatedCostPerMonth: pricingResponse.operations.operationalCosts.totalCostPerMonth,
        projectedGrossMargin: pricingResponse.pricing.marginPercent,
        recommendation: pricingResponse.recommendation.recommendationType,
        serviceabilityScore: pricingResponse.recommendation.serviceabilityScore,
        riskFlags: pricingResponse.recommendation.riskFlags,
        reasoning: pricingResponse.recommendation.reasoning,
        strategicSummary: pricingResponse.recommendation.strategicSummary
      }
    });

  } catch (error) {
    console.error('❌ Pricing service error:', error);

    if (error instanceof PricingServiceError) {
      return NextResponse.json(
        { 
          error: error.message, 
          code: error.code,
          details: error.details 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal pricing calculation error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pricing-service - Get service configuration
 */
export async function GET() {
  try {
    const config = pricingService.getConfig();
    
    return NextResponse.json({
      success: true,
      config,
      info: {
        version: '1.0.0',
        description: 'Consolidated Pricing Service API',
        features: [
          'Unit-based pricing with market benchmarks',
          'Operational cost analysis',
          'Fleet utilization calculations',
          'Strategic recommendations',
          'Market validation',
          'Comprehensive error handling'
        ]
      }
    });
  } catch (error) {
    console.error('❌ Error getting pricing service config:', error);
    return NextResponse.json(
      { error: 'Failed to get service configuration' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/pricing-service - Update service configuration (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json(
        { error: 'Missing config in request body' },
        { status: 400 }
      );
    }

    // Update the service configuration
    pricingService.updateConfig(config);

    return NextResponse.json({
      success: true,
      message: 'Pricing service configuration updated',
      newConfig: pricingService.getConfig()
    });

  } catch (error) {
    console.error('❌ Error updating pricing service config:', error);
    return NextResponse.json(
      { error: 'Failed to update service configuration' },
      { status: 500 }
    );
  }
} 