# 🎯 Potential Customer Identifier

A comprehensive serviceability and pricing engine that intelligently determines whether new customers can be serviced and calculates optimal pricing based on route efficiency and proximity analysis.

## 🚀 Features

### Core Functionality
- **HOA Auto-Approval**: Automatic approval for HOA customers with competitive pricing
- **Single-Family Analysis**: Comprehensive proximity and route density analysis
- **Dynamic Pricing**: Smart pricing based on operational efficiency factors
- **Google Maps Integration**: Address autocomplete with coordinate validation
- **Real-time Analysis**: Instant serviceability scoring and recommendations

### Key Components

#### 1. **Backend API** (`/api/check-serviceability`)
- Processes serviceability requests with comprehensive analysis
- Calculates distances using Haversine formula
- Analyzes route density and proximity metrics
- Returns detailed recommendations with scoring

#### 2. **Frontend Interface** (`/dashboard/serviceability-check`)
- Clean, intuitive form with Google Maps autocomplete
- Real-time results display with visual indicators
- Comprehensive proximity analysis dashboard
- Mobile-responsive design matching Operations Dashboard

#### 3. **Utility Functions**
- `calculate-distance.ts`: Geographic distance calculations
- `price-recommendation.ts`: Pricing logic and recommendations

## 📊 Analysis Engine

### HOA Customers
```typescript
if (customerType === 'HOA') {
  return {
    serviceable: true,
    serviceabilityScore: 100,
    recommendation: 'Accept',
    suggestedPrice: 28,
    reason: 'HOA customers are automatically approved'
  }
}
```

### Single-Family Analysis

#### Proximity Thresholds
- **500ft radius**: High-priority proximity zone
- **1000ft radius**: Medium-priority proximity zone
- **0.5 miles**: Maximum acceptable route deviation

#### Route Density Classification
- **High Density**: 5+ customers within 1000ft
- **Medium Density**: 2-4 customers within 1000ft
- **Low Density**: 0-1 customers within 1000ft

#### Serviceability Scoring (0-100)
```typescript
Base Score: 50

Proximity Bonuses:
+ 30 points: 3+ customers within 500ft
+ 20 points: 1+ customers within 500ft
+ 10 points: 2+ customers within 1000ft

Route Density Bonuses:
+ 20 points: High density routes
+ 10 points: Medium density routes

Distance Penalties:
- 20 points: Nearest customer > 2 miles
- 10 points: Nearest customer > 1 mile
```

## 💰 Pricing Model

### Base Pricing Tiers
- **High Density Routes**: $26-$28
- **Medium Density Routes**: $30-$32
- **Low Density Routes**: $36+
- **Isolated Locations**: $40+

### Pricing Adjustments
```typescript
Base Price Calculation:
- High Density: $26
- Medium Density: $30
- Low Density: $36

Proximity Adjustments:
- 3+ customers within 500ft: -$2
- 1+ customers within 500ft: -$1
- Nearest customer > 1 mile: +$4

Additional Carts:
- Each extra cart: +$8

Minimum Price: $24
```

## 🎨 User Interface

### Input Form
- **Address Field**: Google Maps autocomplete with coordinate extraction
- **Customer Type**: Dropdown (Single-Family / HOA)
- **Number of Carts**: Optional numeric input
- **Special Notes**: Optional textarea for requirements

### Results Display
- **Recommendation Badge**: Color-coded Accept/Borderline/Decline
- **Suggested Price**: Prominent pricing display
- **Serviceability Score**: Visual progress bar (0-100)
- **Proximity Analysis**: Detailed customer density metrics
- **Route Density**: Badge indicating High/Medium/Low density

### Visual Indicators
```css
Accept: Green background, green text
Borderline: Yellow background, yellow text
Decline: Red background, red text

Score Colors:
75-100: Green progress bar
50-74: Yellow progress bar
0-49: Red progress bar
```

## 🔧 Technical Implementation

### API Request Format
```typescript
POST /api/check-serviceability
{
  address: string,
  customerType: 'Single-Family' | 'HOA',
  latitude: number,
  longitude: number,
  numberOfCarts?: number,
  specialNotes?: string
}
```

### API Response Format
```typescript
{
  success: boolean,
  data: {
    address: string,
    customerType: 'Single-Family' | 'HOA',
    serviceable: boolean,
    serviceabilityScore: number,
    recommendation: 'Accept' | 'Borderline' | 'Decline',
    suggestedPrice: number,
    nearestCustomerDistance: string,
    reason: string,
    proximityDetails: {
      nearestCustomers: Array<{
        name: string,
        distance: number,
        type: string
      }>,
      routeDensity: 'High' | 'Medium' | 'Low',
      customersWithin500ft: number,
      customersWithin1000ft: number
    }
  }
}
```

## 📁 File Structure

```
src/
├── app/
│   ├── api/
│   │   └── check-serviceability/
│   │       └── route.ts              # Main API endpoint
│   └── dashboard/
│       └── serviceability-check/
│           └── page.tsx              # Frontend interface
├── components/
│   └── AddressAutocomplete.tsx       # Google Maps autocomplete
└── utils/
    ├── calculate-distance.ts         # Distance calculations
    └── price-recommendation.ts       # Pricing logic
```

## 🚀 Usage Examples

### HOA Customer
```
Input: "123 Community Way, Reston VA" (HOA)
Output: 
- Recommendation: Accept
- Price: $28
- Score: 100/100
- Reason: "HOA customers are automatically approved"
```

### High-Density Single-Family
```
Input: "456 Main St, Falls Church VA" (Single-Family)
Output:
- Recommendation: Accept  
- Price: $26
- Score: 87/100
- Reason: "Excellent location with 4 customers within 500ft"
```

### Isolated Single-Family
```
Input: "789 Remote Rd, Fairfax VA" (Single-Family)
Output:
- Recommendation: Decline
- Price: $42
- Score: 25/100
- Reason: "Poor location. Very isolated with no customers within 0.5 miles"
```

## 🔄 Integration Points

### Data Sources
- **Customer Database**: `data/geocoded_customers.json`
- **Google Maps API**: Address validation and coordinates
- **Route Analysis**: Existing customer locations and service zones

### Dashboard Integration
- Added as new tab in main dashboard navigation
- Consistent styling with Operations Dashboard
- Responsive design for mobile and desktop

## 📈 Business Impact

### Revenue Optimization
- **Smart Pricing**: Ensures profitable pricing based on operational costs
- **Route Efficiency**: Minimizes service costs through density analysis
- **Risk Assessment**: Identifies potentially unprofitable customers

### Operational Benefits
- **Instant Analysis**: Reduces decision time from hours to seconds
- **Data-Driven**: Removes guesswork from customer acceptance
- **Scalable**: Handles unlimited customer evaluations

### Customer Experience
- **Transparent Pricing**: Clear pricing rationale for customers
- **Quick Response**: Instant quotes for potential customers
- **Professional Presentation**: Executive-ready analysis reports

## 🛠 Future Enhancements

### Planned Features
- **Route Simulation**: Visual route impact analysis
- **Seasonal Pricing**: Dynamic pricing based on demand
- **Competitive Analysis**: Market rate comparisons
- **Integration APIs**: CRM and billing system connections

### Advanced Analytics
- **Profit Projections**: Long-term revenue forecasting
- **Churn Risk**: Customer retention probability
- **Market Expansion**: Territory growth recommendations

---

## 🎯 Getting Started

1. **Navigate to Dashboard**: Go to `/dashboard/serviceability-check`
2. **Enter Address**: Use Google Maps autocomplete for accurate coordinates
3. **Select Type**: Choose Single-Family or HOA
4. **Optional Details**: Add cart count and special notes
5. **Analyze**: Click "Check Serviceability" for instant results

The system will provide comprehensive analysis including pricing, recommendations, and detailed proximity metrics to help make informed customer acceptance decisions. 