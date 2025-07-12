/**
 * Smart Pricing Engine for RFP Analysis - Unit-Based Dynamic Pricing Model
 * Uses unit type to determine base pricing with optional add-ons
 */

// Simple cache implementation for memoization
interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxAge = 5 * 60 * 1000; // 5 minutes cache expiry

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T): void {
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Cache instances for different calculation types
const unitBreakdownCache = new SimpleCache<Record<string, number>>();
const unitPricingCache = new SimpleCache<UnitTypePricing>();
const benchmarkValidationCache = new SimpleCache<PricingBreakdown['benchmarkValidation']>();
const routeMetricsCache = new SimpleCache<{ driveTimeMinutes: number; distanceMiles: number }>();
const disposalFeesCache = new SimpleCache<number>();
const confidenceCache = new SimpleCache<'high' | 'medium' | 'low'>();

// Utility function to ensure numbers are parsed correctly
function parseNumber(value: any, defaultValue: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

// Utility function to safely parse customer data
function parseCustomerData(customerData: any[]): Array<{ address: string; monthlyRevenue: number; location?: string }> {
  if (!Array.isArray(customerData)) return [];
  
  return customerData.map(customer => ({
    address: customer?.address || customer?.location || '',
    monthlyRevenue: parseNumber(customer?.monthlyRevenue || customer?.revenue),
    location: customer?.location || customer?.address || ''
  }));
}

// Utility function to create cache keys
function createCacheKey(prefix: string, ...args: any[]): string {
  return `${prefix}_${JSON.stringify(args)}`;
}

// Memoized function to parse special requirements once
function parseSpecialRequirements(specialRequirements: string[]): {
  combined: string;
  hasWalkout: boolean;
  hasGated: boolean;
  hasRearAlley: boolean;
  hasZeroTolerance: boolean;
} {
  const combined = specialRequirements.join(' ').toLowerCase();
  return {
    combined,
    hasWalkout: combined.includes('walk-out') || combined.includes('walkout') || combined.includes('backdoor') || combined.includes('walk'),
    hasGated: combined.includes('gate'),
    hasRearAlley: combined.includes('rear alley') || combined.includes('alley access'),
    hasZeroTolerance: combined.includes('zero tolerance') || combined.includes('oversight')
  };
}

export type UnitType = 'Single Family Homes' | 'Townhomes' | 'Condos' | 'Mixed Residential' | 'Unknown';

export interface ServiceProfile {
  homes: number;
  unitType: UnitType;
  unitBreakdown?: {
    singleFamily?: number;
    townhomes?: number;
    condos?: number;
  };
  trashFrequency: 'weekly' | 'twice-weekly' | 'three-times-weekly';
  recyclingRequired: boolean;
  yardWasteRequired: boolean;
  isWalkout: boolean;
  isGated: boolean;
  hasSpecialContainers: boolean;
  location: string;
  specialRequirements: string[];
  containerRequirements?: {
    trashSize?: number;
    recyclingSize?: number;
    condoContainers?: number; // Number of containers for condos
  };
}

export interface OperationalCosts {
  driveTimeMinutes: number;
  serviceTimeMinutes: number;
  fuelCostPerTrip: number;
  laborCostPerHour: number;
  dumpFeesPerMonth: number;
  equipmentCostPerMonth: number;
  totalMonthlyCost: number;
  costPerHome: number;
}

export interface UnitTypePricing {
  unitType: UnitType;
  unitCount: number;
  basePrice: number;
  walkoutPremium: number;
  gatedPremium: number;
  specialContainerPremium: number;
  finalPricePerUnit: number;
  monthlyRevenue: number;
  riskFlags: string[];
}

export interface PricingBreakdown {
  unitTypePricing: UnitTypePricing[];
  totalMonthlyRevenue: number;
  averagePricePerUnit: number;
  addOnsApplied: {
    walkout: boolean;
    gated: boolean;
    specialContainers: boolean;
  };
  marginPercent: number;
  benchmarkValidation: {
    isWithinBenchmark: boolean;
    benchmarkPrice: number;
    variancePercent: number;
    validationMessage: string;
  };
  confidence: 'high' | 'medium' | 'low';
  riskFlags: string[];
  warnings: string[];
}

export interface PricingEngineConfig {
  targetMargin: number; // Default: 0.35 (35%)
  maxMargin: number; // Default: 0.45 (45%)
  benchmarkTolerance: number; // Default: 0.10 (10%)
  placeholderCostPerUnit: number; // Default: 25.00 (placeholder cost)
}

// Unit-Based Pricing Anchors
const UNIT_PRICING = {
  singleFamilyHome: 37.03,
  townhome: 21.31,
  condo: {
    trash: 75.00, // per 96-gallon container
    recycling: 57.04 // per 96-gallon container
  },
  condoContainersPerUnit: 8 // 1 container per 8 units (default)
};

// Add-On Pricing
const ADD_ON_PRICING = {
  walkoutPremiumPercent: 0.33, // 33% premium
  gatedAccessSurcharge: 1.50, // $1.50 per unit
  specialContainerSurcharge: 1.00 // $1.00 per unit
};

// Benchmark references for validation
const BENCHMARKS = {
  singleFamilyHome: 37.03,
  townhome: 21.31,
  tolerance: 0.10 // ±10%
};

// Operational cost parameters (still needed for cost calculations)
const COST_PARAMETERS = {
  labor_rate_per_hour: 45, // Driver + helper
  fuel_cost_per_mile: 0.80,
  maintenance_per_mile: 0.12,
  service_time_per_home: 2.5, // minutes
  equipment_lease_monthly: 850,
  disposal_rates: {
    trash_per_ton: 72,
    recycling_revenue_per_ton: -15, // Revenue
    yard_waste_per_ton: 45
  },
  waste_generation: {
    trash_tons_per_home_monthly: 0.12,
    recycling_tons_per_home_monthly: 0.05,
    yard_waste_tons_per_home_monthly: 0.08
  }
};

/**
 * Main unit-based pricing engine
 */
export function generateUnitBasedPricing(
  profile: ServiceProfile,
  operationalCosts: OperationalCosts,
  config: PricingEngineConfig = {
    targetMargin: 0.35,
    maxMargin: 0.45,
    benchmarkTolerance: 0.10,
    placeholderCostPerUnit: 25.00
  }
): PricingBreakdown {
  const unitTypePricing: UnitTypePricing[] = [];
  let totalMonthlyRevenue = 0;
  let totalUnits = 0;
  const riskFlags: string[] = [];
  const warnings: string[] = [];

  // Handle mixed residential or determine unit breakdown (memoized)
  const unitBreakdown = determineUnitBreakdown(profile);

  // Calculate pricing for each unit type
  for (const [unitType, count] of Object.entries(unitBreakdown)) {
    if (count > 0) {
      const unitPricing = calculateUnitTypePricing(
        unitType as UnitType,
        count,
        profile,
        config
      );
      
      unitTypePricing.push(unitPricing);
      totalMonthlyRevenue += unitPricing.monthlyRevenue;
      totalUnits += count;
      riskFlags.push(...unitPricing.riskFlags);
    }
  }

  // Calculate overall metrics
  const averagePricePerUnit = totalUnits > 0 ? totalMonthlyRevenue / totalUnits : 0;
  const totalCost = totalUnits * config.placeholderCostPerUnit;
  const marginPercent = totalMonthlyRevenue > 0 ? (totalMonthlyRevenue - totalCost) / totalMonthlyRevenue : 0;

  // Benchmark validation (memoized)
  const benchmarkValidation = validateAgainstBenchmarks(unitTypePricing, profile);

  // Determine confidence (memoized)
  const confidence = determineConfidence(profile, benchmarkValidation, riskFlags);

  // Parse special requirements once for warnings
  const specialReqs = parseSpecialRequirements(profile.specialRequirements);

  // Add warnings for high-risk scenarios
  if (profile.isWalkout && !specialReqs.hasWalkout) {
    warnings.push('Walk-out service detected but not explicitly mentioned in requirements');
  }

  if (benchmarkValidation.variancePercent > 10) {
    warnings.push(`Pricing exceeds market benchmark by ${benchmarkValidation.variancePercent.toFixed(1)}%`);
  }

  return {
    unitTypePricing,
    totalMonthlyRevenue,
    averagePricePerUnit,
    addOnsApplied: {
      walkout: profile.isWalkout,
      gated: profile.isGated,
      specialContainers: profile.hasSpecialContainers
    },
    marginPercent,
    benchmarkValidation,
    confidence,
    riskFlags: [...new Set(riskFlags)], // Remove duplicates
    warnings
  };
}

/**
 * Determine unit breakdown from profile (memoized)
 */
function determineUnitBreakdown(profile: ServiceProfile): Record<string, number> {
  const cacheKey = createCacheKey('unitBreakdown', profile.unitType, profile.homes, profile.unitBreakdown);
  const cached = unitBreakdownCache.get(cacheKey);
  if (cached) return cached;

  const breakdown: Record<string, number> = {
    'Single Family Homes': 0,
    'Townhomes': 0,
    'Condos': 0
  };

  if (profile.unitBreakdown) {
    breakdown['Single Family Homes'] = parseNumber(profile.unitBreakdown.singleFamily, 0);
    breakdown['Townhomes'] = parseNumber(profile.unitBreakdown.townhomes, 0);
    breakdown['Condos'] = parseNumber(profile.unitBreakdown.condos, 0);
  } else {
    // Default to profile unit type
    const unitType = profile.unitType === 'Unknown' ? 'Single Family Homes' : profile.unitType;
    if (unitType === 'Mixed Residential') {
      // For mixed residential, assume 70% SFH, 30% townhomes
      breakdown['Single Family Homes'] = Math.floor(parseNumber(profile.homes) * 0.7);
      breakdown['Townhomes'] = parseNumber(profile.homes) - breakdown['Single Family Homes'];
    } else {
      breakdown[unitType] = parseNumber(profile.homes);
    }
  }

  unitBreakdownCache.set(cacheKey, breakdown);
  return breakdown;
}

/**
 * Calculate pricing for a specific unit type (memoized)
 */
function calculateUnitTypePricing(
  unitType: UnitType,
  unitCount: number,
  profile: ServiceProfile,
  config: PricingEngineConfig
): UnitTypePricing {
  const cacheKey = createCacheKey('unitPricing', unitType, unitCount, profile.isWalkout, profile.isGated, profile.hasSpecialContainers, profile.specialRequirements);
  const cached = unitPricingCache.get(cacheKey);
  if (cached) return cached;

  let basePrice = 0;
  const riskFlags: string[] = [];
  const parsedUnitCount = parseNumber(unitCount);

  // Determine base price by unit type
  switch (unitType) {
    case 'Single Family Homes':
      basePrice = UNIT_PRICING.singleFamilyHome;
      break;
    case 'Townhomes':
      basePrice = UNIT_PRICING.townhome;
      break;
    case 'Condos':
      // For condos, calculate based on containers needed
      const containersNeeded = Math.ceil(parsedUnitCount / UNIT_PRICING.condoContainersPerUnit);
      const trashCost = containersNeeded * UNIT_PRICING.condo.trash;
      const recyclingCost = containersNeeded * UNIT_PRICING.condo.recycling;
      basePrice = (trashCost + recyclingCost) / parsedUnitCount; // Per unit price
      riskFlags.push(`Condo pricing: ${containersNeeded} containers for ${parsedUnitCount} units`);
      break;
    default:
      basePrice = UNIT_PRICING.singleFamilyHome; // Default to SFH
      riskFlags.push('Unknown unit type - defaulted to Single Family Home pricing');
  }

  // Calculate add-on premiums
  let walkoutPremium = 0;
  let gatedPremium = 0;
  let specialContainerPremium = 0;

  // Walk-out premium (33% of base price)
  if (profile.isWalkout) {
    walkoutPremium = basePrice * ADD_ON_PRICING.walkoutPremiumPercent;
    riskFlags.push('Walk-out service premium applied (+33%)');
  }

  // Gated access premium
  if (profile.isGated) {
    gatedPremium = ADD_ON_PRICING.gatedAccessSurcharge;
    riskFlags.push('Gated community access coordination required');
  }

  // Special container premium
  if (profile.hasSpecialContainers) {
    specialContainerPremium = ADD_ON_PRICING.specialContainerSurcharge;
    riskFlags.push('Special container requirements detected');
  }

  // Parse special requirements once for efficiency
  const specialReqs = parseSpecialRequirements(profile.specialRequirements);

  // Check for rear alley access or special oversight (risk flag only)
  if (specialReqs.hasRearAlley) {
    riskFlags.push('⚠️ Rear alley access required - operational complexity');
  }
  if (specialReqs.hasZeroTolerance) {
    riskFlags.push('⚠️ High service expectations - strict oversight required');
  }

  const finalPricePerUnit = basePrice + walkoutPremium + gatedPremium + specialContainerPremium;
  const monthlyRevenue = finalPricePerUnit * parsedUnitCount;

  const result: UnitTypePricing = {
    unitType,
    unitCount: parsedUnitCount,
    basePrice,
    walkoutPremium,
    gatedPremium,
    specialContainerPremium,
    finalPricePerUnit,
    monthlyRevenue,
    riskFlags
  };

  unitPricingCache.set(cacheKey, result);
  return result;
}

/**
 * Validate pricing against benchmarks (memoized)
 */
function validateAgainstBenchmarks(
  unitTypePricing: UnitTypePricing[],
  profile: ServiceProfile
): PricingBreakdown['benchmarkValidation'] {
  const cacheKey = createCacheKey('benchmarkValidation', unitTypePricing.map(u => ({ type: u.unitType, count: u.unitCount, price: u.finalPricePerUnit })));
  const cached = benchmarkValidationCache.get(cacheKey);
  if (cached) return cached;

  let totalVariance = 0;
  let totalWeight = 0;
  let isWithinBenchmark = true;
  const messages: string[] = [];

  for (const unitPricing of unitTypePricing) {
    let benchmarkPrice = 0;
    
    switch (unitPricing.unitType) {
      case 'Single Family Homes':
        benchmarkPrice = BENCHMARKS.singleFamilyHome;
        break;
      case 'Townhomes':
        benchmarkPrice = BENCHMARKS.townhome;
        break;
      case 'Condos':
        // For condos, use a different validation approach
        benchmarkPrice = unitPricing.basePrice; // Use calculated base as benchmark
        break;
      default:
        benchmarkPrice = BENCHMARKS.singleFamilyHome;
    }

    const variance = ((unitPricing.finalPricePerUnit - benchmarkPrice) / benchmarkPrice) * 100;
    const weight = unitPricing.unitCount;
    
    totalVariance += variance * weight;
    totalWeight += weight;

    if (Math.abs(variance) > BENCHMARKS.tolerance * 100) {
      isWithinBenchmark = false;
      messages.push(`${unitPricing.unitType}: ${variance > 0 ? '+' : ''}${variance.toFixed(1)}% vs benchmark`);
    }
  }

  const averageVariance = totalWeight > 0 ? totalVariance / totalWeight : 0;
  const primaryBenchmark = unitTypePricing.length > 0 ? 
    (unitTypePricing[0].unitType === 'Single Family Homes' ? BENCHMARKS.singleFamilyHome : BENCHMARKS.townhome) : 
    BENCHMARKS.singleFamilyHome;

  let validationMessage = '';
  if (isWithinBenchmark) {
    validationMessage = '✅ Pricing within market benchmark range (±10%)';
  } else if (averageVariance > 10) {
    validationMessage = `⚠️ Exceeds Market Benchmark by ${averageVariance.toFixed(1)}%`;
  } else {
    validationMessage = `⚠️ Below Market Benchmark by ${Math.abs(averageVariance).toFixed(1)}%`;
  }

  if (messages.length > 0) {
    validationMessage += ` - ${messages.join(', ')}`;
  }

  const result = {
    isWithinBenchmark,
    benchmarkPrice: primaryBenchmark,
    variancePercent: averageVariance,
    validationMessage
  };

  benchmarkValidationCache.set(cacheKey, result);
  return result;
}

/**
 * Determine confidence level (memoized)
 */
function determineConfidence(
  profile: ServiceProfile,
  benchmarkValidation: PricingBreakdown['benchmarkValidation'],
  riskFlags: string[]
): 'high' | 'medium' | 'low' {
  const cacheKey = createCacheKey('confidence', profile.unitType, profile.isWalkout, profile.isGated, profile.hasSpecialContainers, profile.specialRequirements, benchmarkValidation.variancePercent, riskFlags.length);
  const cached = confidenceCache.get(cacheKey);
  if (cached) return cached;

  let confidenceScore = 100;

  // Reduce confidence for unknown unit types
  if (profile.unitType === 'Unknown') confidenceScore -= 20;

  // Reduce confidence for mixed residential without breakdown
  if (profile.unitType === 'Mixed Residential' && !profile.unitBreakdown) confidenceScore -= 15;

  // Reduce confidence for high benchmark variance
  if (Math.abs(benchmarkValidation.variancePercent) > 15) confidenceScore -= 25;
  else if (Math.abs(benchmarkValidation.variancePercent) > 10) confidenceScore -= 10;

  // Reduce confidence for multiple risk flags
  if (riskFlags.length > 3) confidenceScore -= 20;
  else if (riskFlags.length > 1) confidenceScore -= 10;

  // Reduce confidence if add-ons applied without clear requirements
  if (profile.isWalkout || profile.isGated || profile.hasSpecialContainers) {
    const specialReqs = parseSpecialRequirements(profile.specialRequirements);
    if (profile.isWalkout && !specialReqs.hasWalkout) {
      confidenceScore -= 15;
    }
    if (profile.isGated && !specialReqs.hasGated) {
      confidenceScore -= 10;
    }
  }

  let result: 'high' | 'medium' | 'low';
  if (confidenceScore >= 80) result = 'high';
  else if (confidenceScore >= 60) result = 'medium';
  else result = 'low';

  confidenceCache.set(cacheKey, result);
  return result;
}

/**
 * Calculate operational costs based on service profile and location data
 */
export function calculateOperationalCosts(
  profile: ServiceProfile,
  timeeroData?: any,
  customerData?: any[]
): OperationalCosts {
  // Step 1: Estimate drive time and distance (memoized)
  const { driveTimeMinutes, distanceMiles } = estimateRouteMetrics(profile.location, customerData);
  
  // Step 2: Calculate service time
  const serviceTimeMinutes = parseNumber(profile.homes) * COST_PARAMETERS.service_time_per_home;
  
  // Step 3: Determine pickup frequency
  let pickupsPerMonth = 4.33; // Weekly base
  if (profile.trashFrequency === 'twice-weekly') pickupsPerMonth *= 2;
  if (profile.trashFrequency === 'three-times-weekly') pickupsPerMonth *= 3;
  
  // Add recycling and yard waste pickups
  if (profile.recyclingRequired) pickupsPerMonth += 4.33; // Weekly recycling
  if (profile.yardWasteRequired) pickupsPerMonth += 4.33 * 0.75; // Seasonal (75% of year)
  
  // Step 4: Calculate costs
  const totalTimePerTrip = (driveTimeMinutes + serviceTimeMinutes) / 60; // Convert to hours
  const laborCostPerTrip = totalTimePerTrip * COST_PARAMETERS.labor_rate_per_hour;
  const fuelCostPerTrip = distanceMiles * (COST_PARAMETERS.fuel_cost_per_mile + COST_PARAMETERS.maintenance_per_mile);
  
  const monthlyLaborCost = laborCostPerTrip * pickupsPerMonth;
  const monthlyFuelCost = fuelCostPerTrip * pickupsPerMonth;
  
  // Step 5: Calculate disposal fees (memoized)
  const dumpFeesPerMonth = calculateDisposalFees(profile);
  
  const totalMonthlyCost = monthlyLaborCost + monthlyFuelCost + dumpFeesPerMonth + COST_PARAMETERS.equipment_lease_monthly;
  const costPerHome = totalMonthlyCost / parseNumber(profile.homes);
  
  return {
    driveTimeMinutes,
    serviceTimeMinutes,
    fuelCostPerTrip,
    laborCostPerHour: COST_PARAMETERS.labor_rate_per_hour,
    dumpFeesPerMonth,
    equipmentCostPerMonth: COST_PARAMETERS.equipment_lease_monthly,
    totalMonthlyCost,
    costPerHome
  };
}

/**
 * Calculate disposal fees based on waste generation (memoized)
 */
function calculateDisposalFees(profile: ServiceProfile): number {
  const cacheKey = createCacheKey('disposalFees', profile.homes, profile.recyclingRequired, profile.yardWasteRequired);
  const cached = disposalFeesCache.get(cacheKey);
  if (cached) return cached;

  const homes = parseNumber(profile.homes);
  const trashTons = homes * COST_PARAMETERS.waste_generation.trash_tons_per_home_monthly;
  const trashCost = trashTons * COST_PARAMETERS.disposal_rates.trash_per_ton;
  
  let recyclingRevenue = 0;
  if (profile.recyclingRequired) {
    const recyclingTons = homes * COST_PARAMETERS.waste_generation.recycling_tons_per_home_monthly;
    recyclingRevenue = recyclingTons * COST_PARAMETERS.disposal_rates.recycling_revenue_per_ton; // Negative = revenue
  }
  
  let yardWasteCost = 0;
  if (profile.yardWasteRequired) {
    const yardWasteTons = homes * COST_PARAMETERS.waste_generation.yard_waste_tons_per_home_monthly;
    yardWasteCost = yardWasteTons * COST_PARAMETERS.disposal_rates.yard_waste_per_ton;
  }
  
  const result = trashCost + recyclingRevenue + yardWasteCost;
  disposalFeesCache.set(cacheKey, result);
  return result;
}

/**
 * Estimate route metrics using customer data and location heuristics (memoized)
 */
function estimateRouteMetrics(location: string, customerData?: any[]): { driveTimeMinutes: number; distanceMiles: number } {
  const cacheKey = createCacheKey('routeMetrics', location, customerData?.length || 0);
  const cached = routeMetricsCache.get(cacheKey);
  if (cached) return cached;

  // Default estimates
  let driveTimeMinutes = 25;
  let distanceMiles = 15;
  
  // Use customer data to find nearby routes
  if (customerData && customerData.length > 0) {
    const locationLower = location.toLowerCase();
    const parsedCustomerData = parseCustomerData(customerData);
    
    const nearbyCustomers = parsedCustomerData.filter(customer => {
      const customerLocation = customer.address.toLowerCase();
      return (
        (locationLower.includes('fairfax') && customerLocation.includes('fairfax')) ||
        (locationLower.includes('vienna') && customerLocation.includes('vienna')) ||
        (locationLower.includes('mclean') && customerLocation.includes('mclean')) ||
        (locationLower.includes('arlington') && customerLocation.includes('arlington')) ||
        (locationLower.includes('oakton') && customerLocation.includes('oakton'))
      );
    });
    
    if (nearbyCustomers.length > 0) {
      driveTimeMinutes = 15; // Closer to existing routes
      distanceMiles = 8;
    }
  }
  
  const result = { driveTimeMinutes, distanceMiles };
  routeMetricsCache.set(cacheKey, result);
  return result;
}

/**
 * Main pricing engine function that orchestrates the entire process
 */
export function runSmartPricingEngine(
  profile: ServiceProfile,
  timeeroData?: any,
  customerData?: any[],
  config?: PricingEngineConfig
): { costs: OperationalCosts; pricing: PricingBreakdown } {
  console.log('🎯 Running Smart Pricing Engine...');
  
  // Step 1: Calculate operational costs
  const costs = calculateOperationalCosts(profile, timeeroData, customerData);
  console.log(`💰 Calculated costs: $${costs.costPerHome.toFixed(2)}/home`);
  
  // Step 2: Generate pricing recommendation
  const pricing = generateUnitBasedPricing(profile, costs, config);
  console.log(`📊 Suggested price: $${pricing.averagePricePerUnit.toFixed(2)}/home (${pricing.marginPercent.toFixed(1)}% margin)`);
  
  // Step 3: Validate pricing against double-counting
  const specialReqs = parseSpecialRequirements(profile.specialRequirements);
  if (pricing.addOnsApplied.walkout && !specialReqs.hasWalkout) {
    console.warn('⚠️ Warning: Walk-out service applied but not clearly specified in requirements');
  }
  
  return { costs, pricing };
}

/**
 * Export configuration for admin settings
 */
export const DEFAULT_PRICING_CONFIG: PricingEngineConfig = {
  targetMargin: 0.35, // 35% target margin
  maxMargin: 0.45, // 45% max margin
  benchmarkTolerance: 0.10, // 10% benchmark tolerance
  placeholderCostPerUnit: 25.00 // $25.00/home placeholder cost
};

/**
 * Utility function to format pricing for UI display
 */
export function formatPricingForDisplay(pricing: PricingBreakdown): {
  summary: string;
  breakdown: Array<{ label: string; value: string; type: 'base' | 'premium' | 'discount' | 'total' }>;
  confidence: string;
  warnings: string[];
  validation: string;
} {
  const breakdown = [
    ...pricing.unitTypePricing.map(unitPricing => ({
      label: unitPricing.unitType,
      value: `$${unitPricing.basePrice.toFixed(2)}`,
      type: 'base' as const
    })),
    ...(pricing.addOnsApplied.walkout ? [{ label: 'Walk-out Service Premium (+33%)', value: `+$${pricing.unitTypePricing[0].walkoutPremium.toFixed(2)}`, type: 'premium' as const }] : []),
    ...(pricing.addOnsApplied.gated ? [{ label: 'Gated Access Coordination', value: `+$${pricing.unitTypePricing[0].gatedPremium.toFixed(2)}`, type: 'premium' as const }] : []),
    ...(pricing.addOnsApplied.specialContainers ? [{ label: 'Special Container Handling', value: `+$${pricing.unitTypePricing[0].specialContainerPremium.toFixed(2)}`, type: 'premium' as const }] : []),
    { label: 'Competitive Price', value: `$${pricing.averagePricePerUnit.toFixed(2)}`, type: 'total' as const }
  ];
  
  const summary = `$${pricing.averagePricePerUnit.toFixed(2)}/home/month (${pricing.marginPercent.toFixed(1)}% margin)`;
  
  const confidenceText = pricing.confidence === 'high' ? '🟢 High Confidence - Competitive' :
                        pricing.confidence === 'medium' ? '🟡 Medium Confidence - Review' :
                        '🔴 Low Confidence - Needs Adjustment';
  
  const validationText = pricing.benchmarkValidation.isWithinBenchmark ? 
    `✔️ ${pricing.benchmarkValidation.validationMessage}` :
    `⚠️ ${pricing.benchmarkValidation.validationMessage}`;
  
  return {
    summary,
    breakdown,
    confidence: confidenceText,
    warnings: pricing.warnings,
    validation: validationText
  };
}

/**
 * Generate comprehensive strategic summary for all RFP proposals
 * Provides detailed explanation for poor, medium, and good profitability scenarios
 */
export function generateStrategicSummary(
  communityName: string,
  unitCount: number,
  unitType: UnitType,
  pricing: PricingBreakdown,
  operationalCosts: OperationalCosts,
  serviceProfile: ServiceProfile
): string {
  const basePrice = pricing.averagePricePerUnit;
  const finalMargin = pricing.marginPercent * 100; // Convert to percentage
  const totalRevenue = pricing.totalMonthlyRevenue;
  const totalCost = operationalCosts.totalMonthlyCost;
  const netProfit = totalRevenue - totalCost;
  
  // Determine strategic fit and recommendation level
  const strategicFit = finalMargin > 25 ? 'high' : finalMargin > 15 ? 'medium' : 'low';
  const recommendationLevel = finalMargin > 25 ? 'Highly Recommend' : 
                             finalMargin > 15 ? 'Recommend with Conditions' : 
                             finalMargin > 0 ? 'Pursue with Caution' : 'Do Not Pursue';

  // Determine profitability assessment
  const profitabilityAssessment = finalMargin > 25 ? 'Excellent' :
                                 finalMargin > 20 ? 'Very Good' :
                                 finalMargin > 15 ? 'Good' :
                                 finalMargin > 10 ? 'Acceptable' :
                                 finalMargin > 0 ? 'Poor' : 'Loss-Making';

  // Get cost breakdown details
  const laborCosts = operationalCosts.laborCostPerHour * operationalCosts.serviceTimeMinutes / 60 * 4.33;
  const fuelCosts = operationalCosts.fuelCostPerTrip * 4.33;
  const maintenanceCosts = operationalCosts.equipmentCostPerMonth * 0.15;
  const disposalFees = operationalCosts.dumpFeesPerMonth;

  // Determine proximity score
  const proximityScore = operationalCosts.driveTimeMinutes < 15 ? 'close' : 
                        operationalCosts.driveTimeMinutes < 30 ? 'moderate' : 'far';

  // Get benchmark price
  const benchmarkPrice = pricing.benchmarkValidation.benchmarkPrice;

  // Determine pricing constraints
  const pricingConstraints: string[] = [];
  if (pricing.benchmarkValidation.variancePercent > 10) {
    pricingConstraints.push('exceeds market benchmarks');
  }
  if (serviceProfile.isWalkout) {
    pricingConstraints.push('walk-out service premium required');
  }
  if (serviceProfile.isGated) {
    pricingConstraints.push('gated access coordination costs');
  }

  // Build comprehensive summary
  let summary = `**${communityName}** - ${parseNumber(unitCount)} ${unitType}\n\n`;
  
  summary += `**📊 FINANCIAL ANALYSIS**\n`;
  summary += `• **Monthly Revenue**: $${totalRevenue.toFixed(2)}\n`;
  summary += `• **Monthly Costs**: $${totalCost.toFixed(2)}\n`;
  summary += `• **Net Profit**: $${netProfit.toFixed(2)}\n`;
  summary += `• **Profit Margin**: ${finalMargin.toFixed(1)}%\n`;
  summary += `• **Price per Unit**: $${basePrice.toFixed(2)}\n`;
  summary += `• **Profitability**: ${profitabilityAssessment}\n\n`;
  
  summary += `**🎯 STRATEGIC RECOMMENDATION: ${recommendationLevel}**\n\n`;
  
  summary += `**🔍 OPERATIONAL ANALYSIS**\n`;
  summary += `• **Location**: ${proximityScore === 'close' ? 'Excellent' : proximityScore === 'moderate' ? 'Good' : 'Challenging'} proximity to existing routes\n`;
  summary += `• **Drive Time**: ${operationalCosts.driveTimeMinutes} minutes\n`;
  summary += `• **Service Complexity**: ${serviceProfile.isWalkout ? 'High (walk-out service)' : 'Standard'}\n`;
  summary += `• **Access Requirements**: ${serviceProfile.isGated ? 'Gated community coordination' : 'Standard access'}\n\n`;
  
  summary += `**💡 PRICING STRATEGY**\n`;
  summary += `• **Base Price**: $${pricing.unitTypePricing[0]?.basePrice.toFixed(2)} (${pricing.benchmarkValidation.isWithinBenchmark ? 'competitive' : 'premium'} vs $${benchmarkPrice.toFixed(2)} benchmark)\n`;
  if (pricing.addOnsApplied.walkout) {
    summary += `• **Walk-out Premium**: +$${pricing.unitTypePricing[0]?.walkoutPremium.toFixed(2)} (+33%)\n`;
  }
  if (pricing.addOnsApplied.gated) {
    summary += `• **Gated Access**: +$${pricing.unitTypePricing[0]?.gatedPremium.toFixed(2)}\n`;
  }
  if (pricing.addOnsApplied.specialContainers) {
    summary += `• **Special Containers**: +$${pricing.unitTypePricing[0]?.specialContainerPremium.toFixed(2)}\n`;
  }
  summary += `• **Final Price**: $${pricing.averagePricePerUnit.toFixed(2)}/unit\n\n`;
  
  if (pricing.riskFlags.length > 0) {
    summary += `**⚠️ RISK FACTORS**\n`;
    pricing.riskFlags.forEach(flag => {
      summary += `• ${flag}\n`;
    });
    summary += `\n`;
  }
  
  if (pricing.warnings.length > 0) {
    summary += `**🚨 WARNINGS**\n`;
    pricing.warnings.forEach(warning => {
      summary += `• ${warning}\n`;
    });
    summary += `\n`;
  }
  
  // Add strategic recommendations based on profitability
  summary += `**🎯 STRATEGIC INSIGHTS**\n`;
  if (finalMargin > 25) {
    summary += `• **Excellent Opportunity**: High profitability with strong competitive position\n`;
    summary += `• **Recommendation**: Pursue aggressively with competitive pricing\n`;
    summary += `• **Next Steps**: Prepare comprehensive proposal highlighting service excellence\n`;
  } else if (finalMargin > 15) {
    summary += `• **Good Opportunity**: Solid profitability with manageable risk\n`;
    summary += `• **Recommendation**: Proceed with detailed cost analysis and service plan\n`;
    summary += `• **Next Steps**: Validate service requirements and finalize pricing strategy\n`;
  } else if (finalMargin > 0) {
    summary += `• **Challenging Opportunity**: Low margins require careful management\n`;
    summary += `• **Recommendation**: Consider value-added services or pricing adjustments\n`;
    summary += `• **Next Steps**: Explore cost optimization and service efficiency improvements\n`;
  } else {
    summary += `• **High Risk**: Current pricing structure results in losses\n`;
    summary += `• **Recommendation**: Significant pricing adjustment required or decline opportunity\n`;
    summary += `• **Next Steps**: Reassess cost structure and competitive positioning\n`;
  }
  
  return summary;
}

/**
 * Clear all caches (useful for testing or when data changes significantly)
 */
export function clearPricingCaches(): void {
  unitBreakdownCache.clear();
  unitPricingCache.clear();
  benchmarkValidationCache.clear();
  routeMetricsCache.clear();
  disposalFeesCache.clear();
  confidenceCache.clear();
} 