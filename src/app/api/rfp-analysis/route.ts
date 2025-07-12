import { NextRequest, NextResponse } from 'next/server';
import { analyzeOperationalFeasibility, getFleetStatusSummary, getRoutingImpactSummary, getServiceCompatibilitySummary } from '../../../lib/fleet-analysis';
import { performEnhancedFleetAnalysis, formatServiceStreamSummary } from '../../../lib/enhanced-fleet-analysis';
import { performComprehensiveRFPAnalysis } from '../../../lib/comprehensive-rfp-analysis';
import { 
  runSmartPricingEngine, 
  ServiceProfile, 
  formatPricingForDisplay,
  DEFAULT_PRICING_CONFIG,
  type OperationalCosts,
  type PricingBreakdown,
  UnitType,
  generateUnitBasedPricing,
  calculateOperationalCosts,
  generateStrategicSummary
} from '../../../lib/smart-pricing-engine';

interface RFPData {
  communityName: string;
  location: string;
  homes: number;
  serviceType: string;
  pickupFrequency: string;
  specialRequirements: string[];
  contractLength: number;
  startDate: string;
  fuelSurchargeAllowed: boolean;
  timeWindows: string;
  recyclingRequired: boolean;
  yardWasteRequired: boolean;
}

interface AnalysisResult {
  proximityScore: 'close' | 'moderate' | 'far';
  suggestedPricePerHome: number;
  estimatedCostPerMonth: number;
  projectedGrossMargin: number;
  efficiencyPerMinute: number;
  strategicFitScore: 'low' | 'medium' | 'high';
  riskFlags: string[];
  recommendation: 'bid' | 'bid-with-conditions' | 'do-not-bid';
  calculations: {
    distanceFromDepot: number;
    distanceFromLandfill: number;
    estimatedTimePerVisit: number;
    fuelCostPerMonth: number;
    laborCostPerMonth: number;
    equipmentCostPerMonth: number;
    dumpingFees: number;
  };
  competitiveAnalysis: {
    marketRate: number;
    ourAdvantage: string[];
    risks: string[];
  };
  communityDetails: {
    name: string;
    homes: number;
    location: string;
    serviceArea: string;
  };
  operationalFeasibility: {
    fleetCapacityStatus: string;
    routingImpact: string;
    serviceCompatibility: string;
    additionalTruckCost: number;
    routingCost: number;
    totalOperationalCost: number;
    feasible: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    conditions: string[];
  };
  enhancedAnalysis: {
    serviceStreams: string;
    serviceabilityScore: number;
    fleetLoadPercentage: number;
    bidRecommendation: {
      shouldBid: boolean;
      confidence: 'high' | 'medium' | 'low';
      reasoning: string[];
      conditions: string[];
      marginAfterCosts: number;
    };
    costBreakdown: {
      laborCosts: number;
      fuelCosts: number;
      maintenanceCosts: number;
      disposalCosts: number;
      totalMonthlyCost: number;
    };
    tooltips: { [key: string]: string };
  };
  smartPricing: {
    unitTypePricing: Array<{
      unitType: UnitType;
      unitCount: number;
      basePrice: number;
      walkoutPremium: number;
      gatedPremium: number;
      specialContainerPremium: number;
      finalPricePerUnit: number;
      monthlyRevenue: number;
      riskFlags: string[];
    }>;
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
  };
  strategicSummary?: string; // Add comprehensive diagnostic report
}

// Constants
const DEPOT_COORDS = { lat: 38.923867, lng: -77.235103 }; // 8401 Westpark Dr, McLean VA
const FAIRFAX_LANDFILL = { lat: 38.85319175, lng: -77.37514310524120 };
const LORTON_LANDFILL = { lat: 38.691352122449000, lng: -77.2377658367347 };

// Helper function to calculate distance using Haversine formula
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

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
 * Check if additional trucks are needed based on fleet load
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

// Parse RFP text using AI-like logic
const parseRFPText = (rfpText: string): RFPData => {
  const lines = rfpText.toLowerCase().split('\n');
  let communityName = 'Unknown Community';
  let location = 'Unknown Location';
  let homes = 0;
  let serviceType = 'Residential Waste & Recycling';
  let pickupFrequency = 'Weekly';
  let specialRequirements: string[] = [];
  let contractLength = 12;
  let startDate = new Date().toISOString().split('T')[0];
  let fuelSurchargeAllowed = true;
  let timeWindows = 'Flexible';
  let recyclingRequired = false;
  let yardWasteRequired = false;

  // Check if this is GPT-parsed content (formatted analysis)
  const isGPTParsed = rfpText.includes('GPT Contract Analysis') || rfpText.includes('Confidence:');
  
  if (isGPTParsed) {
    // Extract from GPT-formatted analysis
    const communityMatch = rfpText.match(/COMMUNITY:\s*([^\n]+)/i);
    if (communityMatch) {
      communityName = communityMatch[1].trim();
    }
    
    const locationMatch = rfpText.match(/LOCATION:\s*([^\n]+)/i);
    if (locationMatch) {
      location = locationMatch[1].trim();
    }
    
    const unitsMatch = rfpText.match(/UNITS:\s*(\d+)/i);
    if (unitsMatch) {
      homes = parseInt(unitsMatch[1]);
    }
    
    // Extract service frequencies
    const trashMatch = rfpText.match(/Trash Collection:\s*([^\n]+)/i);
    if (trashMatch) {
      pickupFrequency = trashMatch[1].trim();
    }
    
    const recyclingMatch = rfpText.match(/Recycling Collection:\s*([^\n]+)/i);
    if (recyclingMatch && !recyclingMatch[1].toLowerCase().includes('none')) {
      recyclingRequired = true;
    }
    
    const yardMatch = rfpText.match(/Yard Waste Collection:\s*([^\n]+)/i);
    if (yardMatch && !yardMatch[1].toLowerCase().includes('none')) {
      yardWasteRequired = true;
    }
    
    // Extract contract duration
    const durationMatch = rfpText.match(/Duration:\s*([^\n]+)/i);
    if (durationMatch) {
      const duration = durationMatch[1].trim();
      const yearMatch = duration.match(/(\d+)\s*year/i);
      if (yearMatch) {
        contractLength = parseInt(yearMatch[1]) * 12;
      }
    }
    
    // Extract special requirements from GPT analysis
    const requirementsSection = rfpText.match(/Special Requirements:\s*([^\n]+)/i);
    if (requirementsSection) {
      specialRequirements = requirementsSection[1].split(',').map(req => req.trim());
    }
    
    const accessSection = rfpText.match(/Access Notes:\s*([^\n]+)/i);
    if (accessSection) {
      specialRequirements.push(...accessSection[1].split(',').map(note => note.trim()));
    }
    
    const pricingSection = rfpText.match(/Pricing Constraints:\s*([^\n]+)/i);
    if (pricingSection) {
      const constraints = pricingSection[1].toLowerCase();
      if (constraints.includes('no fuel') || constraints.includes('fuel surcharge not allowed')) {
        fuelSurchargeAllowed = false;
        specialRequirements.push('No fuel surcharge allowed');
      }
    }
    
  } else {
    // Legacy parsing for non-GPT content
    // Extract community name - enhanced patterns
    const nameMatch = rfpText.match(/(?:community|association|estate|manor|complex|village|park|hoa|neighborhood)\s*:?\s*([^\n\r,]{1,50})/i) ||
                     rfpText.match(/(?:name|community)\s*:\s*([^\n\r,]{1,50})/i);
    
    if (nameMatch) {
      communityName = nameMatch[1].trim();
    }
    
    // For PDF analysis documents, try to extract meaningful info
    if (rfpText.includes('PDF Document Analysis Report')) {
      const communityMatch = rfpText.match(/COMMUNITY:\s*([^\n]+)/i);
      if (communityMatch) {
        communityName = communityMatch[1].trim();
      }
      
      const locationMatch = rfpText.match(/LOCATION:\s*([^\n]+)/i);
      if (locationMatch) {
        location = locationMatch[1].trim();
      }
      
      const scopeMatch = rfpText.match(/ESTIMATED SCOPE:\s*(\d+)\s*units/i);
      if (scopeMatch) {
        homes = parseInt(scopeMatch[1]);
      }
    }
    
    // Extract number of homes/units - enhanced patterns
    const homesMatch = rfpText.match(/(\d+)\s*(?:home|house|unit|residence|dwelling)/i) ||
                      rfpText.match(/(?:home|house|unit|residence|dwelling)\s*[:\-]?\s*(\d+)/i) ||
                      rfpText.match(/total\s*[:\-]?\s*(\d+)/i);
    
    if (homesMatch) {
      homes = parseInt(homesMatch[1]);
    }
    
    // Extract location information
    const addressMatch = rfpText.match(/(?:address|location|situated|located)\s*:?\s*([^\n\r]{1,100})/i);
    if (addressMatch) {
      location = addressMatch[1].trim();
    }
    
    // Extract service requirements
    if (rfpText.includes('recycling') || rfpText.includes('recycle')) {
      recyclingRequired = true;
    }
    
    if (rfpText.includes('yard waste') || rfpText.includes('yard debris') || rfpText.includes('landscaping')) {
      yardWasteRequired = true;
    }
    
    // Extract pickup frequency
    const frequencyMatch = rfpText.match(/(once|twice|two|three)\s*(?:per|a)?\s*week/i) ||
                          rfpText.match(/(\d+)\s*(?:times?|x)\s*(?:per|a)?\s*week/i);
    
    if (frequencyMatch) {
      const freq = frequencyMatch[1].toLowerCase();
      if (freq === 'twice' || freq === 'two' || freq === '2') {
        pickupFrequency = 'Twice Weekly';
      } else if (freq === 'three' || freq === '3') {
        pickupFrequency = 'Three Times Weekly';
      }
    }
    
    // Extract special requirements
    if (rfpText.includes('gated') || rfpText.includes('gate')) {
      specialRequirements.push('Gated community access required');
    }
    
    if (rfpText.includes('rear') || rfpText.includes('alley')) {
      specialRequirements.push('Rear alley access');
    }
    
    if (rfpText.includes('cart') || rfpText.includes('container')) {
      specialRequirements.push('Specific container requirements');
    }
    
    // Extract contract length
    const contractMatch = rfpText.match(/(\d+)\s*year/i);
    if (contractMatch) {
      contractLength = parseInt(contractMatch[1]) * 12;
    }
    
    // Check for fuel surcharge restrictions
    if (rfpText.includes('no fuel surcharge') || rfpText.includes('fuel surcharge not allowed')) {
      fuelSurchargeAllowed = false;
      specialRequirements.push('No fuel surcharge allowed');
    }
  }

  return {
    communityName,
    location,
    homes: Math.max(homes, 50), // Minimum 50 homes for analysis
    serviceType,
    pickupFrequency,
    specialRequirements,
    contractLength,
    startDate,
    fuelSurchargeAllowed,
    timeWindows,
    recyclingRequired,
    yardWasteRequired
  };
};

// Helper function to detect service requirements (moved from smart-pricing-engine)
function detectServiceRequirements(specialRequirements: string[]): {
  isWalkout: boolean;
  isGated: boolean;
  hasSpecialContainers: boolean;
  serviceDescription: string;
} {
  const allRequirements = specialRequirements.join(' ').toLowerCase();
  
  // Detect walk-out/backdoor service - STRICT detection requiring explicit mention
  const walkoutKeywords = ['walk-out', 'walkout', 'walk out', 'backdoor', 'back door', 'rear alley access required', 'bring containers out', 'toter service', 'door-to-door'];
  const isWalkout = walkoutKeywords.some(keyword => allRequirements.includes(keyword));
  
  // Detect gated community - minor surcharge
  const gatedKeywords = ['gated', 'gate', 'access code', 'security gate', 'controlled access', 'access coordination', 'access required'];
  const isGated = gatedKeywords.some(keyword => allRequirements.includes(keyword));
  
  // Detect special containers - minor surcharge
  const containerKeywords = ['special container', 'wheeled cart', 'specific gallon', 'custom container', 'provided container'];
  const hasSpecialContainers = containerKeywords.some(keyword => allRequirements.includes(keyword));
  
  // Generate service description
  let serviceDescription = 'Standard curbside service';
  if (isWalkout) serviceDescription = 'Walk-out/backdoor service';
  if (isGated) serviceDescription += ' with gated access';
  if (hasSpecialContainers) serviceDescription += ' with special containers';
  
  console.log(`🔍 Service Detection (Strict): Walk-out: ${isWalkout}, Gated: ${isGated}, Special Containers: ${hasSpecialContainers}`);
  
  return { isWalkout, isGated, hasSpecialContainers, serviceDescription };
}

// Helper function to determine unit type from RFP data
function determineUnitType(rfpData: RFPData): UnitType {
  const serviceType = rfpData.serviceType.toLowerCase();
  const requirements = rfpData.specialRequirements.join(' ').toLowerCase();
  
  if (serviceType.includes('townhome') || requirements.includes('townhome')) {
    return 'Townhomes';
  } else if (serviceType.includes('condo') || requirements.includes('condo')) {
    return 'Condos';
  } else if (serviceType.includes('mixed') || (serviceType.includes('single') && serviceType.includes('townhome'))) {
    return 'Mixed Residential';
  } else {
    // Default to Single Family Homes
    return 'Single Family Homes';
  }
}

// Transform customer data for analysis
const transformCustomerData = (customers: any[]) => {
  return customers.map(customer => ({
    id: customer.id,
    address: customer.address,
    lat: customer.latitude,
    lng: customer.longitude,
    homes: customer.units || 1
  }));
};

// Main RFP analysis function with unit-based pricing engine
const analyzeRFP = (rfpData: RFPData, customerData: any[]): AnalysisResult => {
  console.log('🔍 Starting enhanced RFP analysis with Smart Pricing Engine...');

  // STEP 1: Create service profile for unit-based pricing engine
  const serviceDetection = detectServiceRequirements(rfpData.specialRequirements);
  const { isWalkout, isGated, hasSpecialContainers } = serviceDetection;
  
  // Determine unit type from RFP data
  const unitType = determineUnitType(rfpData);
  
  // Determine trash frequency
  let trashFrequency: 'weekly' | 'twice-weekly' | 'three-times-weekly' = 'weekly';
  if (rfpData.pickupFrequency.includes('Three') || rfpData.pickupFrequency.includes('3')) {
    trashFrequency = 'three-times-weekly';
  } else if (rfpData.pickupFrequency.includes('Twice') || rfpData.pickupFrequency.includes('2')) {
    trashFrequency = 'twice-weekly';
  }

  const serviceProfile: ServiceProfile = {
    homes: rfpData.homes,
    unitType,
    trashFrequency,
    recyclingRequired: rfpData.recyclingRequired,
    yardWasteRequired: rfpData.yardWasteRequired,
    isWalkout,
    isGated,
    hasSpecialContainers,
    location: rfpData.location,
    specialRequirements: rfpData.specialRequirements
  };

  // STEP 2: Calculate operational costs
  const operationalCosts = calculateOperationalCosts(serviceProfile);

  // STEP 3: Run unit-based pricing engine
  const pricing = generateUnitBasedPricing(serviceProfile, operationalCosts);
  
  console.log(`💰 Smart Pricing: $${pricing.averagePricePerUnit.toFixed(2)}/home (${pricing.marginPercent.toFixed(1)}% margin)`);
  console.log(`📊 Cost Breakdown: $${operationalCosts.costPerHome.toFixed(2)}/home base cost`);

  // STEP 3.5: Generate comprehensive strategic summary for ALL proposals
  const strategicSummary = generateStrategicSummary(
    rfpData.communityName,
    rfpData.homes,
    unitType,
    pricing,
    operationalCosts,
    serviceProfile
  );

  // STEP 4: Use pricing engine results for analysis
  const adjustedPrice = pricing.averagePricePerUnit;

  // STEP 5: Use operational costs from pricing engine
  const mileageEstimate = {
    miles: operationalCosts.driveTimeMinutes / 3, // Approximate miles from drive time
    minutes: operationalCosts.driveTimeMinutes
  };
  
  // STEP 6: Use costs from pricing engine
  const totalCost = operationalCosts.totalMonthlyCost;
  const monthlyRevenue = adjustedPrice * rfpData.homes;
  const netProfit = monthlyRevenue - totalCost;
  const margin = calculateProfitMargin(monthlyRevenue, totalCost);

  // STEP 4: Truck capacity assessment
  const estimateTruckLoad = (unitCount: number, pickupsPerWeek: number) => {
    const currentFleetCapacity = 3; // 3 trucks
    const maxHoursPerDay = 12;
    const workDaysPerWeek = 5;
    const totalWeeklyCapacity = currentFleetCapacity * maxHoursPerDay * workDaysPerWeek; // 180 hours/week
    
    const timePerHome = 2.5 / 60; // 2.5 minutes = 0.042 hours per home
    const driveTime = (mileageEstimate.minutes * 2) / 60; // Round trip drive time in hours
    const serviceTime = unitCount * timePerHome;
    const totalTimePerTrip = serviceTime + driveTime;
    
    const weeklyHours = totalTimePerTrip * pickupsPerWeek;
    const loadPercent = (weeklyHours / totalWeeklyCapacity) * 100;
    
    const additionalTrucks = loadPercent > 100 ? Math.ceil((loadPercent - 100) / 60) : 0; // 60 hours per additional truck
    
    return {
      loadPercent,
      additionalTrucks,
      weeklyHours,
      totalCapacity: totalWeeklyCapacity
    };
  };

  const countPickups = (data: RFPData) => {
    let pickups = 1; // Base trash pickup
    if (data.pickupFrequency.includes('Twice') || data.pickupFrequency.includes('2')) {
      pickups = 2;
    } else if (data.pickupFrequency.includes('Three') || data.pickupFrequency.includes('3')) {
      pickups = 3;
    }
    
    if (data.recyclingRequired) pickups += 1;
    if (data.yardWasteRequired) pickups += 1;
    
    return pickups;
  };

  const pickupsPerWeek = countPickups(rfpData);
  const fleetUtilization = estimateTruckLoad(rfpData.homes, pickupsPerWeek);
  const needsExtraTrucks = fleetUtilization.loadPercent > 100;

  // STEP 5: Risk & confidence flags
  const flags: string[] = [];
  
  if (needsExtraTrucks) {
    flags.push(`⚠️ Requires ${fleetUtilization.additionalTrucks} additional truck${fleetUtilization.additionalTrucks > 1 ? 's' : ''}`);
  }
  
  if (!pricing.benchmarkValidation.isWithinBenchmark) {
    flags.push('⚠️ Pricing exceeds market benchmarks');
  }
  
  if (margin < 15) {
    flags.push('⚠️ Low profitability - margin below 15%');
  }
  
  if (mileageEstimate.miles > 25) {
    flags.push('⚠️ High routing burden - isolated location');
  }
  
  if (!rfpData.fuelSurchargeAllowed && operationalCosts.fuelCostPerTrip > 25) {
    flags.push('⚠️ No fuel surcharge allowed despite high fuel costs');
  }
  
  if (rfpData.specialRequirements.length > 3) {
    flags.push('⚠️ Complex service requirements may increase costs');
  }

  // STEP 6: Generate recommendation
  let recommendation: 'bid' | 'bid-with-conditions' | 'do-not-bid' = 'do-not-bid';
  let confidence: 'high' | 'medium' | 'low' = 'low';
  
  if (margin >= 20 && !needsExtraTrucks && mileageEstimate.miles < 20) {
    recommendation = 'bid';
    confidence = 'high';
  } else if (margin >= 15 && fleetUtilization.loadPercent < 90) {
    recommendation = 'bid-with-conditions';
    confidence = 'medium';
  } else if (margin >= 10) {
    recommendation = 'bid-with-conditions';
    confidence = 'low';
  }

  // Calculate scores for compatibility
  const proximityScore: 'close' | 'moderate' | 'far' = 
    mileageEstimate.miles < 10 ? 'close' : mileageEstimate.miles < 20 ? 'moderate' : 'far';
  
  const strategicFitScore: 'low' | 'medium' | 'high' = 
    margin > 25 && fleetUtilization.loadPercent < 75 ? 'high' :
    margin > 15 && fleetUtilization.loadPercent < 85 ? 'medium' : 'low';
  
  const serviceabilityScore = Math.max(0, Math.min(100,
    (margin > 20 ? 50 : margin > 15 ? 35 : margin > 10 ? 20 : 0) +
    (fleetUtilization.loadPercent < 75 ? 30 : fleetUtilization.loadPercent < 85 ? 20 : fleetUtilization.loadPercent < 100 ? 10 : 0) +
    (mileageEstimate.miles < 15 ? 20 : mileageEstimate.miles < 25 ? 10 : 0)
  ));

  // Enhanced analysis for UI
  const enhancedAnalysis = {
    serviceStreams: `${rfpData.homes} homes • ${rfpData.pickupFrequency}${rfpData.recyclingRequired ? ' • Recycling' : ''}${rfpData.yardWasteRequired ? ' • Yard Waste' : ''}`,
    serviceabilityScore,
    fleetLoadPercentage: fleetUtilization.loadPercent,
    bidRecommendation: {
      shouldBid: recommendation !== 'do-not-bid',
      confidence,
      reasoning: [
        `Fleet utilization: ${fleetUtilization.loadPercent.toFixed(1)}% (${fleetUtilization.loadPercent < 85 ? 'manageable' : 'high'})`,
        `Profit margin: ${margin.toFixed(1)}% (${margin > 20 ? 'excellent' : margin > 15 ? 'good' : margin > 10 ? 'acceptable' : 'poor'})`,
        `Route distance: ${mileageEstimate.miles} miles (${proximityScore} proximity)`,
        `Service complexity: ${pickupsPerWeek} pickups/week (${isWalkout ? 'walk-out service' : 'curbside'})`
      ],
      conditions: recommendation === 'bid-with-conditions' ? [
        margin < 15 ? 'Negotiate higher pricing for better margins' : '',
        needsExtraTrucks ? 'Plan for additional truck capacity' : '',
        mileageEstimate.miles > 20 ? 'Consider route optimization opportunities' : '',
        !rfpData.fuelSurchargeAllowed ? 'Factor fuel costs into base pricing' : ''
      ].filter(Boolean) : [],
      marginAfterCosts: margin
    },
    costBreakdown: {
      laborCosts: operationalCosts.laborCostPerHour * operationalCosts.serviceTimeMinutes / 60,
      fuelCosts: operationalCosts.fuelCostPerTrip * 4.33, // Monthly fuel cost
      maintenanceCosts: operationalCosts.equipmentCostPerMonth * 0.1, // Maintenance portion
      disposalCosts: operationalCosts.dumpFeesPerMonth,
      totalMonthlyCost: totalCost
    },
    tooltips: {
      serviceabilityScore: 'Composite score based on profitability, fleet capacity, and route efficiency',
      fleetLoadPercentage: 'Percentage of current fleet capacity required for this contract',
      marginAfterCosts: 'Net profit margin after all operational costs including labor, fuel, maintenance, and disposal'
    }
  };

  return {
    proximityScore,
    suggestedPricePerHome: adjustedPrice,
    estimatedCostPerMonth: totalCost,
    projectedGrossMargin: margin / 100, // Convert to decimal for compatibility
    efficiencyPerMinute: monthlyRevenue / (fleetUtilization.weeklyHours * 60 * 4.33),
    strategicFitScore,
    riskFlags: flags,
    recommendation,
    calculations: {
      distanceFromDepot: mileageEstimate.miles,
      distanceFromLandfill: mileageEstimate.miles + 8, // Estimate landfill distance
      estimatedTimePerVisit: 2.5,
      fuelCostPerMonth: operationalCosts.fuelCostPerTrip * 4.33,
      laborCostPerMonth: operationalCosts.laborCostPerHour * operationalCosts.serviceTimeMinutes / 60 * 4.33,
      equipmentCostPerMonth: operationalCosts.equipmentCostPerMonth,
      dumpingFees: operationalCosts.dumpFeesPerMonth
    },
    competitiveAnalysis: {
      marketRate: adjustedPrice * 0.92, // Slightly below our price
      ourAdvantage: [
        'Local route density and efficiency',
        'Proven HOA service experience',
        isWalkout ? 'Specialized walk-out service capability' : 'Reliable curbside operations',
        'Comprehensive recycling and yard waste services'
      ],
      risks: [
        'Competitive pricing pressure in market',
        margin < 15 ? 'Tight margin limits pricing flexibility' : 'Service quality expectations',
        needsExtraTrucks ? 'Fleet capacity constraints' : 'Contract length commitments'
      ]
    },
    communityDetails: {
      name: rfpData.communityName,
      homes: rfpData.homes,
      location: rfpData.location,
      serviceArea: 'Northern Virginia'
    },
    operationalFeasibility: {
      fleetCapacityStatus: fleetUtilization.loadPercent < 85 ? 'Available capacity' : needsExtraTrucks ? 'Requires additional trucks' : 'High utilization',
      routingImpact: mileageEstimate.miles < 15 ? 'Minimal routing impact' : mileageEstimate.miles < 25 ? 'Moderate routing burden' : 'High routing burden',
      serviceCompatibility: 'Compatible with existing operations',
      additionalTruckCost: needsExtraTrucks ? fleetUtilization.additionalTrucks * 8500 : 0,
      routingCost: (operationalCosts.fuelCostPerTrip * 4.33) + (operationalCosts.laborCostPerHour * operationalCosts.driveTimeMinutes / 60 * 4.33), // Fuel + drive time labor
      totalOperationalCost: totalCost,
      feasible: recommendation !== 'do-not-bid',
      riskLevel: confidence === 'high' ? 'low' : confidence === 'medium' ? 'medium' : 'high',
      conditions: enhancedAnalysis.bidRecommendation.conditions
    },
    enhancedAnalysis,
    smartPricing: {
      unitTypePricing: pricing.unitTypePricing,
      totalMonthlyRevenue: pricing.totalMonthlyRevenue,
      averagePricePerUnit: pricing.averagePricePerUnit,
      addOnsApplied: pricing.addOnsApplied,
      marginPercent: pricing.marginPercent,
      benchmarkValidation: pricing.benchmarkValidation,
      confidence,
      riskFlags: flags,
      warnings: pricing.warnings
    },
    strategicSummary // Add the comprehensive diagnostic report
  };
};

export async function POST(request: NextRequest) {
  try {
    const { rfpText } = await request.json();

    if (!rfpText) {
      return NextResponse.json(
        { success: false, error: 'RFP text is required' },
        { status: 400 }
      );
    }

    // Load customer data (in production, this would come from a database)
    let customerData = [];
    try {
      const fs = require('fs');
      const path = require('path');
      const dataPath = path.join(process.cwd(), 'data', 'geocoded_customers.json');
      const rawData = fs.readFileSync(dataPath, 'utf8');
      const allCustomers = JSON.parse(rawData);
      
      // Filter to include only HOA customers for RFP analysis
      customerData = allCustomers.filter((customer: any) => customer.Type === 'HOA');
      
      console.log(`📊 Loaded ${allCustomers.length} total customers, filtered to ${customerData.length} HOA customers for analysis`);
    } catch (error) {
      console.error('Error loading customer data:', error);
    }

    // Parse and analyze the RFP
    const rfpData = parseRFPText(rfpText);
    const analysis = analyzeRFP(rfpData, customerData);

    return NextResponse.json({
      success: true,
      data: analysis,
      metadata: {
        analyzedAt: new Date().toISOString(),
        customerDataCount: customerData.length,
        version: '1.0'
      }
    });

  } catch (error) {
    console.error('Error analyzing RFP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze RFP' },
      { status: 500 }
    );
  }
} 