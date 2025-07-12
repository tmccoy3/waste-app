// Sample Customer Profiles for Similarity Scoring and Pricing Insights
// Based on existing customer data patterns

import { CustomerProfile } from './dynamic-fleet-analysis';

export const SAMPLE_CUSTOMER_PROFILES: CustomerProfile[] = [
  {
    id: 'CUST-001',
    communityType: 'single_family',
    homes: 150,
    binType: '96_gallon',
    specialInstructions: ['garage_access', 'narrow_streets'],
    monthlyCostPerUnit: 28.50,
    laborTimePerHundredHomes: 4.2, // hours per 100 homes
    avgDisposalWeight: 2.1 // tons per 100 homes per month
  },
  {
    id: 'CUST-002',
    communityType: 'single_family',
    homes: 85,
    binType: '96_gallon',
    specialInstructions: ['curbside_only'],
    monthlyCostPerUnit: 31.25,
    laborTimePerHundredHomes: 3.8,
    avgDisposalWeight: 1.9
  },
  {
    id: 'CUST-003',
    communityType: 'condo',
    homes: 240,
    binType: 'dumpster',
    specialInstructions: ['gated_community', 'scheduled_access'],
    monthlyCostPerUnit: 24.75,
    laborTimePerHundredHomes: 2.1, // dumpster service is more efficient
    avgDisposalWeight: 1.6 // condos generate less waste per unit
  },
  {
    id: 'CUST-004',
    communityType: 'townhome',
    homes: 120,
    binType: '96_gallon',
    specialInstructions: ['mixed_access', 'some_garage'],
    monthlyCostPerUnit: 29.00,
    laborTimePerHundredHomes: 3.9,
    avgDisposalWeight: 2.0
  },
  {
    id: 'CUST-005',
    communityType: 'single_family',
    homes: 320,
    binType: '96_gallon',
    specialInstructions: ['large_community', 'multiple_entrances'],
    monthlyCostPerUnit: 25.00, // volume discount
    laborTimePerHundredHomes: 3.5,
    avgDisposalWeight: 2.2
  },
  {
    id: 'CUST-006',
    communityType: 'single_family',
    homes: 45,
    binType: '96_gallon',
    specialInstructions: ['rural_area', 'long_driveways'],
    monthlyCostPerUnit: 34.50, // higher cost for rural
    laborTimePerHundredHomes: 5.8,
    avgDisposalWeight: 2.4
  },
  {
    id: 'CUST-007',
    communityType: 'condo',
    homes: 180,
    binType: 'front_loader',
    specialInstructions: ['commercial_dumpsters', 'daily_service'],
    monthlyCostPerUnit: 22.00,
    laborTimePerHundredHomes: 1.8,
    avgDisposalWeight: 1.4
  },
  {
    id: 'CUST-008',
    communityType: 'townhome',
    homes: 95,
    binType: '96_gallon',
    specialInstructions: ['narrow_streets', 'parking_challenges'],
    monthlyCostPerUnit: 32.75,
    laborTimePerHundredHomes: 4.5,
    avgDisposalWeight: 1.8
  },
  {
    id: 'CUST-009',
    communityType: 'single_family',
    homes: 200,
    binType: '96_gallon',
    specialInstructions: ['standard_curbside'],
    monthlyCostPerUnit: 26.50,
    laborTimePerHundredHomes: 3.6,
    avgDisposalWeight: 2.0
  },
  {
    id: 'CUST-010',
    communityType: 'single_family',
    homes: 75,
    binType: '96_gallon',
    specialInstructions: ['hilly_terrain', 'steep_driveways'],
    monthlyCostPerUnit: 33.00,
    laborTimePerHundredHomes: 4.8,
    avgDisposalWeight: 2.1
  },
  {
    id: 'CUST-011',
    communityType: 'condo',
    homes: 160,
    binType: 'dumpster',
    specialInstructions: ['high_rise', 'loading_dock'],
    monthlyCostPerUnit: 23.25,
    laborTimePerHundredHomes: 1.9,
    avgDisposalWeight: 1.5
  },
  {
    id: 'CUST-012',
    communityType: 'townhome',
    homes: 140,
    binType: '96_gallon',
    specialInstructions: ['mixed_service', 'some_rear_access'],
    monthlyCostPerUnit: 28.75,
    laborTimePerHundredHomes: 4.0,
    avgDisposalWeight: 1.9
  }
];

/**
 * Get customer profiles filtered by community type
 */
export function getCustomersByType(communityType: 'single_family' | 'condo' | 'townhome'): CustomerProfile[] {
  return SAMPLE_CUSTOMER_PROFILES.filter(customer => customer.communityType === communityType);
}

/**
 * Get customer profiles within a home count range
 */
export function getCustomersBySize(minHomes: number, maxHomes: number): CustomerProfile[] {
  return SAMPLE_CUSTOMER_PROFILES.filter(customer => 
    customer.homes >= minHomes && customer.homes <= maxHomes
  );
}

/**
 * Get pricing benchmarks by community type
 */
export function getPricingBenchmarks(communityType?: 'single_family' | 'condo' | 'townhome'): {
  averagePrice: number;
  medianPrice: number;
  priceRange: { min: number; max: number };
  sampleSize: number;
} {
  const relevantCustomers = communityType 
    ? getCustomersByType(communityType)
    : SAMPLE_CUSTOMER_PROFILES;

  const prices = relevantCustomers.map(c => c.monthlyCostPerUnit).sort((a, b) => a - b);
  
  const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const medianPrice = prices[Math.floor(prices.length / 2)];
  
  return {
    averagePrice: Math.round(averagePrice * 100) / 100,
    medianPrice: Math.round(medianPrice * 100) / 100,
    priceRange: {
      min: prices[0],
      max: prices[prices.length - 1]
    },
    sampleSize: prices.length
  };
}

/**
 * Get operational benchmarks by community type
 */
export function getOperationalBenchmarks(communityType?: 'single_family' | 'condo' | 'townhome'): {
  avgLaborHours: number;
  avgDisposalWeight: number;
  efficiencyScore: number; // homes per hour
  sampleSize: number;
} {
  const relevantCustomers = communityType 
    ? getCustomersByType(communityType)
    : SAMPLE_CUSTOMER_PROFILES;

  const avgLaborHours = relevantCustomers.reduce((sum, c) => sum + c.laborTimePerHundredHomes, 0) / relevantCustomers.length;
  const avgDisposalWeight = relevantCustomers.reduce((sum, c) => sum + c.avgDisposalWeight, 0) / relevantCustomers.length;
  const efficiencyScore = 100 / avgLaborHours; // homes per hour

  return {
    avgLaborHours: Math.round(avgLaborHours * 10) / 10,
    avgDisposalWeight: Math.round(avgDisposalWeight * 10) / 10,
    efficiencyScore: Math.round(efficiencyScore * 10) / 10,
    sampleSize: relevantCustomers.length
  };
} 