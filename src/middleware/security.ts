/**
 * Security Middleware
 * Runtime security validation and credential checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { secretsManager } from '../lib/secrets-manager';

interface SecurityContext {
  isSecure: boolean;
  warnings: string[];
  errors: string[];
  requiredCredentials: string[];
  missingCredentials: string[];
}

// Rate limiting storage (in-memory for demo, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

class SecurityMiddleware {
  private static instance: SecurityMiddleware;
  private initialized = false;
  private securityContext: SecurityContext | null = null;

  private constructor() {}

  public static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware();
    }
    return SecurityMiddleware.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Run security audit
      const auditResults = secretsManager.validateAllSecrets();
      
      this.securityContext = {
        isSecure: auditResults.missingRequired.length === 0,
        warnings: auditResults.recommendations,
        errors: auditResults.invalidSecrets.map(secret => 
          `Invalid configuration for ${secret}`
        ),
        requiredCredentials: auditResults.requiredSecrets,
        missingCredentials: auditResults.missingRequired
      };

      // Log security status
      console.log('🔐 Security Middleware Initialized');
      console.log(`   Security Score: ${auditResults.securityScore}%`);
      console.log(`   Valid Secrets: ${auditResults.validSecrets.length}`);
      console.log(`   Missing Required: ${auditResults.missingRequired.length}`);
      
      if (auditResults.missingRequired.length > 0) {
        console.warn('⚠️  Missing required credentials:', auditResults.missingRequired);
      }

      this.initialized = true;
    } catch (error) {
      console.error('❌ Security Middleware initialization failed:', error);
      
      this.securityContext = {
        isSecure: false,
        warnings: ['Security initialization failed'],
        errors: ['Failed to validate credentials'],
        requiredCredentials: [],
        missingCredentials: []
      };
    }
  }

  public async validateRequest(request: NextRequest): Promise<{
    isValid: boolean;
    response?: NextResponse;
    context?: SecurityContext;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;
    const clientIP = this.getClientIP(request);

    // Rate limiting
    const rateLimitResult = this.checkRateLimit(clientIP, pathname);
    if (!rateLimitResult.allowed) {
      console.warn(`🚫 Rate limit exceeded for ${clientIP} on ${pathname}`);
      
      return {
        isValid: false,
        response: NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            retryAfter: rateLimitResult.retryAfter
          },
          { 
            status: 429,
            headers: {
              'Retry-After': rateLimitResult.retryAfter.toString(),
              'X-RateLimit-Limit': '100',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
            }
          }
        )
      };
    }

    // API endpoint security validation
    if (pathname.startsWith('/api/')) {
      const apiValidation = await this.validateAPIEndpoint(pathname, method);
      if (!apiValidation.isValid) {
        return {
          isValid: false,
          response: NextResponse.json(
            { 
              error: 'API endpoint validation failed',
              message: apiValidation.message,
              details: apiValidation.details
            },
            { status: apiValidation.status }
          )
        };
      }
    }

    // Add security headers
    const response = NextResponse.next();
    this.addSecurityHeaders(response);

    return {
      isValid: true,
      response,
      context: this.securityContext || undefined
    };
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    return 'unknown';
  }

  private checkRateLimit(clientIP: string, pathname: string): {
    allowed: boolean;
    retryAfter: number;
    resetTime: number;
  } {
    const key = `${clientIP}:${pathname}`;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 100;

    const existing = rateLimitStore.get(key);
    
    if (!existing) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true, retryAfter: 0, resetTime: now + windowMs };
    }

    if (now > existing.resetTime) {
      // Reset the window
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true, retryAfter: 0, resetTime: now + windowMs };
    }

    if (existing.count >= maxRequests) {
      const retryAfter = Math.ceil((existing.resetTime - now) / 1000);
      return { allowed: false, retryAfter, resetTime: existing.resetTime };
    }

    // Increment count
    existing.count++;
    rateLimitStore.set(key, existing);
    
    return { allowed: true, retryAfter: 0, resetTime: existing.resetTime };
  }

  private async validateAPIEndpoint(pathname: string, method: string): Promise<{
    isValid: boolean;
    message?: string;
    details?: string[];
    status: number;
  }> {
    const details: string[] = [];

    // Check for specific API endpoints that require credentials
    const credentialRequirements = this.getCredentialRequirements(pathname);
    
    for (const requirement of credentialRequirements) {
      if (!secretsManager.isSecretConfigured(requirement.key)) {
        details.push(`${requirement.key} is required for ${pathname}`);
      }
    }

    if (details.length > 0) {
      return {
        isValid: false,
        message: 'Missing required credentials for this endpoint',
        details,
        status: 503 // Service Unavailable
      };
    }

    // Method validation
    const allowedMethods = this.getAllowedMethods(pathname);
    if (!allowedMethods.includes(method)) {
      return {
        isValid: false,
        message: `Method ${method} not allowed for ${pathname}`,
        details: [`Allowed methods: ${allowedMethods.join(', ')}`],
        status: 405 // Method Not Allowed
      };
    }

    return { isValid: true, status: 200 };
  }

  private getCredentialRequirements(pathname: string): Array<{ key: string; description: string }> {
    const requirements: Array<{ key: string; description: string }> = [];

    // Google Maps API
    if (pathname.includes('maps') || pathname.includes('location')) {
      requirements.push({
        key: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
        description: 'Google Maps API key required'
      });
    }

    // Google Sheets API
    if (pathname.includes('google-sheets')) {
      requirements.push({
        key: 'GOOGLE_SERVICE_ACCOUNT_KEY',
        description: 'Google Service Account required'
      });
    }

    // FreshBooks API
    if (pathname.includes('freshbooks')) {
      requirements.push({
        key: 'FRESHBOOKS_CLIENT_ID',
        description: 'FreshBooks client ID required'
      });
      requirements.push({
        key: 'FRESHBOOKS_CLIENT_SECRET',
        description: 'FreshBooks client secret required'
      });
    }

    // Timeero API
    if (pathname.includes('timeero')) {
      requirements.push({
        key: 'TIMEERO_API_KEY',
        description: 'Timeero API key required'
      });
    }

    // OpenAI API
    if (pathname.includes('gpt') || pathname.includes('openai') || pathname.includes('parse-contract')) {
      requirements.push({
        key: 'OPENAI_API_KEY',
        description: 'OpenAI API key required'
      });
    }

    return requirements;
  }

  private getAllowedMethods(pathname: string): string[] {
    // Default allowed methods
    const defaults = ['GET', 'POST', 'OPTIONS'];

    // Specific endpoint method restrictions
    const restrictions: Record<string, string[]> = {
      '/api/customers': ['GET', 'POST', 'PUT', 'DELETE'],
      '/api/pricing-service': ['GET', 'POST', 'PUT'],
      '/api/smart-pricing-config': ['GET', 'POST'],
      '/api/send-chat-message': ['POST'],
      '/api/parse-document': ['POST'],
      '/api/parse-rfp': ['POST'],
      '/api/check-serviceability': ['POST']
    };

    return restrictions[pathname] || defaults;
  }

  private addSecurityHeaders(response: NextResponse): void {
    // Content Security Policy
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https://api.freshbooks.com https://api.timeero.com https://api.openai.com https://maps.googleapis.com; " +
      "frame-ancestors 'none';"
    );

    // Security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // HSTS (only in production)
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
  }

  public getSecurityContext(): SecurityContext | null {
    return this.securityContext;
  }

  public async generateSecurityReport(): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    const auditResults = secretsManager.validateAllSecrets();
    const report = secretsManager.generateSecurityReport();
    
    // Add middleware-specific information
    const middlewareReport = [
      '\n🛡️  SECURITY MIDDLEWARE STATUS',
      '=' .repeat(50),
      `🔧 Initialized: ${this.initialized}`,
      `🔐 Security Context: ${this.securityContext?.isSecure ? '✅ Secure' : '❌ Insecure'}`,
      `⚠️  Active Warnings: ${this.securityContext?.warnings.length || 0}`,
      `❌ Active Errors: ${this.securityContext?.errors.length || 0}`,
      '',
      '🔍 RUNTIME SECURITY FEATURES:',
      '  • Rate limiting (100 requests/15 minutes)',
      '  • API endpoint validation',
      '  • Credential requirement checking',
      '  • Security headers enforcement',
      '  • Method validation',
      '  • Real-time security monitoring',
      ''
    ].join('\n');

    return report + middlewareReport;
  }
}

// Export singleton instance
export const securityMiddleware = SecurityMiddleware.getInstance();

// Export types
export type { SecurityContext }; 