# 🚛 WasteOps Intelligence Platform

## Overview

WasteOps Intelligence is a comprehensive waste management operations platform built with Next.js that provides executive-level insights, pricing intelligence, and operational analytics for waste collection companies. The platform combines real-time data analysis with advanced business intelligence to optimize routes, pricing, and customer relationships.

## 🎯 Key Features

### Executive Dashboard
- **Real-time Operations Metrics**: Active customers, revenue tracking, completion times
- **Business Valuation Simulator**: DCF analysis, revenue multiples, risk assessments
- **Customer Portfolio Analytics**: HOA vs. Subscription performance analysis
- **Interactive Maps**: Geographic customer distribution with service zones

### CEO Intelligence Features
- **Advanced Pricing Engine**: Dynamic pricing based on route efficiency and market conditions
- **Profitability Analysis**: Customer-level profit/loss with risk scoring
- **Competitive Intelligence**: Market positioning and pricing benchmarks
- **Expansion Opportunity Finder**: Data-driven growth recommendations

### Operations Management
- **Route Optimization**: AI-powered route planning and efficiency analysis
- **Customer Serviceability**: Address validation and service area analysis
- **Performance Tracking**: Driver performance, vehicle utilization, completion times
- **Automated Alerts**: Google Chat integration for operational notifications

## 🛠️ Technology Stack

- **Frontend**: Next.js 15.3.3, React 18, TypeScript
- **UI Components**: Shadcn/UI with Tailwind CSS
- **Database**: Prisma ORM with PostgreSQL
- **Authentication**: Role-based access control (RBAC)
- **Analytics**: Recharts for data visualization
- **Maps**: Google Maps API integration
- **Notifications**: Google Chat webhook integration

## 🔗 Integrations

The platform integrates with multiple third-party services to provide comprehensive business intelligence and operational data synchronization:

### FreshBooks Integration
- **Purpose**: Accounts Receivable/Payable management
- **Data Sync**: Invoice records, payment status, customer billing
- **Required Variables**: `FRESHBOOKS_API_TOKEN`, `FRESHBOOKS_ACCOUNT_ID`
- **API Endpoint**: `https://api.freshbooks.com/accounting/account/{account_id}/invoices`

### Stripe Integration
- **Purpose**: Payment processing and transaction management
- **Data Sync**: Payment charges, transaction history, payment methods
- **Required Variables**: `STRIPE_SECRET_KEY`
- **Features**: Automatic amount conversion (cents to dollars), payment status tracking

### Timeero Integration
- **Purpose**: Time tracking and employee management
- **Data Sync**: Employee timesheets, clock-in/out records, work duration
- **Required Variables**: `TIMEERO_API_KEY`
- **API Endpoint**: `https://api.timeero.app/api/public/timesheets`

### G-Suite (Google Sheets) Integration
- **Purpose**: Spreadsheet data import and reporting
- **Data Sync**: Sheet data, automated report generation
- **Required Variables**: `GOOGLE_SERVICE_KEY_JSON`, `GOOGLE_SHEET_ID`
- **Features**: Service account authentication, read-only access, JSON data storage

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Google Maps API key
- Google Chat webhook (optional)
- Integration service accounts (FreshBooks, Stripe, Timeero, Google)

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd waste-ops-intelligence
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
```

## 🔧 Environment Variables

Configure your environment variables in `.env.local`:

### Database Configuration
```env
DATABASE_URL="postgresql://username:password@localhost:5432/wasteops"
```

### Authentication & Security
```env
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### Google Services
```env
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
GOOGLE_CHAT_WEBHOOK_URL="your-google-chat-webhook-url"
GOOGLE_SERVICE_KEY_JSON='{"type": "service_account", "project_id": "your-project", ...}'
GOOGLE_SHEET_ID="your-google-sheet-id"
```

### FreshBooks Integration
```env
FRESHBOOKS_API_TOKEN="your-freshbooks-api-token"
FRESHBOOKS_ACCOUNT_ID="your-freshbooks-account-id"
```

### Stripe Integration
```env
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
```

### Timeero Integration
```env
TIMEERO_API_KEY="your-timeero-api-key"
```

### Optional Development Variables
```env
NODE_ENV="development"
PRISMA_CLIENT_ENGINE_TYPE="binary"
```

## 🔄 Running Syncs

The platform includes a comprehensive data synchronization service that integrates with multiple external APIs to keep your data current.

### Basic Usage

```typescript
import { DataSyncService } from '@/lib/services/data-sync';

// Initialize the service
const syncService = new DataSyncService();

// Sync all integrations
await syncService.syncFreshBooks();
await syncService.syncStripe();
await syncService.syncTimeero();
await syncService.syncGoogleSheets();
```

### FreshBooks Sync
```typescript
// Sync invoice data from FreshBooks
await syncService.syncFreshBooks();

// This will:
// - Fetch invoices from FreshBooks API
// - Validate API response data
// - Upsert invoice records in database
// - Handle amount/status conversions
```

### Stripe Sync
```typescript
// Sync payment data from Stripe
await syncService.syncStripe();

// This will:
// - Fetch charges from Stripe API
// - Convert amounts from cents to dollars
// - Upsert payment records with Stripe IDs
// - Link payments to invoice records
```

### Timeero Sync
```typescript
// Sync time tracking data from Timeero
await syncService.syncTimeero();

// This will:
// - Fetch timesheet data with date ranges
// - Calculate work durations
// - Upsert time entry records
// - Handle nullable end_time values
```

### Google Sheets Sync
```typescript
// Sync spreadsheet data from Google Sheets
await syncService.syncGoogleSheets();

// This will:
// - Authenticate with Google Service Account
// - Read sheet data from A1:Z range
// - Store data as JSON in reports table
// - Handle authentication and permissions
```

### Error Handling
All sync methods include comprehensive error handling:
- Environment variable validation
- API authentication verification
- Network error recovery
- Data validation with Zod schemas
- Detailed error logging

### 3. Database Setup
```bash
npx prisma generate
npx prisma db push
```

### 4. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the platform.

## 🎯 CEO Dashboard Features

### Business Valuation Simulator
- **DCF Analysis**: Discounted cash flow modeling with customizable assumptions
- **Revenue Multiple**: Market-based valuation using industry benchmarks
- **Risk Assessment**: Automated risk scoring based on operational metrics
- **Scenario Planning**: What-if analysis for strategic decisions

### Advanced Analytics
- **Customer Profitability**: Individual customer P&L analysis
- **Route Efficiency**: Revenue per minute, completion time optimization
- **Market Intelligence**: Competitive positioning and pricing analysis
- **Growth Opportunities**: Data-driven expansion recommendations

### Executive KPIs
- **Monthly Recurring Revenue**: Subscription-based revenue tracking
- **Customer Acquisition Cost**: Marketing efficiency metrics
- **Lifetime Value**: Customer retention and revenue forecasting
- **Operational Efficiency**: Route optimization and resource utilization

## 🗺️ Navigation

- **Main Dashboard** (`/dashboard`): Operations overview and key metrics
- **CEO Insights** (`/dashboard/ceo-insights`): Executive analytics and business valuation
- **RFP Intelligence** (`/dashboard/rfp-intelligence`): Competitive analysis tools
- **Serviceability Check** (`/dashboard/serviceability-check`): Address validation

## 🔧 Development

### Build Commands
```bash
npm run build          # Production build
npm run start          # Start production server
npm run lint           # Run ESLint
npm run lint:fix       # Fix linting issues
```

### Testing

The platform includes a comprehensive test suite using Jest with TypeScript support and extensive mocking capabilities.

#### Running Tests
```bash
npm test               # Run all tests
npm run test:watch     # Watch mode testing
npm run test:coverage  # Generate coverage report
```

#### Test Structure
```
tests/
├── setup.ts           # Test configuration and mocks
├── data-sync.test.ts  # DataSyncService integration tests
└── __mocks__/         # Mock modules
```

#### Test Features
- **Isolated Testing**: Mocked APIs and database calls
- **Environment Validation**: Tests for missing credentials
- **Error Handling**: Comprehensive error path testing
- **Integration Testing**: Full sync workflow validation

#### Writing Tests
```typescript
// Example test structure
describe('DataSyncService', () => {
  let service: DataSyncService;
  
  beforeEach(() => {
    service = new DataSyncService();
    // Setup mocks and environment
  });
  
  it('should sync data successfully', async () => {
    // Test implementation
  });
});
```

#### Test Configuration
- **Framework**: Jest with ts-jest preset
- **Mocking**: jest-mock-extended for deep mocking
- **Environment**: Node.js test environment
- **Coverage**: Automatic coverage reporting

### Database Management
```bash
npx prisma studio      # Database GUI
npx prisma migrate dev # Create new migration
npx prisma db seed     # Seed database
```

## 📊 Audit Notes

### Performance Optimizations

#### Database Efficiency
- **Batch Upserts**: All sync operations use upsert patterns for optimal performance
- **Transaction Wrapping**: Database operations wrapped in transactions for consistency
- **Indexed Lookups**: Foreign key relationships optimized with proper indexing
- **Connection Pooling**: Prisma connection pooling for concurrent operations

#### API Integration Efficiency
- **Zod Validation**: Runtime type checking with minimal overhead
- **Error Boundaries**: Graceful degradation for API failures
- **Retry Logic**: Exponential backoff for transient failures (TODO: implement)
- **Rate Limiting**: Respect for API rate limits and quotas

### Scalability Considerations

#### Data Volume Handling
- **Pagination Support**: Ready for large dataset pagination (TODO: implement)
- **Incremental Sync**: Delta sync capabilities for large datasets
- **Parallel Processing**: Multiple sync operations can run concurrently
- **Memory Management**: Efficient memory usage for large API responses

#### Performance Monitoring
- **Execution Time Tracking**: Built-in performance monitoring
- **Error Rate Monitoring**: Comprehensive error logging and tracking
- **Resource Utilization**: Database connection and API call monitoring
- **Alerting Integration**: Google Chat notifications for sync failures

### Recommended Improvements

#### Short-term Enhancements
- **Pagination Implementation**: Add pagination for large API responses
- **Retry Logic**: Implement exponential backoff for failed requests
- **Caching Layer**: Add Redis caching for frequently accessed data
- **Webhook Integration**: Real-time sync triggers instead of polling

#### Long-term Scalability
- **Queue System**: Implement job queues for background processing
- **Microservices**: Break sync service into independent microservices
- **Event-driven Architecture**: Move to event-driven sync patterns
- **Data Streaming**: Real-time data streaming for high-frequency updates

#### Security Enhancements
- **Secret Rotation**: Automated API key rotation
- **Audit Logging**: Comprehensive audit trail for all sync operations
- **Access Control**: Fine-grained permissions for sync operations
- **Encryption**: End-to-end encryption for sensitive data

#### Monitoring & Observability
- **Metrics Dashboard**: Real-time sync performance monitoring
- **Health Checks**: Automated health monitoring for all integrations
- **SLA Monitoring**: Service level agreement tracking
- **Performance Alerting**: Proactive alerts for performance degradation

## 🔐 Security Features

- **Role-Based Access Control**: Admin, Manager, Operator roles
- **API Security**: Rate limiting, input validation, CORS protection
- **Data Encryption**: Sensitive data encryption at rest
- **Audit Logging**: Complete action tracking and monitoring

## 📊 Data Sources

- **Customer Data**: Real customer records with geocoded addresses
- **Pricing Data**: Dynamic pricing based on route efficiency
- **Performance Metrics**: Real-time operational data
- **Market Data**: Industry benchmarks and competitive intelligence

## 🚀 Deployment

### Vercel Deployment (Recommended)
1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
npm run start
```

### Environment Variables for Production
- Set all required environment variables
- Configure database connection
- Set up Google Maps API key
- Configure Google Chat webhook

## 📱 Mobile Support

The platform is fully responsive and optimized for:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Tablet devices (iPad, Android tablets)
- Mobile phones (iOS, Android)

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface with Tableau-inspired design
- **Drag & Drop**: Customizable dashboard layout
- **Dark Mode**: System preference detection
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Optimized for fast loading and smooth interactions

## 🔄 API Endpoints

- `/api/customers` - Customer management
- `/api/pricing-service` - Dynamic pricing calculations
- `/api/rfp-analysis` - RFP intelligence processing
- `/api/serviceability` - Address validation
- `/api/send-chat-message` - Google Chat integration

## 📈 Performance Optimizations

- **Memoization**: Cached pricing calculations with 5-minute TTL
- **Lazy Loading**: Components and images loaded on demand
- **Code Splitting**: Automatic bundle optimization
- **CDN Integration**: Static assets served from CDN

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in `/docs`

---

**🎉 Ready to transform your waste management operations with data-driven intelligence!**
