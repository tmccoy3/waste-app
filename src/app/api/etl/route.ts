import { NextRequest, NextResponse } from 'next/server';
import { etlService } from '../../../lib/etl/etl-service';
import { getUserFromRequest } from '../../../middleware/rbac-middleware';
import { UserRole, Permission } from '../../../lib/rbac/types';
import { rbacService } from '../../../lib/rbac/rbac-service';

export async function GET(request: NextRequest) {
  try {
    // 🛡️ RBAC Authentication Check
    const user = await getUserFromRequest(request);
    if (!user) {
      await rbacService.auditLog(
        'anonymous',
        'access_denied',
        '/api/etl',
        { reason: 'authentication_required', method: 'GET' },
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      );
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // 🛡️ RBAC Authorization Check - Only Admins and Analysts can read ETL data
    if (user.role === UserRole.OPERATOR) {
      await rbacService.auditLog(
        user.id,
        'access_denied',
        '/api/etl',
        { reason: 'insufficient_role', userRole: user.role, method: 'GET' },
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      );
      return NextResponse.json(
        { 
          error: 'Access denied. ETL endpoints require Admin or Analyst role.',
          code: 'INSUFFICIENT_ROLE',
          userRole: user.role,
          requiredRoles: [UserRole.ADMIN, UserRole.ANALYST]
        },
        { status: 403 }
      );
    }

    // ✅ Access granted - log successful access
    await rbacService.auditLog(
      user.id,
      'etl_access',
      '/api/etl',
      { method: 'GET', action: request.nextUrl.searchParams.get('action') },
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown'
    );

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const jobId = searchParams.get('jobId');

    console.log(`🔄 ETL API endpoint called with action: ${action} by ${user.role} user: ${user.name}`);

    switch (action) {
      case 'health':
        console.log('🏥 Checking ETL service health...');
        const health = await etlService.healthCheck();
        return NextResponse.json({
          success: true,
          data: health
        });

      case 'status':
        if (!jobId) {
          return NextResponse.json(
            { success: false, error: 'jobId is required for status check' },
            { status: 400 }
          );
        }
        
        console.log(`📊 Getting job status for: ${jobId}`);
        const jobStatus = etlService.getJobStatus(jobId);
        
        if (!jobStatus) {
          return NextResponse.json(
            { success: false, error: 'Job not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          data: jobStatus
        });

      case 'running':
        console.log('🔄 Getting running jobs...');
        const runningJobs = etlService.getRunningJobs();
        return NextResponse.json({
          success: true,
          data: runningJobs
        });

      case 'history':
        const limit = parseInt(searchParams.get('limit') || '10');
        console.log(`📚 Getting job history (limit: ${limit})...`);
        const history = etlService.getJobHistory(limit);
        return NextResponse.json({
          success: true,
          data: history
        });

      case 'report':
        console.log('📈 Generating ETL report...');
        const report = etlService.generateETLReport();
        return NextResponse.json({
          success: true,
          data: report
        });

      case 'tables':
        console.log('📋 Listing BigQuery tables...');
        const tables = await etlService.listTables();
        return NextResponse.json({
          success: true,
          data: tables
        });

      case 'table-info':
        const tableName = searchParams.get('tableName');
        if (!tableName) {
          return NextResponse.json(
            { success: false, error: 'tableName is required' },
            { status: 400 }
          );
        }
        
        console.log(`📊 Getting table info for: ${tableName}`);
        const tableInfo = await etlService.getTableInfo(tableName);
        return NextResponse.json({
          success: true,
          data: tableInfo
        });

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid action. Supported actions: health, status, running, history, report, tables, table-info' 
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ ETL API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 🛡️ RBAC Authentication Check
    const user = await getUserFromRequest(request);
    if (!user) {
      await rbacService.auditLog(
        'anonymous',
        'access_denied',
        '/api/etl',
        { reason: 'authentication_required', method: 'POST' },
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      );
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    // 🛡️ RBAC Authorization Check - Only Admins can execute ETL operations
    if (user.role !== UserRole.ADMIN) {
      await rbacService.auditLog(
        user.id,
        'access_denied',
        '/api/etl',
        { reason: 'insufficient_role', userRole: user.role, method: 'POST' },
        request.headers.get('x-forwarded-for') || 'unknown',
        request.headers.get('user-agent') || 'unknown'
      );
      return NextResponse.json(
        { 
          error: 'Access denied. ETL execution requires Admin role.',
          code: 'INSUFFICIENT_ROLE',
          userRole: user.role,
          requiredRoles: [UserRole.ADMIN]
        },
        { status: 403 }
      );
    }

    // ✅ Access granted - log successful access
    await rbacService.auditLog(
      user.id,
      'etl_execution',
      '/api/etl',
      { method: 'POST', action: request.nextUrl.searchParams.get('action') },
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent') || 'unknown'
    );

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    console.log(`🚀 ETL API POST endpoint called with action: ${action} by ${user.role} user: ${user.name}`);

    switch (action) {
      case 'run':
        console.log('🔄 Running custom ETL job...');
        const config = body.config || {};
        const jobResult = await etlService.runETLJob(config);
        return NextResponse.json({
          success: true,
          data: jobResult
        });

      case 'quick':
        console.log('⚡ Running quick ETL job...');
        const quickResult = await etlService.runQuickETL();
        return NextResponse.json({
          success: true,
          data: quickResult
        });

      case 'full':
        console.log('🔄 Running full ETL job...');
        const fullResult = await etlService.runFullETL();
        return NextResponse.json({
          success: true,
          data: fullResult
        });

      case 'test':
        console.log('🧪 Running test ETL job...');
        const testResult = await etlService.testETL();
        return NextResponse.json({
          success: true,
          data: testResult
        });

      case 'query':
        const sql = body.sql;
        if (!sql) {
          return NextResponse.json(
            { success: false, error: 'SQL query is required' },
            { status: 400 }
          );
        }
        
        console.log('📊 Executing BigQuery query...');
        const queryResult = await etlService.queryData(sql);
        return NextResponse.json({
          success: true,
          data: queryResult
        });

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid action. Supported actions: run, quick, full, test, query' 
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ ETL API POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 