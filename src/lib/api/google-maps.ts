// Google Maps API Integration for Route Analysis
// Calculates drive time and distance for route cost modeling

interface GoogleMapsConfig {
  apiKey: string;
  baseUrl: string;
}

interface Location {
  address?: string;
  lat?: number;
  lng?: number;
}

interface RouteResult {
  distance: {
    text: string;
    value: number; // meters
  };
  duration: {
    text: string;
    value: number; // seconds
  };
  status: string;
}

interface DistanceMatrixResponse {
  destination_addresses: string[];
  origin_addresses: string[];
  rows: Array<{
    elements: RouteResult[];
  }>;
  status: string;
}

const GOOGLE_MAPS_CONFIG: GoogleMapsConfig = {
  apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  baseUrl: 'https://maps.googleapis.com/maps/api'
};

/**
 * Calculate drive time and distance between two locations
 */
export async function calculateRouteDistance(
  origin: Location,
  destination: Location
): Promise<{
  distanceMiles: number;
  durationMinutes: number;
  status: string;
  error?: string;
}> {
  try {
    if (!GOOGLE_MAPS_CONFIG.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    // Format locations for API
    const originStr = origin.address || `${origin.lat},${origin.lng}`;
    const destinationStr = destination.address || `${destination.lat},${destination.lng}`;

    const url = `${GOOGLE_MAPS_CONFIG.baseUrl}/distancematrix/json?` +
      `origins=${encodeURIComponent(originStr)}&` +
      `destinations=${encodeURIComponent(destinationStr)}&` +
      `units=imperial&` +
      `key=${GOOGLE_MAPS_CONFIG.apiKey}`;

    console.log(`🗺️ Calculating route: ${originStr} → ${destinationStr}`);

    const response = await fetch(url);
    const data: DistanceMatrixResponse = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${data.status}`);
    }

    const element = data.rows[0]?.elements[0];
    if (!element || element.status !== 'OK') {
      throw new Error(`Route calculation failed: ${element?.status || 'Unknown error'}`);
    }

    // Convert to miles and minutes
    const distanceMiles = element.distance.value * 0.000621371; // meters to miles
    const durationMinutes = element.duration.value / 60; // seconds to minutes

    console.log(`📏 Route calculated: ${distanceMiles.toFixed(1)} miles, ${durationMinutes.toFixed(1)} minutes`);

    return {
      distanceMiles,
      durationMinutes,
      status: 'OK'
    };

  } catch (error) {
    console.error('❌ Route calculation error:', error);
    return {
      distanceMiles: 0,
      durationMinutes: 0,
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Find the closest existing customer to a new location
 */
export async function findClosestCustomer(
  newLocation: Location,
  existingCustomers: Array<{ id: string; address: string; lat?: number; lng?: number }>
): Promise<{
  closestCustomer: any;
  distanceMiles: number;
  durationMinutes: number;
  status: string;
}> {
  try {
    if (existingCustomers.length === 0) {
      return {
        closestCustomer: null,
        distanceMiles: 50, // default assumption for isolated location
        durationMinutes: 60,
        status: 'NO_CUSTOMERS'
      };
    }

    console.log(`🔍 Finding closest customer to new location among ${existingCustomers.length} customers`);

    let closestCustomer = null;
    let minDistance = Infinity;
    let minDuration = Infinity;

    // Check up to 10 customers to avoid API quota issues
    const customersToCheck = existingCustomers.slice(0, 10);

    for (const customer of customersToCheck) {
      const customerLocation: Location = {
        address: customer.address,
        lat: customer.lat,
        lng: customer.lng
      };

      const route = await calculateRouteDistance(newLocation, customerLocation);
      
      if (route.status === 'OK' && route.distanceMiles < minDistance) {
        minDistance = route.distanceMiles;
        minDuration = route.durationMinutes;
        closestCustomer = customer;
      }

      // Small delay to avoid hitting API rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!closestCustomer) {
      return {
        closestCustomer: null,
        distanceMiles: 25, // reasonable default
        durationMinutes: 30,
        status: 'NO_ROUTE_FOUND'
      };
    }

    console.log(`📍 Closest customer: ${closestCustomer.id} at ${minDistance.toFixed(1)} miles`);

    return {
      closestCustomer,
      distanceMiles: minDistance,
      durationMinutes: minDuration,
      status: 'OK'
    };

  } catch (error) {
    console.error('❌ Closest customer search error:', error);
    return {
      closestCustomer: null,
      distanceMiles: 30,
      durationMinutes: 40,
      status: 'ERROR'
    };
  }
}

/**
 * Alternative route calculation using OpenRouteService (free alternative to Google Maps)
 */
interface OpenRouteServiceConfig {
  apiKey: string;
  baseUrl: string;
}

const ORS_CONFIG: OpenRouteServiceConfig = {
  apiKey: process.env.OPENROUTESERVICE_API_KEY || '',
  baseUrl: 'https://api.openrouteservice.org/v2'
};

/**
 * Calculate route using OpenRouteService as fallback
 */
export async function calculateRouteDistanceORS(
  origin: Location,
  destination: Location
): Promise<{
  distanceMiles: number;
  durationMinutes: number;
  status: string;
  error?: string;
}> {
  try {
    if (!ORS_CONFIG.apiKey) {
      // Fallback to estimated calculation
      return estimateRouteDistance(origin, destination);
    }

    // Convert addresses to coordinates if needed
    let originCoords: [number, number];
    let destCoords: [number, number];

    if (origin.lat && origin.lng) {
      originCoords = [origin.lng, origin.lat]; // ORS uses [lng, lat]
    } else {
      throw new Error('Origin coordinates required for ORS');
    }

    if (destination.lat && destination.lng) {
      destCoords = [destination.lng, destination.lat];
    } else {
      throw new Error('Destination coordinates required for ORS');
    }

    const url = `${ORS_CONFIG.baseUrl}/directions/driving-car`;
    const body = {
      coordinates: [originCoords, destCoords],
      format: 'json'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': ORS_CONFIG.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(`ORS API error: ${data.error?.message || response.statusText}`);
    }

    const route = data.routes[0];
    if (!route) {
      throw new Error('No route found');
    }

    const distanceMiles = route.summary.distance * 0.000621371; // meters to miles
    const durationMinutes = route.summary.duration / 60; // seconds to minutes

    console.log(`🗺️ ORS Route: ${distanceMiles.toFixed(1)} miles, ${durationMinutes.toFixed(1)} minutes`);

    return {
      distanceMiles,
      durationMinutes,
      status: 'OK'
    };

  } catch (error) {
    console.error('❌ ORS route calculation error:', error);
    return estimateRouteDistance(origin, destination);
  }
}

/**
 * Estimate route distance using straight-line distance with road factor
 */
function estimateRouteDistance(
  origin: Location,
  destination: Location
): {
  distanceMiles: number;
  durationMinutes: number;
  status: string;
} {
  try {
    if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
      // Default estimates for unknown locations
      return {
        distanceMiles: 15,
        durationMinutes: 25,
        status: 'ESTIMATED'
      };
    }

    // Haversine formula for straight-line distance
    const R = 3959; // Earth's radius in miles
    const dLat = (destination.lat - origin.lat) * Math.PI / 180;
    const dLng = (destination.lng - origin.lng) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightLineDistance = R * c;

    // Apply road factor (roads aren't straight)
    const roadFactor = 1.3; // roads are typically 30% longer than straight line
    const distanceMiles = straightLineDistance * roadFactor;
    
    // Estimate drive time (assume average 35 mph including stops)
    const durationMinutes = (distanceMiles / 35) * 60;

    console.log(`📐 Estimated route: ${distanceMiles.toFixed(1)} miles, ${durationMinutes.toFixed(1)} minutes`);

    return {
      distanceMiles,
      durationMinutes,
      status: 'ESTIMATED'
    };

  } catch (error) {
    console.error('❌ Route estimation error:', error);
    return {
      distanceMiles: 20,
      durationMinutes: 30,
      status: 'DEFAULT'
    };
  }
}

/**
 * Smart route calculation with fallback chain
 */
export async function calculateSmartRoute(
  origin: Location,
  destination: Location
): Promise<{
  distanceMiles: number;
  durationMinutes: number;
  status: string;
  method: 'google' | 'ors' | 'estimated' | 'default';
}> {
  console.log('🧠 Starting smart route calculation...');

  // Try Google Maps first
  if (GOOGLE_MAPS_CONFIG.apiKey) {
    const googleResult = await calculateRouteDistance(origin, destination);
    if (googleResult.status === 'OK') {
      return { ...googleResult, method: 'google' };
    }
  }

  // Try OpenRouteService as fallback
  if (ORS_CONFIG.apiKey) {
    const orsResult = await calculateRouteDistanceORS(origin, destination);
    if (orsResult.status === 'OK') {
      return { ...orsResult, method: 'ors' };
    }
  }

  // Fall back to estimation
  const estimated = estimateRouteDistance(origin, destination);
  return { 
    ...estimated, 
    method: estimated.status === 'ESTIMATED' ? 'estimated' : 'default' 
  };
} 