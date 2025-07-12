/**
 * Smart Pricing Engine for RFP Analysis - Unit-Based Dynamic Pricing Model
 * Uses unit type to determine base pricing with optional add-ons
 */

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

  // Handle mixed residential or determine unit breakdown
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

  // Benchmark validation
  const benchmarkValidation = validateAgainstBenchmarks(unitTypePricing, profile);

  // Determine confidence
  const confidence = determineConfidence(profile, benchmarkValidation, riskFlags);

  // Add warnings for high-risk scenarios
  if (profile.isWalkout && !profile.specialRequirements.some(req => 
    req.toLowerCase().includes('walk-out') || 
    req.toLowerCase().includes('walkout') || 
    req.toLowerCase().includes('backdoor')
  )) {
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
 * Determine unit breakdown from profile
 */
function determineUnitBreakdown(profile: ServiceProfile): Record<string, number> {
  const breakdown: Record<string, number> = {
    'Single Family Homes': 0,
    'Townhomes': 0,
    'Condos': 0
  };

  if (profile.unitBreakdown) {
    breakdown['Single Family Homes'] = profile.unitBreakdown.singleFamily || 0;
    breakdown['Townhomes'] = profile.unitBreakdown.townhomes || 0;
    breakdown['Condos'] = profile.unitBreakdown.condos || 0;
  } else {
    // Default to profile unit type
    const unitType = profile.unitType === 'Unknown' ? 'Single Family Homes' : profile.unitType;
    if (unitType === 'Mixed Residential') {
      // For mixed residential, assume 70% SFH, 30% townhomes
      breakdown['Single Family Homes'] = Math.floor(profile.homes * 0.7);
      breakdown['Townhomes'] = profile.homes - breakdown['Single Family Homes'];
    } else {
      breakdown[unitType] = profile.homes;
    }
  }

  return breakdown;
}

/**
 * Calculate pricing for a specific unit type
 */
function calculateUnitTypePricing(
  unitType: UnitType,
  unitCount: number,
  profile: ServiceProfile,
  config: PricingEngineConfig
): UnitTypePricing {
  let basePrice = 0;
  const riskFlags: string[] = [];

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
      const containersNeeded = Math.ceil(unitCount / UNIT_PRICING.condoContainersPerUnit);
      const trashCost = containersNeeded * UNIT_PRICING.condo.trash;
      const recyclingCost = containersNeeded * UNIT_PRICING.condo.recycling;
      basePrice = (trashCost + recyclingCost) / unitCount; // Per unit price
      riskFlags.push(`Condo pricing: ${containersNeeded} containers for ${unitCount} units`);
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

  // Check for rear alley access or special oversight (risk flag only)
  const specialReqs = profile.specialRequirements.join(' ').toLowerCase();
  if (specialReqs.includes('rear alley') || specialReqs.includes('alley access')) {
    riskFlags.push('⚠️ Rear alley access required - operational complexity');
  }
  if (specialReqs.includes('zero tolerance') || specialReqs.includes('oversight')) {
    riskFlags.push('⚠️ High service expectations - strict oversight required');
  }

  const finalPricePerUnit = basePrice + walkoutPremium + gatedPremium + specialContainerPremium;
  const monthlyRevenue = finalPricePerUnit * unitCount;

  return {
    unitType,
    unitCount,
    basePrice,
    walkoutPremium,
    gatedPremium,
    specialContainerPremium,
    finalPricePerUnit,
    monthlyRevenue,
    riskFlags
  };
}

/**
 * Validate pricing against benchmarks
 */
function validateAgainstBenchmarks(
  unitTypePricing: UnitTypePricing[],
  profile: ServiceProfile
): PricingBreakdown['benchmarkValidation'] {
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

  return {
    isWithinBenchmark,
    benchmarkPrice: primaryBenchmark,
    variancePercent: averageVariance,
    validationMessage
  };
}

/**
 * Determine confidence level
 */
function determineConfidence(
  profile: ServiceProfile,
  benchmarkValidation: PricingBreakdown['benchmarkValidation'],
  riskFlags: string[]
): 'high' | 'medium' | 'low' {
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
    const explicitMentions = profile.specialRequirements.join(' ').toLowerCase();
    if (profile.isWalkout && !explicitMentions.includes('walk') && !explicitMentions.includes('backdoor')) {
      confidenceScore -= 15;
    }
    if (profile.isGated && !explicitMentions.includes('gate')) {
      confidenceScore -= 10;
    }
  }

  if (confidenceScore >= 80) return 'high';
  if (confidenceScore >= 60) return 'medium';
  return 'low';
}

/**
 * Calculate operational costs based on service profile and location data
 */
export function calculateOperationalCosts(
  profile: ServiceProfile,
  timeeroData?: any,
  customerData?: any[]
): OperationalCosts {
  // Step 1: Estimate drive time and distance
  const { driveTimeMinutes, distanceMiles } = estimateRouteMetrics(profile.location, customerData);
  
  // Step 2: Calculate service time
  const serviceTimeMinutes = profile.homes * COST_PARAMETERS.service_time_per_home;
  
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
  
  // Step 5: Calculate disposal fees
  const dumpFeesPerMonth = calculateDisposalFees(profile);
  
  const totalMonthlyCost = monthlyLaborCost + monthlyFuelCost + dumpFeesPerMonth + COST_PARAMETERS.equipment_lease_monthly;
  const costPerHome = totalMonthlyCost / profile.homes;
  
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
 * Calculate disposal fees based on waste generation
 */
function calculateDisposalFees(profile: ServiceProfile): number {
  const trashTons = profile.homes * COST_PARAMETERS.waste_generation.trash_tons_per_home_monthly;
  const trashCost = trashTons * COST_PARAMETERS.disposal_rates.trash_per_ton;
  
  let recyclingRevenue = 0;
  if (profile.recyclingRequired) {
    const recyclingTons = profile.homes * COST_PARAMETERS.waste_generation.recycling_tons_per_home_monthly;
    recyclingRevenue = recyclingTons * COST_PARAMETERS.disposal_rates.recycling_revenue_per_ton; // Negative = revenue
  }
  
  let yardWasteCost = 0;
  if (profile.yardWasteRequired) {
    const yardWasteTons = profile.homes * COST_PARAMETERS.waste_generation.yard_waste_tons_per_home_monthly;
    yardWasteCost = yardWasteTons * COST_PARAMETERS.disposal_rates.yard_waste_per_ton;
  }
  
  return trashCost + recyclingRevenue + yardWasteCost;
}

/**
 * Estimate route metrics using customer data and location heuristics
 */
function estimateRouteMetrics(location: string, customerData?: any[]): { driveTimeMinutes: number; distanceMiles: number } {
  // Default estimates
  let driveTimeMinutes = 25;
  let distanceMiles = 15;
  
  // Use customer data to find nearby routes
  if (customerData && customerData.length > 0) {
    const locationLower = location.toLowerCase();
    const nearbyCustomers = customerData.filter(customer => {
      const customerLocation = customer.address?.toLowerCase() || '';
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
  
  return { driveTimeMinutes, distanceMiles };
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
  if (pricing.addOnsApplied.walkout && !profile.specialRequirements.some(req => req.toLowerCase().includes('walk'))) {
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
  if (!serviceProfile.specialRequirements.some(req => req.toLowerCase().includes('fuel'))) {
    pricingConstraints.push('noFuelSurcharge');
  }
  if (pricing.benchmarkValidation.isWithinBenchmark) {
    pricingConstraints.push('fixedRate');
  }
  if (!pricing.addOnsApplied.walkout && !pricing.addOnsApplied.gated && !pricing.addOnsApplied.specialContainers) {
    pricingConstraints.push('noAddOns');
  }

  let summary = `### 📊 Strategic Analysis Summary: ${recommendationLevel}

#### 🎯 Executive Overview
- **Community**: ${communityName}
- **Unit Count**: ${unitCount.toLocaleString()} ${unitType}s
- **Pricing Strategy**: $${basePrice.toFixed(2)}/unit/month
- **Total Monthly Revenue**: $${totalRevenue.toLocaleString()}
- **Total Monthly Cost**: $${totalCost.toLocaleString()}
- **Net Monthly Profit**: ${netProfit >= 0 ? '$' + netProfit.toLocaleString() : '-$' + Math.abs(netProfit).toLocaleString()}
- **Profit Margin**: ${finalMargin.toFixed(1)}% (${profitabilityAssessment})

---

### ${finalMargin > 15 ? '✅' : finalMargin > 0 ? '⚠️' : '❌'} Profitability Analysis

#### ${finalMargin > 20 ? '🎯 Strong Financial Performance' : finalMargin > 10 ? '💡 Moderate Financial Performance' : '🚨 Challenging Financial Performance'}

${finalMargin > 20 ? 
  `> 🟢 **Excellent Opportunity**: This proposal delivers a healthy ${finalMargin.toFixed(1)}% margin, exceeding our 15% target by ${(finalMargin - 15).toFixed(1)} percentage points.

**Value Drivers:**
- Strong revenue generation of $${totalRevenue.toLocaleString()}/month
- Efficient cost structure at $${(totalCost / unitCount).toFixed(2)}/unit
- ${finalMargin > 25 ? 'Premium pricing successfully achieved' : 'Competitive pricing with good margins'}
- ${proximityScore === 'close' ? 'Excellent route efficiency' : 'Acceptable operational logistics'}` :

finalMargin > 10 ? 
  `> 🟡 **Moderate Opportunity**: This proposal generates a ${finalMargin.toFixed(1)}% margin, ${finalMargin > 15 ? 'meeting' : 'below'} our 15% target by ${Math.abs(finalMargin - 15).toFixed(1)} percentage points.

**Performance Factors:**
- Monthly revenue of $${totalRevenue.toLocaleString()} provides ${finalMargin > 15 ? 'adequate' : 'limited'} profit buffer
- Cost efficiency at $${(totalCost / unitCount).toFixed(2)}/unit is ${totalCost / totalRevenue < 0.8 ? 'competitive' : 'concerning'}
- ${finalMargin > 15 ? 'Pricing strategy is effective' : 'Pricing constraints limit profitability'}
- ${proximityScore === 'close' ? 'Good route synergy' : proximityScore === 'moderate' ? 'Moderate routing impact' : 'High routing burden'}` :

  `> 🔴 **High-Risk Opportunity**: This proposal operates at ${finalMargin < 0 ? 'a loss' : 'minimal profitability'} with ${finalMargin.toFixed(1)}% margin, falling ${(15 - finalMargin).toFixed(1)} percentage points below our 15% target.

**Risk Factors:**
- ${finalMargin < 0 ? `Monthly loss of $${Math.abs(netProfit).toLocaleString()}` : `Minimal monthly profit of $${netProfit.toLocaleString()}`}
- High cost burden at $${(totalCost / unitCount).toFixed(2)}/unit (${((totalCost / totalRevenue) * 100).toFixed(1)}% of revenue)
- ${pricingConstraints.length > 0 ? 'Pricing constraints prevent necessary adjustments' : 'Limited pricing flexibility'}
- ${proximityScore === 'far' ? 'Significant routing inefficiencies' : 'Operational challenges'}`
}

#### 💰 Detailed Cost Analysis
| Cost Category | Monthly Amount | Per Unit | % of Revenue | Assessment |
|---------------|----------------|----------|--------------|------------|
| **Labor Costs** | $${laborCosts.toLocaleString()} | $${(laborCosts / unitCount).toFixed(2)} | ${(laborCosts / totalRevenue * 100).toFixed(1)}% | ${laborCosts / totalRevenue < 0.4 ? '✅ Efficient' : laborCosts / totalRevenue < 0.5 ? '⚠️ Moderate' : '❌ High'} |
| **Fuel & Transport** | $${fuelCosts.toLocaleString()} | $${(fuelCosts / unitCount).toFixed(2)} | ${(fuelCosts / totalRevenue * 100).toFixed(1)}% | ${proximityScore === 'close' ? '✅ Efficient' : proximityScore === 'moderate' ? '⚠️ Moderate' : '❌ High'} |
| **Equipment & Maintenance** | $${maintenanceCosts.toLocaleString()} | $${(maintenanceCosts / unitCount).toFixed(2)} | ${(maintenanceCosts / totalRevenue * 100).toFixed(1)}% | ${maintenanceCosts / totalRevenue < 0.1 ? '✅ Efficient' : '⚠️ Standard'} |
| **Disposal Fees** | $${disposalFees.toLocaleString()} | $${(disposalFees / unitCount).toFixed(2)} | ${(disposalFees / totalRevenue * 100).toFixed(1)}% | ${disposalFees / totalRevenue < 0.2 ? '✅ Competitive' : disposalFees / totalRevenue < 0.3 ? '⚠️ Elevated' : '❌ High'} |
| **Total Operating Cost** | **$${totalCost.toLocaleString()}** | **$${(totalCost / unitCount).toFixed(2)}** | **${(totalCost / totalRevenue * 100).toFixed(1)}%** | **${totalCost / totalRevenue < 0.75 ? '✅ Efficient' : totalCost / totalRevenue < 0.85 ? '⚠️ Acceptable' : '❌ Concerning'}** |

#### 📈 Market Position & Benchmarking
| Metric | Our Position | Market Benchmark | Variance | Assessment |
|--------|-------------|------------------|----------|------------|
| **Unit Pricing** | $${basePrice.toFixed(2)} | $${benchmarkPrice.toFixed(2)} | ${((basePrice / benchmarkPrice - 1) * 100).toFixed(1)}% | ${pricing.benchmarkValidation.isWithinBenchmark ? '✅ Competitive' : basePrice > benchmarkPrice * 1.1 ? '⚠️ Premium' : '❌ Below Market'} |
| **Profit Margin** | ${finalMargin.toFixed(1)}% | 15.0% (Target) | ${(finalMargin - 15).toFixed(1)}% | ${finalMargin > 20 ? '✅ Excellent' : finalMargin > 15 ? '✅ On Target' : finalMargin > 10 ? '⚠️ Below Target' : '❌ Poor'} |
| **Cost Efficiency** | $${(totalCost / unitCount).toFixed(2)}/unit | $${(benchmarkPrice * 0.8).toFixed(2)}/unit | ${(((totalCost / unitCount) / (benchmarkPrice * 0.8) - 1) * 100).toFixed(1)}% | ${(totalCost / unitCount) < (benchmarkPrice * 0.8) ? '✅ Efficient' : (totalCost / unitCount) < (benchmarkPrice * 0.9) ? '⚠️ Competitive' : '❌ High'} |

#### 🎯 Strategic Fit Assessment

**Route Integration:** ${proximityScore === 'close' ? '✅ Excellent' : proximityScore === 'moderate' ? '⚠️ Moderate' : '❌ Poor'}
- Drive time: ${operationalCosts.driveTimeMinutes} minutes (${proximityScore} proximity)
- ${proximityScore === 'close' ? 'Synergizes well with existing routes' : proximityScore === 'moderate' ? 'Manageable addition to route network' : 'Requires dedicated routing resources'}

**Service Complexity:** ${serviceProfile.specialRequirements.length < 3 ? '✅ Standard' : serviceProfile.specialRequirements.length < 5 ? '⚠️ Moderate' : '❌ Complex'}
- ${pricing.addOnsApplied.walkout ? '• Walk-out service required' : ''}
- ${pricing.addOnsApplied.gated ? '• Gated community access' : ''}
- ${pricing.addOnsApplied.specialContainers ? '• Special container requirements' : ''}
- ${serviceProfile.recyclingRequired ? '• Recycling service included' : ''}
- ${serviceProfile.yardWasteRequired ? '• Yard waste service included' : ''}

**Contract Constraints:** ${pricingConstraints.length === 0 ? '✅ Flexible' : pricingConstraints.length < 3 ? '⚠️ Some Limitations' : '❌ Restrictive'}
${pricingConstraints.includes('noFuelSurcharge') ? '- No fuel surcharge provisions\n' : ''}
${pricingConstraints.includes('fixedRate') ? '- Fixed unit pricing required\n' : ''}
${pricingConstraints.includes('noAddOns') ? '- Limited premium service fees\n' : ''}

---

### 🎯 Strategic Recommendation

#### ${finalMargin > 20 ? '🟢 STRONGLY RECOMMEND PURSUIT' : finalMargin > 15 ? '🟡 RECOMMEND WITH CONDITIONS' : finalMargin > 0 ? '🟠 PURSUE WITH CAUTION' : '🔴 DO NOT PURSUE'}

${finalMargin > 20 ? 
  `**Executive Summary:** This is an excellent opportunity that aligns with our growth strategy and profitability targets.

**Key Strengths:**
- Exceeds profit margin requirements by ${(finalMargin - 15).toFixed(1)} percentage points
- ${proximityScore === 'close' ? 'Excellent operational synergy with existing routes' : 'Acceptable operational integration'}
- Strong revenue potential of $${(totalRevenue * 12 / 1000).toFixed(0)}K annually
- ${pricing.benchmarkValidation.isWithinBenchmark ? 'Competitive market positioning' : 'Premium pricing successfully justified'}

**Implementation Priority:** High - Recommend immediate bid preparation and aggressive pursuit.` :

finalMargin > 15 ? 
  `**Executive Summary:** This opportunity meets our minimum profitability requirements and offers solid strategic value.

**Key Considerations:**
- Meets 15% margin threshold with ${(finalMargin - 15).toFixed(1)}% buffer
- ${proximityScore !== 'far' ? 'Acceptable operational integration' : 'Routing challenges require attention'}
- Annual revenue potential of $${(totalRevenue * 12 / 1000).toFixed(0)}K supports growth objectives
- ${pricingConstraints.length > 0 ? 'Some pricing limitations require careful bid structuring' : 'Flexible pricing structure allows optimization'}

**Implementation Priority:** Medium - Recommend structured bid with clear terms and conditions.` :

finalMargin > 0 ? 
  `**Executive Summary:** This opportunity presents significant challenges but may offer strategic value under specific conditions.

**Critical Concerns:**
- Below-target margin of ${finalMargin.toFixed(1)}% creates financial risk
- ${totalCost / totalRevenue > 0.9 ? 'High cost structure limits flexibility' : 'Moderate cost efficiency'}
- ${proximityScore === 'far' ? 'Routing inefficiencies compound profitability challenges' : 'Operational complexities increase risk'}
- Annual revenue of $${(totalRevenue * 12 / 1000).toFixed(0)}K may not justify resource allocation

**Implementation Priority:** Low - Only pursue if strategic benefits outweigh financial limitations.` :

  `**Executive Summary:** This opportunity does not meet our financial criteria and poses significant business risk.

**Critical Issues:**
- Operating at ${finalMargin.toFixed(1)}% margin results in ${finalMargin < 0 ? 'monthly losses' : 'minimal profitability'}
- High cost structure at ${(totalCost / totalRevenue * 100).toFixed(1)}% of revenue
- ${proximityScore === 'far' ? 'Poor route integration compounds losses' : 'Operational inefficiencies'}
- ${pricingConstraints.length > 0 ? 'Pricing constraints prevent corrective adjustments' : 'Limited ability to improve economics'}

**Implementation Priority:** None - Recommend declining this opportunity.`
}

${finalMargin <= 15 ? 
  `\n#### 🔧 Potential Improvement Strategies
${finalMargin > 10 ? 
    `- **Pricing Optimization:** Negotiate ${((15 / finalMargin * 100) - 100).toFixed(1)}% price increase to reach target margin
- **Cost Reduction:** Focus on ${laborCosts > fuelCosts ? 'labor efficiency' : 'routing optimization'} initiatives
- **Service Bundling:** Explore premium service add-ons to improve unit economics
- **Contract Terms:** Negotiate fuel surcharge provisions and flexible pricing clauses` :
    `- **Fundamental Restructuring:** Requires ${((totalCost / (totalRevenue * 0.85)) * 100 - 100).toFixed(1)}% cost reduction or significant pricing increase
- **Alternative Service Model:** Consider modified service approach to improve economics
- **Strategic Partnership:** Explore subcontracting or joint venture opportunities
- **Market Timing:** Consider declining and revisiting when market conditions improve`
  }` : ''
}

---

**Analysis Generated:** ${new Date().toLocaleDateString()} | **Confidence Level:** ${pricing.confidence.charAt(0).toUpperCase() + pricing.confidence.slice(1)} | **Margin Target:** 15%+

`;

  return summary;
} 