export const facilities = {
  depot: {
    name: "Vehicle Depot",
    address: "8401 Westpark Dr. McLean VA 22012",
    coords: [38.923867, -77.235103]
  },
  landfillFairfax: {
    name: "Fairfax Landfill",
    address: "4618E West Ox Rd, Fairfax, VA 22030",
    coords: [38.85319175, -77.37514310524120]
  },
  landfillLorton: {
    name: "Lorton Landfill",
    address: "9850 Furnace Rd, Lorton, VA 22079",
    coords: [38.691352122449, -77.2377658367347]
  }
};

// Service zones for subscription customers (polygons defining viable service areas)
export const serviceZones = [
  {
    name: "Dunn Loring Zone",
    coordinates: [
      [-77.2392687, 38.896546],
      [-77.2488818, 38.8820488],
      [-77.2277674, 38.8764362],
      [-77.2169528, 38.8899992],
      [-77.2392687, 38.896546]
    ]
  },
  {
    name: "Polo Fields Zone", 
    coordinates: [
      [-77.3910159, 38.9504015],
      [-77.3929041, 38.9448277],
      [-77.3847502, 38.940355],
      [-77.3810595, 38.9432923],
      [-77.3792564, 38.9453617],
      [-77.3771972, 38.9485993],
      [-77.3825615, 38.9507021],
      [-77.3910159, 38.9504015]
    ]
  }
  // Additional zones can be added here
];

// Utility function to calculate distance between two points (Haversine formula)
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

// Check if a point is inside a polygon (service zone)
export function isPointInPolygon(lat: number, lng: number, polygon: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    if (((polygon[i][1] > lat) !== (polygon[j][1] > lat)) &&
        (lng < (polygon[j][0] - polygon[i][0]) * (lat - polygon[i][1]) / (polygon[j][1] - polygon[i][1]) + polygon[i][0])) {
      inside = !inside;
    }
  }
  return inside;
} 