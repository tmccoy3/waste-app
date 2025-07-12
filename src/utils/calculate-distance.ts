/**
 * Calculate the distance between two geographic points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in miles
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
 * Convert miles to feet
 * @param miles Distance in miles
 * @returns Distance in feet
 */
export function milesToFeet(miles: number): number {
  return miles * 5280;
}

/**
 * Convert feet to miles
 * @param feet Distance in feet
 * @returns Distance in miles
 */
export function feetToMiles(feet: number): number {
  return feet / 5280;
}

/**
 * Format distance for display
 * @param distanceInMiles Distance in miles
 * @returns Formatted string with appropriate units
 */
export function formatDistance(distanceInMiles: number): string {
  const feet = milesToFeet(distanceInMiles);
  
  if (feet < 1000) {
    return `${Math.round(feet)} feet`;
  } else if (distanceInMiles < 1) {
    return `${(feet / 1000).toFixed(1)}k feet`;
  } else {
    return `${distanceInMiles.toFixed(1)} miles`;
  }
} 