/**
 * ETL Service for Waste Operations Intelligence
 * Orchestrates the complete Extract-Transform-Load pipeline
 */

import { bigQueryClient, ETLJobResult } from './bigquery-client';
import { dataExtractor, ExtractionResult } from './data-extractors';
import { secretsManager } from '../secrets-manager';

interface ETLJobConfig {
  jobId: string;
  name: string;
  sources: ('customers' | 'timeero' | 'freshbooks')[];
  schedule?: string; // cron expression
  options: {
    includeDays?: number;
    includeGpsData?: boolean;
    skipTimeero?: boolean;
    skipFreshBooks?: boolean;
    skipCustomers?: boolean;
  };
}

interface ETLJobStatus {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  duration?: number;
  recordsProcessed: number;
  errors: string[];
  details: {
    extraction: {
      customers: { success: boolean; recordCount: number; errors: string[] };
      timeeroUsers: { success: boolean; recordCount: number; errors: string[] };
      timesheets: { success: boolean; recordCount: number; errors: string[] };
      mileage: { success: boolean; recordCount: number; errors: string[] };
      gpsData: { success: boolean; recordCount: number; errors: string[] };
      invoices: { success: boolean; recordCount: number; errors: string[] };
      payments: { success: boolean; recordCount: number; errors: string[] };
    };
    loading: {
      customers: ETLJobResult;
      timeeroUsers: ETLJobResult;
      timesheets: ETLJobResult;
      mileage: ETLJobResult;
      gpsData: ETLJobResult;
      invoices: ETLJobResult;
      payments: ETLJobResult;
    };
  };
}

interface ETLServiceStatus {
  isHealthy: boolean;
  message: string;
  bigQueryStatus: any;
  credentialsStatus: any;
  lastJobStatus?: ETLJobStatus;
}

class ETLService {
  private static instance: ETLService;
  private initialized = false;
  private runningJobs = new Map<string, ETLJobStatus>();
  private jobHistory: ETLJobStatus[] = [];
  private maxHistorySize = 100;

  private constructor() {}

  public static getInstance(): ETLService {
    if (!ETLService.instance) {
      ETLService.instance = new ETLService();
    }
    return ETLService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🚀 Initializing ETL Service...');
      
      // Initialize BigQuery client
      await bigQueryClient.initialize();
      
      this.initialized = true;
      console.log('✅ ETL Service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize ETL Service:', error);
      throw error;
    }
  }

  // Health check for the entire ETL system
  public async healthCheck(): Promise<ETLServiceStatus> {
    try {
      const bigQueryStatus = await bigQueryClient.healthCheck();
      const credentialsStatus = secretsManager.validateAllSecrets();
      
      return {
        isHealthy: bigQueryStatus.isHealthy && credentialsStatus.securityScore > 0,
        message: bigQueryStatus.isHealthy ? 'ETL Service is healthy' : 'ETL Service has issues',
        bigQueryStatus,
        credentialsStatus,
        lastJobStatus: this.jobHistory.length > 0 ? this.jobHistory[this.jobHistory.length - 1] : undefined
      };
    } catch (error) {
      return {
        isHealthy: false,
        message: `ETL Service health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        bigQueryStatus: null,
        credentialsStatus: null
      };
    }
  }

  // Run a complete ETL job
  public async runETLJob(config: ETLJobConfig): Promise<ETLJobStatus> {
    const jobId = config.jobId || `etl_job_${Date.now()}`;
    const startTime = new Date().toISOString();
    
    console.log(`🚀 Starting ETL job: ${config.name} (${jobId})`);
    
    // Initialize job status
    const jobStatus: ETLJobStatus = {
      jobId,
      status: 'running',
      startTime,
      recordsProcessed: 0,
      errors: [],
      details: {
        extraction: {
          customers: { success: false, recordCount: 0, errors: [] },
          timeeroUsers: { success: false, recordCount: 0, errors: [] },
          timesheets: { success: false, recordCount: 0, errors: [] },
          mileage: { success: false, recordCount: 0, errors: [] },
          gpsData: { success: false, recordCount: 0, errors: [] },
          invoices: { success: false, recordCount: 0, errors: [] },
          payments: { success: false, recordCount: 0, errors: [] }
        },
        loading: {
          customers: { success: false, message: 'Not started', metadata: { timestamp: startTime } },
          timeeroUsers: { success: false, message: 'Not started', metadata: { timestamp: startTime } },
          timesheets: { success: false, message: 'Not started', metadata: { timestamp: startTime } },
          mileage: { success: false, message: 'Not started', metadata: { timestamp: startTime } },
          gpsData: { success: false, message: 'Not started', metadata: { timestamp: startTime } },
          invoices: { success: false, message: 'Not started', metadata: { timestamp: startTime } },
          payments: { success: false, message: 'Not started', metadata: { timestamp: startTime } }
        }
      }
    };

    // Track running job
    this.runningJobs.set(jobId, jobStatus);

    try {
      // Ensure ETL Service is initialized
      await this.initialize();

      // Step 1: Extract data from all sources
      console.log('📊 Starting data extraction phase...');
      const extractionResults = await dataExtractor.extractAllData(config.options);

      // Update extraction status
      jobStatus.details.extraction = {
        customers: {
          success: extractionResults.customers.success,
          recordCount: extractionResults.customers.data.length,
          errors: extractionResults.customers.errors
        },
        timeeroUsers: {
          success: extractionResults.timeeroUsers.success,
          recordCount: extractionResults.timeeroUsers.data.length,
          errors: extractionResults.timeeroUsers.errors
        },
        timesheets: {
          success: extractionResults.timesheets.success,
          recordCount: extractionResults.timesheets.data.length,
          errors: extractionResults.timesheets.errors
        },
        mileage: {
          success: extractionResults.mileage.success,
          recordCount: extractionResults.mileage.data.length,
          errors: extractionResults.mileage.errors
        },
        gpsData: {
          success: extractionResults.gpsData.success,
          recordCount: extractionResults.gpsData.data.length,
          errors: extractionResults.gpsData.errors
        },
        invoices: {
          success: extractionResults.invoices.success,
          recordCount: extractionResults.invoices.data.length,
          errors: extractionResults.invoices.errors
        },
        payments: {
          success: extractionResults.payments.success,
          recordCount: extractionResults.payments.data.length,
          errors: extractionResults.payments.errors
        }
      };

      // Collect all extraction errors
      const allExtractionErrors = [
        ...extractionResults.customers.errors,
        ...extractionResults.timeeroUsers.errors,
        ...extractionResults.timesheets.errors,
        ...extractionResults.mileage.errors,
        ...extractionResults.gpsData.errors,
        ...extractionResults.invoices.errors,
        ...extractionResults.payments.errors
      ];

      jobStatus.errors.push(...allExtractionErrors);

      // Step 2: Load data into BigQuery
      console.log('📤 Starting data loading phase...');
      
      // Load data in parallel for better performance
      const [
        customersResult,
        timeeroUsersResult,
        timesheetsResult,
        mileageResult,
        gpsDataResult,
        invoicesResult,
        paymentsResult
      ] = await Promise.all([
        bigQueryClient.insertData('customers', extractionResults.customers.data),
        bigQueryClient.insertData('timeero_users', extractionResults.timeeroUsers.data),
        bigQueryClient.insertData('timeero_timesheets', extractionResults.timesheets.data),
        bigQueryClient.insertData('timeero_mileage', extractionResults.mileage.data),
        bigQueryClient.insertData('timeero_gps_tracking', extractionResults.gpsData.data),
        bigQueryClient.insertData('freshbooks_invoices', extractionResults.invoices.data),
        bigQueryClient.insertData('freshbooks_payments', extractionResults.payments.data)
      ]);

      // Update loading status
      jobStatus.details.loading = {
        customers: customersResult,
        timeeroUsers: timeeroUsersResult,
        timesheets: timesheetsResult,
        mileage: mileageResult,
        gpsData: gpsDataResult,
        invoices: invoicesResult,
        payments: paymentsResult
      };

      // Collect loading errors
      const loadingErrors = [
        ...(customersResult.errors || []),
        ...(timeeroUsersResult.errors || []),
        ...(timesheetsResult.errors || []),
        ...(mileageResult.errors || []),
        ...(gpsDataResult.errors || []),
        ...(invoicesResult.errors || []),
        ...(paymentsResult.errors || [])
      ];

      jobStatus.errors.push(...loadingErrors);

      // Calculate total records processed
      jobStatus.recordsProcessed = 
        (customersResult.rowsProcessed || 0) +
        (timeeroUsersResult.rowsProcessed || 0) +
        (timesheetsResult.rowsProcessed || 0) +
        (mileageResult.rowsProcessed || 0) +
        (gpsDataResult.rowsProcessed || 0) +
        (invoicesResult.rowsProcessed || 0) +
        (paymentsResult.rowsProcessed || 0);

      // Determine job completion status
      const hasErrors = jobStatus.errors.length > 0;
      const hasLoadingFailures = Object.values(jobStatus.details.loading).some(result => !result.success);
      
      jobStatus.status = hasErrors || hasLoadingFailures ? 'failed' : 'completed';
      jobStatus.endTime = new Date().toISOString();
      jobStatus.duration = new Date(jobStatus.endTime).getTime() - new Date(jobStatus.startTime).getTime();

      console.log(`✅ ETL job completed: ${jobStatus.status}`);
      console.log(`📊 Records processed: ${jobStatus.recordsProcessed}`);
      console.log(`⏱️ Duration: ${jobStatus.duration}ms`);

      if (jobStatus.errors.length > 0) {
        console.log(`⚠️ Errors encountered: ${jobStatus.errors.length}`);
        jobStatus.errors.forEach(error => console.log(`  - ${error}`));
      }

    } catch (error) {
      console.error('❌ ETL job failed:', error);
      jobStatus.status = 'failed';
      jobStatus.endTime = new Date().toISOString();
      jobStatus.duration = new Date(jobStatus.endTime).getTime() - new Date(jobStatus.startTime).getTime();
      jobStatus.errors.push(`ETL job failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Remove from running jobs and add to history
      this.runningJobs.delete(jobId);
      this.addToHistory(jobStatus);
    }

    return jobStatus;
  }

  // Get job status
  public getJobStatus(jobId: string): ETLJobStatus | null {
    return this.runningJobs.get(jobId) || 
           this.jobHistory.find(job => job.jobId === jobId) || 
           null;
  }

  // Get all running jobs
  public getRunningJobs(): ETLJobStatus[] {
    return Array.from(this.runningJobs.values());
  }

  // Get job history
  public getJobHistory(limit: number = 10): ETLJobStatus[] {
    return this.jobHistory.slice(-limit);
  }

  // Run a quick ETL job with default settings
  public async runQuickETL(): Promise<ETLJobStatus> {
    const config: ETLJobConfig = {
      jobId: `quick_etl_${Date.now()}`,
      name: 'Quick ETL Job',
      sources: ['customers', 'timeero', 'freshbooks'],
      options: {
        includeDays: 7, // Last 7 days
        includeGpsData: false, // Skip GPS data for quick runs
        skipTimeero: false,
        skipFreshBooks: false,
        skipCustomers: false
      }
    };

    return await this.runETLJob(config);
  }

  // Run a full ETL job with all data
  public async runFullETL(): Promise<ETLJobStatus> {
    const config: ETLJobConfig = {
      jobId: `full_etl_${Date.now()}`,
      name: 'Full ETL Job',
      sources: ['customers', 'timeero', 'freshbooks'],
      options: {
        includeDays: 30, // Last 30 days
        includeGpsData: true, // Include GPS data
        skipTimeero: false,
        skipFreshBooks: false,
        skipCustomers: false
      }
    };

    return await this.runETLJob(config);
  }

  // Test ETL system with minimal data
  public async testETL(): Promise<ETLJobStatus> {
    const config: ETLJobConfig = {
      jobId: `test_etl_${Date.now()}`,
      name: 'Test ETL Job',
      sources: ['customers'],
      options: {
        includeDays: 1, // Just today
        includeGpsData: false,
        skipTimeero: true,
        skipFreshBooks: true,
        skipCustomers: false
      }
    };

    return await this.runETLJob(config);
  }

  // BigQuery utilities
  public async queryData(sql: string): Promise<any[]> {
    return await bigQueryClient.query(sql);
  }

  public async getTableInfo(tableName: string): Promise<any> {
    return await bigQueryClient.getTableInfo(tableName);
  }

  public async listTables(): Promise<string[]> {
    return await bigQueryClient.listTables();
  }

  // Private helper methods
  private addToHistory(jobStatus: ETLJobStatus): void {
    this.jobHistory.push(jobStatus);
    
    // Keep only the most recent jobs
    if (this.jobHistory.length > this.maxHistorySize) {
      this.jobHistory = this.jobHistory.slice(-this.maxHistorySize);
    }
  }

  // Generate ETL summary report
  public generateETLReport(): {
    totalJobsRun: number;
    successfulJobs: number;
    failedJobs: number;
    totalRecordsProcessed: number;
    averageJobDuration: number;
    recentErrors: string[];
  } {
    const totalJobs = this.jobHistory.length;
    const successfulJobs = this.jobHistory.filter(job => job.status === 'completed').length;
    const failedJobs = this.jobHistory.filter(job => job.status === 'failed').length;
    const totalRecordsProcessed = this.jobHistory.reduce((sum, job) => sum + job.recordsProcessed, 0);
    const averageJobDuration = totalJobs > 0 ? 
      this.jobHistory.reduce((sum, job) => sum + (job.duration || 0), 0) / totalJobs : 0;
    
    // Get recent errors (last 5 jobs)
    const recentErrors = this.jobHistory
      .slice(-5)
      .flatMap(job => job.errors)
      .slice(-10); // Last 10 errors

    return {
      totalJobsRun: totalJobs,
      successfulJobs,
      failedJobs,
      totalRecordsProcessed,
      averageJobDuration,
      recentErrors
    };
  }
}

// Export singleton instance
export const etlService = ETLService.getInstance();

// Export types
export type { ETLJobConfig, ETLJobStatus, ETLServiceStatus }; 