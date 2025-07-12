// Comprehensive RFP Analysis System
// Integrates dynamic fleet modeling, route costing, customer similarity, and tiered pricing

import { 
  analyzeDynamicFleetRequirements, 
  calculateRouteCosts, 
  findSimilarCustomers, 
  generatePricingInsights, 
  calculateTieredPricing,
  ServiceProfile,
  FleetUtilization,
  FleetAnalysisResult,
  TripRequirement
} from './dynamic-fleet-analysis';
import { calculateSmartRoute, findClosestCustomer } from './api/google-maps';
import { SAMPLE_CUSTOMER_PROFILES, getPricingBenchmarks, getOperationalBenchmarks } from './customer-profiles';

interface RFPInput {
  // Basic service requirements
  homes: number;
  communityName: string;
  address: string;
  communityType: 'single_family' | 'condo' | 'townhome';
  
  // Service streams and frequencies
  trashFrequency: number; // times per week
  recyclingFrequency: number;
  yardwasteFrequency: number;
  
  // Location data
  lat?: number;
  lng?: number;
  
  // Special requirements
  accessType: 'curbside' | 'garage' | 'dumpster';
  specialInstructions?: string[];
}

interface ExistingOperation {
  customers: Array<{
    id: string;
    address: string;
    lat?: number;
    lng?: number;
    homes: number;
  }>;
  fleetUtilization: FleetUtilization;
}

interface ComprehensiveAnalysisResult {
  // Fleet and operational analysis
  fleetAnalysis: FleetAnalysisResult;
  routeAnalysis: {
    distanceMiles: number;
    durationMinutes: number;
    method: string;
    closestCustomer?: any;
    routeCosts: {
      fuelCost: number;
      laborCost: number;
      disposalCost: number;
      totalRouteCost: number;
    };
  };
  
  // Customer similarity and pricing insights
  similarCustomers: Array<{
    customerId: string;
    score: number;
    matchFactors: string[];
  }>;
  pricingInsights: {
    suggestedPricePerHome: number;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string[];
  };
  
  // Tiered pricing analysis
  pricingAnalysis: {
    basePrice: number;
    finalPrice: number;
    breakdown: string[];
    monthlyRevenue: number;
    hasNearbyRoute: boolean;
  };
  
  // Market benchmarks
  marketBenchmarks: {
    pricingBenchmark: {
      averagePrice: number;
      medianPrice: number;
      priceRange: { min: number; max: number };
    };
    operationalBenchmark: {
      avgLaborHours: number;
      avgDisposalWeight: number;
      efficiencyScore: number;
    };
  };
  
  // Final recommendation
  recommendation: {
    shouldBid: boolean;
    confidence: 'high' | 'medium' | 'low';
    serviceabilityScore: number;
    reasoning: string[];
    conditions: string[];
    riskFlags: string[];
    profitMargin: number;
    monthlyProfit: number;
  };
  
  // Summary for UI display
  summary: {
    serviceStreams: string;
    fleetImpact: string;
    routeImpact: string;
    pricingStrategy: string;
    recommendation: string;
  };
}

/**
 * Calculate proper profit margin using correct formula
 */
function calculateProfitMargin(revenue: number, totalCosts: number): number {
  if (revenue <= 0) {
    return totalCosts > 0 ? -100 : 0;
  }
  return ((revenue - totalCosts) / revenue) * 100;
}

/**
 * Determine if additional trucks are needed based on fleet load
 */
function checkTruckRequirements(fleetLoadPercentage: number): {
  requiresAdditionalTrucks: boolean;
  trucksNeeded: number;
  warningMessage?: string;
} {
  if (fleetLoadPercentage > 100) {
    const additionalTrucks = Math.ceil((fleetLoadPercentage - 100) / 85); // 85% target utilization
    return {
      requiresAdditionalTrucks: true,
      trucksNeeded: additionalTrucks,
      warningMessage: `Requires ${additionalTrucks} additional truck${additionalTrucks > 1 ? 's' : ''} (${fleetLoadPercentage.toFixed(1)}% fleet load)`
    };
  }
  
  return {
    requiresAdditionalTrucks: false,
    trucksNeeded: 0
  };
}

/**
 * Calculate enhanced route costs using historical data
 */
async function calculateEnhancedRouteCosts(
  distanceMiles: number,
  durationMinutes: number,
  serviceProfile: ServiceProfile
): Promise<{
  fuelCost: number;
  laborCost: number;
  maintenanceCost: number;
  disposalCost: number;
  totalCost: number;
}> {
  // Enhanced cost calculations
  const fuelCostPerMile = 0.80; // Updated from historical data
  const laborCostPerHour = 45; // Driver + helper average
  const maintenanceCostPerMile = 0.12; // Equipment wear
  
  // Calculate disposal costs by stream
  let disposalCost = 0;
  for (const stream of serviceProfile.streams) {
    const totalWeight = stream.weightPerHome * serviceProfile.homes * stream.frequency * 4.33; // Monthly
    
    switch (stream.type) {
      case 'trash':
        disposalCost += totalWeight * 0.085; // $85/ton
        break;
      case 'recycling':
        disposalCost -= totalWeight * 0.015; // -$15/ton (revenue)
        break;
      case 'yard_waste':
        disposalCost += totalWeight * 0.045; // $45/ton
        break;
    }
  }
  
  const fuelCost = distanceMiles * fuelCostPerMile;
  const laborCost = (durationMinutes / 60) * laborCostPerHour;
  const maintenanceCost = distanceMiles * maintenanceCostPerMile;
  
  return {
    fuelCost,
    laborCost,
    maintenanceCost,
    disposalCost,
    totalCost: fuelCost + laborCost + maintenanceCost + disposalCost
  };
}

/**
 * Generate smart price suggestions based on operational data
 */
function generateSmartPriceSuggestion(
  baseRate: number,
  driveTimeMinutes: number,
  routeComplexity: 'low' | 'medium' | 'high',
  similarCustomerPrices: number[]
): {
  suggestedPrice: number;
  reasoning: string[];
  confidence: 'high' | 'medium' | 'low';
} {
  let adjustedPrice = baseRate;
  const reasoning: string[] = [];
  
  // Drive time adjustment
  const driveTimeCost = (driveTimeMinutes / 60) * 45; // Labor cost for drive time
  const driveTimeAdjustment = driveTimeCost / 100; // Spread across homes (assuming 100 homes baseline)
  adjustedPrice += driveTimeAdjustment;
  reasoning.push(`Drive time adjustment: +$${driveTimeAdjustment.toFixed(2)} (${driveTimeMinutes} min drive)`);
  
  // Route complexity factor
  const complexityMultiplier = {
    low: 1.0,
    medium: 1.15,
    high: 1.3
  }[routeComplexity];
  
  adjustedPrice *= complexityMultiplier;
  if (complexityMultiplier > 1.0) {
    reasoning.push(`Route complexity adjustment: +${((complexityMultiplier - 1) * 100).toFixed(0)}% (${routeComplexity} complexity)`);
  }
  
  // Market comparison
  if (similarCustomerPrices.length > 0) {
    const avgMarketPrice = similarCustomerPrices.reduce((sum, price) => sum + price, 0) / similarCustomerPrices.length;
    const marketDifference = adjustedPrice - avgMarketPrice;
    
    if (Math.abs(marketDifference) > avgMarketPrice * 0.15) { // More than 15% difference
      reasoning.push(`Market comparison: ${marketDifference > 0 ? 'Above' : 'Below'} average by $${Math.abs(marketDifference).toFixed(2)}`);
    }
  }
  
  // Determine confidence
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  if (similarCustomerPrices.length >= 3 && driveTimeMinutes < 30) {
    confidence = 'high';
  } else if (similarCustomerPrices.length < 2 || driveTimeMinutes > 45) {
    confidence = 'low';
  }
  
  return {
    suggestedPrice: adjustedPrice,
    reasoning,
    confidence
  };
}

/**
 * Perform comprehensive RFP analysis with all advanced features
 */
export async function performComprehensiveRFPAnalysis(
  rfpInput: RFPInput,
  existingOperation: ExistingOperation
): Promise<ComprehensiveAnalysisResult> {
  console.log(`🔍 Starting comprehensive analysis for ${rfpInput.communityName} (${rfpInput.homes} homes)`);
  
  // 1. Create service profile for dynamic fleet analysis
  const serviceProfile: ServiceProfile = {
    homes: rfpInput.homes,
    communityType: rfpInput.communityType,
    accessType: rfpInput.accessType,
    streams: []
  };
  
  // Add service streams based on frequencies
  if (rfpInput.trashFrequency > 0) {
    serviceProfile.streams.push({
      type: 'trash',
      volumePerHome: 0.8,
      weightPerHome: 35,
      frequency: rfpInput.trashFrequency
    });
  }
  
  if (rfpInput.recyclingFrequency > 0) {
    serviceProfile.streams.push({
      type: 'recycling',
      volumePerHome: 0.4,
      weightPerHome: 15,
      frequency: rfpInput.recyclingFrequency
    });
  }
  
  if (rfpInput.yardwasteFrequency > 0) {
    serviceProfile.streams.push({
      type: 'yard_waste',
      volumePerHome: 0.6,
      weightPerHome: 25,
      frequency: rfpInput.yardwasteFrequency
    });
  }
  
  // 2. Perform dynamic fleet analysis
  console.log('🚛 Analyzing fleet requirements...');
  const fleetAnalysis = analyzeDynamicFleetRequirements(serviceProfile, existingOperation.fleetUtilization);
  
  // 3. Calculate route distance and costs
  console.log('🗺️ Calculating route distance and costs...');
  let routeAnalysis: any = {
    distanceMiles: 15,
    durationMinutes: 25,
    method: 'estimated',
    routeCosts: { fuelCost: 0, laborCost: 0, disposalCost: 0, totalRouteCost: 0 }
  };
  
  try {
    // Find closest customer for route analysis
    const newLocation = {
      address: rfpInput.address,
      lat: rfpInput.lat,
      lng: rfpInput.lng
    };
    
    const closestResult = await findClosestCustomer(newLocation, existingOperation.customers);
    
    if (closestResult.status === 'OK') {
      routeAnalysis = {
        distanceMiles: closestResult.distanceMiles,
        durationMinutes: closestResult.durationMinutes,
        method: 'calculated',
        closestCustomer: closestResult.closestCustomer
      };
    }
    
    // Calculate enhanced route costs
    const enhancedCosts = await calculateEnhancedRouteCosts(
      routeAnalysis.distanceMiles,
      routeAnalysis.durationMinutes,
      serviceProfile
    );
    
    routeAnalysis.routeCosts = {
      fuelCost: enhancedCosts.fuelCost,
      laborCost: enhancedCosts.laborCost,
      disposalCost: enhancedCosts.disposalCost,
      totalRouteCost: enhancedCosts.totalCost
    };
    
  } catch (error) {
    console.log('❌ Route calculation error:', error);
    // Use fallback costs
    const fallbackCosts = await calculateEnhancedRouteCosts(15, 25, serviceProfile);
    routeAnalysis.routeCosts = {
      fuelCost: fallbackCosts.fuelCost,
      laborCost: fallbackCosts.laborCost,
      disposalCost: fallbackCosts.disposalCost,
      totalRouteCost: fallbackCosts.totalCost
    };
  }

  // 4. Find similar customers and generate pricing insights
  console.log('👥 Finding similar customers...');
  const similarCustomers = findSimilarCustomers(serviceProfile, SAMPLE_CUSTOMER_PROFILES);
  const pricingInsights = generatePricingInsights(similarCustomers, fleetAnalysis.requiredTrips);
  
  // 5. Calculate tiered pricing with smart suggestions
  console.log('💰 Calculating tiered pricing...');
  const pricingAnalysis = calculateTieredPricing(
    serviceProfile,
    fleetAnalysis,
    existingOperation.customers.length > 0,
    pricingInsights
  );
  
  // 6. Generate smart price suggestion
  const routeComplexity: 'low' | 'medium' | 'high' = 
    routeAnalysis.durationMinutes < 20 ? 'low' :
    routeAnalysis.durationMinutes < 40 ? 'medium' : 'high';
    
  const similarPrices = similarCustomers.map(c => c.profile.monthlyCostPerUnit);
  const smartPricing = generateSmartPriceSuggestion(
    pricingAnalysis.basePrice,
    routeAnalysis.durationMinutes,
    routeComplexity,
    similarPrices
  );
  
  // 7. Get market benchmarks
  const marketBenchmarks = {
    pricingBenchmark: getPricingBenchmarks(serviceProfile.communityType),
    operationalBenchmark: getOperationalBenchmarks(serviceProfile.communityType)
  };
  
  // 8. Calculate final costs and margins
  const monthlyRevenue = smartPricing.suggestedPrice * rfpInput.homes;
  const totalMonthlyCosts = routeAnalysis.routeCosts.totalRouteCost * 4.33; // Weekly to monthly
  const profitMargin = calculateProfitMargin(monthlyRevenue, totalMonthlyCosts);
  const monthlyProfit = monthlyRevenue - totalMonthlyCosts;
  
  // 9. Check truck requirements
  const truckRequirements = checkTruckRequirements(fleetAnalysis.fleetLoadPercent);
  
  // 10. Generate final recommendation
  console.log('📊 Generating final recommendation...');
  const serviceabilityScore = Math.max(0, Math.min(100, 
    (profitMargin > 15 ? 40 : profitMargin > 5 ? 20 : 0) +
    (fleetAnalysis.fleetLoadPercent < 85 ? 30 : fleetAnalysis.fleetLoadPercent < 100 ? 15 : 0) +
    (routeAnalysis.durationMinutes < 30 ? 20 : routeAnalysis.durationMinutes < 45 ? 10 : 0) +
    (similarCustomers.length > 0 ? 10 : 0)
  ));
  
  const shouldBid = serviceabilityScore >= 60 && profitMargin > 10 && !truckRequirements.requiresAdditionalTrucks;
  const confidence: 'high' | 'medium' | 'low' = 
    serviceabilityScore >= 80 && profitMargin > 20 ? 'high' :
    serviceabilityScore >= 50 && profitMargin > 5 ? 'medium' : 'low';
  
  const reasoning: string[] = [
    `Fleet utilization: ${fleetAnalysis.fleetLoadPercent.toFixed(1)}% (${fleetAnalysis.fleetLoadPercent < 85 ? 'manageable' : 'high'})`,
    `Route efficiency: ${routeAnalysis.durationMinutes} min drive time (${routeComplexity} complexity)`,
    `Profit margin: ${profitMargin.toFixed(1)}% (${profitMargin > 15 ? 'excellent' : profitMargin > 5 ? 'acceptable' : 'poor'})`,
    ...smartPricing.reasoning
  ];
  
  const conditions: string[] = [];
  const riskFlags: string[] = [];
  
  if (truckRequirements.requiresAdditionalTrucks) {
    riskFlags.push(truckRequirements.warningMessage!);
  }
  
  if (profitMargin < 15) {
    conditions.push('Negotiate higher pricing for better margins');
  }
  
  if (routeAnalysis.durationMinutes > 45) {
    conditions.push('Consider route optimization to reduce drive time');
  }
  
  // 11. Format service streams summary
  const serviceStreams = formatServiceStreams(serviceProfile.streams, rfpInput.homes);
  
  return {
    fleetAnalysis,
    routeAnalysis,
    similarCustomers,
    pricingInsights: {
      ...pricingInsights,
      suggestedPricePerHome: smartPricing.suggestedPrice,
      confidence: smartPricing.confidence,
      reasoning: smartPricing.reasoning
    },
    pricingAnalysis: {
      ...pricingAnalysis,
      hasNearbyRoute: existingOperation.customers.length > 0
    },
    marketBenchmarks,
    recommendation: {
      shouldBid,
      confidence,
      serviceabilityScore,
      reasoning,
      conditions,
      riskFlags,
      profitMargin,
      monthlyProfit
    },
    summary: {
      serviceStreams,
      fleetImpact: `${fleetAnalysis.fleetLoadPercent.toFixed(1)}% fleet utilization`,
      routeImpact: `${routeAnalysis.durationMinutes} min drive time`,
      pricingStrategy: `$${smartPricing.suggestedPrice.toFixed(2)}/home/month`,
      recommendation: shouldBid ? 
        (confidence === 'high' ? 'RECOMMEND BID' : 'BID WITH CONDITIONS') : 
        'DO NOT BID'
    }
  };
}

/**
 * Format service streams for display
 */
function formatServiceStreams(streams: any[], homes: number): string {
  const streamDescriptions = streams.map(stream => {
    const frequency = stream.frequency === 1 ? '1x/week' : `${stream.frequency}x/week`;
    const streamName = stream.type === 'yard_waste' ? 'yard waste' : stream.type;
    return `${homes} homes ${streamName} (${frequency})`;
  });
  
  return streamDescriptions.join(' • ');
}

/**
 * Quick RFP analysis for simple cases (backwards compatibility)
 */
export async function quickRFPAnalysis(
  homes: number,
  trashFreq: number,
  recyclingFreq: number,
  yardwasteFreq: number,
  address: string = '',
  communityType: 'single_family' | 'condo' | 'townhome' = 'single_family'
): Promise<{
  shouldBid: boolean;
  confidence: string;
  reasoning: string[];
  fleetLoadPercent: number;
  estimatedPrice: number;
  monthlyRevenue: number;
}> {
  const rfpInput: RFPInput = {
    homes,
    communityName: 'Quick Analysis',
    address,
    communityType,
    trashFrequency: trashFreq,
    recyclingFrequency: recyclingFreq,
    yardwasteFrequency: yardwasteFreq,
    accessType: 'curbside'
  };
  
  const existingOperation: ExistingOperation = {
    customers: [],
    fleetUtilization: {
      currentTrucks: 3,
      hoursPerTruck: 8,
      stopsPerTruck: 150,
      utilizationPercent: 75
    }
  };
  
  const result = await performComprehensiveRFPAnalysis(rfpInput, existingOperation);
  
      return {
      shouldBid: result.recommendation.shouldBid,
      confidence: result.recommendation.confidence,
      reasoning: result.recommendation.reasoning,
      fleetLoadPercent: result.fleetAnalysis.fleetLoadPercent,
      estimatedPrice: result.pricingAnalysis.finalPrice,
      monthlyRevenue: result.pricingAnalysis.monthlyRevenue
    };
} 