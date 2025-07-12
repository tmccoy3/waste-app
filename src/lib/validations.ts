import { z } from 'zod';

// Customer Data Validation
export const CustomerSchema = z.object({
  'HOA Name': z.string().min(1, 'HOA Name is required'),
  'Monthly Revenue': z.string().regex(/^\$?[\d,]+\.?\d*$/, 'Invalid revenue format'),
  'Full Address': z.string().min(1, 'Address is required'),
  'Average Completion Time in Minutes': z.string().regex(/^\d+\.?\d*$/, 'Invalid time format'),
  'Service Status': z.enum(['Serviced', 'Pending', 'Cancelled'], {
    errorMap: () => ({ message: 'Service status must be Serviced, Pending, or Cancelled' })
  }),
  'Unit Type': z.string().optional(),
  'Type': z.enum(['HOA', 'Subscription', 'Commercial'], {
    errorMap: () => ({ message: 'Type must be HOA, Subscription, or Commercial' })
  }),
  'Number of Units': z.string().regex(/^\d+$/, 'Number of units must be a number').optional(),
});

export const CustomerArraySchema = z.array(CustomerSchema);

// Parsed Customer Data (for internal use)
export const ParsedCustomerSchema = z.object({
  hoaName: z.string().min(1),
  monthlyRevenue: z.number().min(0),
  fullAddress: z.string().min(1),
  averageCompletionTime: z.number().min(0),
  serviceStatus: z.enum(['Serviced', 'Pending', 'Cancelled']),
  unitType: z.string().optional(),
  type: z.enum(['HOA', 'Subscription', 'Commercial']),
  numberOfUnits: z.number().int().min(0).optional(),
});

// Metrics Validation
export const MetricsSchema = z.object({
  activeCustomers: z.number().int().min(0),
  monthlyRevenue: z.number().min(0),
  hoaAvgTime: z.number().min(0),
  revenuePerMinute: z.number().min(0),
  efficiencyGain: z.number(),
});

// Chart Data Validation
export const RevenueTrendSchema = z.object({
  month: z.string().min(1),
  HOA: z.number().min(0),
  Subscription: z.number().min(0),
  Commercial: z.number().min(0),
  growth: z.string().regex(/^[+-]?\d+\.?\d*%$/, 'Invalid growth format'),
});

export const EfficiencyScoreSchema = z.object({
  name: z.string().min(1),
  value: z.number().min(0).max(100),
  count: z.number().int().min(0),
});

// Business Valuation Validation
export const BusinessValuationInputSchema = z.object({
  adjustedRevenue: z.number().min(0),
  customMargin: z.number().min(0).max(100),
  customIRR: z.number().min(0).max(100),
  revenueMultiple: z.number().min(0),
  ebitdaMultiple: z.number().min(0),
  ebitdaMargin: z.number().min(0).max(100),
  valuationMethod: z.enum(['irr', 'revenue-multiple', 'ebitda-multiple']),
});

// Service Profile Validation (for pricing engine)
export const ServiceProfileSchema = z.object({
  homes: z.number().int().min(1),
  unitType: z.enum(['Single Family Homes', 'Townhomes', 'Condos', 'Mixed Residential', 'Unknown']),
  unitBreakdown: z.object({
    singleFamily: z.number().int().min(0).optional(),
    townhomes: z.number().int().min(0).optional(),
    condos: z.number().int().min(0).optional(),
  }).optional(),
  trashFrequency: z.enum(['weekly', 'twice-weekly', 'three-times-weekly']),
  recyclingRequired: z.boolean(),
  yardWasteRequired: z.boolean(),
  isWalkout: z.boolean(),
  isGated: z.boolean(),
  hasSpecialContainers: z.boolean(),
  location: z.string().min(1),
  specialRequirements: z.array(z.string()),
  containerRequirements: z.object({
    trashSize: z.number().int().min(0).optional(),
    recyclingSize: z.number().int().min(0).optional(),
    condoContainers: z.number().int().min(0).optional(),
  }).optional(),
});

// Pricing Engine Config Validation
export const PricingEngineConfigSchema = z.object({
  targetMargin: z.number().min(0).max(1),
  maxMargin: z.number().min(0).max(1),
  benchmarkTolerance: z.number().min(0).max(1),
  placeholderCostPerUnit: z.number().min(0),
});

// API Response Validation
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

// Form Validation Schemas
export const SearchFormSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  filters: z.object({
    type: z.enum(['HOA', 'Subscription', 'Commercial', 'All']).optional(),
    status: z.enum(['Serviced', 'Pending', 'Cancelled', 'All']).optional(),
    minRevenue: z.number().min(0).optional(),
    maxRevenue: z.number().min(0).optional(),
  }).optional(),
});

export const PaginationSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  total: z.number().int().min(0),
});

// Error Handling Schemas
export const ErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.any().optional(),
  timestamp: z.date().optional(),
});

export const ValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string(),
  received: z.any().optional(),
});

// Utility Functions
export function parseCustomerData(data: unknown): z.infer<typeof CustomerSchema>[] {
  const result = CustomerArraySchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid customer data: ${result.error.message}`);
  }
  return result.data;
}

export function parseMetrics(data: unknown): z.infer<typeof MetricsSchema> {
  const result = MetricsSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid metrics data: ${result.error.message}`);
  }
  return result.data;
}

export function validateServiceProfile(data: unknown): z.infer<typeof ServiceProfileSchema> {
  const result = ServiceProfileSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid service profile: ${result.error.message}`);
  }
  return result.data;
}

export function validateBusinessValuationInput(data: unknown): z.infer<typeof BusinessValuationInputSchema> {
  const result = BusinessValuationInputSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid business valuation input: ${result.error.message}`);
  }
  return result.data;
}

// Type exports
export type Customer = z.infer<typeof CustomerSchema>;
export type ParsedCustomer = z.infer<typeof ParsedCustomerSchema>;
export type Metrics = z.infer<typeof MetricsSchema>;
export type RevenueTrend = z.infer<typeof RevenueTrendSchema>;
export type EfficiencyScore = z.infer<typeof EfficiencyScoreSchema>;
export type BusinessValuationInput = z.infer<typeof BusinessValuationInputSchema>;
export type ServiceProfile = z.infer<typeof ServiceProfileSchema>;
export type PricingEngineConfig = z.infer<typeof PricingEngineConfigSchema>;
export type ApiResponse = z.infer<typeof ApiResponseSchema>;
export type SearchForm = z.infer<typeof SearchFormSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type AppError = z.infer<typeof ErrorSchema>; 