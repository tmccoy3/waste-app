export type RouteDensity = 'High' | 'Medium' | 'Low';
export type Recommendation = 'Accept' | 'Borderline' | 'Decline';

export interface PricingFactors {
  routeDensity: RouteDensity;
  nearestDistance: number; // in miles
  customersWithin500ft: number;
  customersWithin1000ft: number;
  numberOfCarts: number;
}

export interface PricingResult {
  suggestedPrice: number;
  recommendation: Recommendation;
  serviceabilityScore: number;
  routeDensity: RouteDensity;
}

/**
 * Calculate suggested pricing based on route density and proximity
 */
export function calculateSuggestedPrice(factors: PricingFactors): number {
  let basePrice = 30; // Default base price

  // Adjust based on route density
  switch (factors.routeDensity) {
    case 'High':
      basePrice = 26;
      break;
    case 'Medium':
      basePrice = 30;
      break;
    case 'Low':
      basePrice = 36;
      break;
  }

  // Adjust based on proximity to existing customers
  if (factors.customersWithin500ft >= 3) {
    basePrice -= 2; // Discount for high density
  } else if (factors.customersWithin500ft >= 1) {
    basePrice -= 1; // Small discount for medium density
  } else if (factors.nearestDistance > 1) {
    basePrice += 4; // Premium for isolated locations
  }

  // Adjust for number of carts
  if (factors.numberOfCarts > 1) {
    basePrice += (factors.numberOfCarts - 1) * 8; // Additional $8 per extra cart
  }

  // Ensure minimum price
  return Math.max(basePrice, 24);
}

/**
 * Calculate serviceability score (0-100)
 */
export function calculateServiceabilityScore(factors: PricingFactors): number {
  let score = 50; // Base score

  // Proximity scoring
  if (factors.customersWithin500ft >= 3) {
    score += 30;
  } else if (factors.customersWithin500ft >= 1) {
    score += 20;
  } else if (factors.customersWithin1000ft >= 2) {
    score += 10;
  }

  // Route density scoring
  switch (factors.routeDensity) {
    case 'High':
      score += 20;
      break;
    case 'Medium':
      score += 10;
      break;
    case 'Low':
      // No bonus
      break;
  }

  // Distance penalty
  if (factors.nearestDistance > 2) {
    score -= 20;
  } else if (factors.nearestDistance > 1) {
    score -= 10;
  }

  return Math.min(Math.max(score, 0), 100);
}

/**
 * Determine route density based on customer concentration
 */
export function determineRouteDensity(customersWithin1000ft: number): RouteDensity {
  if (customersWithin1000ft >= 5) {
    return 'High';
  } else if (customersWithin1000ft >= 2) {
    return 'Medium';
  } else {
    return 'Low';
  }
}

/**
 * Get recommendation based on serviceability score
 */
export function getRecommendation(serviceabilityScore: number): Recommendation {
  if (serviceabilityScore >= 75) {
    return 'Accept';
  } else if (serviceabilityScore >= 50) {
    return 'Borderline';
  } else {
    return 'Decline';
  }
}

/**
 * Generate comprehensive pricing analysis
 */
export function analyzePricing(factors: PricingFactors): PricingResult {
  const suggestedPrice = calculateSuggestedPrice(factors);
  const serviceabilityScore = calculateServiceabilityScore(factors);
  const recommendation = getRecommendation(serviceabilityScore);

  return {
    suggestedPrice,
    recommendation,
    serviceabilityScore,
    routeDensity: factors.routeDensity
  };
}

/**
 * Get pricing tier description
 */
export function getPricingTierDescription(price: number): string {
  if (price <= 28) {
    return 'Premium Route - High Density';
  } else if (price <= 32) {
    return 'Standard Route - Medium Density';
  } else if (price <= 36) {
    return 'Extended Route - Low Density';
  } else {
    return 'Premium Route - Isolated Location';
  }
} 