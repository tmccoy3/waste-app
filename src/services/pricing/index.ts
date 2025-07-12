/**
 * Pricing Service Module
 * Clean, consolidated pricing microservice
 */

// Export types
export * from './types';

// Export main service
export { PricingService, pricingService } from './PricingService';

// Export helpers (for testing or custom implementations)
export { PricingServiceHelpers } from './PricingServiceHelpers';

// Convenience function for quick pricing calculations
export async function calculatePricing(request: import('./types').PricingRequest) {
  const { pricingService } = await import('./PricingService');
  return pricingService.calculatePricing(request);
}

// Configuration helpers
export function createPricingConfig(overrides: Partial<import('./types').PricingConfig> = {}) {
  return {
    targetMargin: 0.35,
    minimumMargin: 0.15,
    maximumMargin: 0.45,
    benchmarkTolerance: 0.10,
    laborRatePerHour: 85,
    fuelCostPerMile: 0.65,
    equipmentCostPerHour: 25,
    disposalCostPerTon: 45,
    premiumRules: {
      walkoutPremiumPercent: 0.33,
      gatedAccessSurcharge: 3.50,
      specialContainerSurcharge: 2.00,
    },
    volumeDiscounts: {
      tier1: { minHomes: 100, discountPercent: 0.03 },
      tier2: { minHomes: 250, discountPercent: 0.05 },
      tier3: { minHomes: 500, discountPercent: 0.08 },
    },
    ...overrides,
  };
}

// Request builder helpers
export function createRFPRequest(
  communityName: string,
  locationName: string,
  homes: number,
  overrides: Partial<import('./types').PricingRequest> = {}
): import('./types').PricingRequest {
  return {
    communityName,
    locationName,
    homes,
    unitType: 'Single Family Homes',
    services: {
      trash: { frequency: 'weekly', required: true },
      recycling: { frequency: 'bi-weekly', required: true },
      yardWaste: { frequency: 'weekly', required: false },
    },
    accessType: 'curbside',
    isGated: false,
    hasSpecialContainers: false,
    specialRequirements: [],
    contractLength: 3,
    startDate: new Date().toISOString(),
    fuelSurchargeAllowed: true,
    ...overrides,
  };
} 