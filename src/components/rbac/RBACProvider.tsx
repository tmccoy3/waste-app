'use client';

/**
 * RBAC Provider - React Context for Role-Based Access Control
 * Provides authentication and authorization context for React components
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  UserRole, 
  Permission, 
  PermissionResult, 
  RBACContext as IRBACContext 
} from '../../lib/rbac/types';
import { rbacService } from '../../lib/rbac/rbac-service';
import { RBACHelper } from '../../lib/rbac/rbac-config';

interface RBACProviderProps {
  children: ReactNode;
}

interface RBACState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Create context
const RBACContext = createContext<IRBACContext | null>(null);

// RBAC Provider component
export const RBACProvider: React.FC<RBACProviderProps> = ({ children }) => {
  const [state, setState] = useState<RBACState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  const [sessionId, setSessionId] = useState<string | null>(null);

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  // Session refresh interval
  useEffect(() => {
    if (sessionId) {
      const interval = setInterval(async () => {
        try {
          const session = await rbacService.refreshSession(sessionId);
          if (!session) {
            handleLogout();
          }
        } catch (error) {
          console.error('Session refresh failed:', error);
          handleLogout();
        }
      }, 5 * 60 * 1000); // Refresh every 5 minutes

      return () => clearInterval(interval);
    }
  }, [sessionId]);

  const initializeAuth = async () => {
    try {
      // Check for existing session in localStorage
      const storedSessionId = localStorage.getItem('rbac_session');
      if (storedSessionId) {
        const session = await rbacService.validateSession(storedSessionId);
        if (session) {
          setSessionId(storedSessionId);
          setState({
            user: session.user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          return;
        } else {
          // Clean up invalid session
          localStorage.removeItem('rbac_session');
        }
      }

      // No valid session found
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Auth initialization failed:', error);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Authentication initialization failed'
      });
    }
  };

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const session = await rbacService.login(email, password);
      if (session) {
        setSessionId(session.sessionId);
        localStorage.setItem('rbac_session', session.sessionId);
        
        setState({
          user: session.user,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });

        return true;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Invalid email or password'
        }));
        return false;
      }
    } catch (error) {
      console.error('Login failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Login failed. Please try again.'
      }));
      return false;
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      if (sessionId) {
        await rbacService.logout(sessionId);
        localStorage.removeItem('rbac_session');
      }
      
      setSessionId(null);
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear local state even if logout fails
      setSessionId(null);
      localStorage.removeItem('rbac_session');
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    return state.user?.permissions.includes(permission) || false;
  };

  const hasRole = (role: UserRole): boolean => {
    return state.user?.role === role || false;
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!state.user) return false;
    return permissions.some(permission => state.user!.permissions.includes(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!state.user) return false;
    return permissions.every(permission => state.user!.permissions.includes(permission));
  };

  const checkAccess = (resource: string, action: string): PermissionResult => {
    if (!state.user) {
      return {
        granted: false,
        reason: 'User not authenticated'
      };
    }

    // Check route access
    if (resource.startsWith('/')) {
      return rbacService.checkRouteAccess(state.user, resource);
    }

    // Check API access
    if (resource.startsWith('/api/')) {
      return rbacService.checkAPIAccess(state.user, resource, action);
    }

    // Default permission check
    const permission = `${action}:${resource}` as Permission;
    return rbacService.checkPermission(state.user, permission);
  };

  const auditLog = async (action: string, resource: string, details?: any): Promise<void> => {
    if (state.user) {
      await rbacService.auditLog(
        state.user.id,
        action,
        resource,
        details
      );
    }
  };

  const contextValue: IRBACContext = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    login: handleLogin,
    logout: handleLogout,
    checkAccess,
    auditLog
  };

  return (
    <RBACContext.Provider value={contextValue}>
      {children}
    </RBACContext.Provider>
  );
};

// Hook to use RBAC context
export const useRBAC = (): IRBACContext => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};

// HOC for protecting components with permissions
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions: Permission[],
  fallbackComponent?: React.ComponentType<P>
) {
  return function ProtectedComponent(props: P) {
    const { hasAllPermissions } = useRBAC();
    
    if (!hasAllPermissions(requiredPermissions)) {
      if (fallbackComponent) {
        const FallbackComponent = fallbackComponent;
        return <FallbackComponent {...props} />;
      }
      
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-500">
              You don't have permission to access this resource.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// HOC for protecting components with roles
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles: UserRole[],
  fallbackComponent?: React.ComponentType<P>
) {
  return function ProtectedComponent(props: P) {
    const { user } = useRBAC();
    
    if (!user || !requiredRoles.includes(user.role)) {
      if (fallbackComponent) {
        const FallbackComponent = fallbackComponent;
        return <FallbackComponent {...props} />;
      }
      
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-500">
              Your role ({user?.role}) doesn't have access to this resource.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// Component for conditional rendering based on permissions
export const PermissionGate: React.FC<{
  permissions: Permission[];
  children: ReactNode;
  fallback?: ReactNode;
  requireAll?: boolean;
}> = ({ permissions, children, fallback = null, requireAll = true }) => {
  const { hasAllPermissions, hasAnyPermission } = useRBAC();
  
  const hasAccess = requireAll 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Component for conditional rendering based on roles
export const RoleGate: React.FC<{
  roles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ roles, children, fallback = null }) => {
  const { user } = useRBAC();
  
  const hasAccess = user && roles.includes(user.role);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default RBACProvider; 