/**
 * RBAC Service
 * Handles authentication, authorization, and session management
 */

import { 
  User, 
  UserRole, 
  Permission, 
  UserSession, 
  PermissionResult, 
  AuditLogEntry,
  RBACContext
} from './types';
import { RBACHelper, RBAC_CONFIG } from './rbac-config';

// In-memory storage for demonstration (replace with database in production)
interface RBACStorage {
  users: User[];
  sessions: UserSession[];
  auditLog: AuditLogEntry[];
}

// Demo users for testing
const DEMO_USERS: User[] = [
  {
    id: 'admin-1',
    email: 'admin@wasteops.com',
    name: 'System Administrator',
    role: UserRole.ADMIN,
    permissions: RBACHelper.getPermissionsForRole(UserRole.ADMIN),
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  },
  {
    id: 'analyst-1',
    email: 'analyst@wasteops.com',
    name: 'Data Analyst',
    role: UserRole.ANALYST,
    permissions: RBACHelper.getPermissionsForRole(UserRole.ANALYST),
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  },
  {
    id: 'operator-1',
    email: 'operator@wasteops.com',
    name: 'Field Operator',
    role: UserRole.OPERATOR,
    permissions: RBACHelper.getPermissionsForRole(UserRole.OPERATOR),
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  }
];

class RBACService {
  private static instance: RBACService;
  private storage: RBACStorage;
  private sessionCleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.storage = {
      users: [...DEMO_USERS],
      sessions: [],
      auditLog: []
    };
    
    // Start session cleanup
    this.startSessionCleanup();
  }

  public static getInstance(): RBACService {
    if (!RBACService.instance) {
      RBACService.instance = new RBACService();
    }
    return RBACService.instance;
  }

  // User management
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'permissions'>): Promise<User> {
    const user: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      permissions: RBACHelper.getPermissionsForRole(userData.role),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...userData
    };

    this.storage.users.push(user);
    
    await this.auditLog(
      'system',
      'create_user',
      'user_management',
      { userId: user.id, email: user.email, role: user.role }
    );

    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.storage.users.find(user => user.email === email && user.isActive) || null;
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.storage.users.find(user => user.id === userId && user.isActive) || null;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const userIndex = this.storage.users.findIndex(user => user.id === userId);
    if (userIndex === -1) return null;

    const user = this.storage.users[userIndex];
    this.storage.users[userIndex] = {
      ...user,
      ...updates,
      updatedAt: new Date(),
      permissions: updates.role ? RBACHelper.getPermissionsForRole(updates.role) : user.permissions
    };

    await this.auditLog(
      userId,
      'update_user',
      'user_management',
      { userId, updates }
    );

    return this.storage.users[userIndex];
  }

  async deleteUser(userId: string): Promise<boolean> {
    const userIndex = this.storage.users.findIndex(user => user.id === userId);
    if (userIndex === -1) return false;

    this.storage.users[userIndex].isActive = false;
    this.storage.users[userIndex].updatedAt = new Date();

    // Clean up user sessions
    this.storage.sessions = this.storage.sessions.filter(session => session.user.id !== userId);

    await this.auditLog(
      userId,
      'delete_user',
      'user_management',
      { userId }
    );

    return true;
  }

  // Authentication
  async login(email: string, password: string, ipAddress?: string, userAgent?: string): Promise<UserSession | null> {
    // Simple demo authentication (replace with real authentication)
    const user = await this.getUserByEmail(email);
    if (!user) {
      await this.auditLog(
        'anonymous',
        'login_failed',
        'authentication',
        { email, reason: 'user_not_found', ipAddress }
      );
      return null;
    }

    // In a real system, verify password hash
    if (password !== 'demo123') {
      await this.auditLog(
        user.id,
        'login_failed',
        'authentication',
        { email, reason: 'invalid_password', ipAddress }
      );
      return null;
    }

    // Create session
    const session: UserSession = {
      user,
      sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      expiresAt: new Date(Date.now() + RBAC_CONFIG.sessionTimeout * 60 * 1000),
      ipAddress,
      userAgent
    };

    this.storage.sessions.push(session);

    await this.auditLog(
      user.id,
      'login_success',
      'authentication',
      { email, sessionId: session.sessionId, ipAddress }
    );

    return session;
  }

  async logout(sessionId: string): Promise<boolean> {
    const sessionIndex = this.storage.sessions.findIndex(session => session.sessionId === sessionId);
    if (sessionIndex === -1) return false;

    const session = this.storage.sessions[sessionIndex];
    this.storage.sessions.splice(sessionIndex, 1);

    await this.auditLog(
      session.user.id,
      'logout',
      'authentication',
      { sessionId }
    );

    return true;
  }

  async validateSession(sessionId: string): Promise<UserSession | null> {
    const session = this.storage.sessions.find(session => session.sessionId === sessionId);
    if (!session) return null;

    if (session.expiresAt < new Date()) {
      // Session expired
      await this.logout(sessionId);
      return null;
    }

    return session;
  }

  async refreshSession(sessionId: string): Promise<UserSession | null> {
    const session = await this.validateSession(sessionId);
    if (!session) return null;

    // Extend session
    session.expiresAt = new Date(Date.now() + RBAC_CONFIG.sessionTimeout * 60 * 1000);

    await this.auditLog(
      session.user.id,
      'session_refresh',
      'authentication',
      { sessionId }
    );

    return session;
  }

  // Authorization
  checkPermission(user: User, permission: Permission): PermissionResult {
    const hasPermission = user.permissions.includes(permission);
    
    return {
      granted: hasPermission,
      reason: hasPermission ? undefined : `User lacks required permission: ${permission}`,
      requiredPermission: hasPermission ? undefined : permission
    };
  }

  checkRole(user: User, role: UserRole): PermissionResult {
    const hasRole = user.role === role;
    
    return {
      granted: hasRole,
      reason: hasRole ? undefined : `User role ${user.role} does not match required role: ${role}`,
      requiredRole: hasRole ? undefined : role
    };
  }

  checkAnyPermission(user: User, permissions: Permission[]): PermissionResult {
    const hasAnyPermission = permissions.some(permission => user.permissions.includes(permission));
    
    return {
      granted: hasAnyPermission,
      reason: hasAnyPermission ? undefined : `User lacks any of required permissions: ${permissions.join(', ')}`,
      requiredPermission: hasAnyPermission ? undefined : permissions[0]
    };
  }

  checkAllPermissions(user: User, permissions: Permission[]): PermissionResult {
    const hasAllPermissions = permissions.every(permission => user.permissions.includes(permission));
    
    return {
      granted: hasAllPermissions,
      reason: hasAllPermissions ? undefined : `User lacks some required permissions: ${permissions.join(', ')}`,
      requiredPermission: hasAllPermissions ? undefined : permissions.find(p => !user.permissions.includes(p))
    };
  }

  checkRouteAccess(user: User, path: string): PermissionResult {
    const isAllowed = RBACHelper.isRouteAllowed(user.role, path);
    
    return {
      granted: isAllowed,
      reason: isAllowed ? undefined : `User role ${user.role} cannot access route: ${path}`,
      requiredRole: isAllowed ? undefined : UserRole.ADMIN
    };
  }

  checkAPIAccess(user: User, endpoint: string, method: string): PermissionResult {
    const isAllowed = RBACHelper.isAPIEndpointAllowed(user.role, endpoint, method);
    
    return {
      granted: isAllowed,
      reason: isAllowed ? undefined : `User role ${user.role} cannot access API: ${method} ${endpoint}`,
      requiredRole: isAllowed ? undefined : UserRole.ADMIN
    };
  }

  // Audit logging
  async auditLog(
    userId: string,
    action: string,
    resource: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const logEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      action,
      resource,
      timestamp: new Date(),
      ipAddress,
      userAgent,
      success: true,
      details
    };

    this.storage.auditLog.push(logEntry);

    // Keep only last 1000 entries
    if (this.storage.auditLog.length > 1000) {
      this.storage.auditLog = this.storage.auditLog.slice(-1000);
    }

    console.log(`[AUDIT] ${userId} ${action} ${resource}`, details);
  }

  // Session management
  private startSessionCleanup(): void {
    this.sessionCleanupInterval = setInterval(() => {
      const now = new Date();
      const expiredSessions = this.storage.sessions.filter(session => session.expiresAt < now);
      
      expiredSessions.forEach(session => {
        this.auditLog(
          session.user.id,
          'session_expired',
          'authentication',
          { sessionId: session.sessionId }
        );
      });

      this.storage.sessions = this.storage.sessions.filter(session => session.expiresAt >= now);
    }, 60000); // Check every minute
  }

  private stopSessionCleanup(): void {
    if (this.sessionCleanupInterval) {
      clearInterval(this.sessionCleanupInterval);
      this.sessionCleanupInterval = null;
    }
  }

  // Utility methods
  getAllUsers(): User[] {
    return this.storage.users.filter(user => user.isActive);
  }

  getActiveSessions(): UserSession[] {
    return this.storage.sessions;
  }

  getAuditLog(limit: number = 100): AuditLogEntry[] {
    return this.storage.auditLog.slice(-limit);
  }

  getRBACStats(): {
    totalUsers: number;
    activeUsers: number;
    activeSessions: number;
    usersByRole: Record<UserRole, number>;
    totalAuditEntries: number;
  } {
    const activeUsers = this.storage.users.filter(user => user.isActive);
    
    return {
      totalUsers: this.storage.users.length,
      activeUsers: activeUsers.length,
      activeSessions: this.storage.sessions.length,
      usersByRole: {
        [UserRole.ADMIN]: activeUsers.filter(u => u.role === UserRole.ADMIN).length,
        [UserRole.ANALYST]: activeUsers.filter(u => u.role === UserRole.ANALYST).length,
        [UserRole.OPERATOR]: activeUsers.filter(u => u.role === UserRole.OPERATOR).length
      },
      totalAuditEntries: this.storage.auditLog.length
    };
  }

  // Cleanup
  destroy(): void {
    this.stopSessionCleanup();
    this.storage = {
      users: [],
      sessions: [],
      auditLog: []
    };
  }
}

// Export singleton instance
export const rbacService = RBACService.getInstance();

// Export class for testing
export default RBACService; 