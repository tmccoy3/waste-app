/**
 * BigQuery Client for Waste Operations Intelligence ETL Pipeline
 * Handles data warehouse operations including table management and data loading
 */

import { BigQuery, Dataset, Table } from '@google-cloud/bigquery';
import { secretsManager } from '../secrets-manager';

interface BigQueryConfig {
  projectId: string;
  datasetId: string;
  keyFilename?: string;
  credentials?: any;
}

interface TableSchema {
  name: string;
  fields: Array<{
    name: string;
    type: 'STRING' | 'INTEGER' | 'FLOAT' | 'BOOLEAN' | 'TIMESTAMP' | 'DATE' | 'DATETIME' | 'GEOGRAPHY' | 'JSON';
    mode?: 'NULLABLE' | 'REQUIRED' | 'REPEATED';
    description?: string;
  }>;
  description?: string;
  partitionField?: string;
  clusterFields?: string[];
}

interface ETLJobResult {
  success: boolean;
  message: string;
  rowsProcessed?: number;
  errors?: string[];
  metadata?: {
    jobId?: string;
    duration?: number;
    tableName?: string;
    timestamp: string;
  };
}

class BigQueryETLClient {
  private static instance: BigQueryETLClient;
  private bigquery: BigQuery;
  private dataset: Dataset;
  private config: BigQueryConfig;
  private initialized = false;

  private constructor() {
    this.config = this.getConfiguration();
    this.bigquery = new BigQuery({
      projectId: this.config.projectId,
      keyFilename: this.config.keyFilename,
      credentials: this.config.credentials
    });
    this.dataset = this.bigquery.dataset(this.config.datasetId);
  }

  public static getInstance(): BigQueryETLClient {
    if (!BigQueryETLClient.instance) {
      BigQueryETLClient.instance = new BigQueryETLClient();
    }
    return BigQueryETLClient.instance;
  }

  private getConfiguration(): BigQueryConfig {
    const googleCreds = secretsManager.getGoogleCredentials();
    
    // Default configuration for development
    const config: BigQueryConfig = {
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'waste-ops-intelligence',
      datasetId: process.env.BIGQUERY_DATASET_ID || 'operations_data',
    };

    // Use service account credentials if available
    if (googleCreds.serviceAccountKey) {
      config.credentials = googleCreds.serviceAccountKey;
      config.projectId = googleCreds.serviceAccountKey.project_id || config.projectId;
    }

    return config;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create dataset if it doesn't exist
      const [datasetExists] = await this.dataset.exists();
      if (!datasetExists) {
        console.log(`📊 Creating BigQuery dataset: ${this.config.datasetId}`);
        await this.dataset.create({
          location: 'US',
          description: 'Waste Operations Intelligence data warehouse'
        });
      }

      // Create all required tables
      await this.initializeTables();
      
      this.initialized = true;
      console.log('✅ BigQuery ETL Client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize BigQuery ETL Client:', error);
      throw error;
    }
  }

  private async initializeTables(): Promise<void> {
    const schemas = this.getTableSchemas();
    
    for (const schema of schemas) {
      try {
        await this.ensureTable(schema);
      } catch (error) {
        console.error(`❌ Failed to create table ${schema.name}:`, error);
        throw error;
      }
    }
  }

  private getTableSchemas(): TableSchema[] {
    return [
      // Customer data table
      {
        name: 'customers',
        description: 'Customer master data with service details',
        fields: [
          { name: 'customer_id', type: 'STRING', mode: 'REQUIRED', description: 'Unique customer identifier' },
          { name: 'name', type: 'STRING', mode: 'REQUIRED', description: 'Customer name' },
          { name: 'address', type: 'STRING', mode: 'NULLABLE', description: 'Service address' },
          { name: 'latitude', type: 'FLOAT', mode: 'NULLABLE', description: 'Latitude coordinate' },
          { name: 'longitude', type: 'FLOAT', mode: 'NULLABLE', description: 'Longitude coordinate' },
          { name: 'customer_type', type: 'STRING', mode: 'NULLABLE', description: 'Type of customer (HOA, Commercial, etc.)' },
          { name: 'unit_type', type: 'STRING', mode: 'NULLABLE', description: 'Service unit type' },
          { name: 'units', type: 'INTEGER', mode: 'NULLABLE', description: 'Number of service units' },
          { name: 'monthly_revenue', type: 'FLOAT', mode: 'NULLABLE', description: 'Monthly revenue amount' },
          { name: 'service_days', type: 'STRING', mode: 'REPEATED', description: 'Service days of week' },
          { name: 'completion_time_minutes', type: 'INTEGER', mode: 'NULLABLE', description: 'Average completion time' },
          { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Record creation timestamp' },
          { name: 'updated_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Last update timestamp' }
        ],
        partitionField: 'created_at'
      },

      // Timeero data tables
      {
        name: 'timeero_users',
        description: 'Timeero employee/driver data',
        fields: [
          { name: 'user_id', type: 'INTEGER', mode: 'REQUIRED', description: 'Timeero user ID' },
          { name: 'first_name', type: 'STRING', mode: 'NULLABLE', description: 'First name' },
          { name: 'last_name', type: 'STRING', mode: 'NULLABLE', description: 'Last name' },
          { name: 'email', type: 'STRING', mode: 'NULLABLE', description: 'Email address' },
          { name: 'employee_code', type: 'STRING', mode: 'NULLABLE', description: 'Employee code' },
          { name: 'role_name', type: 'STRING', mode: 'NULLABLE', description: 'Role/position' },
          { name: 'pay_rate', type: 'FLOAT', mode: 'NULLABLE', description: 'Hourly pay rate' },
          { name: 'active', type: 'STRING', mode: 'NULLABLE', description: 'Active status' },
          { name: 'can_track_location', type: 'BOOLEAN', mode: 'NULLABLE', description: 'Location tracking enabled' },
          { name: 'can_track_mileage', type: 'BOOLEAN', mode: 'NULLABLE', description: 'Mileage tracking enabled' },
          { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Record creation timestamp' },
          { name: 'updated_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Last update timestamp' }
        ],
        partitionField: 'created_at'
      },

      {
        name: 'timeero_timesheets',
        description: 'Timeero timesheet and work hours data',
        fields: [
          { name: 'timesheet_id', type: 'STRING', mode: 'REQUIRED', description: 'Unique timesheet ID' },
          { name: 'user_id', type: 'INTEGER', mode: 'REQUIRED', description: 'Timeero user ID' },
          { name: 'date', type: 'DATE', mode: 'REQUIRED', description: 'Work date' },
          { name: 'clock_in', type: 'DATETIME', mode: 'NULLABLE', description: 'Clock in time' },
          { name: 'clock_out', type: 'DATETIME', mode: 'NULLABLE', description: 'Clock out time' },
          { name: 'total_hours', type: 'FLOAT', mode: 'NULLABLE', description: 'Total hours worked' },
          { name: 'break_duration', type: 'FLOAT', mode: 'NULLABLE', description: 'Break time in hours' },
          { name: 'location_name', type: 'STRING', mode: 'NULLABLE', description: 'Work location' },
          { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Record creation timestamp' },
          { name: 'updated_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Last update timestamp' }
        ],
        partitionField: 'date',
        clusterFields: ['user_id', 'date']
      },

      {
        name: 'timeero_mileage',
        description: 'Timeero mileage and route data',
        fields: [
          { name: 'mileage_id', type: 'STRING', mode: 'REQUIRED', description: 'Unique mileage record ID' },
          { name: 'user_id', type: 'INTEGER', mode: 'REQUIRED', description: 'Timeero user ID' },
          { name: 'date', type: 'DATE', mode: 'REQUIRED', description: 'Date of travel' },
          { name: 'start_location', type: 'STRING', mode: 'NULLABLE', description: 'Starting location' },
          { name: 'end_location', type: 'STRING', mode: 'NULLABLE', description: 'Ending location' },
          { name: 'distance_miles', type: 'FLOAT', mode: 'NULLABLE', description: 'Distance traveled in miles' },
          { name: 'purpose', type: 'STRING', mode: 'NULLABLE', description: 'Purpose of travel' },
          { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Record creation timestamp' },
          { name: 'updated_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Last update timestamp' }
        ],
        partitionField: 'date',
        clusterFields: ['user_id', 'date']
      },

      {
        name: 'timeero_gps_tracking',
        description: 'GPS tracking data from Timeero',
        fields: [
          { name: 'gps_id', type: 'STRING', mode: 'REQUIRED', description: 'Unique GPS record ID' },
          { name: 'user_id', type: 'INTEGER', mode: 'REQUIRED', description: 'Timeero user ID' },
          { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'GPS timestamp' },
          { name: 'latitude', type: 'FLOAT', mode: 'REQUIRED', description: 'Latitude coordinate' },
          { name: 'longitude', type: 'FLOAT', mode: 'REQUIRED', description: 'Longitude coordinate' },
          { name: 'accuracy', type: 'FLOAT', mode: 'NULLABLE', description: 'GPS accuracy in meters' },
          { name: 'speed', type: 'FLOAT', mode: 'NULLABLE', description: 'Speed in mph' },
          { name: 'heading', type: 'FLOAT', mode: 'NULLABLE', description: 'Direction heading' },
          { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Record creation timestamp' }
        ],
        partitionField: 'timestamp',
        clusterFields: ['user_id', 'timestamp']
      },

      // FreshBooks financial data
      {
        name: 'freshbooks_invoices',
        description: 'FreshBooks invoice data',
        fields: [
          { name: 'invoice_id', type: 'STRING', mode: 'REQUIRED', description: 'FreshBooks invoice ID' },
          { name: 'invoice_number', type: 'STRING', mode: 'NULLABLE', description: 'Invoice number' },
          { name: 'customer_id', type: 'STRING', mode: 'NULLABLE', description: 'Customer ID' },
          { name: 'customer_name', type: 'STRING', mode: 'NULLABLE', description: 'Customer name' },
          { name: 'amount', type: 'FLOAT', mode: 'NULLABLE', description: 'Invoice amount' },
          { name: 'outstanding_amount', type: 'FLOAT', mode: 'NULLABLE', description: 'Outstanding amount' },
          { name: 'status', type: 'STRING', mode: 'NULLABLE', description: 'Invoice status' },
          { name: 'issued_date', type: 'DATE', mode: 'NULLABLE', description: 'Issue date' },
          { name: 'due_date', type: 'DATE', mode: 'NULLABLE', description: 'Due date' },
          { name: 'paid_date', type: 'DATE', mode: 'NULLABLE', description: 'Paid date' },
          { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Record creation timestamp' },
          { name: 'updated_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Last update timestamp' }
        ],
        partitionField: 'issued_date',
        clusterFields: ['customer_id', 'status']
      },

      {
        name: 'freshbooks_payments',
        description: 'FreshBooks payment data',
        fields: [
          { name: 'payment_id', type: 'STRING', mode: 'REQUIRED', description: 'FreshBooks payment ID' },
          { name: 'invoice_id', type: 'STRING', mode: 'NULLABLE', description: 'Related invoice ID' },
          { name: 'customer_id', type: 'STRING', mode: 'NULLABLE', description: 'Customer ID' },
          { name: 'amount', type: 'FLOAT', mode: 'NULLABLE', description: 'Payment amount' },
          { name: 'payment_method', type: 'STRING', mode: 'NULLABLE', description: 'Payment method' },
          { name: 'payment_date', type: 'DATE', mode: 'NULLABLE', description: 'Payment date' },
          { name: 'status', type: 'STRING', mode: 'NULLABLE', description: 'Payment status' },
          { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Record creation timestamp' },
          { name: 'updated_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Last update timestamp' }
        ],
        partitionField: 'payment_date',
        clusterFields: ['customer_id', 'payment_date']
      },

      // Route efficiency and analytics
      {
        name: 'route_analytics',
        description: 'Processed route efficiency analytics',
        fields: [
          { name: 'analytics_id', type: 'STRING', mode: 'REQUIRED', description: 'Unique analytics record ID' },
          { name: 'user_id', type: 'INTEGER', mode: 'REQUIRED', description: 'Driver/user ID' },
          { name: 'date', type: 'DATE', mode: 'REQUIRED', description: 'Route date' },
          { name: 'route_name', type: 'STRING', mode: 'NULLABLE', description: 'Route identifier' },
          { name: 'total_distance_miles', type: 'FLOAT', mode: 'NULLABLE', description: 'Total distance traveled' },
          { name: 'total_duration_minutes', type: 'INTEGER', mode: 'NULLABLE', description: 'Total route duration' },
          { name: 'stops_completed', type: 'INTEGER', mode: 'NULLABLE', description: 'Number of stops completed' },
          { name: 'stops_planned', type: 'INTEGER', mode: 'NULLABLE', description: 'Number of planned stops' },
          { name: 'efficiency_score', type: 'FLOAT', mode: 'NULLABLE', description: 'Route efficiency score (0-100)' },
          { name: 'fuel_consumption_gallons', type: 'FLOAT', mode: 'NULLABLE', description: 'Estimated fuel consumption' },
          { name: 'labor_cost', type: 'FLOAT', mode: 'NULLABLE', description: 'Labor cost for route' },
          { name: 'fuel_cost', type: 'FLOAT', mode: 'NULLABLE', description: 'Fuel cost for route' },
          { name: 'total_cost', type: 'FLOAT', mode: 'NULLABLE', description: 'Total route cost' },
          { name: 'estimated_revenue', type: 'FLOAT', mode: 'NULLABLE', description: 'Estimated revenue from route' },
          { name: 'profit_margin', type: 'FLOAT', mode: 'NULLABLE', description: 'Route profit margin' },
          { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Record creation timestamp' }
        ],
        partitionField: 'date',
        clusterFields: ['user_id', 'date', 'route_name']
      }
    ];
  }

  private async ensureTable(schema: TableSchema): Promise<void> {
    const table = this.dataset.table(schema.name);
    const [exists] = await table.exists();

    if (!exists) {
      console.log(`📊 Creating BigQuery table: ${schema.name}`);
      
      const options: any = {
        schema: { fields: schema.fields },
        description: schema.description,
        location: 'US'
      };

      // Add time partitioning if specified
      if (schema.partitionField) {
        options.timePartitioning = {
          type: 'DAY',
          field: schema.partitionField
        };
      }

      // Add clustering if specified
      if (schema.clusterFields) {
        options.clustering = {
          fields: schema.clusterFields
        };
      }

      await table.create(options);
      console.log(`✅ Created table: ${schema.name}`);
    } else {
      console.log(`✅ Table already exists: ${schema.name}`);
    }
  }

  // Insert data into a table
  public async insertData(tableName: string, rows: any[]): Promise<ETLJobResult> {
    const startTime = Date.now();
    
    try {
      if (!rows || rows.length === 0) {
        return {
          success: true,
          message: 'No data to insert',
          rowsProcessed: 0,
          metadata: {
            duration: Date.now() - startTime,
            tableName,
            timestamp: new Date().toISOString()
          }
        };
      }

      const table = this.dataset.table(tableName);
      await table.insert(rows);

      console.log(`✅ Inserted ${rows.length} rows into ${tableName}`);

      return {
        success: true,
        message: `Successfully inserted ${rows.length} rows`,
        rowsProcessed: rows.length,
        metadata: {
          duration: Date.now() - startTime,
          tableName,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error(`❌ Failed to insert data into ${tableName}:`, error);
      
      return {
        success: false,
        message: `Failed to insert data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        rowsProcessed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        metadata: {
          duration: Date.now() - startTime,
          tableName,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // Execute a query
  public async query(sql: string): Promise<any[]> {
    try {
      const [rows] = await this.bigquery.query({
        query: sql,
        location: 'US'
      });
      
      return rows;
    } catch (error) {
      console.error('❌ BigQuery query failed:', error);
      throw error;
    }
  }

  // Get table info
  public async getTableInfo(tableName: string): Promise<any> {
    try {
      const table = this.dataset.table(tableName);
      const [metadata] = await table.getMetadata();
      
      return {
        tableName,
        schema: metadata.schema,
        numRows: metadata.numRows,
        numBytes: metadata.numBytes,
        creationTime: metadata.creationTime,
        lastModifiedTime: metadata.lastModifiedTime
      };
    } catch (error) {
      console.error(`❌ Failed to get table info for ${tableName}:`, error);
      throw error;
    }
  }

  // List all tables in the dataset
  public async listTables(): Promise<string[]> {
    try {
      const [tables] = await this.dataset.getTables();
      return tables.map(table => table.id!);
    } catch (error) {
      console.error('❌ Failed to list tables:', error);
      throw error;
    }
  }

  // Health check
  public async healthCheck(): Promise<{
    isHealthy: boolean;
    message: string;
    details: any;
  }> {
    try {
      // Test basic connectivity
      const [datasets] = await this.bigquery.getDatasets();
      const datasetExists = datasets.some(ds => ds.id === this.config.datasetId);
      
      if (!datasetExists) {
        return {
          isHealthy: false,
          message: `Dataset ${this.config.datasetId} not found`,
          details: { projectId: this.config.projectId, datasetId: this.config.datasetId }
        };
      }

      // Test table access
      const tables = await this.listTables();
      
      return {
        isHealthy: true,
        message: 'BigQuery connection healthy',
        details: {
          projectId: this.config.projectId,
          datasetId: this.config.datasetId,
          tablesCount: tables.length,
          tables: tables.slice(0, 5) // Show first 5 tables
        }
      };

    } catch (error) {
      return {
        isHealthy: false,
        message: `BigQuery health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }
}

// Export singleton instance
export const bigQueryClient = BigQueryETLClient.getInstance();

// Export types
export type { TableSchema, ETLJobResult, BigQueryConfig };