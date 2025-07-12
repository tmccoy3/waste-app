# Waste Ops Intelligence Platform

A comprehensive waste management operations intelligence platform built with Next.js, TypeScript, and modern React patterns.

## 🏗️ Architecture Overview

This platform follows a modular, scalable architecture designed for enterprise-grade waste management operations:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
├─────────────────────────────────────────────────────────────┤
│  • Next.js 15 + React 19 + TypeScript                      │
│  • Tailwind CSS + shadcn/ui components                     │
│  • Modular metric components with fallback states          │
│  • Error boundaries & centralized error handling           │
│  • Custom hooks for shared business logic                  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   Services Layer                            │
├─────────────────────────────────────────────────────────────┤
│  • MetricsService (singleton with caching)                 │
│  • PricingService (microservice architecture)              │
│  • ETL Pipeline (BigQuery integration)                     │
│  • Authentication & RBAC                                   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     API Layer                               │
├─────────────────────────────────────────────────────────────┤
│  • REST API endpoints                                       │
│  • Request tracing & monitoring                            │
│  • Rate limiting & security                                │
│  • Error logging (Sentry integration)                      │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  • PostgreSQL (primary database)                           │
│  • Redis (caching & session storage)                       │
│  • BigQuery (data warehouse)                               │
│  • Prisma ORM                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Component library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Component library built on Radix UI
- **Lucide React** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage

### DevOps & Monitoring
- **Sentry** - Error tracking and performance monitoring
- **PostHog/Amplitude** - Analytics (optional)
- **Cloudflare Zero Trust** - Security and access control

### Data Pipeline
- **BigQuery** - Data warehouse
- **Airbyte/Zapier** - ETL orchestration (optional)
- **Timeero API** - Time tracking integration

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── metrics/          # Metric-specific components
│   └── ErrorBoundary.tsx # Error handling
├── hooks/                # Custom React hooks
│   └── useMetrics.ts     # Shared metrics service
├── lib/                  # Utility libraries
├── utils/                # Helper functions
└── generated/            # Generated types/code
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd waste-ops-intelligence
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api

## 🔐 Security & Authentication

### Environment Variables
All sensitive configuration is stored in environment variables:
- Database credentials
- API keys
- Session secrets
- Third-party service tokens

### RBAC (Role-Based Access Control)
- **Admin**: Full access to all features and configuration
- **Analyst**: Read-only access to analytics and reports
- **Operator**: Access to route metrics and operational data

### Security Headers
- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options

## 📊 Monitoring & Observability

### Error Tracking
- **Sentry**: Centralized error reporting and performance monitoring
- **Error Boundaries**: React components that catch and handle errors gracefully
- **Custom Error Logging**: Structured error reports with context

### Analytics
- **PostHog**: User behavior analytics (optional)
- **Custom Metrics**: Business-specific KPIs and performance indicators

### Performance
- **Caching Strategy**: Redis for frequently accessed data
- **Database Optimization**: Query optimization and indexing
- **CDN**: Static asset delivery optimization

## 🔄 Development Workflow

### Code Quality
- **TypeScript**: Strict type checking
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit validation

### Testing
- **Jest**: Unit testing framework
- **React Testing Library**: Component testing
- **Cypress**: End-to-end testing

### Deployment
- **Vercel/Netlify**: Frontend deployment
- **Docker**: Containerization for production
- **CI/CD**: Automated testing and deployment

## 📈 Performance Optimization

### Caching Strategy
- **Redis**: Server-side caching for expensive calculations
- **React Query**: Client-side data fetching and caching
- **Memoization**: Component and calculation memoization

### Bundle Optimization
- **Code Splitting**: Dynamic imports for large components
- **Tree Shaking**: Unused code elimination
- **Image Optimization**: Next.js image optimization

## 🔧 Configuration

### Feature Flags
Environment-based feature toggling for gradual rollouts:
- `FEATURE_ANALYTICS_ENABLED`
- `FEATURE_RBAC_ENABLED`
- `FEATURE_BIGQUERY_ENABLED`

### API Configuration
- Rate limiting configuration
- CORS settings
- Request timeout settings

## 📚 Additional Documentation

- [API Documentation](./api/README.md)
- [Component Library](./components/README.md)
- [Database Schema](./database/README.md)
- [Deployment Guide](./deployment/README.md)
- [Security Guidelines](./security/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in the `/docs` folder 