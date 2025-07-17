/**
 * Customer Clustering & Profitability Analysis
 * Analyzes customer density, distance to clusters, and profitability zones
 */

import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

// Landfill locations
const LANDFILL_LOCATIONS = [
  {
    name: 'I-66 Transfer Station',
    address: '4618E West Ox Rd, Fairfax, VA 22030',
    lat: 38.8551,
    lng: -77.3897
  },
  {
    name: 'Lorton Landfill',
    address: '9850 Furnace Rd, Lorton, VA 22079',
    lat: 38.7034,
    lng: -77.2308
  }
];

interface CustomerLocation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  monthlyRevenue: number;
  customerType: string;
}

interface ProfitabilityAnalysis {
  marginLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  score: number; // 0-100
  reasoning: string[];
  metrics: {
    nearestCustomerDistance: number;
    customerDensity: number;
    nearestLandfillDistance: number;
    clusterSize: number;
    averageRouteDistance: number;
  };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find customers within a radius
 */
function findCustomersInRadius(
  centerLat: number,
  centerLng: number,
  customers: CustomerLocation[],
  radiusMiles: number
): CustomerLocation[] {
  return customers.filter(customer => {
    const distance = calculateDistance(centerLat, centerLng, customer.lat, customer.lng);
    return distance <= radiusMiles;
  });
}

/**
 * Calculate customer density score
 */
function calculateCustomerDensity(
  centerLat: number,
  centerLng: number,
  customers: CustomerLocation[]
): number {
  const radiusOptions = [2, 5, 10]; // miles
  let densityScore = 0;
  
  for (const radius of radiusOptions) {
    const customersInRadius = findCustomersInRadius(centerLat, centerLng, customers, radius);
    const weight = radius === 2 ? 3 : radius === 5 ? 2 : 1; // Closer customers weighted more
    densityScore += (customersInRadius.length / radius) * weight;
  }
  
  return densityScore;
}

/**
 * Find nearest customer and distance
 */
function findNearestCustomer(
  targetLat: number,
  targetLng: number,
  customers: CustomerLocation[]
): { distance: number; customer: CustomerLocation | null } {
  if (customers.length === 0) {
    return { distance: Infinity, customer: null };
  }
  
  let nearest = customers[0];
  let minDistance = calculateDistance(targetLat, targetLng, nearest.lat, nearest.lng);
  
  for (const customer of customers) {
    const distance = calculateDistance(targetLat, targetLng, customer.lat, customer.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = customer;
    }
  }
  
  return { distance: minDistance, customer: nearest };
}

/**
 * Find nearest landfill and distance
 */
function findNearestLandfill(targetLat: number, targetLng: number): { distance: number; landfill: any } {
  let nearest = LANDFILL_LOCATIONS[0];
  let minDistance = calculateDistance(targetLat, targetLng, nearest.lat, nearest.lng);
  
  for (const landfill of LANDFILL_LOCATIONS) {
    const distance = calculateDistance(targetLat, targetLng, landfill.lat, landfill.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = landfill;
    }
  }
  
  return { distance: minDistance, landfill: nearest };
}

/**
 * Calculate cluster size and average route distance
 */
function calculateClusterMetrics(
  centerLat: number,
  centerLng: number,
  customers: CustomerLocation[]
): { clusterSize: number; averageRouteDistance: number } {
  const nearbyCustomers = findCustomersInRadius(centerLat, centerLng, customers, 10);
  
  if (nearbyCustomers.length === 0) {
    return { clusterSize: 0, averageRouteDistance: 0 };
  }
  
  const totalDistance = nearbyCustomers.reduce((sum, customer) => {
    return sum + calculateDistance(centerLat, centerLng, customer.lat, customer.lng);
  }, 0);
  
  return {
    clusterSize: nearbyCustomers.length,
    averageRouteDistance: totalDistance / nearbyCustomers.length
  };
}

/**
 * Analyze profitability based on clustering and distance factors
 */
export async function analyzeProfitability(
  targetLat: number,
  targetLng: number,
  targetAddress: string
): Promise<ProfitabilityAnalysis> {
  console.log(`🔍 Analyzing profitability for location: ${targetAddress}`);
  
  // Get all customers from database
  const customers = await prisma.customer.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      isActive: true
    },
    select: {
      id: true,
      hoaName: true,
      fullAddress: true,
      latitude: true,
      longitude: true,
      monthlyRevenue: true,
      customerType: true
    }
  });
  
  console.log(`📊 Loaded ${customers.length} customers for analysis`);
  
  const customerLocations: CustomerLocation[] = customers.map(c => ({
    id: c.id,
    name: c.hoaName,
    address: c.fullAddress,
    lat: c.latitude!,
    lng: c.longitude!,
    monthlyRevenue: Number(c.monthlyRevenue),
    customerType: c.customerType
  }));
  
  // Calculate metrics
  const nearestCustomer = findNearestCustomer(targetLat, targetLng, customerLocations);
  const customerDensity = calculateCustomerDensity(targetLat, targetLng, customerLocations);
  const nearestLandfill = findNearestLandfill(targetLat, targetLng);
  const clusterMetrics = calculateClusterMetrics(targetLat, targetLng, customerLocations);
  
  console.log(`📏 Nearest customer: ${nearestCustomer.distance.toFixed(2)} miles`);
  console.log(`🏘️ Customer density score: ${customerDensity.toFixed(2)}`);
  console.log(`🏗️ Nearest landfill: ${nearestLandfill.distance.toFixed(2)} miles (${nearestLandfill.landfill.name})`);
  console.log(`📍 Cluster size: ${clusterMetrics.clusterSize} customers`);
  
  // Calculate profitability score and level
  let score = 0;
  const reasoning: string[] = [];
  
  // Factor 1: Distance to nearest customer (30% weight)
  const nearestDistance = nearestCustomer.distance;
  if (nearestDistance <= 2) {
    score += 30;
    reasoning.push(`Very close to existing customers (${nearestDistance.toFixed(1)} miles)`);
  } else if (nearestDistance <= 5) {
    score += 20;
    reasoning.push(`Moderately close to existing customers (${nearestDistance.toFixed(1)} miles)`);
  } else if (nearestDistance <= 10) {
    score += 10;
    reasoning.push(`Some distance from existing customers (${nearestDistance.toFixed(1)} miles)`);
  } else {
    score += 0;
    reasoning.push(`Far from existing customers (${nearestDistance.toFixed(1)} miles) - requires isolated route`);
  }
  
  // Factor 2: Customer density (25% weight)
  if (customerDensity >= 15) {
    score += 25;
    reasoning.push(`High customer density area - excellent route optimization potential`);
  } else if (customerDensity >= 8) {
    score += 18;
    reasoning.push(`Good customer density - decent route optimization potential`);
  } else if (customerDensity >= 3) {
    score += 10;
    reasoning.push(`Moderate customer density - limited route optimization`);
  } else {
    score += 0;
    reasoning.push(`Low customer density - poor route optimization potential`);
  }
  
  // Factor 3: Distance to landfill (20% weight)
  const landfillDistance = nearestLandfill.distance;
  if (landfillDistance <= 15) {
    score += 20;
    reasoning.push(`Close to landfill (${landfillDistance.toFixed(1)} miles to ${nearestLandfill.landfill.name})`);
  } else if (landfillDistance <= 25) {
    score += 12;
    reasoning.push(`Moderate distance to landfill (${landfillDistance.toFixed(1)} miles to ${nearestLandfill.landfill.name})`);
  } else {
    score += 0;
    reasoning.push(`Far from landfill (${landfillDistance.toFixed(1)} miles to ${nearestLandfill.landfill.name}) - high disposal costs`);
  }
  
  // Factor 4: Cluster size (15% weight)
  if (clusterMetrics.clusterSize >= 10) {
    score += 15;
    reasoning.push(`Large customer cluster nearby (${clusterMetrics.clusterSize} customers)`);
  } else if (clusterMetrics.clusterSize >= 5) {
    score += 10;
    reasoning.push(`Medium customer cluster nearby (${clusterMetrics.clusterSize} customers)`);
  } else if (clusterMetrics.clusterSize >= 2) {
    score += 5;
    reasoning.push(`Small customer cluster nearby (${clusterMetrics.clusterSize} customers)`);
  } else {
    score += 0;
    reasoning.push(`No significant customer cluster nearby - isolated location`);
  }
  
  // Factor 5: Average route distance within cluster (10% weight)
  if (clusterMetrics.averageRouteDistance <= 3) {
    score += 10;
    reasoning.push(`Tight cluster with short distances between stops`);
  } else if (clusterMetrics.averageRouteDistance <= 6) {
    score += 6;
    reasoning.push(`Moderate distances between stops in cluster`);
  } else {
    score += 0;
    reasoning.push(`Large distances between stops - inefficient routing`);
  }
  
  // Determine margin level
  let marginLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  if (score >= 70) {
    marginLevel = 'HIGH';
  } else if (score >= 40) {
    marginLevel = 'MEDIUM';
  } else {
    marginLevel = 'LOW';
  }
  
  console.log(`💰 Profitability analysis complete: ${marginLevel} margin (${score}/100)`);
  
  return {
    marginLevel,
    score,
    reasoning,
    metrics: {
      nearestCustomerDistance: nearestDistance,
      customerDensity,
      nearestLandfillDistance: landfillDistance,
      clusterSize: clusterMetrics.clusterSize,
      averageRouteDistance: clusterMetrics.averageRouteDistance
    }
  };
}

/**
 * Generate recommendation explanation based on profitability analysis
 */
export function generateProfitabilityExplanation(analysis: ProfitabilityAnalysis): string {
  const { marginLevel, score, reasoning, metrics } = analysis;
  
  switch (marginLevel) {
    case 'HIGH':
      return `High margin customer (${score}/100 score). This location is excellent for profitability due to: ${reasoning.slice(0, 2).join(', ')}. Dense customer area with optimized routing potential.`;
    
    case 'MEDIUM':
      return `Medium margin customer (${score}/100 score). This location offers moderate profitability. Key factors: ${reasoning.slice(0, 2).join(', ')}. Some route optimization possible but with limitations.`;
    
    case 'LOW':
      return `Low margin customer (${score}/100 score). This location presents profitability challenges: ${reasoning.filter(r => r.includes('Far') || r.includes('Low') || r.includes('isolated')).join(', ')}. Would require careful pricing and route planning.`;
    
    default:
      return `Unable to determine profitability level for this location.`;
  }
} 