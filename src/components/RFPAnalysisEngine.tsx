'use client';

import { useState } from 'react';

interface CustomerData {
  id: string;
  name: string;
  address: string;
  type: 'HOA' | 'Subscription';
  latitude: number;
  longitude: number;
  units: number;
  completionTime: number;
  monthlyRevenue: number;
  trashDays: string;
  recyclingDays: string;
  yardWasteDays: string;
}

interface RFPData {
  communityName: string;
  location: string;
  homes: number;
  serviceType: string;
  pickupFrequency: string;
  specialRequirements: string[];
  contractLength: number;
  startDate: string;
  fuelSurchargeAllowed: boolean;
  timeWindows: string;
  recyclingRequired: boolean;
  yardWasteRequired: boolean;
}

interface AnalysisResult {
  proximityScore: 'close' | 'moderate' | 'far';
  suggestedPricePerHome: number;
  estimatedCostPerMonth: number;
  projectedGrossMargin: number;
  efficiencyPerMinute: number;
  strategicFitScore: 'low' | 'medium' | 'high';
  riskFlags: string[];
  recommendation: 'bid' | 'bid-with-conditions' | 'do-not-bid';
  calculations: {
    distanceFromDepot: number;
    distanceFromLandfill: number;
    estimatedTimePerVisit: number;
    fuelCostPerMonth: number;
    laborCostPerMonth: number;
    equipmentCostPerMonth: number;
    dumpingFees: number;
  };
  competitiveAnalysis: {
    marketRate: number;
    ourAdvantage: string[];
    risks: string[];
  };
}

interface RFPAnalysisEngineProps {
  customerData: CustomerData[];
  onAnalysisComplete: (result: AnalysisResult) => void;
}

// Constants
const DEPOT_COORDS = { lat: 38.923867, lng: -77.235103 }; // 8401 Westpark Dr, McLean VA
const FAIRFAX_LANDFILL = { lat: 38.85319175, lng: -77.37514310524120 };
const LORTON_LANDFILL = { lat: 38.691352122449000, lng: -77.2377658367347 };

// Enhanced Card components with better styling
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-xl font-bold text-gray-900 ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-8 py-6 ${className}`}>
    {children}
  </div>
);

export default function RFPAnalysisEngine({ customerData, onAnalysisComplete }: RFPAnalysisEngineProps) {
  
  // Helper function to calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Parse RFP text using AI-like logic
  const parseRFPText = (rfpText: string): RFPData => {
    // This would be replaced with actual AI/NLP parsing in production
    // For now, we'll extract key information using regex and keyword matching
    
    const lines = rfpText.toLowerCase().split('\n');
    let communityName = 'Unknown Community';
    let location = 'Unknown Location';
    let homes = 0;
    let serviceType = 'Residential Waste & Recycling';
    let pickupFrequency = 'Weekly';
    let specialRequirements: string[] = [];
    let contractLength = 12;
    let startDate = new Date().toISOString().split('T')[0];
    let fuelSurchargeAllowed = true;
    let timeWindows = 'Flexible';
    let recyclingRequired = false;
    let yardWasteRequired = false;

    // Extract community name
    const nameMatch = rfpText.match(/(?:community|association|estate|manor|complex|village|park)\s+([^\n\r]{1,50})/i);
    if (nameMatch) {
      communityName = nameMatch[0].trim();
    }

    // Extract number of homes/units
    const homeMatches = rfpText.match(/(\d+)\s*(?:homes|units|residences|dwellings)/i);
    if (homeMatches) {
      homes = parseInt(homeMatches[1]);
    }

    // Extract location information
    const locationMatch = rfpText.match(/(?:located|address|community).*?([A-Z][a-z]+,\s*[A-Z]{2})/i);
    if (locationMatch) {
      location = locationMatch[1];
    }

    // Check for time restrictions
    if (rfpText.includes('8am') || rfpText.includes('8:00') || rfpText.includes('morning only')) {
      timeWindows = '8AM-12PM';
      specialRequirements.push('Morning pickup window restriction');
    }

    // Check for fuel surcharge restrictions
    if (rfpText.includes('no fuel surcharge') || rfpText.includes('fuel surcharge not allowed')) {
      fuelSurchargeAllowed = false;
      specialRequirements.push('No fuel surcharge allowed');
    }

    // Check for recycling requirements
    if (rfpText.includes('recycling') || rfpText.includes('recycle')) {
      recyclingRequired = true;
    }

    // Check for yard waste requirements
    if (rfpText.includes('yard waste') || rfpText.includes('landscaping') || rfpText.includes('organic')) {
      yardWasteRequired = true;
    }

    // Check for contamination penalties
    if (rfpText.includes('contamination') || rfpText.includes('penalty') || rfpText.includes('fine')) {
      specialRequirements.push('Contamination penalties');
    }

    return {
      communityName,
      location,
      homes,
      serviceType,
      pickupFrequency,
      specialRequirements,
      contractLength,
      startDate,
      fuelSurchargeAllowed,
      timeWindows,
      recyclingRequired,
      yardWasteRequired
    };
  };

  // Analyze RFP and generate recommendations
  const analyzeRFP = (rfpData: RFPData): AnalysisResult => {
    // Calculate proximity to depot and landfills (using estimated coordinates for the location)
    // In production, this would use Google Maps API for geocoding
    const estimatedLat = 38.8 + Math.random() * 0.3; // Rough DMV area
    const estimatedLng = -77.4 + Math.random() * 0.3;
    
    const distanceFromDepot = calculateDistance(DEPOT_COORDS.lat, DEPOT_COORDS.lng, estimatedLat, estimatedLng);
    const distanceFromFairfax = calculateDistance(FAIRFAX_LANDFILL.lat, FAIRFAX_LANDFILL.lng, estimatedLat, estimatedLng);
    const distanceFromLorton = calculateDistance(LORTON_LANDFILL.lat, LORTON_LANDFILL.lng, estimatedLat, estimatedLng);
    const distanceFromLandfill = Math.min(distanceFromFairfax, distanceFromLorton);

    // Determine proximity score
    let proximityScore: 'close' | 'moderate' | 'far' = 'moderate';
    if (distanceFromDepot <= 10 && distanceFromLandfill <= 15) {
      proximityScore = 'close';
    } else if (distanceFromDepot <= 20 && distanceFromLandfill <= 25) {
      proximityScore = 'moderate';
    } else {
      proximityScore = 'far';
    }

    // Calculate costs based on existing customer data patterns
    const similarCustomers = customerData.filter(c => 
      c.type === 'HOA' && 
      Math.abs(c.units - rfpData.homes) <= rfpData.homes * 0.3
    );

    let baseTimePerVisit = 1.0; // Default 1 minute per home
    let baseRevenuePerHome = 25.0; // Base pricing

    if (similarCustomers.length > 0) {
      const avgTimePerUnit = similarCustomers.reduce((sum, c) => sum + (c.completionTime / c.units), 0) / similarCustomers.length;
      const avgRevenuePerUnit = similarCustomers.reduce((sum, c) => sum + (c.monthlyRevenue / c.units), 0) / similarCustomers.length;
      
      baseTimePerVisit = avgTimePerUnit;
      baseRevenuePerHome = avgRevenuePerUnit;
    }

    // Adjust for distance and special requirements
    let timeMultiplier = 1.0;
    let costMultiplier = 1.0;
    let riskFlags: string[] = [];

    // Distance adjustments
    if (proximityScore === 'far') {
      timeMultiplier += 0.3;
      costMultiplier += 0.2;
      riskFlags.push('High travel time to service area');
    }

    // Time window restrictions
    if (rfpData.timeWindows.includes('8AM') || rfpData.timeWindows.includes('morning')) {
      timeMultiplier += 0.2;
      costMultiplier += 0.15;
      riskFlags.push('Restricted pickup time window');
    }

    // Fuel surcharge restrictions
    if (!rfpData.fuelSurchargeAllowed) {
      costMultiplier += 0.1;
      riskFlags.push('No fuel surcharge protection');
    }

    // Special service requirements
    if (rfpData.recyclingRequired) {
      timeMultiplier += 0.1;
      costMultiplier += 0.05;
    }

    if (rfpData.yardWasteRequired) {
      timeMultiplier += 0.15;
      costMultiplier += 0.08;
    }

    // Add special requirement risks
    riskFlags.push(...rfpData.specialRequirements);

    // Calculate final metrics
    const estimatedTimePerVisit = baseTimePerVisit * timeMultiplier;
    const totalMonthlyTime = estimatedTimePerVisit * rfpData.homes;
    
    // Cost calculations
    const laborRate = 85; // $ per hour
    const fuelCostPerMile = 0.65;
    const equipmentCostPerHour = 25;
    const dumpingFeePerTon = 45;
    const avgTonesPerMonth = rfpData.homes * 0.3; // Estimate

    const laborCostPerMonth = (totalMonthlyTime / 60) * laborRate * 4.33; // 4.33 weeks per month
    const fuelCostPerMonth = (distanceFromDepot * 2 + distanceFromLandfill) * fuelCostPerMile * 4.33 * 4; // 4 trips per week
    const equipmentCostPerMonth = (totalMonthlyTime / 60) * equipmentCostPerHour * 4.33;
    const dumpingFees = avgTonesPerMonth * dumpingFeePerTon;

    const estimatedCostPerMonth = (laborCostPerMonth + fuelCostPerMonth + equipmentCostPerMonth + dumpingFees) * costMultiplier;

    // Pricing strategy
    const marketRatePerHome = baseRevenuePerHome * (1 + (proximityScore === 'far' ? 0.15 : proximityScore === 'moderate' ? 0.05 : 0));
    const suggestedPricePerHome = marketRatePerHome * (1 + 0.1); // 10% markup for profit

    const totalMonthlyRevenue = suggestedPricePerHome * rfpData.homes;
    const projectedGrossMargin = (totalMonthlyRevenue - estimatedCostPerMonth) / totalMonthlyRevenue;
    const efficiencyPerMinute = totalMonthlyRevenue / totalMonthlyTime;

    // Strategic fit analysis
    let strategicFitScore: 'low' | 'medium' | 'high' = 'medium';
    
    if (proximityScore === 'close' && rfpData.homes >= 500) {
      strategicFitScore = 'high';
    } else if (proximityScore === 'far' || rfpData.homes < 100) {
      strategicFitScore = 'low';
    }

    // Recommendation logic
    let recommendation: 'bid' | 'bid-with-conditions' | 'do-not-bid' = 'bid';
    
    if (projectedGrossMargin < 0.15 || strategicFitScore === 'low') {
      recommendation = 'do-not-bid';
    } else if (riskFlags.length >= 3 || projectedGrossMargin < 0.20) {
      recommendation = 'bid-with-conditions';
    }

    return {
      proximityScore,
      suggestedPricePerHome,
      estimatedCostPerMonth,
      projectedGrossMargin,
      efficiencyPerMinute,
      strategicFitScore,
      riskFlags,
      recommendation,
      calculations: {
        distanceFromDepot,
        distanceFromLandfill,
        estimatedTimePerVisit,
        fuelCostPerMonth,
        laborCostPerMonth,
        equipmentCostPerMonth,
        dumpingFees
      },
      competitiveAnalysis: {
        marketRate: marketRatePerHome,
        ourAdvantage: [
          'Established route density in area',
          'Efficient operational model',
          'Proven track record with similar communities'
        ],
        risks: riskFlags
      }
    };
  };

  // Main analysis function
  const processRFP = (rfpText: string): AnalysisResult => {
    const rfpData = parseRFPText(rfpText);
    const analysis = analyzeRFP(rfpData);
    return analysis;
  };

  return {
    processRFP,
    parseRFPText,
    analyzeRFP
  };
} 