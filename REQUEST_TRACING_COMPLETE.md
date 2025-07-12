# Request Tracing and Centralized Logging Implementation

## Overview

This document outlines the complete implementation of request tracing and centralized error logging for the Waste Operations Intelligence Platform. The system provides comprehensive monitoring, error tracking, and performance analytics with support for Sentry integration.

## Architecture Components

### 1. Centralized Logger Service (`src/lib/monitoring/logger.ts`)

The core logging service that provides:
- **Structured Logging**: Consistent log format with metadata
- **Request Correlation**: Unique request IDs for tracing
- **Error Categorization**: Automated error classification
- **Performance Monitoring**: Request timing and memory usage
- **Multi-Channel Output**: Console, file, and Sentry integration
- **Context Management**: Request-specific information storage

### 2. Request Tracing Middleware (`src/middleware/request-tracing.ts`)

Middleware that handles:
- **Request Context Creation**: Automatic context generation
- **Performance Measurement**: Response time tracking
- **Error Wrapping**: Enhanced error handling with context
- **Header Injection**: Request/trace ID propagation
- **Memory Monitoring**: Resource usage tracking

### 3. Logger Features

#### Log Levels
- **ERROR**: Critical errors requiring immediate attention
- **WARN**: Warning conditions that should be monitored
- **INFO**: General information about system operation
- **DEBUG**: Detailed information for debugging
- **TRACE**: Very detailed execution information

#### Error Categories
- **AUTHENTICATION**: Auth/authorization failures
- **EXTERNAL_API**: Third-party API errors
- **DATABASE**: Database operation failures
- **VALIDATION**: Input validation errors
- **BUSINESS_LOGIC**: Business rule violations
- **NETWORK**: Network connectivity issues
- **SYSTEM**: System-level errors
- **USER_INPUT**: User input problems

## Setup Instructions

### 1. Environment Configuration

Add the following environment variables to your `.env.local`:

```bash
# Logging Configuration
LOG_LEVEL=info                    # debug, info, warn, error
NODE_ENV=development              # development, production
SENTRY_DSN=your_sentry_dsn_here   # Optional: For error tracking

# File Logging (Production)
ENABLE_FILE_LOGGING=true          # Enable file logging in production
LOG_DIRECTORY=./logs              # Directory for log files
```

### 2. Sentry Integration (Optional)

Install Sentry SDK:
```bash
npm install @sentry/nextjs
```

Configure Sentry in your environment:
```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### 3. Integration in API Routes

#### Method 1: Using the Request Tracing Wrapper

```typescript
// src/app/api/example/route.ts
import { withRequestTracing } from '@/middleware/request-tracing';

async function handleExample(request: NextRequest) {
  // Your API logic here
  return NextResponse.json({ success: true });
}

// Wrap your handler with request tracing
export const GET = withRequestTracing(handleExample, 'example-handler');
```

#### Method 2: Manual Integration

```typescript
// src/app/api/example/route.ts
import { getRequestContext, logger } from '@/middleware/request-tracing';

export async function POST(request: NextRequest) {
  const context = getRequestContext(request);
  const requestId = context.requestId;
  
  try {
    logger.info('Processing example request', requestId);
    
    // Your API logic here
    const result = await someOperation();
    
    logger.info('Example request completed successfully', requestId);
    return NextResponse.json(result);
    
  } catch (error) {
    logger.error('Example request failed', error, requestId);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4. Performance Monitoring

```typescript
import { measurePerformance, traceDbOperation, traceApiCall } from '@/middleware/request-tracing';

// Generic performance measurement
const result = await measurePerformance(
  () => expensiveOperation(),
  'expensive-operation',
  requestId
);

// Database operation tracing
const users = await traceDbOperation(
  () => prisma.user.findMany(),
  'users',
  'SELECT',
  requestId
);

// API call tracing
const apiResult = await traceApiCall(
  () => fetch('/api/external'),
  'ExternalAPI',
  '/api/external',
  requestId
);
```

## Usage Examples

### Basic Logging

```typescript
import { logger, ErrorCategory } from '@/lib/monitoring/logger';

// Info logging
logger.info('User action completed', requestId, {
  userId: 'user123',
  action: 'profile_update'
});

// Error logging with category
logger.error(
  'Database connection failed',
  new Error('Connection timeout'),
  requestId,
  ErrorCategory.DATABASE,
  { table: 'users', operation: 'SELECT' }
);

// Warning with context
logger.warn(
  'API rate limit approaching',
  requestId,
  ErrorCategory.EXTERNAL_API,
  { currentUsage: 95, limit: 100 }
);
```

### Specialized Logging Helpers

```typescript
// API error logging
logger.logAPIError(
  'fetchUserData',
  'TimeeroAPI',
  new Error('API timeout'),
  requestId,
  { userId: 'user123', endpoint: '/users' }
);

// Database error logging
logger.logDatabaseError(
  'insertUser',
  'users',
  new Error('Duplicate key violation'),
  requestId,
  { userId: 'user123' }
);

// Authentication error logging
logger.logAuthError(
  'login',
  'user123',
  'invalid_password',
  requestId,
  { attempts: 3 }
);

// Business logic error logging
logger.logBusinessError(
  'calculatePricing',
  new Error('Invalid service type'),
  requestId,
  { serviceType: 'unknown' }
);
```

### Request Context Management

```typescript
import { logger } from '@/middleware/request-tracing';

// Create request context
const context = logger.createRequestContext(request);

// Update context with user information
logger.updateRequestContext(context.requestId, {
  userId: 'user123',
  userRole: 'admin'
});

// Get existing context
const existingContext = logger.getRequestContext(requestId);
```

## Log Format

### Console Output Format
```
[2024-01-15T10:30:45.123Z] [INFO] [waste-ops-intelligence] [REQ:req_1705311045123_abc123] [USER:user123] [AUTHENTICATION] Login successful
Metadata: { email: 'user@example.com', sessionId: 'session123' }
```

### File Output Format (JSON)
```json
{
  "level": "info",
  "message": "Login successful",
  "requestId": "req_1705311045123_abc123",
  "userId": "user123",
  "category": "authentication",
  "metadata": {
    "email": "user@example.com",
    "sessionId": "session123"
  },
  "timestamp": "2024-01-15T10:30:45.123Z",
  "service": "waste-ops-intelligence",
  "environment": "production"
}
```

## Testing

### Running the Test Suite

```bash
# Start the development server
npm run dev

# Run the request tracing tests
node test-request-tracing.js
```

### Test Coverage

The test suite validates:
- ✅ Request ID generation and uniqueness
- ✅ Request/response correlation
- ✅ Performance monitoring
- ✅ Error tracking with context
- ✅ Memory usage monitoring
- ✅ Concurrent request isolation
- ✅ Error categorization
- ✅ Tracing header propagation

## Monitoring and Alerting

### Key Metrics to Monitor

1. **Request Volume**: Number of requests per minute/hour
2. **Response Times**: Average, P95, P99 response times
3. **Error Rates**: 4xx and 5xx error percentages
4. **Memory Usage**: Memory consumption per request
5. **Slow Requests**: Requests taking >5 seconds
6. **Database Performance**: Query execution times
7. **External API Health**: Third-party API response times

### Recommended Alerts

1. **High Error Rate**: >5% error rate for 5 minutes
2. **Slow Response Time**: P95 response time >2 seconds
3. **Memory Leak**: Memory usage increasing consistently
4. **Database Issues**: Query time >10 seconds
5. **External API Failures**: External API error rate >10%

## Production Deployment

### Environment Variables
```bash
# Production configuration
NODE_ENV=production
LOG_LEVEL=info
ENABLE_FILE_LOGGING=true
SENTRY_DSN=your_production_sentry_dsn

# Optional: External monitoring
DATADOG_API_KEY=your_datadog_key
NEW_RELIC_LICENSE_KEY=your_newrelic_key
```

### File Log Management

Logs are automatically rotated by date and stored in:
- `logs/error-YYYY-MM-DD.log`
- `logs/warn-YYYY-MM-DD.log`
- `logs/info-YYYY-MM-DD.log`

Consider using log rotation tools like `logrotate` for production environments.

### Log Aggregation

For production environments, consider integrating with:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Splunk** for enterprise logging
- **Fluentd** for log forwarding
- **Grafana** for visualization

## Performance Considerations

### Memory Management
- Request contexts are automatically cleaned up after 1 hour
- Log files are rotated daily
- In-memory caching has size limits

### Performance Impact
- Logging overhead: ~1-2ms per request
- Memory usage: ~1KB per request context
- File I/O: Asynchronous, non-blocking

### Optimization Tips
1. Use appropriate log levels in production
2. Implement log sampling for high-volume endpoints
3. Use structured logging for better parsing
4. Monitor log storage costs and retention policies

## Security Considerations

### Data Privacy
- Sensitive data is automatically filtered from logs
- PII is masked in error messages
- API keys and passwords are never logged

### Log Security
- Log files have restricted permissions
- Sensitive request data is excluded from logs
- User identifiers are hashed in production

## Troubleshooting

### Common Issues

1. **Missing Request IDs**
   - Ensure middleware is properly configured
   - Check header propagation in API routes

2. **High Memory Usage**
   - Verify request context cleanup is working
   - Check for memory leaks in long-running processes

3. **Missing Sentry Events**
   - Verify SENTRY_DSN is correctly configured
   - Check network connectivity to Sentry

4. **Log File Permissions**
   - Ensure write permissions for log directory
   - Check disk space availability

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug
```

This will show detailed information about:
- Request context creation
- Performance measurements
- Error categorization
- Context cleanup operations

## API Reference

### Logger Methods

#### Core Logging
- `logger.error(message, error?, requestId?, category?, metadata?)`
- `logger.warn(message, requestId?, category?, metadata?)`
- `logger.info(message, requestId?, metadata?)`
- `logger.debug(message, requestId?, metadata?)`
- `logger.trace(message, requestId?, metadata?)`

#### Specialized Logging
- `logger.logAPIError(operation, apiName, error, requestId?, metadata?)`
- `logger.logDatabaseError(operation, table, error, requestId?, metadata?)`
- `logger.logBusinessError(operation, error, requestId?, metadata?)`
- `logger.logAuthError(operation, userId, reason, requestId?, metadata?)`
- `logger.logPerformance(metrics)`

#### Context Management
- `logger.createRequestContext(request, requestId?)`
- `logger.updateRequestContext(requestId, updates)`
- `logger.getRequestContext(requestId)`
- `logger.generateRequestId()`

### Middleware Functions

#### Request Tracing
- `withRequestTracing(handler, handlerName)`
- `requestTracingMiddleware(request)`
- `getRequestContext(request)`
- `getRequestId(request)`
- `updateRequestContextWithUser(requestId, userId, userRole)`

#### Performance Monitoring
- `measurePerformance(operation, operationName, requestId?)`
- `traceDbOperation(operation, tableName, operationType, requestId?)`
- `traceApiCall(operation, apiName, endpoint, requestId?)`

## Integration Examples

### Integration with Existing Error Handlers

```typescript
// Update existing error handlers
try {
  await riskyOperation();
} catch (error) {
  // Replace console.error with structured logging
  logger.error(
    'Risky operation failed',
    error,
    requestId,
    ErrorCategory.BUSINESS_LOGIC,
    { operation: 'riskyOperation', context: 'user-action' }
  );
  throw error;
}
```

### Integration with React Components

```typescript
// Client-side error boundary with request tracing
import { useEffect } from 'react';

function MyComponent() {
  useEffect(() => {
    // Get request ID from response headers
    const requestId = document.querySelector('meta[name="request-id"]')?.content;
    
    // Include request ID in client-side error reporting
    window.addEventListener('error', (event) => {
      fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: event.error.message,
          requestId,
          url: window.location.href
        })
      });
    });
  }, []);
  
  return <div>My Component</div>;
}
```

## Best Practices

### 1. Consistent Logging Patterns
- Always include request ID when available
- Use appropriate log levels
- Include relevant context in metadata
- Use error categories for better filtering

### 2. Performance Monitoring
- Monitor database query performance
- Track external API response times
- Set up alerts for slow operations
- Use performance measurement helpers

### 3. Error Handling
- Log errors with full context
- Include user-friendly error messages
- Categorize errors appropriately
- Don't log sensitive information

### 4. Security
- Never log passwords or API keys
- Sanitize user input in logs
- Use appropriate log levels in production
- Implement log retention policies

## Conclusion

The request tracing and centralized logging system provides comprehensive monitoring and debugging capabilities for the Waste Operations Intelligence Platform. The implementation includes:

✅ **Request Correlation**: Unique request IDs for tracing requests across services
✅ **Performance Monitoring**: Detailed timing and memory usage tracking
✅ **Error Categorization**: Automated error classification and context
✅ **Sentry Integration**: Optional error tracking and alerting
✅ **Production Ready**: File logging, log rotation, and security considerations
✅ **Easy Integration**: Simple wrappers and helpers for existing code
✅ **Comprehensive Testing**: Full test suite with real-world scenarios

This system provides the foundation for robust monitoring, debugging, and performance optimization of the application in both development and production environments. 