import { NextRequest, NextResponse } from 'next/server';
import { logger, RequestContext, PerformanceMetrics } from '../lib/monitoring/logger';

// Request tracing middleware
export async function requestTracingMiddleware(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  // Create request context and ID
  const requestContext = logger.createRequestContext(request);
  const requestId = requestContext.requestId;
  
  // Log incoming request
  logger.info(`Incoming request: ${request.method} ${request.nextUrl.pathname}`, requestId, {
    type: 'request_start',
    userAgent: requestContext.userAgent,
    ipAddress: requestContext.ipAddress,
    query: Object.fromEntries(request.nextUrl.searchParams.entries())
  });

  // Add request ID to headers for client-side tracing
  const response = NextResponse.next();
  response.headers.set('X-Request-ID', requestId);
  response.headers.set('X-Trace-ID', requestId);
  
  // Measure response time and log performance metrics
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Create performance metrics
  const metrics: PerformanceMetrics = {
    requestId,
    endpoint: request.nextUrl.pathname,
    method: request.method,
    duration,
    status: response.status,
    timestamp: new Date().toISOString(),
    memoryUsage: process.memoryUsage()
  };
  
  // Log performance metrics
  logger.logPerformance(metrics);
  
  // Log response
  logger.info(`Request completed: ${request.method} ${request.nextUrl.pathname} - ${response.status} (${duration}ms)`, requestId, {
    type: 'request_end',
    status: response.status,
    duration,
    memoryUsage: metrics.memoryUsage
  });
  
  return response;
}

// Enhanced error handler with request tracing
export function withRequestTracing<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  handlerName: string
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest;
    const startTime = Date.now();
    
    // Create or get request context
    let requestContext: RequestContext;
    const existingRequestId = request.headers.get('X-Request-ID');
    
    if (existingRequestId) {
      requestContext = logger.getRequestContext(existingRequestId) || 
                      logger.createRequestContext(request, existingRequestId);
    } else {
      requestContext = logger.createRequestContext(request);
    }
    
    const requestId = requestContext.requestId;
    
    try {
      // Log handler start
      logger.debug(`Handler started: ${handlerName}`, requestId, {
        type: 'handler_start',
        handler: handlerName
      });
      
      // Execute handler
      const result = await handler(...args);
      
      // Log successful completion
      const duration = Date.now() - startTime;
      logger.debug(`Handler completed: ${handlerName} (${duration}ms)`, requestId, {
        type: 'handler_end',
        handler: handlerName,
        duration,
        status: result.status
      });
      
      // Add request ID to response headers
      result.headers.set('X-Request-ID', requestId);
      result.headers.set('X-Trace-ID', requestId);
      
      return result;
      
    } catch (error) {
      // Log error with full context
      const duration = Date.now() - startTime;
      logger.error(
        `Handler failed: ${handlerName}`,
        error instanceof Error ? error : new Error(String(error)),
        requestId,
        undefined,
        {
          type: 'handler_error',
          handler: handlerName,
          duration,
          endpoint: request.nextUrl.pathname,
          method: request.method
        }
      );
      
      // Return error response with request tracing
      const errorResponse = NextResponse.json(
        { 
          success: false, 
          error: 'Internal server error',
          requestId,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
      
      errorResponse.headers.set('X-Request-ID', requestId);
      errorResponse.headers.set('X-Trace-ID', requestId);
      
      return errorResponse;
    }
  };
}

// Request context helper for use in API routes
export function getRequestContext(request: NextRequest): RequestContext {
  const requestId = request.headers.get('X-Request-ID');
  
  if (requestId) {
    return logger.getRequestContext(requestId) || logger.createRequestContext(request, requestId);
  }
  
  return logger.createRequestContext(request);
}

// Helper to extract request ID from headers
export function getRequestId(request: NextRequest): string {
  return request.headers.get('X-Request-ID') || logger.generateRequestId();
}

// Helper to update request context with user info
export function updateRequestContextWithUser(
  requestId: string, 
  userId: string, 
  userRole: string
): void {
  logger.updateRequestContext(requestId, { userId, userRole });
}

// Performance monitoring helper
export function measurePerformance<T>(
  operation: () => Promise<T>,
  operationName: string,
  requestId?: string
): Promise<T> {
  const startTime = Date.now();
  
  logger.debug(`Performance measurement started: ${operationName}`, requestId, {
    type: 'performance_start',
    operation: operationName
  });
  
  return operation().then(
    (result) => {
      const duration = Date.now() - startTime;
      logger.debug(`Performance measurement completed: ${operationName} (${duration}ms)`, requestId, {
        type: 'performance_end',
        operation: operationName,
        duration,
        success: true
      });
      
      // Log slow operations as warnings
      if (duration > 3000) { // 3 seconds
        logger.warn(`Slow operation detected: ${operationName} (${duration}ms)`, requestId, undefined, {
          type: 'slow_operation',
          operation: operationName,
          duration
        });
      }
      
      return result;
    },
    (error) => {
      const duration = Date.now() - startTime;
      logger.error(
        `Performance measurement failed: ${operationName} (${duration}ms)`,
        error instanceof Error ? error : new Error(String(error)),
        requestId,
        undefined,
        {
          type: 'performance_error',
          operation: operationName,
          duration,
          success: false
        }
      );
      
      throw error;
    }
  );
}

// Database operation tracing
export function traceDbOperation<T>(
  operation: () => Promise<T>,
  tableName: string,
  operationType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
  requestId?: string
): Promise<T> {
  return measurePerformance(
    operation,
    `DB_${operationType}_${tableName}`,
    requestId
  );
}

// API call tracing
export function traceApiCall<T>(
  operation: () => Promise<T>,
  apiName: string,
  endpoint: string,
  requestId?: string
): Promise<T> {
  return measurePerformance(
    operation,
    `API_${apiName}_${endpoint}`,
    requestId
  );
}

// Export logger instance for direct use
export { logger }; 