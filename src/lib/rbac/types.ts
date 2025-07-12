/**
 * RBAC (Role-Based Access Control) Types
 * Defines user roles, permissions, and access control interfaces
 */

// User roles in the system
export enum UserRole {
  ADMIN = 'admin',
  ANALYST = 'analyst',
  OPERATOR = 'operator'
}

// Granular permissions for different system functions
export enum Permission {
  // Dashboard permissions
  VIEW_EXECUTIVE_DASHBOARD = 'view:executive_dashboard',
  VIEW_CEO_INSIGHTS = 'view:ceo_insights',
  VIEW_RFP_INTELLIGENCE = 'view:rfp_intelligence',
  VIEW_SERVICEABILITY = 'view:serviceability',
  VIEW_ROUTE_METRICS = 'view:route_metrics',
  VIEW_FINANCIAL_METRICS = 'view:financial_metrics',
  VIEW_OPERATIONAL_METRICS = 'view:operational_metrics',
  VIEW_CUSTOMER_DATA = 'view:customer_data',
  
  // Pricing permissions
  VIEW_PRICING_CONFIG = 'view:pricing_config',
  EDIT_PRICING_CONFIG = 'edit:pricing_config',
  VIEW_PRICING_ANALYSIS = 'view:pricing_analysis',
  GENERATE_PRICING_RECOMMENDATIONS = 'generate:pricing_recommendations',
  
  // ETL and data management
  VIEW_ETL_STATUS = 'view:etl_status',
  TRIGGER_ETL_JOBS = 'trigger:etl_jobs',
  VIEW_ETL_HISTORY = 'view:etl_history',
  MANAGE_DATA_SOURCES = 'manage:data_sources',
  
  // Security and system admin
  VIEW_SECURITY_AUDIT = 'view:security_audit',
  MANAGE_CREDENTIALS = 'manage:credentials',
  MANAGE_USERS = 'manage:users',
  VIEW_SYSTEM_LOGS = 'view:system_logs',
  
  // API endpoints
  API_CUSTOMERS = 'api:customers',
  API_PRICING_SERVICE = 'api:pricing_service',
  API_PRICING_CONFIG = 'api:pricing_config',
  API_ETL = 'api:etl',
  API_COMPREHENSIVE_RFP = 'api:comprehensive_rfp',
  API_SMART_PRICING = 'api:smart_pricing',
  API_FRESHBOOKS = 'api:freshbooks',
  API_TIMEERO = 'api:timeero',
  API_GOOGLE_SHEETS = 'api:google_sheets',
  API_PARSE_DOCUMENT = 'api:parse_document',
  API_CHAT_MESSAGE = 'api:chat_message'
}

// User interface with role and permissions
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Role configuration with permissions
export interface RoleConfig {
  role: UserRole;
  permissions: Permission[];
  description: string;
  canDelegate: boolean;
}

// Permission check result
export interface PermissionResult {
  granted: boolean;
  reason?: string;
  requiredRole?: UserRole;
  requiredPermission?: Permission;
}

// Session and authentication
export interface UserSession {
  user: User;
  sessionId: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

// RBAC configuration
export interface RBACConfig {
  roles: RoleConfig[];
  sessionTimeout: number; // in minutes
  requireAuthentication: boolean;
  allowGuestAccess: boolean;
  guestPermissions: Permission[];
}

// Audit log entry
export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details?: any;
}

// Route protection configuration
export interface RouteProtection {
  path: string;
  requiredPermissions: Permission[];
  allowedRoles: UserRole[];
  requiresAuthentication: boolean;
}

// Component access control
export interface ComponentAccess {
  component: string;
  requiredPermissions: Permission[];
  fallbackComponent?: string;
  hideWhenNoAccess: boolean;
}

// API endpoint protection
export interface APIEndpointProtection {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requiredPermissions: Permission[];
  allowedRoles: UserRole[];
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
}

// RBAC context for React components
export interface RBACContext {
  user: User | null;
  isAuthenticated: boolean;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAccess: (resource: string, action: string) => PermissionResult;
  auditLog: (action: string, resource: string, details?: any) => void;
} 