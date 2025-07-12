/**
 * Pricing Service Helper Methods
 * Supporting calculations for the main pricing service
 */

import {
  PricingRequest,
  PricingBreakdown,
  OperationalAnalysis,
  PricingConfig,
} from './types';

// Helper methods for PricingService
export class PricingServiceHelpers {
  
  static calculateServiceTime(request: PricingRequest): number {
    let baseTime = 1.5; // Base 1.5 minutes per home
    
    // Add time for additional services
    if (request.services.recycling.required) baseTime += 0.5;
    if (request.services.yardWaste.required) baseTime += 0.7;
    
    // Add time for special access
    if (request.accessType === 'walkout') baseTime += 1.0;
    if (request.isGated) baseTime += 0.3;
    
    return baseTime;
  }

  static calculateDriveTime(request: PricingRequest): number {
    // If coordinates provided, could calculate actual drive time
    // For now, use estimated based on location patterns
    if (request.coordinates?.lat && request.coordinates?.lng) {
      // Could integrate with Google Maps API here
      return 25; // Default estimation
    }
    
    // Use location name patterns for estimation
    const locationLower = request.locationName.toLowerCase();
    if (locationLower.includes('fairfax') || locationLower.includes('arlington')) {
      return 15; // Close areas
    } else if (locationLower.includes('loudoun') || locationLower.includes('prince william')) {
      return 30; // Moderate distance
    } else {
      return 25; // Default
    }
  }

  static calculateProximityScore(driveTimeMinutes: number): 'close' | 'moderate' | 'far' {
    if (driveTimeMinutes <= 15) return 'close';
    if (driveTimeMinutes <= 30) return 'moderate';
    return 'far';
  }

  static calculateFleetUtilization(request: PricingRequest, serviceTimeMinutes: number): OperationalAnalysis['fleetUtilization'] {
    const currentCapacity = 3 * 8 * 60; // 3 trucks, 8 hours/day, 60 minutes/hour
    const requiredCapacity = request.homes * serviceTimeMinutes;
    const utilizationPercent = (requiredCapacity / currentCapacity) * 100;
    const additionalTrucksNeeded = Math.max(0, Math.ceil((requiredCapacity - currentCapacity) / (8 * 60)));
    
    return {
      currentCapacity,
      requiredCapacity,
      utilizationPercent,
      additionalTrucksNeeded,
    };
  }

  static calculateOperationalCosts(
    request: PricingRequest, 
    driveTimeMinutes: number, 
    serviceTimeMinutes: number,
    config: PricingConfig
  ): OperationalAnalysis['operationalCosts'] {
    const totalTimePerVisit = driveTimeMinutes + serviceTimeMinutes;
    const totalMonthlyMinutes = totalTimePerVisit * request.homes;
    const totalMonthlyHours = totalMonthlyMinutes / 60;
    
    // Calculate individual cost components
    const laborCostPerMonth = totalMonthlyHours * config.laborRatePerHour;
    const fuelCostPerMonth = (driveTimeMinutes * 2 / 60) * config.fuelCostPerMile * 15 * 4.33; // Estimated miles and frequency
    const equipmentCostPerMonth = totalMonthlyHours * config.equipmentCostPerHour;
    const disposalCostPerMonth = request.homes * 0.3 * config.disposalCostPerTon; // Estimated tons per home
    
    const totalCostPerMonth = laborCostPerMonth + fuelCostPerMonth + equipmentCostPerMonth + disposalCostPerMonth;
    const costPerUnit = totalCostPerMonth / request.homes;
    
    return {
      laborCostPerMonth,
      fuelCostPerMonth,
      equipmentCostPerMonth,
      disposalCostPerMonth,
      totalCostPerMonth,
      costPerUnit,
    };
  }

  static calculatePremiums(request: PricingRequest, basePrice: number, config: PricingConfig): PricingBreakdown['premiums'] {
    const premiums = {
      walkout: 0,
      gated: 0,
      specialContainers: 0,
      multipleServices: 0,
    };
    
    // Walkout premium
    if (request.accessType === 'walkout') {
      premiums.walkout = basePrice * config.premiumRules.walkoutPremiumPercent;
    }
    
    // Gated access premium
    if (request.isGated) {
      premiums.gated = config.premiumRules.gatedAccessSurcharge;
    }
    
    // Special containers premium
    if (request.hasSpecialContainers) {
      premiums.specialContainers = config.premiumRules.specialContainerSurcharge;
    }
    
    // Multiple services premium
    const serviceCount = [
      request.services.trash.required,
      request.services.recycling.required,
      request.services.yardWaste.required,
    ].filter(Boolean).length;
    
    if (serviceCount > 1) {
      premiums.multipleServices = basePrice * 0.05 * (serviceCount - 1); // 5% per additional service
    }
    
    return premiums;
  }

  static calculateDiscounts(
    request: PricingRequest, 
    operations: OperationalAnalysis, 
    basePrice: number,
    config: PricingConfig
  ): PricingBreakdown['discounts'] {
    const discounts = {
      volume: 0,
      routeEfficiency: 0,
    };
    
    // Volume discount
    const { volumeDiscounts } = config;
    if (request.homes >= volumeDiscounts.tier3.minHomes) {
      discounts.volume = basePrice * volumeDiscounts.tier3.discountPercent;
    } else if (request.homes >= volumeDiscounts.tier2.minHomes) {
      discounts.volume = basePrice * volumeDiscounts.tier2.discountPercent;
    } else if (request.homes >= volumeDiscounts.tier1.minHomes) {
      discounts.volume = basePrice * volumeDiscounts.tier1.discountPercent;
    }
    
    // Route efficiency discount
    if (operations.routeAnalysis.proximityScore === 'close') {
      discounts.routeEfficiency = basePrice * 0.03; // 3% for close proximity
    }
    
    return discounts;
  }

  static calculateServicesPricing(request: PricingRequest, basePrice: number): PricingBreakdown['servicesPricing'] {
    return {
      trash: request.services.trash.required ? basePrice * 0.6 : 0,
      recycling: request.services.recycling.required ? basePrice * 0.25 : 0,
      yardWaste: request.services.yardWaste.required ? basePrice * 0.15 : 0,
    };
  }

  static calculateServiceabilityScore(pricing: PricingBreakdown, operations: OperationalAnalysis): number {
    let score = 0;
    
    // Profitability score (40 points max)
    if (pricing.marginPercent > 0.25) score += 40;
    else if (pricing.marginPercent > 0.15) score += 30;
    else if (pricing.marginPercent > 0.05) score += 20;
    else if (pricing.marginPercent > 0) score += 10;
    
    // Fleet capacity score (30 points max)
    if (operations.fleetUtilization.utilizationPercent < 85) score += 30;
    else if (operations.fleetUtilization.utilizationPercent < 100) score += 20;
    else if (operations.fleetUtilization.utilizationPercent < 120) score += 10;
    
    // Route efficiency score (20 points max)
    if (operations.routeAnalysis.proximityScore === 'close') score += 20;
    else if (operations.routeAnalysis.proximityScore === 'moderate') score += 10;
    
    // Service complexity score (10 points max)
    score += 10; // Base points for standard service
    
    return Math.min(100, score);
  }

  static determineStrategicFit(pricing: PricingBreakdown, operations: OperationalAnalysis): 'high' | 'medium' | 'low' {
    if (pricing.marginPercent > 0.25 && operations.fleetUtilization.utilizationPercent < 85) {
      return 'high';
    } else if (pricing.marginPercent > 0.15 && operations.fleetUtilization.utilizationPercent < 100) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  static generateReasoning(request: PricingRequest, pricing: PricingBreakdown, operations: OperationalAnalysis): string[] {
    const reasoning = [];
    
    reasoning.push(`Fleet utilization: ${operations.fleetUtilization.utilizationPercent.toFixed(1)}% (${operations.fleetUtilization.utilizationPercent < 85 ? 'manageable' : 'high'})`);
    reasoning.push(`Route efficiency: ${operations.routeAnalysis.driveTimeMinutes} min drive time (${operations.routeAnalysis.proximityScore} proximity)`);
    reasoning.push(`Profit margin: ${(pricing.marginPercent * 100).toFixed(1)}% (${pricing.marginPercent > 0.15 ? 'acceptable' : 'low'})`);
    reasoning.push(`Service complexity: ${request.services.trash.required ? 'Trash' : ''}${request.services.recycling.required ? ' + Recycling' : ''}${request.services.yardWaste.required ? ' + Yard Waste' : ''}`);
    
    return reasoning;
  }

  static generateRiskFlags(request: PricingRequest, pricing: PricingBreakdown, operations: OperationalAnalysis): string[] {
    const flags = [];
    
    if (operations.fleetUtilization.additionalTrucksNeeded > 0) {
      flags.push(`⚠️ Requires ${operations.fleetUtilization.additionalTrucksNeeded} additional truck${operations.fleetUtilization.additionalTrucksNeeded > 1 ? 's' : ''}`);
    }
    
    if (pricing.marginPercent < 0.15) {
      flags.push('⚠️ Low profitability - margin below 15%');
    }
    
    if (operations.routeAnalysis.proximityScore === 'far') {
      flags.push('⚠️ High routing burden - distant location');
    }
    
    if (!request.fuelSurchargeAllowed) {
      flags.push('⚠️ No fuel surcharge protection');
    }
    
    return flags;
  }

  static generateConditions(pricing: PricingBreakdown, operations: OperationalAnalysis): string[] {
    const conditions = [];
    
    if (pricing.marginPercent < 0.15) {
      conditions.push('Negotiate higher pricing for better margins');
    }
    
    if (operations.fleetUtilization.additionalTrucksNeeded > 0) {
      conditions.push('Plan for additional fleet capacity');
    }
    
    if (operations.routeAnalysis.proximityScore === 'far') {
      conditions.push('Consider route optimization opportunities');
    }
    
    return conditions;
  }

  static determineRecommendationType(pricing: PricingBreakdown, operations: OperationalAnalysis, riskFlags: string[]): 'bid' | 'bid-with-conditions' | 'do-not-bid' {
    if (pricing.marginPercent < 0.05 || operations.fleetUtilization.utilizationPercent > 120) {
      return 'do-not-bid';
    } else if (pricing.marginPercent < 0.15 || riskFlags.length >= 2) {
      return 'bid-with-conditions';
    } else {
      return 'bid';
    }
  }

  static determineConfidence(pricing: PricingBreakdown, operations: OperationalAnalysis, riskFlags: string[]): 'high' | 'medium' | 'low' {
    if (pricing.marginPercent > 0.20 && operations.fleetUtilization.utilizationPercent < 85 && riskFlags.length === 0) {
      return 'high';
    } else if (pricing.marginPercent > 0.10 && operations.fleetUtilization.utilizationPercent < 100 && riskFlags.length <= 1) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  static generateStrategicSummary(request: PricingRequest, pricing: PricingBreakdown, operations: OperationalAnalysis): string {
    const recommendation = pricing.marginPercent > 0.15 ? 'RECOMMEND' : 'CAUTION';
    const profitability = pricing.marginPercent > 0.20 ? 'Excellent' : pricing.marginPercent > 0.15 ? 'Good' : 'Poor';
    
    return `
### Strategic Analysis: ${recommendation}

**Community**: ${request.communityName} (${request.homes} ${request.unitType})
**Pricing**: $${pricing.pricePerUnit.toFixed(2)}/unit/month
**Monthly Revenue**: $${pricing.totalMonthlyRevenue.toLocaleString()}
**Profit Margin**: ${(pricing.marginPercent * 100).toFixed(1)}% (${profitability})

**Fleet Impact**: ${operations.fleetUtilization.utilizationPercent.toFixed(1)}% utilization
**Route Efficiency**: ${operations.routeAnalysis.driveTimeMinutes} min drive time (${operations.routeAnalysis.proximityScore})
**Service Complexity**: ${request.accessType === 'walkout' ? 'Walk-out' : 'Curbside'} service

**Key Factors**:
- ${pricing.marginPercent > 0.15 ? '✅' : '❌'} Profitability target met
- ${operations.fleetUtilization.utilizationPercent < 85 ? '✅' : '❌'} Fleet capacity available
- ${operations.routeAnalysis.proximityScore === 'close' ? '✅' : '❌'} Route efficiency optimal
    `.trim();
  }

  static generateCompetitiveAdvantages(request: PricingRequest, pricing: PricingBreakdown): string[] {
    const advantages = [
      'Established local presence',
      'Comprehensive service offerings',
      'Proven operational efficiency',
    ];
    
    if (request.accessType === 'walkout') {
      advantages.push('Specialized walk-out service capability');
    }
    
    if (pricing.marginPercent > 0.20) {
      advantages.push('Competitive pricing with healthy margins');
    }
    
    return advantages;
  }

  static generateMarketRisks(request: PricingRequest, pricing: PricingBreakdown, variancePercent: number): string[] {
    const risks = [];
    
    if (variancePercent > 10) {
      risks.push('Pricing above market average - competitive pressure');
    }
    
    if (pricing.marginPercent < 0.15) {
      risks.push('Low margins limit pricing flexibility');
    }
    
    if (request.contractLength > 5) {
      risks.push('Long-term contract limits pricing adjustments');
    }
    
    return risks;
  }

  static generateValidationMessage(isWithinBenchmark: boolean, variancePercent: number, marketPosition: string): string {
    if (isWithinBenchmark) {
      return `✅ Pricing within market benchmark range (${variancePercent > 0 ? '+' : ''}${variancePercent.toFixed(1)}%)`;
    } else if (variancePercent > 0) {
      return `⚠️ Pricing exceeds market benchmark by ${variancePercent.toFixed(1)}% (${marketPosition} positioning)`;
    } else {
      return `⚠️ Pricing below market benchmark by ${Math.abs(variancePercent).toFixed(1)}% (${marketPosition} positioning)`;
    }
  }
} 