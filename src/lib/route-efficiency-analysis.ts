// Route Efficiency Analysis - Integrates Timeero data with waste management operations
// Provides comprehensive route optimization insights for fleet management

import { 
  GpsLocation, 
  MileageEntry, 
  TimesheetEntry, 
  ScheduledJob,
  TimeeroUser 
} from './api/timeero';

// Enhanced route analysis types
interface RouteStop {
  id: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  arrivalTime: string;
  departureTime?: string;
  stopDuration: number; // minutes
  stopType: 'pickup' | 'delivery' | 'depot' | 'break' | 'unknown';
  customerName?: string;
  jobId?: number;
  isPlanned: boolean;
}

interface RouteSegment {
  from: RouteStop;
  to: RouteStop;
  distance: number; // miles
  duration: number; // minutes
  avgSpeed: number; // mph
  fuelUsed: number; // gallons (estimated)
  efficiency: 'high' | 'medium' | 'low';
}

interface DailyRouteAnalysis {
  userId: number;
  user: TimeeroUser | null;
  date: string;
  routeStops: RouteStop[];
  routeSegments: RouteSegment[];
  summary: {
    totalDistance: number;
    totalDuration: number; // minutes
    workingHours: number;
    breakTime: number;
    avgSpeed: number;
    plannedStops: number;
    actualStops: number;
    onTimePercentage: number;
    fuelEfficiency: number; // mpg
    routeEfficiency: 'excellent' | 'good' | 'needs_improvement' | 'poor';
    costPerMile: number;
    revenuePerMile: number;
    profitability: number;
  };
  insights: {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
    riskFlags: string[];
  };
}

interface FleetRouteAnalysis {
  analysisDate: string;
  teamSummary: {
    totalDrivers: number;
    activeDrivers: number;
    totalMiles: number;
    totalHours: number;
    avgEfficiency: number;
    topPerformer: string;
    needsAttention: string[];
  };
  driverAnalyses: DailyRouteAnalysis[];
  benchmarks: {
    avgMilesPerHour: number;
    avgStopsPerHour: number;
    avgFuelEfficiency: number;
    targetEfficiency: number;
  };
  recommendations: {
    routeOptimization: string[];
    trainingNeeds: string[];
    equipmentUpgrades: string[];
    processImprovements: string[];
  };
}

// Constants for waste management operations
const WASTE_TRUCK_MPG = 6.5; // Average fuel efficiency for waste trucks
const FUEL_COST_PER_GALLON = 3.85;
const LABOR_COST_PER_HOUR = 44; // Driver + helper
const TRUCK_OPERATING_COST_PER_MILE = 2.15;
const TARGET_STOPS_PER_HOUR = 8; // Industry benchmark
const TARGET_MPH_RESIDENTIAL = 12; // Including stop time
const BREAK_THRESHOLD_MINUTES = 15; // Stops longer than this are considered breaks

/**
 * Calculate distance between two GPS coordinates using Haversine formula
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
 * Identify route stops from GPS data using clustering and dwell time analysis
 */
function identifyRouteStops(gpsData: GpsLocation[], scheduledJobs: ScheduledJob[]): RouteStop[] {
  if (gpsData.length === 0) return [];

  const stops: RouteStop[] = [];
  let currentStop: Partial<RouteStop> | null = null;
  const MIN_STOP_DURATION = 3; // minutes
  const LOCATION_THRESHOLD = 0.01; // ~0.6 miles

  for (let i = 0; i < gpsData.length; i++) {
    const point = gpsData[i];
    const timestamp = new Date(point.timestamp);

    // Check if we're starting a new stop (low speed or stationary)
    if (!currentStop && (point.speed === undefined || point.speed < 5)) {
      currentStop = {
        id: `stop_${stops.length + 1}`,
        location: {
          latitude: point.latitude,
          longitude: point.longitude,
          address: point.address
        },
        arrivalTime: point.timestamp,
        stopType: 'unknown',
        isPlanned: false
      };
    }

    // Check if we're ending a stop (speed increases or location changes significantly)
    if (currentStop && i > 0) {
      const prevPoint = gpsData[i - 1];
      const distance = calculateDistance(
        currentStop.location!.latitude,
        currentStop.location!.longitude,
        point.latitude,
        point.longitude
      );

      if ((point.speed && point.speed > 10) || distance > LOCATION_THRESHOLD) {
        // Calculate stop duration
        const arrivalTime = new Date(currentStop.arrivalTime!);
        const departureTime = new Date(prevPoint.timestamp);
        const duration = (departureTime.getTime() - arrivalTime.getTime()) / (1000 * 60);

        if (duration >= MIN_STOP_DURATION) {
          // Find matching scheduled job
          const matchingJob = scheduledJobs.find(job => {
            if (!job.location) return false;
            const jobDistance = calculateDistance(
              currentStop!.location!.latitude,
              currentStop!.location!.longitude,
              job.location.latitude,
              job.location.longitude
            );
            return jobDistance < 0.1; // Within ~0.6 miles
          });

          stops.push({
            id: currentStop.id!,
            location: currentStop.location!,
            arrivalTime: currentStop.arrivalTime!,
            departureTime: prevPoint.timestamp,
            stopDuration: Math.round(duration),
            stopType: matchingJob ? 'pickup' : (duration > BREAK_THRESHOLD_MINUTES ? 'break' : 'pickup'),
            customerName: matchingJob?.customer_name,
            jobId: matchingJob?.id,
            isPlanned: !!matchingJob
          });
        }

        currentStop = null;
      }
    }
  }

  return stops;
}

/**
 * Analyze route segments between stops
 */
function analyzeRouteSegments(stops: RouteStop[], gpsData: GpsLocation[]): RouteSegment[] {
  const segments: RouteSegment[] = [];

  for (let i = 0; i < stops.length - 1; i++) {
    const fromStop = stops[i];
    const toStop = stops[i + 1];

    const distance = calculateDistance(
      fromStop.location.latitude,
      fromStop.location.longitude,
      toStop.location.latitude,
      toStop.location.longitude
    );

    const departureTime = new Date(fromStop.departureTime || fromStop.arrivalTime);
    const arrivalTime = new Date(toStop.arrivalTime);
    const duration = (arrivalTime.getTime() - departureTime.getTime()) / (1000 * 60); // minutes

    const avgSpeed = duration > 0 ? (distance / (duration / 60)) : 0;
    const fuelUsed = distance / WASTE_TRUCK_MPG;

    let efficiency: 'high' | 'medium' | 'low' = 'medium';
    if (avgSpeed > 15 && duration < 30) {
      efficiency = 'high';
    } else if (avgSpeed < 8 || duration > 45) {
      efficiency = 'low';
    }

    segments.push({
      from: fromStop,
      to: toStop,
      distance: Math.round(distance * 100) / 100,
      duration: Math.round(duration),
      avgSpeed: Math.round(avgSpeed * 10) / 10,
      fuelUsed: Math.round(fuelUsed * 100) / 100,
      efficiency
    });
  }

  return segments;
}

/**
 * Generate insights and recommendations based on route analysis
 */
function generateRouteInsights(analysis: Omit<DailyRouteAnalysis, 'insights'>): DailyRouteAnalysis['insights'] {
  const insights: DailyRouteAnalysis['insights'] = {
    strengths: [],
    improvements: [],
    recommendations: [],
    riskFlags: []
  };

  const { summary, routeSegments, routeStops } = analysis;

  // Analyze strengths
  if (summary.onTimePercentage > 90) {
    insights.strengths.push('Excellent on-time performance');
  }
  if (summary.fuelEfficiency > WASTE_TRUCK_MPG * 1.1) {
    insights.strengths.push('Above-average fuel efficiency');
  }
  if (summary.avgSpeed > TARGET_MPH_RESIDENTIAL) {
    insights.strengths.push('Efficient route navigation');
  }

  // Identify improvements
  if (summary.onTimePercentage < 80) {
    insights.improvements.push('Improve schedule adherence');
    insights.recommendations.push('Review route timing and adjust schedules');
  }
  if (summary.fuelEfficiency < WASTE_TRUCK_MPG * 0.9) {
    insights.improvements.push('Optimize fuel consumption');
    insights.recommendations.push('Driver training on fuel-efficient driving techniques');
  }

  const inefficientSegments = routeSegments.filter(s => s.efficiency === 'low').length;
  if (inefficientSegments > routeSegments.length * 0.3) {
    insights.improvements.push('Optimize route sequencing');
    insights.recommendations.push('Analyze route order and consider resequencing stops');
  }

  // Risk flags
  if (summary.workingHours > 10) {
    insights.riskFlags.push('Extended work hours - monitor driver fatigue');
  }
  if (summary.breakTime < 30 && summary.workingHours > 6) {
    insights.riskFlags.push('Insufficient break time for shift length');
  }
  if (summary.avgSpeed < 8) {
    insights.riskFlags.push('Very low average speed - potential traffic or route issues');
  }

  // General recommendations
  if (summary.plannedStops > summary.actualStops) {
    insights.recommendations.push('Investigate missed scheduled stops');
  }
  if (summary.costPerMile > TRUCK_OPERATING_COST_PER_MILE * 1.2) {
    insights.recommendations.push('Review operational costs and identify savings opportunities');
  }

  return insights;
}

/**
 * Perform comprehensive daily route analysis for a single driver
 */
export function analyzeDailyRoute(
  user: TimeeroUser | null,
  gpsData: GpsLocation[],
  mileageData: MileageEntry[],
  timesheetData: TimesheetEntry[],
  scheduledJobs: ScheduledJob[],
  date: string
): DailyRouteAnalysis {
  // Identify stops from GPS data
  const routeStops = identifyRouteStops(gpsData, scheduledJobs);
  
  // Analyze segments between stops
  const routeSegments = analyzeRouteSegments(routeStops, gpsData);

  // Calculate summary metrics
  const totalDistance = mileageData.reduce((sum, entry) => sum + entry.distance_miles, 0);
  const totalDuration = routeSegments.reduce((sum, segment) => sum + segment.duration, 0);
  const workingHours = timesheetData.reduce((sum, entry) => sum + entry.total_hours, 0);
  const breakTime = routeStops
    .filter(stop => stop.stopType === 'break')
    .reduce((sum, stop) => sum + stop.stopDuration, 0);

  const avgSpeed = totalDuration > 0 ? (totalDistance / (totalDuration / 60)) : 0;
  const plannedStops = routeStops.filter(stop => stop.isPlanned).length;
  const actualStops = routeStops.length;
  const onTimeStops = scheduledJobs.filter(job => job.status === 'completed').length;
  const onTimePercentage = plannedStops > 0 ? (onTimeStops / plannedStops) * 100 : 100;

  const fuelUsed = totalDistance / WASTE_TRUCK_MPG;
  const fuelEfficiency = totalDistance > 0 ? totalDistance / fuelUsed : 0;

  // Calculate costs and profitability
  const fuelCost = fuelUsed * FUEL_COST_PER_GALLON;
  const laborCost = workingHours * LABOR_COST_PER_HOUR;
  const operatingCost = totalDistance * TRUCK_OPERATING_COST_PER_MILE;
  const totalCost = fuelCost + laborCost + operatingCost;
  const costPerMile = totalDistance > 0 ? totalCost / totalDistance : 0;

  // Estimate revenue (simplified - would need actual customer data)
  const avgRevenuePerStop = 35; // Estimated based on typical residential service
  const estimatedRevenue = actualStops * avgRevenuePerStop;
  const revenuePerMile = totalDistance > 0 ? estimatedRevenue / totalDistance : 0;
  const profitability = estimatedRevenue > 0 ? ((estimatedRevenue - totalCost) / estimatedRevenue) * 100 : 0;

  // Determine overall route efficiency
  let routeEfficiency: 'excellent' | 'good' | 'needs_improvement' | 'poor' = 'good';
  if (onTimePercentage > 95 && avgSpeed > TARGET_MPH_RESIDENTIAL && fuelEfficiency > WASTE_TRUCK_MPG) {
    routeEfficiency = 'excellent';
  } else if (onTimePercentage < 70 || avgSpeed < 8 || fuelEfficiency < WASTE_TRUCK_MPG * 0.8) {
    routeEfficiency = 'poor';
  } else if (onTimePercentage < 85 || avgSpeed < 10 || fuelEfficiency < WASTE_TRUCK_MPG * 0.9) {
    routeEfficiency = 'needs_improvement';
  }

  const summary = {
    totalDistance: Math.round(totalDistance * 100) / 100,
    totalDuration: Math.round(totalDuration),
    workingHours: Math.round(workingHours * 100) / 100,
    breakTime: Math.round(breakTime),
    avgSpeed: Math.round(avgSpeed * 10) / 10,
    plannedStops,
    actualStops,
    onTimePercentage: Math.round(onTimePercentage * 10) / 10,
    fuelEfficiency: Math.round(fuelEfficiency * 10) / 10,
    routeEfficiency,
    costPerMile: Math.round(costPerMile * 100) / 100,
    revenuePerMile: Math.round(revenuePerMile * 100) / 100,
    profitability: Math.round(profitability * 10) / 10
  };

  const baseAnalysis = {
    userId: user?.id || 0,
    user,
    date,
    routeStops,
    routeSegments,
    summary
  };

  const insights = generateRouteInsights(baseAnalysis);

  return {
    ...baseAnalysis,
    insights
  };
}

/**
 * Analyze fleet-wide route performance
 */
export function analyzeFleetRoutes(dailyAnalyses: DailyRouteAnalysis[]): FleetRouteAnalysis {
  const activeDrivers = dailyAnalyses.filter(analysis => analysis.summary.workingHours > 0);
  
  const teamSummary = {
    totalDrivers: dailyAnalyses.length,
    activeDrivers: activeDrivers.length,
    totalMiles: activeDrivers.reduce((sum, analysis) => sum + analysis.summary.totalDistance, 0),
    totalHours: activeDrivers.reduce((sum, analysis) => sum + analysis.summary.workingHours, 0),
    avgEfficiency: activeDrivers.length > 0 
      ? activeDrivers.reduce((sum, analysis) => {
          const efficiencyScore = analysis.summary.routeEfficiency === 'excellent' ? 4 :
                                 analysis.summary.routeEfficiency === 'good' ? 3 :
                                 analysis.summary.routeEfficiency === 'needs_improvement' ? 2 : 1;
          return sum + efficiencyScore;
        }, 0) / activeDrivers.length
      : 0,
    topPerformer: '',
    needsAttention: [] as string[]
  };

  // Identify top performer
  const sortedByEfficiency = [...activeDrivers].sort((a, b) => {
    const scoreA = a.summary.onTimePercentage + a.summary.avgSpeed + a.summary.fuelEfficiency;
    const scoreB = b.summary.onTimePercentage + b.summary.avgSpeed + b.summary.fuelEfficiency;
    return scoreB - scoreA;
  });

  if (sortedByEfficiency.length > 0) {
    teamSummary.topPerformer = sortedByEfficiency[0].user?.name || `User ${sortedByEfficiency[0].userId}`;
  }

  // Identify drivers needing attention
  teamSummary.needsAttention = activeDrivers
    .filter(analysis => 
      analysis.summary.routeEfficiency === 'poor' || 
      analysis.summary.onTimePercentage < 70 ||
      analysis.insights.riskFlags.length > 2
    )
    .map(analysis => analysis.user?.name || `User ${analysis.userId}`);

  // Calculate benchmarks
  const benchmarks = {
    avgMilesPerHour: activeDrivers.length > 0 
      ? activeDrivers.reduce((sum, analysis) => sum + analysis.summary.avgSpeed, 0) / activeDrivers.length
      : 0,
    avgStopsPerHour: activeDrivers.length > 0
      ? activeDrivers.reduce((sum, analysis) => {
          const stopsPerHour = analysis.summary.workingHours > 0 
            ? analysis.summary.actualStops / analysis.summary.workingHours 
            : 0;
          return sum + stopsPerHour;
        }, 0) / activeDrivers.length
      : 0,
    avgFuelEfficiency: activeDrivers.length > 0
      ? activeDrivers.reduce((sum, analysis) => sum + analysis.summary.fuelEfficiency, 0) / activeDrivers.length
      : 0,
    targetEfficiency: WASTE_TRUCK_MPG
  };

  // Generate fleet-level recommendations
  const recommendations = {
    routeOptimization: [] as string[],
    trainingNeeds: [] as string[],
    equipmentUpgrades: [] as string[],
    processImprovements: [] as string[]
  };

  if (benchmarks.avgFuelEfficiency < WASTE_TRUCK_MPG * 0.9) {
    recommendations.trainingNeeds.push('Fleet-wide fuel efficiency training needed');
  }

  if (benchmarks.avgStopsPerHour < TARGET_STOPS_PER_HOUR * 0.8) {
    recommendations.routeOptimization.push('Review route density and stop sequencing');
    recommendations.processImprovements.push('Analyze pickup time standards and procedures');
  }

  const lowPerformanceCount = activeDrivers.filter(a => a.summary.routeEfficiency === 'poor').length;
  if (lowPerformanceCount > activeDrivers.length * 0.3) {
    recommendations.processImprovements.push('Comprehensive route optimization program needed');
    recommendations.trainingNeeds.push('Enhanced driver training and mentoring program');
  }

  return {
    analysisDate: new Date().toISOString().split('T')[0],
    teamSummary,
    driverAnalyses: dailyAnalyses,
    benchmarks: {
      avgMilesPerHour: Math.round(benchmarks.avgMilesPerHour * 10) / 10,
      avgStopsPerHour: Math.round(benchmarks.avgStopsPerHour * 10) / 10,
      avgFuelEfficiency: Math.round(benchmarks.avgFuelEfficiency * 10) / 10,
      targetEfficiency: benchmarks.targetEfficiency
    },
    recommendations
  };
}

// Export types for use in other modules
export type {
  RouteStop,
  RouteSegment,
  DailyRouteAnalysis,
  FleetRouteAnalysis
}; 