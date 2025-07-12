// Fleet Analysis Library for Operational Feasibility
// Handles truck capacity, routing, and service stream optimization

interface Customer {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  units: number;
  trashDays: string;
  recyclingDays: string;
  yardWasteDays: string;
  completionTime: number;
  type: 'HOA' | 'Subscription';
}

interface FleetConfig {
  totalTrucks: number;
  homesPerTruckPerDay: number;
  hoursPerDay: number;
  daysPerWeek: number;
}

interface ServiceStream {
  type: 'trash' | 'recycling' | 'yardwaste';
  frequency: string; // e.g., "Monday/Thursday", "Wednesday"
  homesServed: number;
  timeRequired: number; // minutes
}

interface RouteAnalysis {
  distanceToNearestCustomer: number; // miles
  driveTimeToLocation: number; // minutes
  routeExtensionCost: number; // additional cost per month
  efficiencyImpact: number; // percentage change in route efficiency
}

interface FleetCapacityAnalysis {
  currentUtilization: number; // percentage of fleet capacity used
  canAccommodateNewContract: boolean;
  additionalTrucksNeeded: number;
  serviceStreamConflicts: string[];
  capacityAfterNewContract: number; // percentage
}

interface OperationalFeasibility {
  fleetCapacity: FleetCapacityAnalysis;
  routing: RouteAnalysis;
  serviceCompatibility: {
    trashCompatible: boolean;
    recyclingCompatible: boolean;
    yardWasteCompatible: boolean;
    conflicts: string[];
  };
  costImpact: {
    additionalTruckCost: number;
    routingCost: number;
    totalAdditionalCost: number;
    marginImpact: number; // percentage points
  };
  recommendation: {
    feasible: boolean;
    conditions: string[];
    riskLevel: 'low' | 'medium' | 'high';
  };
}

// Default fleet configuration
const DEFAULT_FLEET_CONFIG: FleetConfig = {
  totalTrucks: 3,
  homesPerTruckPerDay: 600,
  hoursPerDay: 10,
  daysPerWeek: 5
};

// Truck operating costs
const TRUCK_COSTS = {
  monthlyTruckCost: 8500, // Monthly cost for additional truck (lease, insurance, maintenance)
  fuelCostPerMile: 0.65,
  driverCostPerHour: 24,
  helperCostPerHour: 20
};

/**
 * Calculate distance between two points using Haversine formula
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
 * Parse service frequency string into days per week
 */
function parseServiceFrequency(frequency: string): number {
  if (!frequency) return 1;
  const days = frequency.toLowerCase().split('/').length;
  return Math.max(1, days);
}

/**
 * Analyze current fleet utilization based on existing customers
 */
export function analyzeCurrentFleetUtilization(customers: Customer[], config: FleetConfig = DEFAULT_FLEET_CONFIG): FleetCapacityAnalysis {
  // Calculate current workload by day
  const dailyWorkload = {
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0
  };

  // Process each customer's service requirements
  customers.forEach(customer => {
    const trashDays = customer.trashDays?.toLowerCase() || '';
    const recyclingDays = customer.recyclingDays?.toLowerCase() || '';
    const yardWasteDays = customer.yardWasteDays?.toLowerCase() || '';

    // Add workload for each service type
    [trashDays, recyclingDays, yardWasteDays].forEach(serviceDay => {
      if (serviceDay.includes('monday')) dailyWorkload.monday += customer.units;
      if (serviceDay.includes('tuesday')) dailyWorkload.tuesday += customer.units;
      if (serviceDay.includes('wednesday')) dailyWorkload.wednesday += customer.units;
      if (serviceDay.includes('thursday')) dailyWorkload.thursday += customer.units;
      if (serviceDay.includes('friday')) dailyWorkload.friday += customer.units;
    });
  });

  // Calculate peak utilization
  const dailyCapacity = config.totalTrucks * config.homesPerTruckPerDay;
  const peakDayHomes = Math.max(...Object.values(dailyWorkload));
  const currentUtilization = (peakDayHomes / dailyCapacity) * 100;

  return {
    currentUtilization: Math.round(currentUtilization * 10) / 10,
    canAccommodateNewContract: currentUtilization < 85, // Keep 15% buffer
    additionalTrucksNeeded: 0,
    serviceStreamConflicts: [],
    capacityAfterNewContract: currentUtilization
  };
}

/**
 * Analyze routing impact of adding a new location
 */
export function analyzeRoutingImpact(
  newLocation: { latitude: number; longitude: number; address: string },
  existingCustomers: Customer[]
): RouteAnalysis {
  if (existingCustomers.length === 0) {
    return {
      distanceToNearestCustomer: 0,
      driveTimeToLocation: 0,
      routeExtensionCost: 0,
      efficiencyImpact: 0
    };
  }

  // Find nearest existing customer
  let nearestDistance = Infinity;
  let nearestCustomer: Customer | null = null;

  existingCustomers.forEach(customer => {
    const distance = calculateDistance(
      newLocation.latitude,
      newLocation.longitude,
      customer.latitude,
      customer.longitude
    );
    
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestCustomer = customer;
    }
  });

  // Estimate drive time (assuming average 30 mph in suburban areas)
  const driveTimeMinutes = (nearestDistance / 30) * 60;

  // Calculate additional routing costs
  const additionalMilesPerWeek = nearestDistance * 2 * 5; // Round trip, 5 days
  const additionalFuelCostPerWeek = additionalMilesPerWeek * TRUCK_COSTS.fuelCostPerMile;
  const additionalTimeCostPerWeek = (driveTimeMinutes * 2 * 5 / 60) * (TRUCK_COSTS.driverCostPerHour + TRUCK_COSTS.helperCostPerHour);
  
  const routeExtensionCost = (additionalFuelCostPerWeek + additionalTimeCostPerWeek) * 4.33; // Per month

  // Calculate efficiency impact (negative if adding distance to routes)
  const efficiencyImpact = nearestDistance > 5 ? -10 : nearestDistance > 2 ? -5 : 0;

  return {
    distanceToNearestCustomer: Math.round(nearestDistance * 10) / 10,
    driveTimeToLocation: Math.round(driveTimeMinutes),
    routeExtensionCost: Math.round(routeExtensionCost * 100) / 100,
    efficiencyImpact
  };
}

/**
 * Analyze service stream compatibility
 */
export function analyzeServiceCompatibility(
  newContract: {
    homes: number;
    trashFrequency: string;
    recyclingFrequency: string;
    yardWasteFrequency: string;
  },
  existingCustomers: Customer[]
): {
  trashCompatible: boolean;
  recyclingCompatible: boolean;
  yardWasteCompatible: boolean;
  conflicts: string[];
} {
  const conflicts: string[] = [];
  
  // For now, assume basic compatibility - in production this would analyze
  // actual route scheduling and truck availability by day
  const trashDaysPerWeek = parseServiceFrequency(newContract.trashFrequency);
  const recyclingDaysPerWeek = parseServiceFrequency(newContract.recyclingFrequency);
  
  let trashCompatible = true;
  let recyclingCompatible = true;
  let yardWasteCompatible = true;

  // Check if high-frequency services might cause conflicts
  if (trashDaysPerWeek > 2 && newContract.homes > 300) {
    trashCompatible = false;
    conflicts.push('High-frequency trash service may require dedicated truck');
  }

  if (recyclingDaysPerWeek > 1 && newContract.homes > 500) {
    recyclingCompatible = false;
    conflicts.push('Multi-day recycling service may conflict with existing routes');
  }

  return {
    trashCompatible,
    recyclingCompatible,
    yardWasteCompatible,
    conflicts
  };
}

/**
 * Main function to analyze operational feasibility of a new RFP
 */
export function analyzeOperationalFeasibility(
  rfpData: {
    homes: number;
    location: { latitude: number; longitude: number; address: string };
    trashFrequency: string;
    recyclingFrequency: string;
    yardWasteFrequency: string;
    estimatedTimePerHome: number; // minutes
  },
  existingCustomers: Customer[],
  config: FleetConfig = DEFAULT_FLEET_CONFIG
): OperationalFeasibility {
  
  // 1. Analyze current fleet capacity
  const currentFleetAnalysis = analyzeCurrentFleetUtilization(existingCustomers, config);
  
  // 2. Calculate additional capacity needed
  const trashDaysPerWeek = parseServiceFrequency(rfpData.trashFrequency);
  const recyclingDaysPerWeek = parseServiceFrequency(rfpData.recyclingFrequency);
  const totalServiceDays = trashDaysPerWeek + recyclingDaysPerWeek;
  
  const additionalHomesPerDay = (rfpData.homes * totalServiceDays) / config.daysPerWeek;
  const newUtilization = currentFleetAnalysis.currentUtilization + 
                        (additionalHomesPerDay / (config.totalTrucks * config.homesPerTruckPerDay)) * 100;
  
  const additionalTrucksNeeded = newUtilization > 90 ? Math.ceil((newUtilization - 90) / 30) : 0;
  const canAccommodateNewContract = additionalTrucksNeeded === 0;

  // 3. Analyze routing impact
  const routingAnalysis = analyzeRoutingImpact(rfpData.location, existingCustomers);

  // 4. Analyze service compatibility
  const serviceCompatibility = analyzeServiceCompatibility({
    homes: rfpData.homes,
    trashFrequency: rfpData.trashFrequency,
    recyclingFrequency: rfpData.recyclingFrequency,
    yardWasteFrequency: rfpData.yardWasteFrequency || ''
  }, existingCustomers);

  // 5. Calculate cost impacts
  const additionalTruckCost = additionalTrucksNeeded * TRUCK_COSTS.monthlyTruckCost;
  const routingCost = routingAnalysis.routeExtensionCost;
  const totalAdditionalCost = additionalTruckCost + routingCost;

  // 6. Determine feasibility and risk level
  const conflicts = [...serviceCompatibility.conflicts];
  if (additionalTrucksNeeded > 0) {
    conflicts.push(`Requires ${additionalTrucksNeeded} additional truck(s)`);
  }
  if (routingAnalysis.distanceToNearestCustomer > 10) {
    conflicts.push('Location is far from existing routes');
  }

  const riskLevel: 'low' | 'medium' | 'high' = 
    additionalTrucksNeeded > 0 || conflicts.length > 2 ? 'high' :
    conflicts.length > 0 || routingAnalysis.distanceToNearestCustomer > 5 ? 'medium' : 'low';

  const feasible = riskLevel !== 'high' && canAccommodateNewContract;

  return {
    fleetCapacity: {
      currentUtilization: currentFleetAnalysis.currentUtilization,
      canAccommodateNewContract,
      additionalTrucksNeeded,
      serviceStreamConflicts: conflicts,
      capacityAfterNewContract: Math.round(newUtilization * 10) / 10
    },
    routing: routingAnalysis,
    serviceCompatibility,
    costImpact: {
      additionalTruckCost,
      routingCost,
      totalAdditionalCost,
      marginImpact: 0 // Will be calculated based on revenue
    },
    recommendation: {
      feasible,
      conditions: conflicts,
      riskLevel
    }
  };
}

/**
 * Get fleet status summary for UI display
 */
export function getFleetStatusSummary(analysis: OperationalFeasibility): string {
  const { fleetCapacity } = analysis;
  
  if (fleetCapacity.additionalTrucksNeeded > 0) {
    return `Fleet at ${fleetCapacity.currentUtilization}% — needs ${fleetCapacity.additionalTrucksNeeded} additional truck(s)`;
  } else if (fleetCapacity.capacityAfterNewContract > 85) {
    return `Fleet at ${fleetCapacity.currentUtilization}% — can accept but will be at ${fleetCapacity.capacityAfterNewContract}% capacity`;
  } else {
    return `Fleet at ${fleetCapacity.currentUtilization}% — can accept without additional trucks`;
  }
}

/**
 * Get routing impact summary for UI display
 */
export function getRoutingImpactSummary(analysis: OperationalFeasibility): string {
  const { routing } = analysis;
  
  if (routing.distanceToNearestCustomer === 0) {
    return 'No existing customers for route comparison';
  }
  
  return `+${routing.distanceToNearestCustomer} miles, +${routing.driveTimeToLocation} mins added to route`;
}

/**
 * Get service compatibility summary for UI display
 */
export function getServiceCompatibilitySummary(analysis: OperationalFeasibility): string {
  const { serviceCompatibility } = analysis;
  
  const incompatibleServices = [];
  if (!serviceCompatibility.trashCompatible) incompatibleServices.push('trash');
  if (!serviceCompatibility.recyclingCompatible) incompatibleServices.push('recycling');
  if (!serviceCompatibility.yardWasteCompatible) incompatibleServices.push('yard waste');
  
  if (incompatibleServices.length === 0) {
    return 'All services compatible with existing routes';
  } else {
    return `${incompatibleServices.join(', ')} may need route optimization or additional truck`;
  }
} 