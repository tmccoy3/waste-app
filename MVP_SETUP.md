# WasteOps Intelligence MVP Setup Guide

## 🎯 Overview
This MVP dashboard integrates with your active tools to provide real-time operational insights:
- **FreshBooks** (revenue & invoicing)
- **Timeero** (employee tracking + GPS)
- **Google Sheets** (customer & route management)
- **Google Chat** (operational notifications)

## 🚀 Quick Start

### 1. Environment Setup
Copy the environment template and configure your API keys:
```bash
cp env.example .env.local
```

Edit `.env.local` with your actual API credentials (see API Setup section below).

### 2. Start the Dashboard
```bash
npm run dev
```

Visit: http://localhost:3000/dashboard

## 🔧 API Setup Instructions

### FreshBooks Integration
1. **Get API Credentials:**
   - Go to FreshBooks Developer Portal: https://my.freshbooks.com/#/developer
   - Create a new app or use existing
   - Note: Client ID, Client Secret
   
2. **OAuth Flow:**
   - Generate access token using OAuth 2.0
   - Get your Account ID from the API response
   
3. **Environment Variables:**
   ```
   FRESHBOOKS_CLIENT_ID=your_client_id
   FRESHBOOKS_CLIENT_SECRET=your_client_secret
   FRESHBOOKS_ACCESS_TOKEN=your_access_token
   FRESHBOOKS_ACCOUNT_ID=your_account_id
   ```

### Timeero Integration
1. **Get API Key:**
   - Login to Timeero: https://app.timeero.com
   - Go to Settings → API
   - Generate new API key
   
2. **Get Company ID:**
   - Available in your Timeero account settings
   
3. **Environment Variables:**
   ```
   TIMEERO_API_KEY=your_api_key
   TIMEERO_COMPANY_ID=your_company_id
   ```

### Google Sheets Integration
1. **Create Service Account:**
   - Go to Google Cloud Console: https://console.cloud.google.com
   - Create new project or select existing
   - Enable Google Sheets API
   - Create Service Account
   - Download JSON key file
   
2. **Prepare Spreadsheet:**
   - Create Google Sheet with tabs: "Customers", "Routes"
   - Share sheet with service account email
   - Copy spreadsheet ID from URL
   
3. **Environment Variables:**
   ```
   GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
   GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
   ```

### Google Chat Integration
1. **Create Webhook:**
   - In Google Chat, go to the space you want notifications
   - Click space name → Manage webhooks
   - Create new webhook
   - Copy webhook URL
   
2. **Environment Variables:**
   ```
   GOOGLE_CHAT_WEBHOOK_URL=https://chat.googleapis.com/v1/spaces/...
   ```

## 📊 Dashboard Features

### Revenue Overview (FreshBooks)
- **Total Revenue MTD:** Real-time month-to-date revenue
- **Overdue Invoices:** Count and total amount of overdue invoices
- **Recent Payments:** List of latest payments received
- **Weekly Income Chart:** Visual representation of daily income

### Employee & Route Insights (Timeero)
- **Active Drivers:** Real-time status of all drivers
- **Clock-in Times:** Who's on time, late, or missing
- **Route Efficiency:** Performance metrics for routes
- **GPS Locations:** Current driver locations and routes

### Customer Management (Google Sheets)
- **Customer Zones:** Breakdown by service area
- **Profitability Analysis:** High/medium/low profit zones
- **Active Subscriptions:** HOA and recurring customers
- **Route Assignments:** Customer-to-route mapping

### Automated Alerts (Google Chat)
- **New Job Booked:** Instant notification when job is scheduled
- **Payment Received:** Alert when customer pays invoice
- **Driver Missing:** Warning when driver misses clock-in
- **Route Inefficiency:** Alert for routes taking too long
- **Overdue Invoices:** Daily reminder of unpaid invoices

## 📋 Google Sheets Template

### Customers Sheet Columns:
| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ID | Name | Type | Address | Zone | Email | Phone | Service Day | Monthly Rate | Status | Profitability | Notes |

### Routes Sheet Columns:
| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| ID | Name | Zone | Service Day | Customer IDs | Est. Time | Actual Time | Efficiency | Driver ID |

### Sample Data:
**Customers:**
```
1, Sunset HOA, HOA, 123 Sunset Blvd, Downtown, manager@sunset.com, 555-0101, Monday, 1250, active, high, Weekly service
2, Pine Ridge Apartments, Subscription, 456 Pine St, Westside, admin@pineridge.com, 555-0102, Wednesday, 890, active, medium, Bi-weekly pickup
```

**Routes:**
```
1, Downtown Monday, Downtown, Monday, 1,3,5, 240, 225, high, emp_001
2, Westside Wednesday, Westside, Wednesday, 2,4,6, 180, 195, medium, emp_002
```

## 🔄 Automation Workflows

### Daily Operations:
1. **Morning:** Check driver clock-ins, send alerts for missing drivers
2. **Midday:** Monitor route efficiency, alert for delays
3. **Evening:** Send daily summary to management chat

### Weekly Reports:
1. **Revenue Analysis:** Compare actual vs projected income
2. **Route Optimization:** Identify inefficient routes
3. **Customer Profitability:** Update zone profitability ratings

### Monthly Reviews:
1. **Customer Growth:** Track new subscriptions and cancellations
2. **Driver Performance:** Analyze punctuality and efficiency
3. **Financial Health:** Review overdue invoices and cash flow

## 🎛️ Dashboard Actions

### Sync Buttons:
- **📊 Sync FreshBooks:** Refresh revenue and invoice data
- **🚛 View Timeero Routes:** Open live GPS tracking
- **📋 Import Google Sheets:** Update customer and route data
- **💬 Send Chat Alert:** Test notification system

### Quick Actions:
- Export daily/weekly reports
- Create new invoices
- Clock in/out employees
- Update route assignments

## 🔧 Customization

### Alert Configuration:
```typescript
googleChatAPI.setAlertConfig({
  jobBooked: true,        // New job notifications
  paymentReceived: true,  // Payment alerts
  driverMissing: true,    // Late driver warnings
  routeInefficient: false, // Disable route alerts
  overdueInvoices: true   // Invoice reminders
})
```

### Data Refresh Intervals:
- **FreshBooks:** Every 15 minutes
- **Timeero:** Every 5 minutes
- **Google Sheets:** Every 30 minutes
- **Alerts:** Real-time via webhooks

## 🚨 Troubleshooting

### Common Issues:
1. **API Rate Limits:** Check API documentation for limits
2. **Authentication Errors:** Verify API keys and tokens
3. **Sheet Access:** Ensure service account has access
4. **Chat Webhooks:** Verify webhook URL is correct

### Debug Mode:
Set environment variable for detailed logging:
```
DEBUG=true
```

## 📈 Next Steps (Phase 2)
1. **Database Integration:** Move from mock data to PostgreSQL
2. **Advanced Analytics:** Predictive route optimization
3. **Mobile App:** Driver mobile interface
4. **Customer Portal:** Self-service booking system
5. **Financial Forecasting:** Revenue prediction models

## 🆘 Support
For setup assistance or feature requests, check the console logs or contact your development team. 