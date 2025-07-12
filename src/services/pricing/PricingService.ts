/**
 * Core Pricing Service Implementation
 * Consolidates all pricing logic into a single, clean service
 */

import {
  PricingRequest,
  PricingResponse,
  PricingConfig,
  PricingValidationError,
  IPricingService,
  PricingServiceError,
  PricingBreakdown,
  OperationalAnalysis,
  PricingRecommendation,
  MarketValidation,
  PricingMetadata,
} from './types';
import { PricingServiceHelpers } from './PricingServiceHelpers';

// Default configuration
const DEFAULT_CONFIG: PricingConfig = {
  // Margin targets
  targetMargin: 0.35, // 35%
  minimumMargin: 0.15, // 15%
  maximumMargin: 0.45, // 45%
  
  // Benchmark tolerances
  benchmarkTolerance: 0.10, // 10%
  
  // Operational parameters
  laborRatePerHour: 85,
  fuelCostPerMile: 0.65,
  equipmentCostPerHour: 25,
  disposalCostPerTon: 45,
  
  // Pricing rules
  premiumRules: {
    walkoutPremiumPercent: 0.33, // 33%
    gatedAccessSurcharge: 3.50,
    specialContainerSurcharge: 2.00,
  },
  
  // Volume discounts
  volumeDiscounts: {
    tier1: { minHomes: 100, discountPercent: 0.03 }, // 3%
    tier2: { minHomes: 250, discountPercent: 0.05 }, // 5%
    tier3: { minHomes: 500, discountPercent: 0.08 }, // 8%
  },
};

// Base pricing by unit type (market research based)
const BASE_UNIT_PRICING = {
  'Single Family Homes': 37.03,
  'Townhomes': 21.31,
  'Condos': 75.00, // Per container - will be divided by units per container
  'Mixed Residential': 32.50,
};

// Market benchmarks
const MARKET_BENCHMARKS = {
  'Single Family Homes': 37.03,
  'Townhomes': 21.31,
  'Condos': 57.04,
  'Mixed Residential': 32.50,
};

export class PricingService implements IPricingService {
  private config: PricingConfig;
  
  constructor(config?: Partial<PricingConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public async calculatePricing(request: PricingRequest): Promise<PricingResponse> {
    const startTime = Date.now();
    const requestId = `pricing-${Date.now()}`;
    
    try {
      // Validate request
      const validationErrors = this.validateRequest(request);
      if (validationErrors.length > 0) {
        throw new PricingServiceError(
          'Request validation failed',
          'VALIDATION_ERROR',
          validationErrors
        );
      }

      // Calculate operational analysis
      const operations = this.calculateOperationalAnalysis(request);
      
      // Calculate pricing breakdown
      const pricing = this.calculatePricingBreakdown(request, operations);
      
      // Generate recommendation
      const recommendation = this.generateRecommendation(request, pricing, operations);
      
      // Validate against market benchmarks
      const validation = this.validateAgainstMarket(request, pricing);
      
      // Create metadata
      const metadata = this.createMetadata(requestId, startTime, []);
      
      return {
        pricing,
        operations,
        recommendation,
        validation,
        metadata,
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      if (error instanceof PricingServiceError) {
        throw error;
      }
      
      throw new PricingServiceError(
        'Pricing calculation failed',
        'CALCULATION_ERROR',
        { originalError: error, processingTime }
      );
    }
  }

  public validateRequest(request: PricingRequest): PricingValidationError[] {
    const errors: PricingValidationError[] = [];
    
    // Basic validations
    if (!request.communityName || request.communityName.trim().length === 0) {
      errors.push({
        field: 'communityName',
        message: 'Community name is required',
        code: 'REQUIRED_FIELD',
      });
    }
    
    if (!request.homes || request.homes < 1) {
      errors.push({
        field: 'homes',
        message: 'Number of homes must be greater than 0',
        code: 'INVALID_VALUE',
      });
    }
    
    if (request.homes > 10000) {
      errors.push({
        field: 'homes',
        message: 'Number of homes exceeds maximum limit (10,000)',
        code: 'EXCEEDS_LIMIT',
      });
    }
    
    // Service validations
    const hasAnyService = request.services.trash.required || 
                         request.services.recycling.required || 
                         request.services.yardWaste.required;
    
    if (!hasAnyService) {
      errors.push({
        field: 'services',
        message: 'At least one service must be required',
        code: 'NO_SERVICES',
      });
    }
    
    // Contract validations
    if (request.contractLength < 1 || request.contractLength > 10) {
      errors.push({
        field: 'contractLength',
        message: 'Contract length must be between 1 and 10 years',
        code: 'INVALID_RANGE',
      });
    }
    
    return errors;
  }

  public getConfig(): PricingConfig {
    return { ...this.config };
  }

  public updateConfig(config: Partial<PricingConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private calculateOperationalAnalysis(request: PricingRequest): OperationalAnalysis {
    // Calculate service time per unit
    const baseServiceTime = this.calculateServiceTime(request);
    
    // Calculate drive time (estimated or from coordinates)
    const driveTimeMinutes = this.calculateDriveTime(request);
    
    // Determine proximity score
    const proximityScore = this.calculateProximityScore(driveTimeMinutes);
    
    // Calculate fleet utilization
    const fleetUtilization = this.calculateFleetUtilization(request, baseServiceTime);
    
    // Calculate operational costs
    const operationalCosts = this.calculateOperationalCosts(request, driveTimeMinutes, baseServiceTime);
    
    return {
      fleetUtilization,
      routeAnalysis: {
        driveTimeMinutes,
        serviceTimeMinutes: baseServiceTime,
        totalTimePerVisit: driveTimeMinutes + baseServiceTime,
        proximityScore,
      },
      operationalCosts,
    };
  }

  private calculatePricingBreakdown(request: PricingRequest, operations: OperationalAnalysis): PricingBreakdown {
    // Get base price for unit type
    const basePrice = BASE_UNIT_PRICING[request.unitType] || BASE_UNIT_PRICING['Single Family Homes'];
    
    // Calculate premiums
    const premiums = this.calculatePremiums(request, basePrice);
    
    // Calculate discounts
    const discounts = this.calculateDiscounts(request, operations);
    
    // Calculate service-specific pricing
    const servicesPricing = this.calculateServicesPricing(request, basePrice);
    
    // Calculate final price per unit
    const pricePerUnit = basePrice + 
                        premiums.walkout + 
                        premiums.gated + 
                        premiums.specialContainers + 
                        premiums.multipleServices -
                        discounts.volume -
                        discounts.routeEfficiency;
    
    const totalMonthlyRevenue = pricePerUnit * request.homes;
    const totalMonthlyProfit = totalMonthlyRevenue - operations.operationalCosts.totalCostPerMonth;
    const marginPercent = totalMonthlyRevenue > 0 ? (totalMonthlyProfit / totalMonthlyRevenue) : 0;
    
    return {
      pricePerUnit,
      totalMonthlyRevenue,
      basePrice,
      premiums,
      discounts,
      servicesPricing,
      marginPercent,
      profitPerUnit: totalMonthlyProfit / request.homes,
      totalMonthlyProfit,
    };
  }

  private generateRecommendation(
    request: PricingRequest,
    pricing: PricingBreakdown,
    operations: OperationalAnalysis
  ): PricingRecommendation {
    // Calculate serviceability score
    const serviceabilityScore = this.calculateServiceabilityScore(pricing, operations);
    
    // Determine strategic fit
    const strategicFit = this.determineStrategicFit(pricing, operations);
    
    // Generate reasoning
    const reasoning = this.generateReasoning(request, pricing, operations);
    
    // Generate risk flags
    const riskFlags = this.generateRiskFlags(request, pricing, operations);
    
    // Generate conditions
    const conditions = this.generateConditions(pricing, operations);
    
    // Determine recommendation type
    const recommendationType = this.determineRecommendationType(pricing, operations, riskFlags);
    
    // Determine confidence
    const confidence = this.determineConfidence(pricing, operations, riskFlags);
    
    // Generate strategic summary
    const strategicSummary = this.generateStrategicSummary(request, pricing, operations);
    
    return {
      shouldBid: recommendationType !== 'do-not-bid',
      confidence,
      recommendationType,
      serviceabilityScore,
      strategicFit,
      reasoning,
      conditions,
      riskFlags,
      strategicSummary,
    };
  }

  private validateAgainstMarket(request: PricingRequest, pricing: PricingBreakdown): MarketValidation {
    const benchmarkPrice = MARKET_BENCHMARKS[request.unitType] || MARKET_BENCHMARKS['Single Family Homes'];
    const variancePercent = ((pricing.pricePerUnit - benchmarkPrice) / benchmarkPrice) * 100;
    const isWithinBenchmark = Math.abs(variancePercent) <= (this.config.benchmarkTolerance * 100);
    
    // Determine market position
    const marketPosition = variancePercent < -5 ? 'below' : 
                          variancePercent > 5 ? 'premium' : 'competitive';
    
    // Generate competitive advantages
    const competitiveAdvantages = this.generateCompetitiveAdvantages(request, pricing);
    
    // Generate market risks
    const marketRisks = this.generateMarketRisks(request, pricing, variancePercent);
    
    // Determine validation status
    const validationStatus = isWithinBenchmark ? 'valid' : 
                            Math.abs(variancePercent) > 20 ? 'invalid' : 'warning';
    
    const validationMessage = this.generateValidationMessage(isWithinBenchmark, variancePercent, marketPosition);
    
    return {
      benchmarkPrice,
      variancePercent,
      isWithinBenchmark,
      marketPosition,
      competitiveAdvantages,
      marketRisks,
      validationStatus,
      validationMessage,
    };
  }

  private createMetadata(requestId: string, startTime: number, warnings: string[]): PricingMetadata {
    return {
      requestId,
      timestamp: new Date(),
      version: '1.0.0',
      config: this.config,
      processingTimeMs: Date.now() - startTime,
      warnings,
      errors: [],
    };
  }

  // Helper methods for calculations
  private calculateServiceTime(request: PricingRequest): number {
    let baseTime = 1.5; // Base 1.5 minutes per home
    
    // Add time for additional services
    if (request.services.recycling.required) baseTime += 0.5;
    if (request.services.yardWaste.required) baseTime += 0.7;
    
    // Add time for special access
    if (request.accessType === 'walkout') baseTime += 1.0;
    if (request.isGated) baseTime += 0.3;
    
    return baseTime;
  }

  private calculateDriveTime(request: PricingRequest): number {
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

  private calculateProximityScore(driveTimeMinutes: number): 'close' | 'moderate' | 'far' {
    if (driveTimeMinutes <= 15) return 'close';
    if (driveTimeMinutes <= 30) return 'moderate';
    return 'far';
  }

  private calculateFleetUtilization(request: PricingRequest, serviceTimeMinutes: number): OperationalAnalysis['fleetUtilization'] {
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

  private calculateOperationalCosts(request: PricingRequest, driveTimeMinutes: number, serviceTimeMinutes: number): OperationalAnalysis['operationalCosts'] {
    const totalTimePerVisit = driveTimeMinutes + serviceTimeMinutes;
    const totalMonthlyMinutes = totalTimePerVisit * request.homes;
    const totalMonthlyHours = totalMonthlyMinutes / 60;
    
    // Calculate individual cost components
    const laborCostPerMonth = totalMonthlyHours * this.config.laborRatePerHour;
    const fuelCostPerMonth = (driveTimeMinutes * 2 / 60) * this.config.fuelCostPerMile * 15 * 4.33; // Estimated miles and frequency
    const equipmentCostPerMonth = totalMonthlyHours * this.config.equipmentCostPerHour;
    const disposalCostPerMonth = request.homes * 0.3 * this.config.disposalCostPerTon; // Estimated tons per home
    
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

  private calculatePremiums(request: PricingRequest, basePrice: number): PricingBreakdown['premiums'] {
    const premiums = {
      walkout: 0,
      gated: 0,
      specialContainers: 0,
      multipleServices: 0,
    };
    
    // Walkout premium
    if (request.accessType === 'walkout') {
      premiums.walkout = basePrice * this.config.premiumRules.walkoutPremiumPercent;
    }
    
    // Gated access premium
    if (request.isGated) {
      premiums.gated = this.config.premiumRules.gatedAccessSurcharge;
    }
    
    // Special containers premium
    if (request.hasSpecialContainers) {
      premiums.specialContainers = this.config.premiumRules.specialContainerSurcharge;
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

  private calculateDiscounts(request: PricingRequest, operations: OperationalAnalysis): PricingBreakdown['discounts'] {
    const discounts = {
      volume: 0,
      routeEfficiency: 0,
    };
    
    // Volume discount
    const { volumeDiscounts } = this.config;
    if (request.homes >= volumeDiscounts.tier3.minHomes) {
      discounts.volume = BASE_UNIT_PRICING[request.unitType] * volumeDiscounts.tier3.discountPercent;
    } else if (request.homes >= volumeDiscounts.tier2.minHomes) {
      discounts.volume = BASE_UNIT_PRICING[request.unitType] * volumeDiscounts.tier2.discountPercent;
    } else if (request.homes >= volumeDiscounts.tier1.minHomes) {
      discounts.volume = BASE_UNIT_PRICING[request.unitType] * volumeDiscounts.tier1.discountPercent;
    }
    
    // Route efficiency discount
    if (operations.routeAnalysis.proximityScore === 'close') {
      discounts.routeEfficiency = BASE_UNIT_PRICING[request.unitType] * 0.03; // 3% for close proximity
    }
    
    return discounts;
  }

  private calculateServicesPricing(request: PricingRequest, basePrice: number): PricingBreakdown['servicesPricing'] {
    return {
      trash: request.services.trash.required ? basePrice * 0.6 : 0,
      recycling: request.services.recycling.required ? basePrice * 0.25 : 0,
      yardWaste: request.services.yardWaste.required ? basePrice * 0.15 : 0,
    };
  }

  private calculateServiceabilityScore(pricing: PricingBreakdown, operations: OperationalAnalysis): number {
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

  private determineStrategicFit(pricing: PricingBreakdown, operations: OperationalAnalysis): 'high' | 'medium' | 'low' {
    if (pricing.marginPercent > 0.25 && operations.fleetUtilization.utilizationPercent < 85) {
      return 'high';
    } else if (pricing.marginPercent > 0.15 && operations.fleetUtilization.utilizationPercent < 100) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private generateReasoning(request: PricingRequest, pricing: PricingBreakdown, operations: OperationalAnalysis): string[] {
    const reasoning = [];
    
    reasoning.push(`Fleet utilization: ${operations.fleetUtilization.utilizationPercent.toFixed(1)}% (${operations.fleetUtilization.utilizationPercent < 85 ? 'manageable' : 'high'})`);
    reasoning.push(`Route efficiency: ${operations.routeAnalysis.driveTimeMinutes} min drive time (${operations.routeAnalysis.proximityScore} proximity)`);
    reasoning.push(`Profit margin: ${(pricing.marginPercent * 100).toFixed(1)}% (${pricing.marginPercent > 0.15 ? 'acceptable' : 'low'})`);
    reasoning.push(`Service complexity: ${request.services.trash.required ? 'Trash' : ''}${request.services.recycling.required ? ' + Recycling' : ''}${request.services.yardWaste.required ? ' + Yard Waste' : ''}`);
    
    return reasoning;
  }

  private generateRiskFlags(request: PricingRequest, pricing: PricingBreakdown, operations: OperationalAnalysis): string[] {
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

  private generateConditions(pricing: PricingBreakdown, operations: OperationalAnalysis): string[] {
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

  private determineRecommendationType(pricing: PricingBreakdown, operations: OperationalAnalysis, riskFlags: string[]): 'bid' | 'bid-with-conditions' | 'do-not-bid' {
    if (pricing.marginPercent < 0.05 || operations.fleetUtilization.utilizationPercent > 120) {
      return 'do-not-bid';
    } else if (pricing.marginPercent < 0.15 || riskFlags.length >= 2) {
      return 'bid-with-conditions';
    } else {
      return 'bid';
    }
  }

  private determineConfidence(pricing: PricingBreakdown, operations: OperationalAnalysis, riskFlags: string[]): 'high' | 'medium' | 'low' {
    if (pricing.marginPercent > 0.20 && operations.fleetUtilization.utilizationPercent < 85 && riskFlags.length === 0) {
      return 'high';
    } else if (pricing.marginPercent > 0.10 && operations.fleetUtilization.utilizationPercent < 100 && riskFlags.length <= 1) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private generateStrategicSummary(request: PricingRequest, pricing: PricingBreakdown, operations: OperationalAnalysis): string {
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

  private generateCompetitiveAdvantages(request: PricingRequest, pricing: PricingBreakdown): string[] {
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

  private generateMarketRisks(request: PricingRequest, pricing: PricingBreakdown, variancePercent: number): string[] {
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

  private generateValidationMessage(isWithinBenchmark: boolean, variancePercent: number, marketPosition: string): string {
    if (isWithinBenchmark) {
      return `✅ Pricing within market benchmark range (${variancePercent > 0 ? '+' : ''}${variancePercent.toFixed(1)}%)`;
    } else if (variancePercent > 0) {
      return `⚠️ Pricing exceeds market benchmark by ${variancePercent.toFixed(1)}% (${marketPosition} positioning)`;
    } else {
      return `⚠️ Pricing below market benchmark by ${Math.abs(variancePercent).toFixed(1)}% (${marketPosition} positioning)`;
    }
  }
}

// Export singleton instance
export const pricingService = new PricingService(); 