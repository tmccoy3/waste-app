/**
 * ETL Pipeline Test Script
 * Demonstrates the complete ETL pipeline functionality
 */

const API_BASE_URL = 'http://localhost:3000/api';

// Test configuration
const ETL_CONFIG = {
  quick: {
    jobId: `quick_test_${Date.now()}`,
    name: 'Quick ETL Test',
    sources: ['customers', 'timeero', 'freshbooks'],
    options: {
      includeDays: 7,
      includeGpsData: false,
      skipTimeero: false,
      skipFreshBooks: false,
      skipCustomers: false
    }
  },
  test: {
    jobId: `test_${Date.now()}`,
    name: 'Test ETL Job',
    sources: ['customers'],
    options: {
      includeDays: 1,
      includeGpsData: false,
      skipTimeero: true,
      skipFreshBooks: true,
      skipCustomers: false
    }
  }
};

// Helper function to make API calls
async function makeAPICall(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`🔄 ${method} ${url}`);
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ API call failed: ${error.message}`);
    throw error;
  }
}

// Test functions
async function testETLHealth() {
  console.log('\n🏥 Testing ETL Service Health...');
  
  try {
    const result = await makeAPICall('/etl?action=health');
    console.log('✅ ETL Health Check:', result.success ? 'PASSED' : 'FAILED');
    
    if (result.success) {
      const { isHealthy, message, bigQueryStatus, credentialsStatus } = result.data;
      console.log(`   - Overall Health: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
      console.log(`   - Message: ${message}`);
      console.log(`   - BigQuery Status: ${bigQueryStatus?.isHealthy ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`   - Credentials Security Score: ${credentialsStatus?.securityScore || 0}%`);
    }
    
    return result.success;
  } catch (error) {
    console.log('❌ ETL Health Check: FAILED');
    console.error('   Error:', error.message);
    return false;
  }
}

async function testQuickETL() {
  console.log('\n⚡ Testing Quick ETL Job...');
  
  try {
    const result = await makeAPICall('/etl?action=quick', 'POST', {});
    console.log('✅ Quick ETL Job:', result.success ? 'STARTED' : 'FAILED');
    
    if (result.success) {
      const { jobId, status, recordsProcessed, errors } = result.data;
      console.log(`   - Job ID: ${jobId}`);
      console.log(`   - Status: ${status}`);
      console.log(`   - Records Processed: ${recordsProcessed}`);
      console.log(`   - Errors: ${errors.length} errors`);
      
      if (errors.length > 0) {
        console.log(`   - Error Details:`);
        errors.slice(0, 3).forEach(error => console.log(`     • ${error}`));
      }
      
      return jobId;
    }
    
    return null;
  } catch (error) {
    console.log('❌ Quick ETL Job: FAILED');
    console.error('   Error:', error.message);
    return null;
  }
}

async function testJobStatus(jobId) {
  if (!jobId) return;
  
  console.log('\n📊 Testing Job Status...');
  
  try {
    const result = await makeAPICall(`/etl?action=status&jobId=${jobId}`);
    console.log('✅ Job Status Check:', result.success ? 'SUCCESS' : 'FAILED');
    
    if (result.success) {
      const { status, recordsProcessed, duration, errors } = result.data;
      console.log(`   - Job Status: ${status}`);
      console.log(`   - Records Processed: ${recordsProcessed}`);
      console.log(`   - Duration: ${duration}ms`);
      console.log(`   - Errors: ${errors.length} errors`);
      
      // Show extraction details
      const { extraction } = result.data.details;
      console.log('   - Extraction Results:');
      Object.entries(extraction).forEach(([source, details]) => {
        console.log(`     • ${source}: ${details.recordCount} records (${details.success ? 'SUCCESS' : 'FAILED'})`);
      });
      
      // Show loading details
      const { loading } = result.data.details;
      console.log('   - Loading Results:');
      Object.entries(loading).forEach(([source, details]) => {
        console.log(`     • ${source}: ${details.rowsProcessed || 0} rows (${details.success ? 'SUCCESS' : 'FAILED'})`);
      });
    }
    
    return result.success;
  } catch (error) {
    console.log('❌ Job Status Check: FAILED');
    console.error('   Error:', error.message);
    return false;
  }
}

async function testJobHistory() {
  console.log('\n📚 Testing Job History...');
  
  try {
    const result = await makeAPICall('/etl?action=history&limit=5');
    console.log('✅ Job History:', result.success ? 'SUCCESS' : 'FAILED');
    
    if (result.success) {
      const jobs = result.data;
      console.log(`   - Total Jobs: ${jobs.length}`);
      
      jobs.forEach((job, index) => {
        console.log(`   - Job ${index + 1}:`);
        console.log(`     • ID: ${job.jobId}`);
        console.log(`     • Status: ${job.status}`);
        console.log(`     • Records: ${job.recordsProcessed}`);
        console.log(`     • Duration: ${job.duration}ms`);
        console.log(`     • Errors: ${job.errors.length}`);
      });
    }
    
    return result.success;
  } catch (error) {
    console.log('❌ Job History: FAILED');
    console.error('   Error:', error.message);
    return false;
  }
}

async function testETLReport() {
  console.log('\n📈 Testing ETL Report...');
  
  try {
    const result = await makeAPICall('/etl?action=report');
    console.log('✅ ETL Report:', result.success ? 'SUCCESS' : 'FAILED');
    
    if (result.success) {
      const {
        totalJobsRun,
        successfulJobs,
        failedJobs,
        totalRecordsProcessed,
        averageJobDuration,
        recentErrors
      } = result.data;
      
      console.log(`   - Total Jobs Run: ${totalJobsRun}`);
      console.log(`   - Successful Jobs: ${successfulJobs}`);
      console.log(`   - Failed Jobs: ${failedJobs}`);
      console.log(`   - Success Rate: ${totalJobsRun > 0 ? Math.round((successfulJobs / totalJobsRun) * 100) : 0}%`);
      console.log(`   - Total Records Processed: ${totalRecordsProcessed}`);
      console.log(`   - Average Job Duration: ${Math.round(averageJobDuration)}ms`);
      console.log(`   - Recent Errors: ${recentErrors.length}`);
      
      if (recentErrors.length > 0) {
        console.log('   - Recent Error Details:');
        recentErrors.slice(0, 3).forEach(error => console.log(`     • ${error}`));
      }
    }
    
    return result.success;
  } catch (error) {
    console.log('❌ ETL Report: FAILED');
    console.error('   Error:', error.message);
    return false;
  }
}

async function testBigQueryTables() {
  console.log('\n📋 Testing BigQuery Tables...');
  
  try {
    const result = await makeAPICall('/etl?action=tables');
    console.log('✅ BigQuery Tables:', result.success ? 'SUCCESS' : 'FAILED');
    
    if (result.success) {
      const tables = result.data;
      console.log(`   - Total Tables: ${tables.length}`);
      
      if (tables.length > 0) {
        console.log('   - Available Tables:');
        tables.forEach(table => console.log(`     • ${table}`));
        
        // Test table info for the first table
        if (tables.length > 0) {
          await testTableInfo(tables[0]);
        }
      }
    }
    
    return result.success;
  } catch (error) {
    console.log('❌ BigQuery Tables: FAILED');
    console.error('   Error:', error.message);
    return false;
  }
}

async function testTableInfo(tableName) {
  console.log(`\n📊 Testing Table Info for: ${tableName}...`);
  
  try {
    const result = await makeAPICall(`/etl?action=table-info&tableName=${tableName}`);
    console.log('✅ Table Info:', result.success ? 'SUCCESS' : 'FAILED');
    
    if (result.success) {
      const { numRows, numBytes, creationTime, lastModifiedTime, schema } = result.data;
      console.log(`   - Rows: ${numRows || 0}`);
      console.log(`   - Size: ${numBytes ? Math.round(numBytes / 1024 / 1024 * 100) / 100 : 0} MB`);
      console.log(`   - Created: ${creationTime ? new Date(parseInt(creationTime)).toLocaleString() : 'N/A'}`);
      console.log(`   - Modified: ${lastModifiedTime ? new Date(parseInt(lastModifiedTime)).toLocaleString() : 'N/A'}`);
      console.log(`   - Fields: ${schema?.fields?.length || 0} columns`);
    }
    
    return result.success;
  } catch (error) {
    console.log('❌ Table Info: FAILED');
    console.error('   Error:', error.message);
    return false;
  }
}

async function testTestETL() {
  console.log('\n🧪 Testing Test ETL Job...');
  
  try {
    const result = await makeAPICall('/etl?action=test', 'POST', {});
    console.log('✅ Test ETL Job:', result.success ? 'COMPLETED' : 'FAILED');
    
    if (result.success) {
      const { jobId, status, recordsProcessed, errors } = result.data;
      console.log(`   - Job ID: ${jobId}`);
      console.log(`   - Status: ${status}`);
      console.log(`   - Records Processed: ${recordsProcessed}`);
      console.log(`   - Errors: ${errors.length} errors`);
      
      return jobId;
    }
    
    return null;
  } catch (error) {
    console.log('❌ Test ETL Job: FAILED');
    console.error('   Error:', error.message);
    return null;
  }
}

async function testBigQueryQuery() {
  console.log('\n📊 Testing BigQuery Query...');
  
  try {
    const sql = `
      SELECT 
        'customers' as table_name,
        COUNT(*) as record_count,
        'Customer master data' as description
      FROM \`waste-ops-intelligence.operations_data.customers\`
      
      UNION ALL
      
      SELECT 
        'timeero_users' as table_name,
        COUNT(*) as record_count,
        'Employee/driver data' as description
      FROM \`waste-ops-intelligence.operations_data.timeero_users\`
      
      ORDER BY record_count DESC
    `;
    
    const result = await makeAPICall('/etl?action=query', 'POST', { sql });
    console.log('✅ BigQuery Query:', result.success ? 'SUCCESS' : 'FAILED');
    
    if (result.success) {
      const rows = result.data;
      console.log(`   - Query Results: ${rows.length} rows`);
      
      if (rows.length > 0) {
        console.log('   - Table Summary:');
        rows.forEach(row => {
          console.log(`     • ${row.table_name}: ${row.record_count} records`);
        });
      }
    }
    
    return result.success;
  } catch (error) {
    console.log('❌ BigQuery Query: FAILED');
    console.error('   Error:', error.message);
    return false;
  }
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting ETL Pipeline Tests...');
  console.log('=' * 50);
  
  const testResults = {
    health: false,
    testETL: false,
    quickETL: false,
    jobStatus: false,
    jobHistory: false,
    report: false,
    tables: false,
    query: false
  };
  
  // Test 1: Health Check
  testResults.health = await testETLHealth();
  
  // Test 2: Test ETL Job (minimal)
  const testJobId = await testTestETL();
  if (testJobId) {
    testResults.testETL = true;
    testResults.jobStatus = await testJobStatus(testJobId);
  }
  
  // Test 3: Quick ETL Job
  const quickJobId = await testQuickETL();
  if (quickJobId) {
    testResults.quickETL = true;
    // Wait a moment for job to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testJobStatus(quickJobId);
  }
  
  // Test 4: Job History
  testResults.jobHistory = await testJobHistory();
  
  // Test 5: ETL Report
  testResults.report = await testETLReport();
  
  // Test 6: BigQuery Tables
  testResults.tables = await testBigQueryTables();
  
  // Test 7: BigQuery Query (if BigQuery is available)
  if (testResults.tables) {
    testResults.query = await testBigQueryQuery();
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('=' * 50);
  
  const passed = Object.values(testResults).filter(Boolean).length;
  const total = Object.keys(testResults).length;
  
  Object.entries(testResults).forEach(([test, result]) => {
    console.log(`${result ? '✅' : '❌'} ${test}: ${result ? 'PASSED' : 'FAILED'}`);
  });
  
  console.log(`\n📈 Overall Results: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! ETL Pipeline is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
  
  return testResults;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testETLHealth,
  testQuickETL,
  testJobStatus,
  testJobHistory,
  testETLReport,
  testBigQueryTables,
  testTableInfo,
  testTestETL,
  testBigQueryQuery
}; 