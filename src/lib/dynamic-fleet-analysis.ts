// Dynamic Fleet Analysis with Real-World Truck Modeling
// Handles 25-yard rear loaders with 6:1 compaction ratio

interface TruckSpecs {
  capacity: number; // cubic yards
  compactionRatio: number;
  effectiveCapacity: number; // cubic yards after compaction
  maxWeight: number; // tons
  maxRouteHours: number;
  avgStopTime: number; // minutes per stop
}

interface ServiceStream {
  type: 'trash' | 'recycling' | 'yard_waste';
  volumePerHome: number; // cubic yards per home per pickup
  weightPerHome: number; // pounds per home per pickup
  frequency: number; // pickups per week
}

export interface ServiceProfile {
  homes: number;
  streams: ServiceStream[];
  communityType: 'single_family' | 'condo' | 'townhome';
  accessType: 'curbside' | 'garage' | 'dumpster';
}

export interface FleetUtilization {
  currentTrucks: number;
  hoursPerTruck: number;
  stopsPerTruck: number;
  utilizationPercent: number;
}

export interface TripRequirement {
  stream: string;
  volume: number; // cubic yards
  weight: number; // tons
  tripsNeeded: number;
  truckHours: number;
  reason: string;
}

export interface FleetAnalysisResult {
  requiredTrips: TripRequirement[];
  totalTripsNeeded: number;
  surplusCapacity: number; // available trip capacity
  fleetLoadPercent: number;
  additionalTrucksNeeded: number;
  canServiceWithCurrentFleet: boolean;
  constraints: string[];
  recommendations: string[];
}

// Standard truck specifications
const TRUCK_SPECS: TruckSpecs = {
  capacity: 25, // cubic yards
  compactionRatio: 6,
  effectiveCapacity: 150, // 25 * 6 = 150 cubic yards
  maxWeight: 18, // tons (36,000 lbs)
  maxRouteHours: 12.5, // 12-13 hours average
  avgStopTime: 2.5 // 2.5 minutes per stop average
};

// Service stream specifications
const SERVICE_STREAMS: Record<string, ServiceStream> = {
  trash: {
    type: 'trash',
    volumePerHome: 0.8, // cubic yards per home per week
    weightPerHome: 35, // pounds per home per week
    frequency: 1 // base frequency
  },
  recycling: {
    type: 'recycling',
    volumePerHome: 0.4, // cubic yards per home per week
    weightPerHome: 15, // pounds per home per week
    frequency: 1
  },
  yard_waste: {
    type: 'yard_waste',
    volumePerHome: 0.6, // cubic yards per home per week
    weightPerHome: 25, // pounds per home per week
    frequency: 1
  }
};

/**
 * Calculate trip requirements for a specific service stream
 */
function calculateTripRequirements(
  homes: number,
  stream: ServiceStream,
  frequency: number
): TripRequirement {
  // Calculate weekly volume and weight
  const weeklyVolume = homes * stream.volumePerHome * frequency;
  const weeklyWeight = (homes * stream.weightPerHome * frequency) / 2000; // convert to tons
  
  // Determine trips needed based on volume and weight constraints
  const volumeTrips = Math.ceil(weeklyVolume / TRUCK_SPECS.effectiveCapacity);
  const weightTrips = Math.ceil(weeklyWeight / TRUCK_SPECS.maxWeight);
  const tripsNeeded = Math.max(volumeTrips, weightTrips);
  
  // Calculate truck hours needed
  const stopsPerTrip = Math.ceil(homes / tripsNeeded);
  const serviceTimePerTrip = (stopsPerTrip * TRUCK_SPECS.avgStopTime) / 60; // convert to hours
  const totalTruckHours = tripsNeeded * (serviceTimePerTrip + 1.5); // +1.5 hours for drive time/dumping
  
  // Determine limiting factor
  let reason = '';
  if (volumeTrips > weightTrips) {
    reason = `Volume limited: ${weeklyVolume.toFixed(1)} cy requires ${volumeTrips} trips`;
  } else if (weightTrips > volumeTrips) {
    reason = `Weight limited: ${weeklyWeight.toFixed(1)} tons requires ${weightTrips} trips`;
  } else {
    reason = `Balanced load: ${weeklyVolume.toFixed(1)} cy / ${weeklyWeight.toFixed(1)} tons`;
  }
  
  return {
    stream: stream.type,
    volume: weeklyVolume,
    weight: weeklyWeight,
    tripsNeeded,
    truckHours: totalTruckHours,
    reason
  };
}

/**
 * Analyze fleet requirements for a service profile
 */
export function analyzeDynamicFleetRequirements(
  profile: ServiceProfile,
  currentUtilization?: FleetUtilization
): FleetAnalysisResult {
  const tripRequirements: TripRequirement[] = [];
  let totalTripsNeeded = 0;
  let totalHoursNeeded = 0;
  
  // Calculate requirements for each service stream
  profile.streams.forEach(streamConfig => {
    const stream = SERVICE_STREAMS[streamConfig.type];
    if (!stream) return;
    
    const requirement = calculateTripRequirements(
      profile.homes,
      stream,
      streamConfig.frequency
    );
    
    tripRequirements.push(requirement);
    totalTripsNeeded += requirement.tripsNeeded;
    totalHoursNeeded += requirement.truckHours;
  });
  
  // Calculate fleet capacity analysis
  const currentFleet = currentUtilization?.currentTrucks || 3;
  const availableHoursPerWeek = currentFleet * TRUCK_SPECS.maxRouteHours * 5; // 5 working days
  const currentUtilizationHours = currentUtilization 
    ? (currentUtilization.hoursPerTruck * currentUtilization.currentTrucks * 5)
    : (availableHoursPerWeek * 0.75); // assume 75% if no data
  
  const remainingCapacity = availableHoursPerWeek - currentUtilizationHours;
  const surplusCapacity = Math.max(0, remainingCapacity - totalHoursNeeded);
  const fleetLoadPercent = ((currentUtilizationHours + totalHoursNeeded) / availableHoursPerWeek) * 100;
  
  // Determine if additional trucks are needed
  const additionalTrucksNeeded = Math.max(0, Math.ceil((totalHoursNeeded - remainingCapacity) / (TRUCK_SPECS.maxRouteHours * 5)));
  const canServiceWithCurrentFleet = additionalTrucksNeeded === 0;
  
  // Generate constraints and recommendations
  const constraints: string[] = [];
  const recommendations: string[] = [];
  
  if (fleetLoadPercent > 85) {
    constraints.push(`High fleet utilization: ${fleetLoadPercent.toFixed(1)}%`);
  }
  
  if (additionalTrucksNeeded > 0) {
    constraints.push(`Requires ${additionalTrucksNeeded} additional truck(s)`);
    recommendations.push(`Consider adding ${additionalTrucksNeeded} truck(s) at $8,500/month each`);
  }
  
  // Check for stream separation requirements
  const hasMultipleStreams = profile.streams.length > 1;
  if (hasMultipleStreams) {
    recommendations.push('Separate trucks required for different waste streams');
  }
  
  // Route efficiency recommendations
  if (totalTripsNeeded > currentFleet) {
    recommendations.push('Consider route optimization to reduce trip requirements');
  }
  
  if (surplusCapacity > 20) {
    recommendations.push(`${surplusCapacity.toFixed(1)} hours of surplus capacity available for growth`);
  }
  
  return {
    requiredTrips: tripRequirements,
    totalTripsNeeded,
    surplusCapacity,
    fleetLoadPercent,
    additionalTrucksNeeded,
    canServiceWithCurrentFleet,
    constraints,
    recommendations
  };
}

/**
 * Route distance and time-based costing
 */
interface RouteCostConfig {
  fuelCostPerMile: number;
  laborCostPerHour: number;
  disposalCostPerTon: number;
  recyclingRevenuePerTon: number;
}

interface RouteAnalysis {
  driveTimeMinutes: number;
  driveDistanceMiles: number;
  serviceTimeMinutes: number;
  totalTimeHours: number;
  fuelCost: number;
  laborCost: number;
  disposalCost: number;
  totalRouteCost: number;
}

const DEFAULT_COST_CONFIG: RouteCostConfig = {
  fuelCostPerMile: 0.80,
  laborCostPerHour: 45.00,
  disposalCostPerTon: 82.50,
  recyclingRevenuePerTon: -15.00 // revenue, so negative cost
};

/**
 * Calculate route-based costs for service
 */
export function calculateRouteCosts(
  tripRequirements: TripRequirement[],
  driveTimeMinutes: number,
  driveDistanceMiles: number,
  costConfig: RouteCostConfig = DEFAULT_COST_CONFIG
): RouteAnalysis {
  // Calculate service time (time spent at stops)
  const totalServiceTime = tripRequirements.reduce((sum, req) => sum + (req.truckHours * 60), 0);
  
  // Total time includes drive time for each trip
  const totalTrips = tripRequirements.reduce((sum, req) => sum + req.tripsNeeded, 0);
  const totalDriveTime = driveTimeMinutes * totalTrips * 2; // round trip
  const totalTimeMinutes = totalServiceTime + totalDriveTime;
  const totalTimeHours = totalTimeMinutes / 60;
  
  // Calculate costs
  const totalDistance = driveDistanceMiles * totalTrips * 2; // round trip
  const fuelCost = totalDistance * costConfig.fuelCostPerMile;
  const laborCost = totalTimeHours * costConfig.laborCostPerHour;
  
  // Calculate disposal costs by stream type
  let disposalCost = 0;
  tripRequirements.forEach(req => {
    if (req.stream === 'trash' || req.stream === 'yard_waste') {
      const rate = req.stream === 'trash' ? costConfig.disposalCostPerTon : (costConfig.disposalCostPerTon * 0.55);
      disposalCost += req.weight * rate;
    } else if (req.stream === 'recycling') {
      disposalCost += req.weight * costConfig.recyclingRevenuePerTon; // negative for revenue
    }
  });
  
  const totalRouteCost = fuelCost + laborCost + disposalCost;
  
  return {
    driveTimeMinutes: totalDriveTime,
    driveDistanceMiles: totalDistance,
    serviceTimeMinutes: totalServiceTime,
    totalTimeHours,
    fuelCost,
    laborCost,
    disposalCost,
    totalRouteCost
  };
}

/**
 * Customer similarity scoring for learning from existing profiles
 */
export interface CustomerProfile {
  id: string;
  communityType: 'single_family' | 'condo' | 'townhome';
  homes: number;
  binType: '96_gallon' | 'front_loader' | 'dumpster';
  specialInstructions: string[];
  monthlyCostPerUnit: number;
  laborTimePerHundredHomes: number;
  avgDisposalWeight: number;
}

interface SimilarityScore {
  customerId: string;
  score: number;
  matchFactors: string[];
  profile: CustomerProfile;
}

/**
 * Find similar customer profiles for pricing insights
 */
export function findSimilarCustomers(
  newProfile: ServiceProfile,
  existingCustomers: CustomerProfile[]
): SimilarityScore[] {
  const scores: SimilarityScore[] = [];
  
  existingCustomers.forEach(customer => {
    let score = 0;
    const matchFactors: string[] = [];
    
    // Community type match (40% weight)
    if (customer.communityType === newProfile.communityType) {
      score += 40;
      matchFactors.push('Community type match');
    }
    
    // Home count similarity (30% weight)
    const homesSimilarity = 1 - Math.abs(customer.homes - newProfile.homes) / Math.max(customer.homes, newProfile.homes);
    score += homesSimilarity * 30;
    if (homesSimilarity > 0.8) {
      matchFactors.push('Similar home count');
    }
    
    // Access type similarity (20% weight)
    const accessMatch = customer.binType === '96_gallon' && newProfile.accessType === 'curbside';
    if (accessMatch) {
      score += 20;
      matchFactors.push('Similar access type');
    }
    
    // Service complexity (10% weight)
    const serviceComplexity = newProfile.streams.length;
    if (serviceComplexity <= 2) {
      score += 10;
      matchFactors.push('Standard service complexity');
    }
    
    scores.push({
      customerId: customer.id,
      score,
      matchFactors,
      profile: customer
    });
  });
  
  return scores.sort((a, b) => b.score - a.score);
}

/**
 * Generate pricing insights from similar customers
 */
export function generatePricingInsights(
  similarCustomers: SimilarityScore[],
  tripRequirements: TripRequirement[]
): {
  suggestedPricePerHome: number;
  estimatedDisposalWeight: number;
  estimatedLaborHours: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string[];
} {
  const topMatches = similarCustomers.filter(s => s.score > 60).slice(0, 3);
  
  if (topMatches.length === 0) {
    return {
      suggestedPricePerHome: 27.50,
      estimatedDisposalWeight: tripRequirements.reduce((sum, req) => sum + req.weight, 0),
      estimatedLaborHours: tripRequirements.reduce((sum, req) => sum + req.truckHours, 0),
      confidence: 'low',
      reasoning: ['No similar customers found - using default pricing']
    };
  }
  
  // Calculate weighted averages
  const totalScore = topMatches.reduce((sum, match) => sum + match.score, 0);
  const avgPricePerHome = topMatches.reduce((sum, match) => 
    sum + (match.profile.monthlyCostPerUnit * match.score), 0) / totalScore;
  
  const avgLaborTime = topMatches.reduce((sum, match) => 
    sum + (match.profile.laborTimePerHundredHomes * match.score), 0) / totalScore;
  
  const avgDisposalWeight = topMatches.reduce((sum, match) => 
    sum + (match.profile.avgDisposalWeight * match.score), 0) / totalScore;
  
  const confidence = topMatches.length >= 3 ? 'high' : 
                    topMatches.length >= 2 ? 'medium' : 'low';
  
  const reasoning = [
    `Based on ${topMatches.length} similar customer(s)`,
    `Average match score: ${(totalScore / topMatches.length).toFixed(1)}%`,
    ...topMatches.slice(0, 2).map(match => 
      `${match.profile.homes} homes, $${match.profile.monthlyCostPerUnit}/home (${match.score.toFixed(0)}% match)`)
  ];
  
  return {
    suggestedPricePerHome: avgPricePerHome,
    estimatedDisposalWeight: avgDisposalWeight,
    estimatedLaborHours: avgLaborTime,
    confidence,
    reasoning
  };
}

/**
 * Tiered pricing engine with volume discounts and route optimization
 */
interface PricingTier {
  minHomes: number;
  maxHomes: number;
  basePrice: number;
  description: string;
}

interface PricingModifiers {
  routePairingDiscount: number; // percentage discount if paired with nearby route
  truckConstraintPenalty: number; // percentage penalty if additional trucks needed
  volumeDiscount: number; // percentage discount for volume
  streamComplexityMultiplier: number; // multiplier for multiple streams
}

const PRICING_TIERS: PricingTier[] = [
  { minHomes: 1, maxHomes: 50, basePrice: 32.50, description: 'Small community' },
  { minHomes: 51, maxHomes: 100, basePrice: 29.50, description: 'Medium community' },
  { minHomes: 101, maxHomes: 200, basePrice: 27.50, description: 'Large community' },
  { minHomes: 201, maxHomes: 500, basePrice: 25.50, description: 'Very large community' },
  { minHomes: 501, maxHomes: Infinity, basePrice: 23.50, description: 'Enterprise community' }
];

/**
 * Calculate tiered pricing with modifiers
 */
export function calculateTieredPricing(
  profile: ServiceProfile,
  fleetAnalysis: FleetAnalysisResult,
  hasNearbyRoute: boolean = false,
  similarCustomerInsights?: ReturnType<typeof generatePricingInsights>
): {
  basePrice: number;
  modifiers: PricingModifiers;
  finalPrice: number;
  breakdown: string[];
  monthlyRevenue: number;
} {
  // Find appropriate pricing tier
  const tier = PRICING_TIERS.find(t => 
    profile.homes >= t.minHomes && profile.homes <= t.maxHomes
  ) || PRICING_TIERS[PRICING_TIERS.length - 1];
  
  let basePrice = tier.basePrice;
  
  // Use similar customer insights if available and confident
  if (similarCustomerInsights && similarCustomerInsights.confidence === 'high') {
    basePrice = (basePrice + similarCustomerInsights.suggestedPricePerHome) / 2;
  }
  
  // Calculate modifiers
  const modifiers: PricingModifiers = {
    routePairingDiscount: hasNearbyRoute ? 8 : 0, // 8% discount for route pairing
    truckConstraintPenalty: fleetAnalysis.additionalTrucksNeeded > 0 ? 15 : 0, // 15% penalty for additional trucks
    volumeDiscount: profile.homes > 200 ? 5 : 0, // 5% volume discount for 200+ homes
    streamComplexityMultiplier: profile.streams.length > 2 ? 1.1 : 1.0 // 10% increase for complex service
  };
  
  // Apply modifiers
  let finalPrice = basePrice;
  finalPrice *= modifiers.streamComplexityMultiplier;
  finalPrice *= (1 - modifiers.volumeDiscount / 100);
  finalPrice *= (1 - modifiers.routePairingDiscount / 100);
  finalPrice *= (1 + modifiers.truckConstraintPenalty / 100);
  
  // Generate breakdown
  const breakdown: string[] = [
    `Base price (${tier.description}): $${basePrice.toFixed(2)}`
  ];
  
  if (modifiers.streamComplexityMultiplier > 1) {
    breakdown.push(`Multi-stream complexity: +${((modifiers.streamComplexityMultiplier - 1) * 100).toFixed(0)}%`);
  }
  
  if (modifiers.volumeDiscount > 0) {
    breakdown.push(`Volume discount: -${modifiers.volumeDiscount}%`);
  }
  
  if (modifiers.routePairingDiscount > 0) {
    breakdown.push(`Route pairing discount: -${modifiers.routePairingDiscount}%`);
  }
  
  if (modifiers.truckConstraintPenalty > 0) {
    breakdown.push(`Additional truck penalty: +${modifiers.truckConstraintPenalty}%`);
  }
  
  const monthlyRevenue = finalPrice * profile.homes;
  
  return {
    basePrice,
    modifiers,
    finalPrice,
    breakdown,
    monthlyRevenue
  };
} 