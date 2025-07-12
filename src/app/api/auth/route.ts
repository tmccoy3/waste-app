/**
 * Authentication API Endpoints
 * Handles login, logout, session validation, and user management
 */

import { NextRequest, NextResponse } from 'next/server';
import { rbacService } from '../../../lib/rbac/rbac-service';
import { UserRole } from '../../../lib/rbac/types';

// GET /api/auth - Check authentication status
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'status':
        return handleAuthStatus(request);
      
      case 'users':
        return handleGetUsers(request);
      
      case 'audit':
        return handleGetAuditLog(request);
      
      case 'stats':
        return handleGetStats(request);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Auth API GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/auth - Handle authentication actions
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'login':
        return handleLogin(request);
      
      case 'logout':
        return handleLogout(request);
      
      case 'validate':
        return handleValidateSession(request);
      
      case 'refresh':
        return handleRefreshSession(request);
      
      case 'create-user':
        return handleCreateUser(request);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Auth API POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/auth - Update user information
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'update-user':
        return handleUpdateUser(request);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Auth API PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/auth - Delete user
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'delete-user':
        return handleDeleteUser(request);
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Auth API DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handler functions
async function handleLogin(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const session = await rbacService.login(email, password, ipAddress, userAgent);

    if (session) {
      const response = NextResponse.json({
        success: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
          permissions: session.user.permissions
        },
        sessionId: session.sessionId,
        expiresAt: session.expiresAt
      });

      // Set secure HTTP-only cookie
      response.cookies.set('rbac_session', session.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 8 * 60 * 60, // 8 hours
        path: '/'
      });

      return response;
    } else {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}

async function handleLogout(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (sessionId) {
      await rbacService.logout(sessionId);
    }

    const response = NextResponse.json({ success: true });
    
    // Clear cookie
    response.cookies.delete('rbac_session');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}

async function handleValidateSession(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const session = await rbacService.validateSession(sessionId);

    if (session) {
      return NextResponse.json({
        valid: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
          permissions: session.user.permissions
        },
        expiresAt: session.expiresAt
      });
    } else {
      return NextResponse.json({ valid: false });
    }
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { error: 'Session validation failed' },
      { status: 500 }
    );
  }
}

async function handleRefreshSession(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const session = await rbacService.refreshSession(sessionId);

    if (session) {
      return NextResponse.json({
        success: true,
        expiresAt: session.expiresAt
      });
    } else {
      return NextResponse.json(
        { error: 'Session refresh failed' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Session refresh error:', error);
    return NextResponse.json(
      { error: 'Session refresh failed' },
      { status: 500 }
    );
  }
}

async function handleAuthStatus(request: NextRequest): Promise<NextResponse> {
  try {
    const sessionCookie = request.cookies.get('rbac_session');
    
    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false });
    }

    const session = await rbacService.validateSession(sessionCookie.value);

    if (session) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
          permissions: session.user.permissions
        },
        expiresAt: session.expiresAt
      });
    } else {
      return NextResponse.json({ authenticated: false });
    }
  } catch (error) {
    console.error('Auth status error:', error);
    return NextResponse.json({ authenticated: false });
  }
}

async function handleCreateUser(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if user is admin (simplified for demo)
    const body = await request.json();
    const { email, name, role } = body;

    if (!email || !name || !role) {
      return NextResponse.json(
        { error: 'Email, name, and role are required' },
        { status: 400 }
      );
    }

    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const user = await rbacService.createUser({
      email,
      name,
      role,
      isActive: true
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'User creation failed' },
      { status: 500 }
    );
  }
}

async function handleUpdateUser(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await rbacService.updateUser(userId, updates);

    if (user) {
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
          updatedAt: user.updatedAt,
          isActive: user.isActive
        }
      });
    } else {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'User update failed' },
      { status: 500 }
    );
  }
}

async function handleDeleteUser(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const success = await rbacService.deleteUser(userId);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'User deletion failed' },
      { status: 500 }
    );
  }
}

async function handleGetUsers(request: NextRequest): Promise<NextResponse> {
  try {
    const users = rbacService.getAllUsers();
    
    return NextResponse.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isActive: user.isActive
      }))
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    );
  }
}

async function handleGetAuditLog(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    
    const auditLog = rbacService.getAuditLog(limit);
    
    return NextResponse.json({
      success: true,
      auditLog
    });
  } catch (error) {
    console.error('Get audit log error:', error);
    return NextResponse.json(
      { error: 'Failed to get audit log' },
      { status: 500 }
    );
  }
}

async function handleGetStats(request: NextRequest): Promise<NextResponse> {
  try {
    const stats = rbacService.getRBACStats();
    
    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
} 