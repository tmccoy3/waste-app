# Customer Profitability Analysis & Clustering Guide

## Overview
The enhanced serviceability feature now provides intelligent profitability analysis based on customer clustering and geographic density. When you use the serviceability check, you'll receive ratings of "High margin customer", "Medium margin customer", or "Low margin customer" based on the address you enter.

## How It Works

### Profitability Factors
The system analyzes 5 key factors to determine customer profitability:

1. **Distance to Nearest Customer (30% weight)**
   - ≤ 2 miles: Very close to existing customers (30 points)
   - 2-5 miles: Moderately close (20 points)
   - 5-10 miles: Some distance (10 points)
   - > 10 miles: Far from existing customers (0 points)

2. **Customer Density (25% weight)**
   - Analyzes customer count within 2, 5, and 10-mile radii
   - Higher density = better route optimization potential
   - Weighted toward closer customers

3. **Distance to Landfill (20% weight)**
   - ≤ 15 miles: Close to landfill (20 points)
   - 15-25 miles: Moderate distance (12 points)
   - > 25 miles: Far from landfill (0 points)

4. **Cluster Size (15% weight)**
   - Number of customers within 10-mile radius
   - ≥ 10 customers: Large cluster (15 points)
   - 5-9 customers: Medium cluster (10 points)
   - 2-4 customers: Small cluster (5 points)
   - < 2 customers: Isolated (0 points)

5. **Average Route Distance (10% weight)**
   - Average distance between stops in cluster
   - ≤ 3 miles: Tight cluster (10 points)
   - 3-6 miles: Moderate distances (6 points)
   - > 6 miles: Large distances (0 points)

### Margin Levels

- **HIGH MARGIN (70-100 points)**: Excellent profitability
  - Short distances between collection points
  - High customer density
  - Optimized routing potential
  - Low operational costs

- **MEDIUM MARGIN (40-69 points)**: Moderate profitability
  - Some route optimization possible
  - Moderate distances and density
  - Acceptable operational costs

- **LOW MARGIN (0-39 points)**: Challenging profitability
  - Long distances between collection points
  - Low customer density
  - High operational costs
  - Requires careful pricing

## Landfill Locations
The system calculates distances to these landfills:
- **I-66 Transfer Station**: 4618E West Ox Rd, Fairfax, VA 22030
- **Lorton Landfill**: 9850 Furnace Rd, Lorton, VA 22079

## Using the Feature

### Via Dashboard
1. Go to **Dashboard → Serviceability Check**
2. Enter the address and other details
3. Click "Check Serviceability"
4. View the profitability analysis results

### Via API
```bash
curl -X POST http://localhost:3000/api/comprehensive-rfp-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "analysisType": "serviceability",
    "communityName": "Test Community",
    "address": "123 Main St, Fairfax, VA 22030",
    "coordinates": {"lat": 38.8462, "lng": -77.3064},
    "serviceType": "residential",
    "estimatedHomes": 50
  }'
```

### Response Format
```json
{
  "customerProbability": 90,
  "profitMargin": 35,
  "recommendedAction": "BID",
  "fleetImpact": {
    "utilization": 76.6,
    "additionalRoute": false,
    "estimatedDistance": 0.79,
    "estimatedTime": 2
  },
  "riskFactors": [],
  "recommendations": [
    "high margin customer opportunity",
    "High margin customer (90/100 score). This location is excellent for profitability due to: Very close to existing customers (0.8 miles), High customer density area - excellent route optimization potential.",
    "Nearest customer: 0.8 miles",
    "Customer density score: 44.4",
    "Landfill distance: 4.5 miles"
  ],
  "confidenceLevel": 90,
  "profitabilityAnalysis": {
    "marginLevel": "HIGH",
    "score": 90,
    "reasoning": [...],
    "metrics": {
      "nearestCustomerDistance": 0.79,
      "customerDensity": 44.4,
      "nearestLandfillDistance": 4.5,
      "clusterSize": 172,
      "averageRouteDistance": 6.6
    }
  }
}
```

## Benefits
- **Data-driven decisions**: Based on actual customer locations and density
- **Route optimization**: Identifies areas with clustering potential
- **Cost awareness**: Considers landfill distances and operational costs
- **Risk assessment**: Highlights potential profitability challenges
- **Competitive advantage**: Focuses on high-margin opportunities

## Technical Implementation
- Uses Haversine formula for distance calculations
- Analyzes all 181 customers in the database
- Real-time clustering analysis
- Weighted scoring system based on industry best practices
- Integrated with existing serviceability check UI 