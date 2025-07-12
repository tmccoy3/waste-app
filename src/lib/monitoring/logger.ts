import { NextRequest } from 'next/server';

// Log Levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace'
}

// Error Categories for better classification
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  EXTERNAL_API = 'external_api',
  DATABASE = 'database',
  NETWORK = 'network',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  USER_INPUT = 'user_input'
}

// Request Context Interface
export interface RequestContext {
  requestId: string;
  userId?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  sessionId?: string;
  timestamp: string;
}

// Log Entry Interface
export interface LogEntry {
  level: LogLevel;
  message: string;
  requestId?: string;
  userId?: string;
  category?: ErrorCategory;
  metadata?: Record<string, any>;
  error?: Error;
  timestamp: string;
  service: string;
  environment: string;
}

// Performance Metrics Interface
export interface PerformanceMetrics {
  requestId: string;
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: string;
  userId?: string;
  memoryUsage?: NodeJS.MemoryUsage;
}

// Logger Configuration
interface LoggerConfig {
  enableConsole: boolean;
  enableSentry: boolean;
  enableFileLogging: boolean;
  minLevel: LogLevel;
  serviceName: string;
  environment: string;
  sentryDsn?: string;
}

// Centralized Logger Service
class CentralizedLogger {
  private config: LoggerConfig;
  private requestStore = new Map<string, RequestContext>();

  constructor() {
    this.config = {
      enableConsole: true,
      enableSentry: !!process.env.SENTRY_DSN,
      enableFileLogging: process.env.NODE_ENV === 'production',
      minLevel: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
      serviceName: 'waste-ops-intelligence',
      environment: process.env.NODE_ENV || 'development',
      sentryDsn: process.env.SENTRY_DSN
    };

    this.initializeSentry();
  }

  // Initialize Sentry if enabled
  private initializeSentry(): void {
    if (this.config.enableSentry && this.config.sentryDsn) {
      try {
        // Dynamic import to avoid issues if Sentry is not installed
        // @ts-expect-error - Optional dependency
        import('@sentry/nextjs').then((Sentry) => {
          Sentry.init({
            dsn: this.config.sentryDsn,
            environment: this.config.environment,
            integrations: [
              Sentry.httpIntegration(),
              Sentry.replayIntegration()
            ],
            tracesSampleRate: 0.1,
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,
          });
        }).catch((error) => {
          console.warn('Sentry not available:', error);
        });
      } catch (error) {
        console.warn('Sentry initialization failed:', error);
      }
    }
  }

  // Generate unique request ID
  public generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create request context from NextRequest
  public createRequestContext(request: NextRequest, requestId?: string): RequestContext {
    const id = requestId || this.generateRequestId();
    const context: RequestContext = {
      requestId: id,
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      endpoint: request.nextUrl.pathname,
      method: request.method,
      timestamp: new Date().toISOString()
    };

    // Extract user info from authorization header if available
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      context.sessionId = authHeader.substring(7);
    }

    // Store context for later use
    this.requestStore.set(id, context);

    return context;
  }

  // Update request context with user information
  public updateRequestContext(requestId: string, updates: Partial<RequestContext>): void {
    const context = this.requestStore.get(requestId);
    if (context) {
      Object.assign(context, updates);
      this.requestStore.set(requestId, context);
    }
  }

  // Get request context
  public getRequestContext(requestId: string): RequestContext | undefined {
    return this.requestStore.get(requestId);
  }

  // Clean up old request contexts (prevent memory leaks)
  public cleanupRequestContexts(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [requestId, context] of this.requestStore.entries()) {
      const contextTime = new Date(context.timestamp).getTime();
      if (contextTime < oneHourAgo) {
        this.requestStore.delete(requestId);
      }
    }
  }

  // Core logging method
  private log(entry: LogEntry): void {
    // Check if log level meets minimum threshold
    const levels = Object.values(LogLevel);
    const entryLevelIndex = levels.indexOf(entry.level);
    const minLevelIndex = levels.indexOf(this.config.minLevel);
    
    if (entryLevelIndex < minLevelIndex) {
      return;
    }

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Sentry logging for errors and warnings
    if (this.config.enableSentry && (entry.level === LogLevel.ERROR || entry.level === LogLevel.WARN)) {
      this.logToSentry(entry);
    }

    // File logging (in production)
    if (this.config.enableFileLogging) {
      this.logToFile(entry);
    }
  }

  // Console logging with formatting
  private logToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.service}]`;
    const requestInfo = entry.requestId ? ` [REQ:${entry.requestId}]` : '';
    const userInfo = entry.userId ? ` [USER:${entry.userId}]` : '';
    const categoryInfo = entry.category ? ` [${entry.category.toUpperCase()}]` : '';
    
    const logMessage = `${prefix}${requestInfo}${userInfo}${categoryInfo} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(logMessage, entry.error || '');
        if (entry.metadata) console.error('Metadata:', entry.metadata);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        if (entry.metadata) console.warn('Metadata:', entry.metadata);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        if (entry.metadata) console.info('Metadata:', entry.metadata);
        break;
      case LogLevel.DEBUG:
        console.debug(logMessage);
        if (entry.metadata) console.debug('Metadata:', entry.metadata);
        break;
      case LogLevel.TRACE:
        console.trace(logMessage);
        if (entry.metadata) console.trace('Metadata:', entry.metadata);
        break;
    }
  }

  // Sentry logging
  private async logToSentry(entry: LogEntry): Promise<void> {
    try {
      // @ts-expect-error - Optional dependency
      const Sentry = await import('@sentry/nextjs');
      
      Sentry.withScope((scope: any) => {
        // Set context
        if (entry.requestId) scope.setTag('requestId', entry.requestId);
        if (entry.userId) scope.setUser({ id: entry.userId });
        if (entry.category) scope.setTag('errorCategory', entry.category);
        
        // Set additional context
        scope.setContext('metadata', entry.metadata || {});
        scope.setLevel(entry.level === LogLevel.ERROR ? 'error' : 'warning');

        if (entry.error) {
          Sentry.captureException(entry.error);
        } else {
          Sentry.captureMessage(entry.message);
        }
      });
    } catch (error) {
      console.error('Failed to log to Sentry:', error);
    }
  }

  // File logging (for production environments)
  private logToFile(entry: LogEntry): void {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const logDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logFile = path.join(logDir, `${entry.level}-${new Date().toISOString().split('T')[0]}.log`);
      const logLine = JSON.stringify(entry) + '\n';
      
      fs.appendFileSync(logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  // Public logging methods
  public error(
    message: string, 
    error?: Error, 
    requestId?: string, 
    category?: ErrorCategory,
    metadata?: Record<string, any>
  ): void {
    const context = requestId ? this.getRequestContext(requestId) : undefined;
    
    this.log({
      level: LogLevel.ERROR,
      message,
      error,
      requestId,
      userId: context?.userId,
      category,
      metadata,
      timestamp: new Date().toISOString(),
      service: this.config.serviceName,
      environment: this.config.environment
    });
  }

  public warn(
    message: string, 
    requestId?: string, 
    category?: ErrorCategory,
    metadata?: Record<string, any>
  ): void {
    const context = requestId ? this.getRequestContext(requestId) : undefined;
    
    this.log({
      level: LogLevel.WARN,
      message,
      requestId,
      userId: context?.userId,
      category,
      metadata,
      timestamp: new Date().toISOString(),
      service: this.config.serviceName,
      environment: this.config.environment
    });
  }

  public info(
    message: string, 
    requestId?: string,
    metadata?: Record<string, any>
  ): void {
    const context = requestId ? this.getRequestContext(requestId) : undefined;
    
    this.log({
      level: LogLevel.INFO,
      message,
      requestId,
      userId: context?.userId,
      metadata,
      timestamp: new Date().toISOString(),
      service: this.config.serviceName,
      environment: this.config.environment
    });
  }

  public debug(
    message: string, 
    requestId?: string,
    metadata?: Record<string, any>
  ): void {
    const context = requestId ? this.getRequestContext(requestId) : undefined;
    
    this.log({
      level: LogLevel.DEBUG,
      message,
      requestId,
      userId: context?.userId,
      metadata,
      timestamp: new Date().toISOString(),
      service: this.config.serviceName,
      environment: this.config.environment
    });
  }

  public trace(
    message: string, 
    requestId?: string,
    metadata?: Record<string, any>
  ): void {
    const context = requestId ? this.getRequestContext(requestId) : undefined;
    
    this.log({
      level: LogLevel.TRACE,
      message,
      requestId,
      userId: context?.userId,
      metadata,
      timestamp: new Date().toISOString(),
      service: this.config.serviceName,
      environment: this.config.environment
    });
  }

  // Performance monitoring
  public logPerformance(metrics: PerformanceMetrics): void {
    const logMessage = `${metrics.method} ${metrics.endpoint} - ${metrics.status} (${metrics.duration}ms)`;
    
    this.info(logMessage, metrics.requestId, {
      type: 'performance',
      duration: metrics.duration,
      status: metrics.status,
      endpoint: metrics.endpoint,
      method: metrics.method,
      memoryUsage: metrics.memoryUsage
    });

    // Log slow requests as warnings
    if (metrics.duration > 5000) { // 5 seconds
      this.warn(
        `Slow request detected: ${logMessage}`,
        metrics.requestId,
        ErrorCategory.SYSTEM,
        { type: 'slow_request', ...metrics }
      );
    }
  }

  // API error logging helper
  public logAPIError(
    operation: string,
    apiName: string,
    error: Error,
    requestId?: string,
    metadata?: Record<string, any>
  ): void {
    this.error(
      `${apiName} API error during ${operation}: ${error.message}`,
      error,
      requestId,
      ErrorCategory.EXTERNAL_API,
      {
        operation,
        apiName,
        ...metadata
      }
    );
  }

  // Database error logging helper
  public logDatabaseError(
    operation: string,
    table: string,
    error: Error,
    requestId?: string,
    metadata?: Record<string, any>
  ): void {
    this.error(
      `Database error during ${operation} on ${table}: ${error.message}`,
      error,
      requestId,
      ErrorCategory.DATABASE,
      {
        operation,
        table,
        ...metadata
      }
    );
  }

  // Business logic error logging helper
  public logBusinessError(
    operation: string,
    error: Error,
    requestId?: string,
    metadata?: Record<string, any>
  ): void {
    this.error(
      `Business logic error during ${operation}: ${error.message}`,
      error,
      requestId,
      ErrorCategory.BUSINESS_LOGIC,
      {
        operation,
        ...metadata
      }
    );
  }

  // Auth error logging helper
  public logAuthError(
    operation: string,
    userId: string | undefined,
    reason: string,
    requestId?: string,
    metadata?: Record<string, any>
  ): void {
    this.warn(
      `Authentication/Authorization error during ${operation}: ${reason}`,
      requestId,
      ErrorCategory.AUTHENTICATION,
      {
        operation,
        userId,
        reason,
        ...metadata
      }
    );
  }
}

// Create singleton instance
export const logger = new CentralizedLogger();

// Periodic cleanup of request contexts
if (typeof window === 'undefined') { // Server-side only
  setInterval(() => {
    logger.cleanupRequestContexts();
  }, 30 * 60 * 1000); // Every 30 minutes
}

// Export additional classes
export { CentralizedLogger }; 