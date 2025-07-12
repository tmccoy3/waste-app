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

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Google Maps API key
- Google Chat webhook (optional)

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

Configure your environment variables:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/wasteops"
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
GOOGLE_CHAT_WEBHOOK_URL="your-google-chat-webhook-url"
NEXTAUTH_SECRET="your-nextauth-secret"
```

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
```bash
npm run test           # Run test suite
npm run test:watch     # Watch mode testing
```

### Database Management
```bash
npx prisma studio      # Database GUI
npx prisma migrate dev # Create new migration
npx prisma db seed     # Seed database
```

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
