// Enhanced Fleet Analysis Library for Realistic Operational Modeling
// Implements dual-stream routing, capacity modeling, and intuitive recommendations

import { 
  analyzeDynamicFleetRequirements, 
  calculateRouteCosts, 
  findSimilarCustomers, 
  generatePricingInsights, 
  calculateTieredPricing,
  ServiceProfile,
  FleetUtilization
} from './dynamic-fleet-analysis';
import { calculateSmartRoute, findClosestCustomer } from './api/google-maps';
import { SAMPLE_CUSTOMER_PROFILES } from './customer-profiles';

interface FleetConfiguration {
  totalTrucks: number;
  truckType: 'rear-load' | 'front-load' | 'side-load';
  truckCapacityYards: number; // Physical capacity in cubic yards
  maxPayloadTons: number; // Maximum weight capacity
  compactionRatio: number; // Typical 6:1 for rear-load trucks
  effectiveCapacityYards: number; // After compaction
  hoursPerDay: number;
  daysPerWeek: number;
}

interface ServiceStream {
  type: 'trash' | 'recycling' | 'yardwaste';
  homes: number;
  frequency: number; // times per week
  volumePerHomePerWeek: number; // cubic yards
  weightPerHomePerWeek: number; // pounds
  totalWeeklyVolume: number;
  totalWeeklyWeight: number;
  truckTripsNeeded: number;
}

interface RoutingBurden {
  driveTimeMinutes: number;
  burden: 'low' | 'medium' | 'high';
  description: string;
  costImpact: number; // additional cost per month
}

interface DisposalCosts {
  trashFeePerTon: number;
  recyclingFeePerTon: number; // Often negative (revenue)
  yardWasteFeePerTon: number;
  monthlyDisposalCost: number;
}

interface TruckOperatingCosts {
  fuelCostPerHour: number;
  laborCostPerHour: number; // driver + helper
  maintenanceCostPerHour: number;
  totalCostPerHour: number;
}

interface EnhancedAnalysisResult {
  serviceStreams: {
    trash: ServiceStream;
    recycling: ServiceStream;
    yardwaste: ServiceStream;
  };
  fleetRequirements: {
    currentUtilization: number; // percentage
    additionalTrucksNeeded: number;
    canAccommodateWithCurrentFleet: boolean;
    truckHoursPerWeek: number;
    capacityExceeded: boolean;
    fleetLoadPercentage: number;
  };
  routingAnalysis: RoutingBurden;
  costBreakdown: {
    laborCosts: number;
    fuelCosts: number;
    maintenanceCosts: number;
    disposalCosts: number;
    totalMonthlyCost: number;
  };
  bidRecommendation: {
    shouldBid: boolean;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string[];
    conditions: string[];
    riskFlags: string[];
    marginAfterCosts: number;
  };
  serviceabilityScore: number; // 0-100
  tooltips: {
    [key: string]: string;
  };
}

// Default fleet configuration for 3-truck operation
const DEFAULT_FLEET_CONFIG: FleetConfiguration = {
  totalTrucks: 3,
  truckType: 'rear-load',
  truckCapacityYards: 25,
  maxPayloadTons: 18,
  compactionRatio: 6,
  effectiveCapacityYards: 150, // 25 * 6 compaction ratio
  hoursPerDay: 10,
  daysPerWeek: 5
};

// Default disposal costs (per ton)
const DEFAULT_DISPOSAL_COSTS: DisposalCosts = {
  trashFeePerTon: 85, // Cost to dump trash
  recyclingFeePerTon: -15, // Revenue from recycling
  yardWasteFeePerTon: 45, // Cost to dump yard waste
  monthlyDisposalCost: 0 // Calculated
};

// Truck operating costs
const DEFAULT_TRUCK_COSTS: TruckOperatingCosts = {
  fuelCostPerHour: 12, // Diesel consumption
  laborCostPerHour: 44, // $24 driver + $20 helper
  maintenanceCostPerHour: 8, // Maintenance, insurance, etc.
  totalCostPerHour: 64
};

/**
 * Calculate service stream requirements
 */
function calculateServiceStream(
  type: 'trash' | 'recycling' | 'yardwaste',
  homes: number,
  frequency: number,
  config: FleetConfiguration
): ServiceStream {
  // Typical waste generation per home per week
  const wasteGeneration = {
    trash: { volume: 0.8, weight: 35 }, // cubic yards, pounds
    recycling: { volume: 0.4, weight: 15 },
    yardwaste: { volume: 0.6, weight: 25 }
  };

  const generation = wasteGeneration[type];
  const totalWeeklyVolume = homes * generation.volume * frequency;
  const totalWeeklyWeight = homes * generation.weight * frequency;

  // Calculate truck trips needed
  const volumeConstrainedTrips = Math.ceil(totalWeeklyVolume / config.effectiveCapacityYards);
  const weightConstrainedTrips = Math.ceil((totalWeeklyWeight / 2000) / config.maxPayloadTons);
  const truckTripsNeeded = Math.max(volumeConstrainedTrips, weightConstrainedTrips);

  return {
    type,
    homes,
    frequency,
    volumePerHomePerWeek: generation.volume,
    weightPerHomePerWeek: generation.weight,
    totalWeeklyVolume,
    totalWeeklyWeight,
    truckTripsNeeded
  };
}

/**
 * Analyze routing burden based on drive time
 */
function analyzeRoutingBurden(
  driveTimeMinutes: number,
  existingCustomers: any[]
): RoutingBurden {
  let burden: 'low' | 'medium' | 'high';
  let description: string;
  let costImpact: number;

  if (driveTimeMinutes < 5) {
    burden = 'low';
    description = 'Close to existing routes - minimal impact';
    costImpact = driveTimeMinutes * 2 * 5 * 4.33 * (DEFAULT_TRUCK_COSTS.totalCostPerHour / 60); // Monthly cost
  } else if (driveTimeMinutes <= 15) {
    burden = 'medium';
    description = 'Moderate drive time - manageable route extension';
    costImpact = driveTimeMinutes * 2 * 5 * 4.33 * (DEFAULT_TRUCK_COSTS.totalCostPerHour / 60);
  } else {
    burden = 'high';
    description = 'Isolated location - significant routing burden';
    costImpact = driveTimeMinutes * 2 * 5 * 4.33 * (DEFAULT_TRUCK_COSTS.totalCostPerHour / 60) * 1.5; // 50% penalty
  }

  return {
    driveTimeMinutes,
    burden,
    description,
    costImpact: Math.round(costImpact)
  };
}

/**
 * Calculate fleet requirements and utilization
 */
function calculateFleetRequirements(
  serviceStreams: { trash: ServiceStream; recycling: ServiceStream; yardwaste: ServiceStream },
  config: FleetConfiguration
): any {
  // Calculate total truck trips needed per week
  const totalTripsPerWeek = serviceStreams.trash.truckTripsNeeded + 
                           serviceStreams.recycling.truckTripsNeeded + 
                           serviceStreams.yardwaste.truckTripsNeeded;

  // Calculate hours needed (assuming 1 hour per trip average)
  const hoursPerTrip = 1.5; // Including drive time, service time, disposal time
  const totalHoursPerWeek = totalTripsPerWeek * hoursPerTrip;

  // Calculate fleet capacity
  const availableHoursPerWeek = config.totalTrucks * config.hoursPerDay * config.daysPerWeek;
  const currentUtilization = (totalHoursPerWeek / availableHoursPerWeek) * 100;

  // Determine if additional trucks are needed
  const capacityExceeded = currentUtilization > 85; // Keep 15% buffer
  const additionalTrucksNeeded = capacityExceeded ? 
    Math.ceil((totalHoursPerWeek - (availableHoursPerWeek * 0.85)) / (config.hoursPerDay * config.daysPerWeek)) : 0;

  return {
    currentUtilization: Math.round(currentUtilization * 10) / 10,
    additionalTrucksNeeded,
    canAccommodateWithCurrentFleet: !capacityExceeded,
    truckHoursPerWeek: totalHoursPerWeek,
    capacityExceeded,
    fleetLoadPercentage: Math.min(100, currentUtilization)
  };
}

/**
 * Calculate comprehensive cost breakdown
 */
function calculateCostBreakdown(
  serviceStreams: { trash: ServiceStream; recycling: ServiceStream; yardwaste: ServiceStream },
  fleetReqs: any,
  routingBurden: RoutingBurden,
  disposalCosts: DisposalCosts = DEFAULT_DISPOSAL_COSTS,
  truckCosts: TruckOperatingCosts = DEFAULT_TRUCK_COSTS
): any {
  // Labor costs (monthly)
  const laborCosts = (fleetReqs.truckHoursPerWeek * truckCosts.laborCostPerHour * 4.33) + 
                    (fleetReqs.additionalTrucksNeeded * truckCosts.laborCostPerHour * 10 * 5 * 4.33);

  // Fuel and maintenance costs
  const fuelCosts = fleetReqs.truckHoursPerWeek * truckCosts.fuelCostPerHour * 4.33;
  const maintenanceCosts = fleetReqs.truckHoursPerWeek * truckCosts.maintenanceCostPerHour * 4.33;

  // Disposal costs (monthly)
  const trashDisposal = (serviceStreams.trash.totalWeeklyWeight / 2000) * disposalCosts.trashFeePerTon * 4.33;
  const recyclingDisposal = (serviceStreams.recycling.totalWeeklyWeight / 2000) * disposalCosts.recyclingFeePerTon * 4.33;
  const yardwasteDisposal = (serviceStreams.yardwaste.totalWeeklyWeight / 2000) * disposalCosts.yardWasteFeePerTon * 4.33;
  const totalDisposalCosts = trashDisposal + recyclingDisposal + yardwasteDisposal;

  // Add routing burden cost
  const totalMonthlyCost = laborCosts + fuelCosts + maintenanceCosts + totalDisposalCosts + routingBurden.costImpact;

  return {
    laborCosts: Math.round(laborCosts),
    fuelCosts: Math.round(fuelCosts),
    maintenanceCosts: Math.round(maintenanceCosts),
    disposalCosts: Math.round(totalDisposalCosts),
    totalMonthlyCost: Math.round(totalMonthlyCost)
  };
}

/**
 * Generate intuitive bid recommendation with human-readable reasoning
 */
function generateBidRecommendation(
  fleetReqs: any,
  routingBurden: RoutingBurden,
  costBreakdown: any,
  estimatedRevenue: number,
  serviceStreams: { trash: ServiceStream; recycling: ServiceStream; yardwaste: ServiceStream }
): any {
  const reasoning: string[] = [];
  const conditions: string[] = [];
  const riskFlags: string[] = [];

  const marginAfterCosts = (estimatedRevenue - costBreakdown.totalMonthlyCost) / estimatedRevenue;
  const marginPercent = marginAfterCosts * 100;

  // Fleet capacity analysis
  if (fleetReqs.additionalTrucksNeeded > 0) {
    reasoning.push(`⚠️ This opportunity exceeds your current fleet capacity by ${fleetReqs.additionalTrucksNeeded} truck(s).`);
    if (serviceStreams.trash.truckTripsNeeded > 0 && serviceStreams.recycling.truckTripsNeeded > 0) {
      reasoning.push('You would need to split trash and recycling services, driving up operating costs.');
    }
    riskFlags.push(`Requires ${fleetReqs.additionalTrucksNeeded} additional truck(s)`);
    conditions.push(`Budget for ${fleetReqs.additionalTrucksNeeded} additional truck lease(s) at ~$8,500/month each`);
  } else if (fleetReqs.fleetLoadPercentage > 75) {
    reasoning.push(`⚡ This opportunity would utilize ${fleetReqs.fleetLoadPercentage.toFixed(1)}% of your fleet capacity.`);
    reasoning.push('You can accommodate this contract but with limited flexibility for growth.');
  } else {
    reasoning.push(`✅ Your current 3-truck fleet can easily handle this opportunity (${fleetReqs.fleetLoadPercentage.toFixed(1)}% utilization).`);
  }

  // Routing analysis
  if (routingBurden.burden === 'high') {
    reasoning.push(`🗺️ Location is isolated (${routingBurden.driveTimeMinutes} min drive time), adding significant routing costs.`);
    riskFlags.push('High routing burden - isolated location');
    conditions.push('Consider route optimization or premium pricing for drive time');
  } else if (routingBurden.burden === 'medium') {
    reasoning.push(`🚛 Moderate drive time (${routingBurden.driveTimeMinutes} min) to existing routes.`);
  } else {
    reasoning.push(`🎯 Excellent location - close to existing routes (${routingBurden.driveTimeMinutes} min drive time).`);
  }

  // Service stream analysis
  const totalHomes = serviceStreams.trash.homes + serviceStreams.recycling.homes;
  if (serviceStreams.trash.truckTripsNeeded > serviceStreams.recycling.truckTripsNeeded * 2) {
    reasoning.push('💼 Trash-heavy contract - good for route efficiency.');
  } else if (serviceStreams.recycling.truckTripsNeeded > serviceStreams.trash.truckTripsNeeded) {
    reasoning.push('♻️ Recycling-heavy contract - may provide revenue from material sales.');
  }

  // Margin analysis
  if (marginPercent < 15) {
    reasoning.push(`💰 Low projected margin (${marginPercent.toFixed(1)}%) after all operational costs.`);
    riskFlags.push('Low margin after operational costs');
  } else if (marginPercent < 25) {
    reasoning.push(`💡 Moderate margin (${marginPercent.toFixed(1)}%) - acceptable but monitor costs closely.`);
  } else {
    reasoning.push(`💚 Strong margin (${marginPercent.toFixed(1)}%) after all operational costs.`);
  }

  // Final recommendation
  let shouldBid = true;
  let confidence: 'high' | 'medium' | 'low' = 'high';

  if (fleetReqs.additionalTrucksNeeded > 1 || marginPercent < 10) {
    shouldBid = false;
    confidence = 'low';
    reasoning.push('❌ Recommendation: Do not bid - operational challenges outweigh potential profit.');
  } else if (fleetReqs.additionalTrucksNeeded === 1 || marginPercent < 20 || routingBurden.burden === 'high') {
    confidence = 'medium';
    reasoning.push('⚠️ Recommendation: Bid with conditions - manageable but requires careful execution.');
  } else {
    reasoning.push('✅ Recommendation: Submit competitive bid - good operational fit.');
  }

  return {
    shouldBid,
    confidence,
    reasoning,
    conditions,
    riskFlags,
    marginAfterCosts: marginPercent
  };
}

/**
 * Calculate serviceability score (0-100)
 */
function calculateServiceabilityScore(
  fleetReqs: any,
  routingBurden: RoutingBurden,
  marginPercent: number
): number {
  let score = 100;

  // Fleet capacity penalty
  if (fleetReqs.additionalTrucksNeeded > 0) {
    score -= fleetReqs.additionalTrucksNeeded * 25;
  } else if (fleetReqs.fleetLoadPercentage > 85) {
    score -= 10;
  }

  // Routing burden penalty
  if (routingBurden.burden === 'high') {
    score -= 20;
  } else if (routingBurden.burden === 'medium') {
    score -= 10;
  }

  // Margin penalty
  if (marginPercent < 15) {
    score -= 30;
  } else if (marginPercent < 25) {
    score -= 15;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Main enhanced analysis function
 */
export function performEnhancedFleetAnalysis(
  rfpData: {
    homes: number;
    trashFrequency: number; // times per week
    recyclingFrequency: number;
    yardwasteFrequency: number;
    estimatedRevenue: number;
    driveTimeMinutes: number;
  },
  existingCustomers: any[] = [],
  config: FleetConfiguration = DEFAULT_FLEET_CONFIG
): EnhancedAnalysisResult {
  
  // 1. Calculate service streams
  const trashStream = calculateServiceStream('trash', rfpData.homes, rfpData.trashFrequency, config);
  const recyclingStream = calculateServiceStream('recycling', rfpData.homes, rfpData.recyclingFrequency, config);
  const yardwasteStream = calculateServiceStream('yardwaste', rfpData.homes, rfpData.yardwasteFrequency, config);

  const serviceStreams = {
    trash: trashStream,
    recycling: recyclingStream,
    yardwaste: yardwasteStream
  };

  // 2. Calculate fleet requirements
  const fleetRequirements = calculateFleetRequirements(serviceStreams, config);

  // 3. Analyze routing burden
  const routingAnalysis = analyzeRoutingBurden(rfpData.driveTimeMinutes, existingCustomers);

  // 4. Calculate cost breakdown
  const costBreakdown = calculateCostBreakdown(serviceStreams, fleetRequirements, routingAnalysis);

  // 5. Generate bid recommendation
  const bidRecommendation = generateBidRecommendation(
    fleetRequirements,
    routingAnalysis,
    costBreakdown,
    rfpData.estimatedRevenue,
    serviceStreams
  );

  // 6. Calculate serviceability score
  const serviceabilityScore = calculateServiceabilityScore(
    fleetRequirements,
    routingAnalysis,
    bidRecommendation.marginAfterCosts
  );

  // 7. Create tooltips
  const tooltips = {
    serviceabilityScore: 'Composite score based on fleet capacity, routing efficiency, and margin potential (0-100)',
    fleetLoadPercentage: 'Percentage of your total fleet capacity required for this contract',
    marginRiskFlags: 'Operational factors that could impact profitability',
    routingBurden: 'Drive time impact on operational efficiency and costs'
  };

  return {
    serviceStreams,
    fleetRequirements,
    routingAnalysis,
    costBreakdown,
    bidRecommendation,
    serviceabilityScore,
    tooltips
  };
}

/**
 * Helper function to format service stream summary
 */
export function formatServiceStreamSummary(streams: { trash: ServiceStream; recycling: ServiceStream; yardwaste: ServiceStream }): string {
  const parts = [];
  
  if (streams.trash.homes > 0) {
    parts.push(`${streams.trash.homes} homes trash (${streams.trash.frequency}x/week)`);
  }
  if (streams.recycling.homes > 0) {
    parts.push(`${streams.recycling.homes} homes recycling (${streams.recycling.frequency}x/week)`);
  }
  if (streams.yardwaste.homes > 0) {
    parts.push(`${streams.yardwaste.homes} homes yard waste (${streams.yardwaste.frequency}x/week)`);
  }
  
  return parts.join(' • ');
} 