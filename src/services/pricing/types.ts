/**
 * Pricing Service - Type Definitions
 * Clean interfaces for pricing microservice
 */

// Input Types
export interface PricingRequest {
  // Basic service requirements
  communityName: string;
  locationName: string;
  homes: number;
  unitType: 'Single Family Homes' | 'Townhomes' | 'Condos' | 'Mixed Residential';
  
  // Service configuration
  services: ServiceConfiguration;
  
  // Special requirements
  accessType: 'curbside' | 'walkout' | 'dumpster';
  isGated: boolean;
  hasSpecialContainers: boolean;
  specialRequirements: string[];
  
  // Contract terms
  contractLength: number;
  startDate: string;
  fuelSurchargeAllowed: boolean;
  
  // Optional operational data
  coordinates?: {
    lat?: number;
    lng?: number;
    address?: string;
  };
}

export interface ServiceConfiguration {
  trash: {
    frequency: 'weekly' | 'twice-weekly' | 'three-times-weekly';
    required: boolean;
  };
  recycling: {
    frequency: 'weekly' | 'bi-weekly';
    required: boolean;
  };
  yardWaste: {
    frequency: 'weekly' | 'bi-weekly' | 'seasonal';
    required: boolean;
  };
}

// Output Types
export interface PricingResponse {
  // Core pricing results
  pricing: PricingBreakdown;
  
  // Operational analysis
  operations: OperationalAnalysis;
  
  // Strategic recommendation
  recommendation: PricingRecommendation;
  
  // Market validation
  validation: MarketValidation;
  
  // Metadata
  metadata: PricingMetadata;
}

export interface PricingBreakdown {
  // Unit pricing
  pricePerUnit: number;
  totalMonthlyRevenue: number;
  
  // Cost breakdown
  basePrice: number;
  premiums: {
    walkout: number;
    gated: number;
    specialContainers: number;
    multipleServices: number;
  };
  discounts: {
    volume: number;
    routeEfficiency: number;
  };
  
  // Service-specific pricing
  servicesPricing: {
    trash: number;
    recycling: number;
    yardWaste: number;
  };
  
  // Financial metrics
  marginPercent: number;
  profitPerUnit: number;
  totalMonthlyProfit: number;
}

export interface OperationalAnalysis {
  // Fleet requirements
  fleetUtilization: {
    currentCapacity: number;
    requiredCapacity: number;
    utilizationPercent: number;
    additionalTrucksNeeded: number;
  };
  
  // Route analysis
  routeAnalysis: {
    driveTimeMinutes: number;
    serviceTimeMinutes: number;
    totalTimePerVisit: number;
    proximityScore: 'close' | 'moderate' | 'far';
  };
  
  // Cost analysis
  operationalCosts: {
    laborCostPerMonth: number;
    fuelCostPerMonth: number;
    equipmentCostPerMonth: number;
    disposalCostPerMonth: number;
    totalCostPerMonth: number;
    costPerUnit: number;
  };
}

export interface PricingRecommendation {
  // Decision
  shouldBid: boolean;
  confidence: 'high' | 'medium' | 'low';
  recommendationType: 'bid' | 'bid-with-conditions' | 'do-not-bid';
  
  // Scoring
  serviceabilityScore: number; // 0-100
  strategicFit: 'high' | 'medium' | 'low';
  
  // Reasoning
  reasoning: string[];
  conditions: string[];
  riskFlags: string[];
  
  // Strategic summary
  strategicSummary: string;
}

export interface MarketValidation {
  // Benchmark comparison
  benchmarkPrice: number;
  variancePercent: number;
  isWithinBenchmark: boolean;
  
  // Market analysis
  marketPosition: 'below' | 'competitive' | 'premium';
  competitiveAdvantages: string[];
  marketRisks: string[];
  
  // Validation status
  validationStatus: 'valid' | 'warning' | 'invalid';
  validationMessage: string;
}

export interface PricingMetadata {
  // Request info
  requestId: string;
  timestamp: Date;
  version: string;
  
  // Configuration used
  config: PricingConfig;
  
  // Processing info
  processingTimeMs: number;
  warnings: string[];
  errors: string[];
}

export interface PricingConfig {
  // Margin targets
  targetMargin: number;
  minimumMargin: number;
  maximumMargin: number;
  
  // Benchmark tolerances
  benchmarkTolerance: number;
  
  // Operational parameters
  laborRatePerHour: number;
  fuelCostPerMile: number;
  equipmentCostPerHour: number;
  disposalCostPerTon: number;
  
  // Pricing rules
  premiumRules: {
    walkoutPremiumPercent: number;
    gatedAccessSurcharge: number;
    specialContainerSurcharge: number;
  };
  
  // Volume discounts
  volumeDiscounts: {
    tier1: { minHomes: number; discountPercent: number };
    tier2: { minHomes: number; discountPercent: number };
    tier3: { minHomes: number; discountPercent: number };
  };
}

// Error Types
export class PricingServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PricingServiceError';
  }
}

export interface PricingValidationError {
  field: string;
  message: string;
  code: string;
}

// Service Interface
export interface IPricingService {
  calculatePricing(request: PricingRequest): Promise<PricingResponse>;
  validateRequest(request: PricingRequest): PricingValidationError[];
  getConfig(): PricingConfig;
  updateConfig(config: Partial<PricingConfig>): void;
} 