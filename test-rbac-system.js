/**
 * RBAC System Test Script
 * Comprehensive testing of Role-Based Access Control functionality
 */

const BASE_URL = 'http://localhost:3000';

// Test user credentials
const TEST_USERS = {
  admin: { email: 'admin@wasteops.com', password: 'demo123' },
  analyst: { email: 'analyst@wasteops.com', password: 'demo123' },
  operator: { email: 'operator@wasteops.com', password: 'demo123' }
};

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`🔄 ${options.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }

    const data = await response.json();
    return { success: true, data, status: response.status };
  } catch (error) {
    console.error(`❌ API call failed: ${error.message}`);
    return { success: false, error: error.message, status: 0 };
  }
}

// Test authentication functionality
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  
  const tests = [];
  
  // Test login for each user type
  for (const [role, credentials] of Object.entries(TEST_USERS)) {
    console.log(`\n👤 Testing ${role} login...`);
    
    const result = await apiCall('/api/auth?action=login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });

    if (result.success) {
      console.log(`✅ ${role} login: SUCCESS`);
      console.log(`   - User: ${result.data.user.name}`);
      console.log(`   - Role: ${result.data.user.role}`);
      console.log(`   - Permissions: ${result.data.user.permissions.length} permissions`);
      console.log(`   - Session: ${result.data.sessionId.substring(0, 20)}...`);
      tests.push({ test: `${role}_login`, result: 'PASSED' });
      
      // Store session for role-based tests
      TEST_USERS[role].sessionId = result.data.sessionId;
      TEST_USERS[role].userData = result.data.user;
    } else {
      console.log(`❌ ${role} login: FAILED`);
      console.log(`   - Error: ${result.error}`);
      tests.push({ test: `${role}_login`, result: 'FAILED' });
    }
  }

  // Test invalid login
  console.log('\n🚫 Testing invalid login...');
  const invalidResult = await apiCall('/api/auth?action=login', {
    method: 'POST',
    body: JSON.stringify({ email: 'invalid@test.com', password: 'wrong' })
  });

  if (!invalidResult.success) {
    console.log('✅ Invalid login rejection: PASSED');
    tests.push({ test: 'invalid_login_rejection', result: 'PASSED' });
  } else {
    console.log('❌ Invalid login rejection: FAILED');
    tests.push({ test: 'invalid_login_rejection', result: 'FAILED' });
  }

  return tests;
}

// Test authorization for different user roles
async function testAuthorization() {
  console.log('\n🛡️  Testing Authorization...');
  
  const tests = [];
  
  // Test admin access to ETL endpoints
  console.log('\n👑 Testing Admin Access...');
  const adminResult = await apiCall('/api/etl?action=health', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TEST_USERS.admin.sessionId}`
    }
  });

  if (adminResult.success) {
    console.log('✅ Admin ETL access: PASSED');
    tests.push({ test: 'admin_etl_access', result: 'PASSED' });
  } else {
    console.log('❌ Admin ETL access: FAILED');
    console.log(`   - Error: ${adminResult.error}`);
    tests.push({ test: 'admin_etl_access', result: 'FAILED' });
  }

  // Test analyst access to pricing service
  console.log('\n📊 Testing Analyst Access...');
  const analystResult = await apiCall('/api/pricing-service?config=get', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TEST_USERS.analyst.sessionId}`
    }
  });

  if (analystResult.success) {
    console.log('✅ Analyst pricing access: PASSED');
    tests.push({ test: 'analyst_pricing_access', result: 'PASSED' });
  } else {
    console.log('❌ Analyst pricing access: FAILED');
    console.log(`   - Error: ${analystResult.error}`);
    tests.push({ test: 'analyst_pricing_access', result: 'FAILED' });
  }

  // Test analyst read-only access to ETL
  console.log('\n📊 Testing Analyst ETL Read Access...');
  const analystETLResult = await apiCall('/api/etl?action=health', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TEST_USERS.analyst.sessionId}`
    }
  });

  if (analystETLResult.success) {
    console.log('✅ Analyst ETL read access: PASSED');
    tests.push({ test: 'analyst_etl_read_access', result: 'PASSED' });
  } else {
    console.log('❌ Analyst ETL read access: FAILED');
    console.log(`   - Error: ${analystETLResult.error}`);
    tests.push({ test: 'analyst_etl_read_access', result: 'FAILED' });
  }

  // Test analyst write restriction to ETL
  console.log('\n🚫 Testing Analyst ETL Write Restriction...');
  const analystETLWriteResult = await apiCall('/api/etl?action=test', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_USERS.analyst.sessionId}`
    },
    body: JSON.stringify({})
  });

  if (!analystETLWriteResult.success && (analystETLWriteResult.error.includes('403') || analystETLWriteResult.error.includes('INSUFFICIENT_ROLE'))) {
    console.log('✅ Analyst ETL write restriction: PASSED');
    tests.push({ test: 'analyst_etl_write_restriction', result: 'PASSED' });
  } else {
    console.log('❌ Analyst ETL write restriction: FAILED');
    console.log(`   - Should be denied, but got: ${analystETLWriteResult.success ? 'SUCCESS' : analystETLWriteResult.error}`);
    tests.push({ test: 'analyst_etl_write_restriction', result: 'FAILED' });
  }

  // Test operator restricted access
  console.log('\n🚛 Testing Operator Access...');
  const operatorETLResult = await apiCall('/api/etl?action=health', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TEST_USERS.operator.sessionId}`
    }
  });

  if (!operatorETLResult.success && (operatorETLResult.error.includes('403') || operatorETLResult.error.includes('INSUFFICIENT_ROLE'))) {
    console.log('✅ Operator ETL restriction: PASSED');
    tests.push({ test: 'operator_etl_restriction', result: 'PASSED' });
  } else {
    console.log('❌ Operator ETL restriction: FAILED');
    console.log(`   - Should be denied, but got: ${operatorETLResult.success ? 'SUCCESS' : operatorETLResult.error}`);
    tests.push({ test: 'operator_etl_restriction', result: 'FAILED' });
  }

  // Test operator customer access (should work)
  const operatorCustomerResult = await apiCall('/api/customers', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${TEST_USERS.operator.sessionId}`
    }
  });

  if (operatorCustomerResult.success) {
    console.log('✅ Operator customer access: PASSED');
    tests.push({ test: 'operator_customer_access', result: 'PASSED' });
  } else {
    console.log('❌ Operator customer access: FAILED');
    console.log(`   - Error: ${operatorCustomerResult.error}`);
    tests.push({ test: 'operator_customer_access', result: 'FAILED' });
  }

  return tests;
}

// Test session management
async function testSessionManagement() {
  console.log('\n⏰ Testing Session Management...');
  
  const tests = [];
  
  // Test session validation
  console.log('\n🔍 Testing session validation...');
  const validationResult = await apiCall('/api/auth?action=validate', {
    method: 'POST',
    body: JSON.stringify({ sessionId: TEST_USERS.admin.sessionId })
  });

  if (validationResult.success && validationResult.data.valid) {
    console.log('✅ Session validation: PASSED');
    console.log(`   - User: ${validationResult.data.user.name}`);
    console.log(`   - Expires: ${new Date(validationResult.data.expiresAt).toLocaleString()}`);
    tests.push({ test: 'session_validation', result: 'PASSED' });
  } else {
    console.log('❌ Session validation: FAILED');
    tests.push({ test: 'session_validation', result: 'FAILED' });
  }

  // Test session refresh
  console.log('\n🔄 Testing session refresh...');
  const refreshResult = await apiCall('/api/auth?action=refresh', {
    method: 'POST',
    body: JSON.stringify({ sessionId: TEST_USERS.admin.sessionId })
  });

  if (refreshResult.success) {
    console.log('✅ Session refresh: PASSED');
    console.log(`   - New expiry: ${new Date(refreshResult.data.expiresAt).toLocaleString()}`);
    tests.push({ test: 'session_refresh', result: 'PASSED' });
  } else {
    console.log('❌ Session refresh: FAILED');
    tests.push({ test: 'session_refresh', result: 'FAILED' });
  }

  // Test invalid session
  console.log('\n🚫 Testing invalid session...');
  const invalidSessionResult = await apiCall('/api/auth?action=validate', {
    method: 'POST',
    body: JSON.stringify({ sessionId: 'invalid-session-id' })
  });

  if (invalidSessionResult.success && !invalidSessionResult.data.valid) {
    console.log('✅ Invalid session rejection: PASSED');
    tests.push({ test: 'invalid_session_rejection', result: 'PASSED' });
  } else {
    console.log('❌ Invalid session rejection: FAILED');
    tests.push({ test: 'invalid_session_rejection', result: 'FAILED' });
  }

  return tests;
}

// Test user management
async function testUserManagement() {
  console.log('\n👥 Testing User Management...');
  
  const tests = [];
  
  // Test get all users (admin only)
  console.log('\n📋 Testing get users...');
  const usersResult = await apiCall('/api/auth?action=users', {
    headers: {
      'Authorization': `Bearer ${TEST_USERS.admin.sessionId}`
    }
  });

  if (usersResult.success) {
    console.log('✅ Get users: PASSED');
    console.log(`   - Total users: ${usersResult.data.users.length}`);
    usersResult.data.users.forEach(user => {
      console.log(`   - ${user.name} (${user.role}): ${user.permissions.length} permissions`);
    });
    tests.push({ test: 'get_users', result: 'PASSED' });
  } else {
    console.log('❌ Get users: FAILED');
    tests.push({ test: 'get_users', result: 'FAILED' });
  }

  // Test create user (admin only)
  console.log('\n➕ Testing create user...');
  const createUserResult = await apiCall('/api/auth?action=create-user', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TEST_USERS.admin.sessionId}`
    },
    body: JSON.stringify({
      email: 'test@wasteops.com',
      name: 'Test User',
      role: 'analyst'
    })
  });

  if (createUserResult.success) {
    console.log('✅ Create user: PASSED');
    console.log(`   - Created: ${createUserResult.data.user.name}`);
    console.log(`   - Role: ${createUserResult.data.user.role}`);
    tests.push({ test: 'create_user', result: 'PASSED' });
  } else {
    console.log('❌ Create user: FAILED');
    console.log(`   - Error: ${createUserResult.error}`);
    tests.push({ test: 'create_user', result: 'FAILED' });
  }

  return tests;
}

// Test audit logging
async function testAuditLogging() {
  console.log('\n📋 Testing Audit Logging...');
  
  const tests = [];
  
  // Test get audit log
  console.log('\n📊 Testing audit log retrieval...');
  const auditResult = await apiCall('/api/auth?action=audit&limit=20', {
    headers: {
      'Authorization': `Bearer ${TEST_USERS.admin.sessionId}`
    }
  });

  if (auditResult.success) {
    console.log('✅ Audit log retrieval: PASSED');
    console.log(`   - Total entries: ${auditResult.data.auditLog.length}`);
    
    // Show recent audit entries
    auditResult.data.auditLog.slice(-5).forEach(entry => {
      console.log(`   - ${new Date(entry.timestamp).toLocaleTimeString()}: ${entry.userId} ${entry.action} ${entry.resource}`);
    });
    tests.push({ test: 'audit_log_retrieval', result: 'PASSED' });
  } else {
    console.log('❌ Audit log retrieval: FAILED');
    tests.push({ test: 'audit_log_retrieval', result: 'FAILED' });
  }

  return tests;
}

// Test system stats
async function testSystemStats() {
  console.log('\n📈 Testing System Stats...');
  
  const tests = [];
  
  const statsResult = await apiCall('/api/auth?action=stats', {
    headers: {
      'Authorization': `Bearer ${TEST_USERS.admin.sessionId}`
    }
  });

  if (statsResult.success) {
    console.log('✅ System stats: PASSED');
    const stats = statsResult.data.stats;
    console.log(`   - Total Users: ${stats.totalUsers}`);
    console.log(`   - Active Users: ${stats.activeUsers}`);
    console.log(`   - Active Sessions: ${stats.activeSessions}`);
    console.log(`   - Users by Role:`);
    Object.entries(stats.usersByRole).forEach(([role, count]) => {
      console.log(`     • ${role}: ${count}`);
    });
    console.log(`   - Audit Entries: ${stats.totalAuditEntries}`);
    tests.push({ test: 'system_stats', result: 'PASSED' });
  } else {
    console.log('❌ System stats: FAILED');
    tests.push({ test: 'system_stats', result: 'FAILED' });
  }

  return tests;
}

// Test logout functionality
async function testLogout() {
  console.log('\n🚪 Testing Logout...');
  
  const tests = [];
  
  // Test logout for analyst
  console.log('\n👋 Testing analyst logout...');
  const logoutResult = await apiCall('/api/auth?action=logout', {
    method: 'POST',
    body: JSON.stringify({ sessionId: TEST_USERS.analyst.sessionId })
  });

  if (logoutResult.success) {
    console.log('✅ Logout: PASSED');
    tests.push({ test: 'logout', result: 'PASSED' });
    
    // Verify session is invalidated
    const validationAfterLogout = await apiCall('/api/auth?action=validate', {
      method: 'POST',
      body: JSON.stringify({ sessionId: TEST_USERS.analyst.sessionId })
    });

    if (validationAfterLogout.success && !validationAfterLogout.data.valid) {
      console.log('✅ Session invalidation: PASSED');
      tests.push({ test: 'session_invalidation', result: 'PASSED' });
    } else {
      console.log('❌ Session invalidation: FAILED');
      tests.push({ test: 'session_invalidation', result: 'FAILED' });
    }
  } else {
    console.log('❌ Logout: FAILED');
    tests.push({ test: 'logout', result: 'FAILED' });
  }

  return tests;
}

// Main test runner
async function runRBACTests() {
  console.log('🚀 Starting RBAC System Tests...');
  console.log('=======================================');

  let allTests = [];

  try {
    // Run all test suites
    const authTests = await testAuthentication();
    const authzTests = await testAuthorization();
    const sessionTests = await testSessionManagement();
    const userMgmtTests = await testUserManagement();
    const auditTests = await testAuditLogging();
    const statsTests = await testSystemStats();
    const logoutTests = await testLogout();

    // Combine all test results
    allTests = [
      ...authTests,
      ...authzTests,
      ...sessionTests,
      ...userMgmtTests,
      ...auditTests,
      ...statsTests,
      ...logoutTests
    ];

    // Print summary
    console.log('\n📊 Test Results Summary:');
    console.log('=======================================');
    
    const passed = allTests.filter(t => t.result === 'PASSED').length;
    const failed = allTests.filter(t => t.result === 'FAILED').length;
    
    allTests.forEach(test => {
      const icon = test.result === 'PASSED' ? '✅' : '❌';
      console.log(`${icon} ${test.test}: ${test.result}`);
    });

    console.log('\n📈 Overall Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Success Rate: ${Math.round((passed / allTests.length) * 100)}%`);

    if (failed === 0) {
      console.log('\n🎉 All RBAC tests passed! The system is working correctly.');
    } else {
      console.log(`\n⚠️  ${failed} test(s) failed. Check the logs above for details.`);
    }

  } catch (error) {
    console.error('\n💥 Test suite failed with error:', error);
    console.log('\n❌ RBAC System Tests: FAILED');
  }
}

// Run the tests if this script is executed directly
if (typeof window === 'undefined') {
  runRBACTests().catch(console.error);
}

module.exports = { runRBACTests }; 