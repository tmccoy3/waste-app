/**
 * RBAC Middleware
 * Provides authentication and authorization middleware for API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { rbacService } from '../lib/rbac/rbac-service';
import { UserRole, Permission } from '../lib/rbac/types';
import { RBACHelper } from '../lib/rbac/rbac-config';

interface RBACMiddlewareOptions {
  requireAuth?: boolean;
  requiredPermissions?: Permission[];
  allowedRoles?: UserRole[];
  skipAuditLog?: boolean;
}

// Get session from request headers
async function getSessionFromRequest(request: NextRequest): Promise<string | null> {
  // Check Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  const sessionCookie = request.cookies.get('rbac_session');
  if (sessionCookie) {
    return sessionCookie.value;
  }

  return null;
}

// Main RBAC middleware function
export async function rbacMiddleware(
  request: NextRequest,
  options: RBACMiddlewareOptions = {}
): Promise<NextResponse | null> {
  const {
    requireAuth = true,
    requiredPermissions = [],
    allowedRoles = [],
    skipAuditLog = false
  } = options;

  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Get client info
  const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    // Skip authentication for certain paths
    if (path.includes('/api/auth/') || path === '/api/health') {
      return null; // Allow through
    }

    // Get session ID from request
    const sessionId = await getSessionFromRequest(request);

    if (!sessionId && requireAuth) {
      if (!skipAuditLog) {
        await rbacService.auditLog(
          'anonymous',
          'access_denied',
          path,
          { reason: 'no_session', method },
          ipAddress,
          userAgent
        );
      }

      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    // Validate session if provided
    let userSession = null;
    if (sessionId) {
      userSession = await rbacService.validateSession(sessionId);
      
      if (!userSession && requireAuth) {
        if (!skipAuditLog) {
          await rbacService.auditLog(
            'anonymous',
            'access_denied',
            path,
            { reason: 'invalid_session', method },
            ipAddress,
            userAgent
          );
        }

        return NextResponse.json(
          { 
            error: 'Invalid or expired session',
            code: 'SESSION_INVALID'
          },
          { status: 401 }
        );
      }
    }

    // Check role-based access
    if (userSession && allowedRoles.length > 0) {
      const hasValidRole = allowedRoles.includes(userSession.user.role);
      
      if (!hasValidRole) {
        if (!skipAuditLog) {
          await rbacService.auditLog(
            userSession.user.id,
            'access_denied',
            path,
            { reason: 'insufficient_role', userRole: userSession.user.role, requiredRoles: allowedRoles, method },
            ipAddress,
            userAgent
          );
        }

        return NextResponse.json(
          { 
            error: 'Insufficient permissions',
            code: 'INSUFFICIENT_ROLE',
            userRole: userSession.user.role,
            requiredRoles: allowedRoles
          },
          { status: 403 }
        );
      }
    }

    // Check permission-based access
    if (userSession && requiredPermissions.length > 0) {
      const hasRequiredPermissions = requiredPermissions.every(permission => 
        userSession.user.permissions.includes(permission)
      );

      if (!hasRequiredPermissions) {
        const missingPermissions = requiredPermissions.filter(permission => 
          !userSession.user.permissions.includes(permission)
        );

        if (!skipAuditLog) {
          await rbacService.auditLog(
            userSession.user.id,
            'access_denied',
            path,
            { reason: 'insufficient_permissions', missingPermissions, method },
            ipAddress,
            userAgent
          );
        }

        return NextResponse.json(
          { 
            error: 'Missing required permissions',
            code: 'INSUFFICIENT_PERMISSIONS',
            missingPermissions
          },
          { status: 403 }
        );
      }
    }

    // Check API endpoint access using RBAC config
    if (userSession) {
      const apiAccess = rbacService.checkAPIAccess(userSession.user, path, method);
      
      if (!apiAccess.granted) {
        if (!skipAuditLog) {
          await rbacService.auditLog(
            userSession.user.id,
            'access_denied',
            path,
            { reason: 'api_access_denied', method },
            ipAddress,
            userAgent
          );
        }

        return NextResponse.json(
          { 
            error: 'API access denied',
            code: 'API_ACCESS_DENIED',
            reason: apiAccess.reason
          },
          { status: 403 }
        );
      }
    }

    // Access granted - audit log successful access
    if (userSession && !skipAuditLog) {
      await rbacService.auditLog(
        userSession.user.id,
        'api_access',
        path,
        { method },
        ipAddress,
        userAgent
      );
    }

    // Add user info to request headers for the API handler
    const response = NextResponse.next();
    
    if (userSession) {
      response.headers.set('X-User-ID', userSession.user.id);
      response.headers.set('X-User-Role', userSession.user.role);
      response.headers.set('X-User-Email', userSession.user.email);
      response.headers.set('X-Session-ID', userSession.sessionId);
    }

    return response;

  } catch (error) {
    console.error('RBAC Middleware Error:', error);
    
    if (!skipAuditLog) {
      await rbacService.auditLog(
        'system',
        'middleware_error',
        path,
        { error: error instanceof Error ? error.message : 'Unknown error', method },
        ipAddress,
        userAgent
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal authentication error',
        code: 'AUTH_ERROR'
      },
      { status: 500 }
    );
  }
}

// Helper function to create role-based middleware
export function requireRole(role: UserRole) {
  return (request: NextRequest) => rbacMiddleware(request, {
    requireAuth: true,
    allowedRoles: [role]
  });
}

// Helper function to create permission-based middleware
export function requirePermission(permission: Permission) {
  return (request: NextRequest) => rbacMiddleware(request, {
    requireAuth: true,
    requiredPermissions: [permission]
  });
}

// Helper function to create multiple permission middleware
export function requirePermissions(permissions: Permission[]) {
  return (request: NextRequest) => rbacMiddleware(request, {
    requireAuth: true,
    requiredPermissions: permissions
  });
}

// Helper function for admin-only endpoints
export function adminOnly(request: NextRequest) {
  return rbacMiddleware(request, {
    requireAuth: true,
    allowedRoles: [UserRole.ADMIN]
  });
}

// Helper function for analyst and admin endpoints
export function analystOrAdmin(request: NextRequest) {
  return rbacMiddleware(request, {
    requireAuth: true,
    allowedRoles: [UserRole.ANALYST, UserRole.ADMIN]
  });
}

// Helper function for any authenticated user
export function authenticated(request: NextRequest) {
  return rbacMiddleware(request, {
    requireAuth: true
  });
}

// Helper function to get user from request (for use in API handlers)
export async function getUserFromRequest(request: NextRequest): Promise<any> {
  const sessionId = await getSessionFromRequest(request);
  if (!sessionId) return null;

  const userSession = await rbacService.validateSession(sessionId);
  return userSession?.user || null;
}

// Export types for use in other files
export type { RBACMiddlewareOptions }; 