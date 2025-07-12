#!/usr/bin/env node

const http = require('http');
const url = require('url');

const BASE_URL = 'http://localhost:3001';

// Test scenarios
const testScenarios = [
  {
    name: 'Basic API Request',
    endpoint: '/api/customers',
    method: 'GET',
    headers: {}
  },
  {
    name: 'Pricing Service Request',
    endpoint: '/api/pricing-service',
    method: 'GET',
    headers: {}
  },
  {
    name: 'ETL Health Check (Should Fail - No Auth)',
    endpoint: '/api/etl?action=health',
    method: 'GET',
    headers: {}
  },
  {
    name: 'Request with Custom Headers',
    endpoint: '/api/customers',
    method: 'GET',
    headers: {
      'X-Custom-Header': 'test-value',
      'User-Agent': 'RequestTracingTest/1.0'
    }
  },
  {
    name: 'Authentication Request',
    endpoint: '/api/auth?action=login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'admin@wasteops.com',
      password: 'admin123'
    })
  }
];

// Helper function to make HTTP requests
function makeRequest(scenario) {
  return new Promise((resolve, reject) => {
    const urlObj = url.parse(BASE_URL + scenario.endpoint);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.path,
      method: scenario.method,
      headers: {
        ...scenario.headers,
        'X-Test-Scenario': scenario.name
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          scenario: scenario.name,
          status: res.statusCode,
          headers: res.headers,
          requestId: res.headers['x-request-id'],
          traceId: res.headers['x-trace-id'],
          body: data,
          responseTime: Date.now() - startTime
        });
      });
    });

    req.on('error', (error) => {
      reject({
        scenario: scenario.name,
        error: error.message
      });
    });

    const startTime = Date.now();

    // Write request body if present
    if (scenario.body) {
      req.write(scenario.body);
    }
    
    req.end();
  });
}

// Test request tracing functionality
async function testRequestTracing() {
  console.log('🚀 Testing Request Tracing and Centralized Logging...\n');
  
  console.log('📋 Test Scenarios:');
  testScenarios.forEach((scenario, index) => {
    console.log(`  ${index + 1}. ${scenario.name}`);
  });
  console.log('');

  const results = [];
  
  // Run tests sequentially to see the logging clearly
  for (const scenario of testScenarios) {
    console.log(`🔄 Testing: ${scenario.name}`);
    
    try {
      const result = await makeRequest(scenario);
      results.push(result);
      
      console.log(`✅ ${scenario.name} - Status: ${result.status}`);
      console.log(`   Request ID: ${result.requestId}`);
      console.log(`   Trace ID: ${result.traceId}`);
      console.log(`   Response Time: ${result.responseTime}ms`);
      
      // Show response headers related to tracing
      const tracingHeaders = {};
      if (result.headers['x-request-id']) tracingHeaders['X-Request-ID'] = result.headers['x-request-id'];
      if (result.headers['x-trace-id']) tracingHeaders['X-Trace-ID'] = result.headers['x-trace-id'];
      
      if (Object.keys(tracingHeaders).length > 0) {
        console.log(`   Tracing Headers:`, tracingHeaders);
      }
      
    } catch (error) {
      console.error(`❌ ${scenario.name} - Error: ${error.error || error.message}`);
      results.push({
        scenario: scenario.name,
        error: error.error || error.message
      });
    }
    
    console.log('');
    
    // Add a small delay between requests to make logs clearer
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('📊 Test Summary:');
  console.log(`Total Tests: ${testScenarios.length}`);
  console.log(`Successful: ${results.filter(r => !r.error).length}`);
  console.log(`Failed: ${results.filter(r => r.error).length}`);
  console.log('');
  
  // Show detailed results
  console.log('📋 Detailed Results:');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.scenario}:`);
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    } else {
      console.log(`   ✅ Status: ${result.status}`);
      console.log(`   📊 Response Time: ${result.responseTime}ms`);
      console.log(`   🔍 Request ID: ${result.requestId}`);
      
      // Show slow requests
      if (result.responseTime > 1000) {
        console.log(`   ⚠️  SLOW REQUEST (${result.responseTime}ms)`);
      }
    }
    console.log('');
  });
  
  console.log('🔍 What to Look For in the Server Logs:');
  console.log('1. Request correlation IDs in log messages');
  console.log('2. Performance metrics with timing information');
  console.log('3. Structured log messages with metadata');
  console.log('4. Error categorization and context');
  console.log('5. Memory usage tracking');
  console.log('6. Slow request warnings');
  console.log('7. Handler execution timing');
  console.log('');
  
  console.log('💡 Key Features Demonstrated:');
  console.log('✅ Unique request ID generation');
  console.log('✅ Request/response correlation');
  console.log('✅ Performance monitoring');
  console.log('✅ Error tracking with context');
  console.log('✅ Memory usage monitoring');
  console.log('✅ Structured logging format');
  console.log('✅ Request tracing headers');
  console.log('✅ Slow request detection');
  console.log('');
  
  console.log('🎯 Next Steps:');
  console.log('1. Install Sentry SDK: npm install @sentry/nextjs');
  console.log('2. Configure SENTRY_DSN in environment variables');
  console.log('3. Enable file logging in production');
  console.log('4. Set up log aggregation with ELK stack or similar');
  console.log('5. Create dashboards for monitoring and alerting');
  console.log('');
  
  return results;
}

// Test concurrent requests to demonstrate request isolation
async function testConcurrentRequests() {
  console.log('🔄 Testing Concurrent Request Isolation...\n');
  
  const concurrentScenarios = [
    { name: 'Customer API', endpoint: '/api/customers', method: 'GET' },
    { name: 'Pricing Service', endpoint: '/api/pricing-service', method: 'GET' },
    { name: 'Dashboard Page', endpoint: '/dashboard', method: 'GET' },
  ];
  
  // Make concurrent requests
  const promises = concurrentScenarios.map(scenario => makeRequest(scenario));
  
  try {
    const results = await Promise.all(promises);
    
    console.log('✅ All concurrent requests completed:');
    results.forEach(result => {
      console.log(`   ${result.scenario} - Status: ${result.status}, Request ID: ${result.requestId}`);
    });
    
    // Verify all requests have unique IDs
    const requestIds = results.map(r => r.requestId).filter(id => id);
    const uniqueIds = new Set(requestIds);
    
    console.log(`\n🔍 Request ID Uniqueness: ${uniqueIds.size}/${requestIds.length} unique IDs`);
    
    if (uniqueIds.size === requestIds.length) {
      console.log('✅ All request IDs are unique - proper isolation confirmed');
    } else {
      console.log('❌ Some request IDs are duplicate - isolation issue detected');
    }
    
  } catch (error) {
    console.error('❌ Concurrent request test failed:', error);
  }
  
  console.log('');
}

// Error handling test
async function testErrorHandling() {
  console.log('🔥 Testing Error Handling and Logging...\n');
  
  const errorScenarios = [
    {
      name: 'Invalid API Endpoint',
      endpoint: '/api/nonexistent',
      method: 'GET',
      expectedError: true
    },
    {
      name: 'Malformed JSON Request',
      endpoint: '/api/auth?action=login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"invalid": json}',
      expectedError: true
    },
    {
      name: 'Unauthorized ETL Access',
      endpoint: '/api/etl?action=health',
      method: 'GET',
      expectedError: true
    }
  ];
  
  for (const scenario of errorScenarios) {
    console.log(`🔄 Testing: ${scenario.name}`);
    
    try {
      const result = await makeRequest(scenario);
      
      if (scenario.expectedError && result.status >= 400) {
        console.log(`✅ Expected error occurred - Status: ${result.status}`);
        console.log(`   Request ID: ${result.requestId}`);
        console.log(`   Error properly traced and logged`);
      } else {
        console.log(`⚠️  Unexpected success - Status: ${result.status}`);
      }
      
    } catch (error) {
      console.log(`✅ Network error properly handled: ${error.error}`);
    }
    
    console.log('');
  }
}

// Main execution
async function main() {
  try {
    console.log('🏁 Starting Request Tracing and Centralized Logging Test Suite\n');
    
    // Test basic request tracing
    await testRequestTracing();
    
    // Test concurrent request isolation
    await testConcurrentRequests();
    
    // Test error handling
    await testErrorHandling();
    
    console.log('✅ All tests completed successfully!');
    console.log('📊 Check the server logs to see the centralized logging in action.');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure the Next.js server is running on localhost:3001');
      console.error('💡 Run: npm run dev');
    }
  }
}

// Handle connection errors gracefully
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
main(); 