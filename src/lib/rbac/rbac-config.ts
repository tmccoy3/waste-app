/**
 * RBAC Configuration
 * Defines role-based access control rules and permissions
 */

import { UserRole, Permission, RoleConfig, RBACConfig, RouteProtection, APIEndpointProtection } from './types';

// Role definitions with permissions
export const ROLE_CONFIGS: RoleConfig[] = [
  {
    role: UserRole.ADMIN,
    description: 'Full system administrator with all permissions',
    canDelegate: true,
    permissions: [
      // Dashboard permissions - All access
      Permission.VIEW_EXECUTIVE_DASHBOARD,
      Permission.VIEW_CEO_INSIGHTS,
      Permission.VIEW_RFP_INTELLIGENCE,
      Permission.VIEW_SERVICEABILITY,
      Permission.VIEW_ROUTE_METRICS,
      Permission.VIEW_FINANCIAL_METRICS,
      Permission.VIEW_OPERATIONAL_METRICS,
      Permission.VIEW_CUSTOMER_DATA,
      
      // Pricing permissions - Full control
      Permission.VIEW_PRICING_CONFIG,
      Permission.EDIT_PRICING_CONFIG,
      Permission.VIEW_PRICING_ANALYSIS,
      Permission.GENERATE_PRICING_RECOMMENDATIONS,
      
      // ETL and data management - Full control
      Permission.VIEW_ETL_STATUS,
      Permission.TRIGGER_ETL_JOBS,
      Permission.VIEW_ETL_HISTORY,
      Permission.MANAGE_DATA_SOURCES,
      
      // Security and system admin - Full control
      Permission.VIEW_SECURITY_AUDIT,
      Permission.MANAGE_CREDENTIALS,
      Permission.MANAGE_USERS,
      Permission.VIEW_SYSTEM_LOGS,
      
      // API endpoints - All access
      Permission.API_CUSTOMERS,
      Permission.API_PRICING_SERVICE,
      Permission.API_PRICING_CONFIG,
      Permission.API_ETL,
      Permission.API_COMPREHENSIVE_RFP,
      Permission.API_SMART_PRICING,
      Permission.API_FRESHBOOKS,
      Permission.API_TIMEERO,
      Permission.API_GOOGLE_SHEETS,
      Permission.API_PARSE_DOCUMENT,
      Permission.API_CHAT_MESSAGE
    ]
  },
  {
    role: UserRole.ANALYST,
    description: 'Data analyst with view-only access to reports and analytics',
    canDelegate: false,
    permissions: [
      // Dashboard permissions - View only
      Permission.VIEW_EXECUTIVE_DASHBOARD,
      Permission.VIEW_CEO_INSIGHTS,
      Permission.VIEW_RFP_INTELLIGENCE,
      Permission.VIEW_SERVICEABILITY,
      Permission.VIEW_ROUTE_METRICS,
      Permission.VIEW_FINANCIAL_METRICS,
      Permission.VIEW_OPERATIONAL_METRICS,
      Permission.VIEW_CUSTOMER_DATA,
      
      // Pricing permissions - View only
      Permission.VIEW_PRICING_CONFIG,
      Permission.VIEW_PRICING_ANALYSIS,
      Permission.GENERATE_PRICING_RECOMMENDATIONS,
      
      // ETL and data management - View only
      Permission.VIEW_ETL_STATUS,
      Permission.VIEW_ETL_HISTORY,
      
      // API endpoints - Read-only access
      Permission.API_CUSTOMERS,
      Permission.API_PRICING_SERVICE,
      Permission.API_COMPREHENSIVE_RFP,
      Permission.API_SMART_PRICING,
      Permission.API_FRESHBOOKS,
      Permission.API_TIMEERO,
      Permission.API_GOOGLE_SHEETS,
      Permission.API_PARSE_DOCUMENT
    ]
  },
  {
    role: UserRole.OPERATOR,
    description: 'Field operator with limited access to route metrics only',
    canDelegate: false,
    permissions: [
      // Dashboard permissions - Route metrics only
      Permission.VIEW_ROUTE_METRICS,
      Permission.VIEW_OPERATIONAL_METRICS,
      
      // Limited customer data access
      Permission.VIEW_CUSTOMER_DATA,
      
      // API endpoints - Very limited access
      Permission.API_CUSTOMERS,
      Permission.API_TIMEERO
    ]
  }
];

// Main RBAC configuration
export const RBAC_CONFIG: RBACConfig = {
  roles: ROLE_CONFIGS,
  sessionTimeout: 480, // 8 hours in minutes
  requireAuthentication: true,
  allowGuestAccess: false,
  guestPermissions: []
};

// Route protection configuration
export const ROUTE_PROTECTIONS: RouteProtection[] = [
  {
    path: '/dashboard',
    requiredPermissions: [Permission.VIEW_EXECUTIVE_DASHBOARD],
    allowedRoles: [UserRole.ADMIN, UserRole.ANALYST],
    requiresAuthentication: true
  },
  {
    path: '/dashboard/ceo-insights',
    requiredPermissions: [Permission.VIEW_CEO_INSIGHTS],
    allowedRoles: [UserRole.ADMIN, UserRole.ANALYST],
    requiresAuthentication: true
  },
  {
    path: '/dashboard/rfp-intelligence',
    requiredPermissions: [Permission.VIEW_RFP_INTELLIGENCE],
    allowedRoles: [UserRole.ADMIN, UserRole.ANALYST],
    requiresAuthentication: true
  },
  {
    path: '/dashboard/serviceability-check',
    requiredPermissions: [Permission.VIEW_SERVICEABILITY],
    allowedRoles: [UserRole.ADMIN, UserRole.ANALYST],
    requiresAuthentication: true
  },
  {
    path: '/dashboard/route-metrics',
    requiredPermissions: [Permission.VIEW_ROUTE_METRICS],
    allowedRoles: [UserRole.ADMIN, UserRole.ANALYST, UserRole.OPERATOR],
    requiresAuthentication: true
  }
];

// API endpoint protection configuration
export const API_PROTECTIONS: APIEndpointProtection[] = [
  {
    endpoint: '/api/customers',
    method: 'GET',
    requiredPermissions: [Permission.API_CUSTOMERS],
    allowedRoles: [UserRole.ADMIN, UserRole.ANALYST, UserRole.OPERATOR],
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100
    }
  },
  {
    endpoint: '/api/pricing-service',
    method: 'GET',
    requiredPermissions: [Permission.API_PRICING_SERVICE],
    allowedRoles: [UserRole.ADMIN, UserRole.ANALYST],
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 50
    }
  },
  {
    endpoint: '/api/pricing-service',
    method: 'POST',
    requiredPermissions: [Permission.API_PRICING_SERVICE],
    allowedRoles: [UserRole.ADMIN, UserRole.ANALYST],
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 30
    }
  },
  {
    endpoint: '/api/pricing-service',
    method: 'PUT',
    requiredPermissions: [Permission.API_PRICING_CONFIG],
    allowedRoles: [UserRole.ADMIN],
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 10
    }
  },
  {
    endpoint: '/api/etl',
    method: 'GET',
    requiredPermissions: [Permission.API_ETL],
    allowedRoles: [UserRole.ADMIN],
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 20
    }
  },
  {
    endpoint: '/api/etl',
    method: 'POST',
    requiredPermissions: [Permission.API_ETL],
    allowedRoles: [UserRole.ADMIN],
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 5
    }
  },
  {
    endpoint: '/api/comprehensive-rfp-analysis',
    method: 'POST',
    requiredPermissions: [Permission.API_COMPREHENSIVE_RFP],
    allowedRoles: [UserRole.ADMIN, UserRole.ANALYST],
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 10
    }
  },
  {
    endpoint: '/api/smart-pricing-config',
    method: 'GET',
    requiredPermissions: [Permission.API_SMART_PRICING],
    allowedRoles: [UserRole.ADMIN, UserRole.ANALYST],
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 50
    }
  },
  {
    endpoint: '/api/smart-pricing-config',
    method: 'POST',
    requiredPermissions: [Permission.API_SMART_PRICING],
    allowedRoles: [UserRole.ADMIN],
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 10
    }
  },
  {
    endpoint: '/api/freshbooks',
    method: 'GET',
    requiredPermissions: [Permission.API_FRESHBOOKS],
    allowedRoles: [UserRole.ADMIN, UserRole.ANALYST],
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 30
    }
  },
  {
    endpoint: '/api/timeero',
    method: 'GET',
    requiredPermissions: [Permission.API_TIMEERO],
    allowedRoles: [UserRole.ADMIN, UserRole.ANALYST, UserRole.OPERATOR],
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 50
    }
  },
  {
    endpoint: '/api/google-sheets',
    method: 'GET',
    requiredPermissions: [Permission.API_GOOGLE_SHEETS],
    allowedRoles: [UserRole.ADMIN, UserRole.ANALYST],
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 20
    }
  },
  {
    endpoint: '/api/parse-document',
    method: 'POST',
    requiredPermissions: [Permission.API_PARSE_DOCUMENT],
    allowedRoles: [UserRole.ADMIN, UserRole.ANALYST],
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 10
    }
  },
  {
    endpoint: '/api/send-chat-message',
    method: 'POST',
    requiredPermissions: [Permission.API_CHAT_MESSAGE],
    allowedRoles: [UserRole.ADMIN, UserRole.ANALYST],
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 20
    }
  }
];

// Helper functions for role and permission management
export class RBACHelper {
  static getRoleConfig(role: UserRole): RoleConfig | undefined {
    return ROLE_CONFIGS.find(config => config.role === role);
  }

  static hasPermission(userRole: UserRole, permission: Permission): boolean {
    const roleConfig = this.getRoleConfig(userRole);
    return roleConfig?.permissions.includes(permission) || false;
  }

  static hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
    const roleConfig = this.getRoleConfig(userRole);
    if (!roleConfig) return false;
    return permissions.some(permission => roleConfig.permissions.includes(permission));
  }

  static hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
    const roleConfig = this.getRoleConfig(userRole);
    if (!roleConfig) return false;
    return permissions.every(permission => roleConfig.permissions.includes(permission));
  }

  static isRouteAllowed(userRole: UserRole, path: string): boolean {
    const routeProtection = ROUTE_PROTECTIONS.find(route => 
      path.startsWith(route.path)
    );
    
    if (!routeProtection) return true; // Allow unprotected routes
    
    return routeProtection.allowedRoles.includes(userRole);
  }

  static isAPIEndpointAllowed(userRole: UserRole, endpoint: string, method: string): boolean {
    const apiProtection = API_PROTECTIONS.find(api => 
      endpoint === api.endpoint && method === api.method
    );
    
    if (!apiProtection) return true; // Allow unprotected endpoints
    
    return apiProtection.allowedRoles.includes(userRole);
  }

  static getPermissionsForRole(role: UserRole): Permission[] {
    const roleConfig = this.getRoleConfig(role);
    return roleConfig?.permissions || [];
  }

  static getAllowedRolesForPermission(permission: Permission): UserRole[] {
    return ROLE_CONFIGS
      .filter(config => config.permissions.includes(permission))
      .map(config => config.role);
  }
}

// Export default configuration
export default RBAC_CONFIG; 