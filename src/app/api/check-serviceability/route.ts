import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

interface ExistingCustomer {
  'HOA Name': string;
  'Monthly Revenue': string;
  'Full Address': string;
  latitude: string;
  longitude: string;
  Type: 'HOA' | 'Subscription';
  'Number of Units': string;
  'Average Completion Time in Minutes': string;
}

interface ServiceabilityRequest {
  address: string;
  customerType: 'Single-Family' | 'HOA';
  latitude: number;
  longitude: number;
  numberOfCarts?: number;
  specialNotes?: string;
}

interface ServiceabilityResponse {
  address: string;
  customerType: 'Single-Family' | 'HOA';
  serviceable: boolean;
  recommendation: 'Auto Approve' | 'Review Manually' | 'Decline';
  suggestedPrice: number;
  nearestCustomerDistance: string;
  driveTimeMinutes: number;
  reason: string;
  breakdown: {
    proximityScore: {
      value: number;
      status: 'excellent' | 'good' | 'poor';
      driveTime: number;
      distance: number;
    };
    routeIntegration: {
      value: number;
      status: 'excellent' | 'good' | 'poor';
      compatibility: 'seamless' | 'moderate' | 'deviation';
    };
    customerDensity: {
      value: number;
      status: 'excellent' | 'good' | 'poor';
      customersWithin1Mile: number;
      routeDensity: 'High' | 'Medium' | 'Low';
    };
    estimatedProfitability: {
      value: number;
      status: 'excellent' | 'good' | 'poor';
      monthlyProfit: number;
      marginPercentage: number;
    };
  };
  proximityDetails: {
    nearestCustomers: Array<{
      name: string;
      distance: number;
      driveTime: number;
      type: string;
    }>;
    routeDensity: 'High' | 'Medium' | 'Low';
    customersWithin1Mile: number;
  };
}

// Haversine formula to calculate distance between two points
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

// Simulate drive time based on distance and route conditions
function estimateDriveTime(distanceMiles: number, routeDensity: 'High' | 'Medium' | 'Low'): number {
  // Base calculation: distance in miles * average speed factor
  let avgSpeedMph = 25; // Urban/suburban average
  
  // Adjust for route density (traffic, stops, etc.)
  switch (routeDensity) {
    case 'High':
      avgSpeedMph = 20; // More stops, slower
      break;
    case 'Medium':
      avgSpeedMph = 25; // Moderate
      break;
    case 'Low':
      avgSpeedMph = 30; // Fewer stops, faster
      break;
  }
  
  // Add base time for stops and service
  const baseMinutes = 2; // Time for stops, turns, etc.
  const driveMinutes = (distanceMiles / avgSpeedMph) * 60;
  
  return Math.round(driveMinutes + baseMinutes);
}

// Parse revenue string to number
function parseRevenue(revenueStr: string): number {
  if (!revenueStr || typeof revenueStr !== 'string') {
    return 0;
  }
  return parseFloat(revenueStr.replace(/[$,]/g, ''));
}

// Calculate suggested pricing based on route density and proximity
function calculateSuggestedPrice(
  routeDensity: 'High' | 'Medium' | 'Low',
  nearestDistance: number,
  customersWithin1Mile: number,
  driveTime: number,
  numberOfCarts: number = 1
): number {
  let basePrice = 30; // Default base price

  // Adjust based on route density and drive time efficiency
  if (routeDensity === 'High' && driveTime <= 5) {
    basePrice = 26; // Efficient route
  } else if (routeDensity === 'Medium' && driveTime <= 8) {
    basePrice = 30; // Moderate efficiency
  } else {
    basePrice = 36; // Inefficient route
  }

  // Adjust based on customer density within 1 mile
  if (customersWithin1Mile >= 10) {
    basePrice -= 3; // High density discount
  } else if (customersWithin1Mile >= 5) {
    basePrice -= 1; // Medium density discount
  } else if (customersWithin1Mile < 2) {
    basePrice += 5; // Low density premium
  }

  // Drive time penalty/bonus
  if (driveTime > 15) {
    basePrice += 6; // Long drive time penalty
  } else if (driveTime <= 3) {
    basePrice -= 2; // Very close bonus
  }

  // Adjust for number of carts
  if (numberOfCarts > 1) {
    basePrice += (numberOfCarts - 1) * 8; // Additional $8 per extra cart
  }

  // Ensure minimum price
  return Math.max(basePrice, 24);
}

// Calculate proximity score based on drive time
function calculateProximityScore(driveTime: number, nearestDistance: number): { value: number; status: 'excellent' | 'good' | 'poor' } {
  let score = 100;
  let status: 'excellent' | 'good' | 'poor' = 'excellent';

  if (driveTime <= 5) {
    score = 95;
    status = 'excellent';
  } else if (driveTime <= 10) {
    score = 80;
    status = 'good';
  } else if (driveTime <= 15) {
    score = 60;
    status = 'good';
  } else {
    score = 30;
    status = 'poor';
  }

  // Additional distance penalty
  if (nearestDistance > 2) {
    score -= 15;
    status = score > 70 ? 'good' : 'poor';
  }

  return { value: Math.max(score, 0), status };
}

// Calculate route integration score
function calculateRouteIntegration(customersWithin1Mile: number, driveTime: number): { value: number; status: 'excellent' | 'good' | 'poor'; compatibility: 'seamless' | 'moderate' | 'deviation' } {
  let score = 50;
  let compatibility: 'seamless' | 'moderate' | 'deviation' = 'deviation';
  let status: 'excellent' | 'good' | 'poor' = 'poor';

  if (customersWithin1Mile >= 8 && driveTime <= 8) {
    score = 95;
    compatibility = 'seamless';
    status = 'excellent';
  } else if (customersWithin1Mile >= 4 && driveTime <= 12) {
    score = 75;
    compatibility = 'moderate';
    status = 'good';
  } else if (customersWithin1Mile >= 2) {
    score = 55;
    compatibility = 'moderate';
    status = 'good';
  } else {
    score = 25;
    compatibility = 'deviation';
    status = 'poor';
  }

  return { value: score, status, compatibility };
}

// Calculate customer density score
function calculateCustomerDensity(customersWithin1Mile: number): { value: number; status: 'excellent' | 'good' | 'poor'; routeDensity: 'High' | 'Medium' | 'Low' } {
  let score = 0;
  let status: 'excellent' | 'good' | 'poor' = 'poor';
  let routeDensity: 'High' | 'Medium' | 'Low' = 'Low';

  if (customersWithin1Mile >= 10) {
    score = 95;
    status = 'excellent';
    routeDensity = 'High';
  } else if (customersWithin1Mile >= 5) {
    score = 75;
    status = 'good';
    routeDensity = 'Medium';
  } else if (customersWithin1Mile >= 2) {
    score = 50;
    status = 'good';
    routeDensity = 'Medium';
  } else {
    score = 20;
    status = 'poor';
    routeDensity = 'Low';
  }

  return { value: score, status, routeDensity };
}

// Calculate estimated profitability
function calculateProfitability(suggestedPrice: number, driveTime: number, routeDensity: 'High' | 'Medium' | 'Low'): { value: number; status: 'excellent' | 'good' | 'poor'; monthlyProfit: number; marginPercentage: number } {
  // Estimate monthly costs based on drive time and route efficiency
  const laborCostPerMinute = 0.75; // $45/hour driver cost
  const fuelCostPerMinute = 0.20; // Fuel and vehicle costs
  const equipmentCostPerService = 1.50; // Equipment depreciation
  
  const serviceTimeMinutes = driveTime + 3; // 3 minutes for actual service
  const serviceCost = (serviceTimeMinutes * (laborCostPerMinute + fuelCostPerMinute)) + equipmentCostPerService;
  
  // Weekly service cost (assuming weekly pickup)
  const weeklyCost = serviceCost;
  const monthlyCost = weeklyCost * 4.33; // Average weeks per month
  
  const monthlyRevenue = suggestedPrice * 4.33; // Weekly service
  const monthlyProfit = monthlyRevenue - monthlyCost;
  const marginPercentage = (monthlyProfit / monthlyRevenue) * 100;
  
  let score = 0;
  let status: 'excellent' | 'good' | 'poor' = 'poor';
  
  if (marginPercentage >= 60) {
    score = 95;
    status = 'excellent';
  } else if (marginPercentage >= 45) {
    score = 80;
    status = 'good';
  } else if (marginPercentage >= 30) {
    score = 60;
    status = 'good';
  } else {
    score = 30;
    status = 'poor';
  }
  
  return { 
    value: score, 
    status, 
    monthlyProfit: Math.round(monthlyProfit), 
    marginPercentage: Math.round(marginPercentage * 10) / 10 
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: ServiceabilityRequest = await req.json();
    
    // Validate input
    if (!body.address || !body.customerType || !body.latitude || !body.longitude) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: address, customerType, latitude, longitude'
      }, { status: 400 });
    }

    // HOA Auto-Approval Logic
    if (body.customerType === 'HOA') {
      const response: ServiceabilityResponse = {
        address: body.address,
        customerType: 'HOA',
        serviceable: true,
        recommendation: 'Auto Approve',
        suggestedPrice: 28,
        nearestCustomerDistance: 'N/A - HOA Auto-Approved',
        driveTimeMinutes: 0,
        reason: 'HOA customers are automatically approved. HOAs provide consistent revenue and are always serviceable.',
        breakdown: {
          proximityScore: { value: 100, status: 'excellent', driveTime: 0, distance: 0 },
          routeIntegration: { value: 100, status: 'excellent', compatibility: 'seamless' },
          customerDensity: { value: 100, status: 'excellent', customersWithin1Mile: 0, routeDensity: 'High' },
          estimatedProfitability: { value: 100, status: 'excellent', monthlyProfit: 85, marginPercentage: 70 }
        },
        proximityDetails: {
          nearestCustomers: [],
          routeDensity: 'High',
          customersWithin1Mile: 0
        }
      };

      return NextResponse.json({
        success: true,
        data: response
      });
    }

    // Load existing customer data
    const dataPath = join(process.cwd(), 'data', 'geocoded_customers.json');
    const fileContent = readFileSync(dataPath, 'utf8');
    const existingCustomers: ExistingCustomer[] = JSON.parse(fileContent);

    // Calculate distances to all existing customers
    const customerDistances = existingCustomers.map(customer => {
      const distance = calculateDistance(
        body.latitude,
        body.longitude,
        parseFloat(customer.latitude),
        parseFloat(customer.longitude)
      );
      
      return {
        customer,
        distance,
      };
    });

    // Sort by distance
    customerDistances.sort((a, b) => a.distance - b.distance);

    // Find customers within 1 mile
    const customersWithin1Mile = customerDistances.filter(c => c.distance <= 1);

    // Determine route density based on customer concentration
    const densityData = calculateCustomerDensity(customersWithin1Mile.length);
    const routeDensity = densityData.routeDensity;

    // Calculate drive time to nearest customer
    const nearestDistance = customerDistances[0]?.distance || 999;
    const driveTime = estimateDriveTime(nearestDistance, routeDensity);

    // Get nearest customers for detailed analysis
    const nearestCustomers = customerDistances.slice(0, 5).map(c => ({
      name: c.customer['HOA Name'],
      distance: Math.round(c.distance * 100) / 100, // Round to 2 decimal places
      driveTime: estimateDriveTime(c.distance, routeDensity),
      type: c.customer.Type
    }));

    // Calculate suggested price
    const suggestedPrice = calculateSuggestedPrice(
      routeDensity,
      nearestDistance,
      customersWithin1Mile.length,
      driveTime,
      body.numberOfCarts || 1
    );

    // Calculate all breakdown scores
    const proximityScore = calculateProximityScore(driveTime, nearestDistance);
    const routeIntegration = calculateRouteIntegration(customersWithin1Mile.length, driveTime);
    const customerDensity = calculateCustomerDensity(customersWithin1Mile.length);
    const profitability = calculateProfitability(suggestedPrice, driveTime, routeDensity);

    // Calculate overall recommendation based on all factors
    const averageScore = (proximityScore.value + routeIntegration.value + customerDensity.value + profitability.value) / 4;
    
    let recommendation: 'Auto Approve' | 'Review Manually' | 'Decline';
    if (averageScore >= 80) {
      recommendation = 'Auto Approve';
    } else if (averageScore >= 50) {
      recommendation = 'Review Manually';
    } else {
      recommendation = 'Decline';
    }

    // Generate enhanced reason
    let reason = '';
    if (recommendation === 'Auto Approve') {
      reason = `Excellent location with ${driveTime}-minute drive time to nearest customer. High route efficiency and strong profitability projections.`;
    } else if (recommendation === 'Review Manually') {
      reason = `Moderate location requiring ${driveTime} minutes drive time. ${customersWithin1Mile.length} customers within 1 mile. Manual review recommended for route optimization.`;
    } else {
      reason = `Poor location with ${driveTime}-minute drive time and limited route integration. Low profitability due to route inefficiency.`;
    }

    const response: ServiceabilityResponse = {
      address: body.address,
      customerType: 'Single-Family',
      serviceable: recommendation !== 'Decline',
      recommendation,
      suggestedPrice,
      nearestCustomerDistance: `${Math.round(nearestDistance * 100) / 100} miles`,
      driveTimeMinutes: driveTime,
      reason,
      breakdown: {
        proximityScore: {
          ...proximityScore,
          driveTime,
          distance: Math.round(nearestDistance * 100) / 100
        },
        routeIntegration,
        customerDensity: {
          ...customerDensity,
          customersWithin1Mile: customersWithin1Mile.length
        },
        estimatedProfitability: profitability
      },
      proximityDetails: {
        nearestCustomers,
        routeDensity,
        customersWithin1Mile: customersWithin1Mile.length
      }
    };

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Serviceability check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check serviceability'
    }, { status: 500 });
  }
} 