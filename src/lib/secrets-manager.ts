/**
 * Secure Secrets Management Service
 * Centralized credential handling with validation, error handling, and secure access
 */

import crypto from 'crypto';

// Types for different credential categories
interface DatabaseCredentials {
  url: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
}

interface GoogleCredentials {
  mapsApiKey: string;
  sheetsApiKey: string;
  spreadsheetId: string;
  serviceAccountKey: any;
  chatWebhookUrl: string;
}

interface ExternalAPICredentials {
  freshbooks: {
    clientId: string;
    clientSecret: string;
    accessToken: string;
    refreshToken: string;
    accountId: string;
  };
  timeero: {
    apiKey: string;
    companyId?: string;
  };
  openai: {
    apiKey: string;
  };
}

interface AppCredentials {
  appUrl: string;
  environment: 'development' | 'staging' | 'production';
  nodeEnv: string;
}

interface SecretValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

interface SecretAuditResult {
  requiredSecrets: string[];
  optionalSecrets: string[];
  missingRequired: string[];
  missingOptional: string[];
  invalidSecrets: string[];
  validSecrets: string[];
  securityScore: number;
  recommendations: string[];
}

// Security levels for different credential types
enum SecurityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

interface SecretMetadata {
  key: string;
  required: boolean;
  securityLevel: SecurityLevel;
  validator?: (value: string) => SecretValidationResult;
  description: string;
  fallback?: string;
}

class SecretsManager {
  private static instance: SecretsManager;
  private readonly requiredSecrets: SecretMetadata[] = [];
  private readonly optionalSecrets: SecretMetadata[] = [];
  private validatedSecrets: Map<string, any> = new Map();
  private auditResults: SecretAuditResult | null = null;

  private constructor() {
    this.initializeSecretDefinitions();
  }

  public static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager();
    }
    return SecretsManager.instance;
  }

  private initializeSecretDefinitions(): void {
    // Database credentials
    this.requiredSecrets.push({
      key: 'DATABASE_URL',
      required: true,
      securityLevel: SecurityLevel.CRITICAL,
      description: 'PostgreSQL database connection string',
      validator: this.validateDatabaseUrl
    });

    // Google API credentials
    this.requiredSecrets.push({
      key: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
      required: true,
      securityLevel: SecurityLevel.MEDIUM,
      description: 'Google Maps API key for location services',
      validator: this.validateGoogleMapsApiKey,
      fallback: 'demo-key'
    });

    this.optionalSecrets.push({
      key: 'GOOGLE_SHEETS_API_KEY',
      required: false,
      securityLevel: SecurityLevel.MEDIUM,
      description: 'Google Sheets API key for data integration',
      validator: this.validateGoogleApiKey
    });

    this.optionalSecrets.push({
      key: 'GOOGLE_SPREADSHEET_ID',
      required: false,
      securityLevel: SecurityLevel.LOW,
      description: 'Google Sheets spreadsheet ID',
      validator: this.validateGoogleSpreadsheetId
    });

    this.requiredSecrets.push({
      key: 'GOOGLE_SERVICE_ACCOUNT_KEY',
      required: true,
      securityLevel: SecurityLevel.CRITICAL,
      description: 'Google Service Account JSON key for authentication',
      validator: this.validateGoogleServiceAccount
    });

    this.optionalSecrets.push({
      key: 'GOOGLE_CHAT_WEBHOOK_URL',
      required: false,
      securityLevel: SecurityLevel.MEDIUM,
      description: 'Google Chat webhook URL for notifications',
      validator: this.validateWebhookUrl
    });

    // External API credentials
    this.optionalSecrets.push({
      key: 'FRESHBOOKS_CLIENT_ID',
      required: false,
      securityLevel: SecurityLevel.HIGH,
      description: 'FreshBooks OAuth client ID',
      validator: this.validateFreshBooksCredential
    });

    this.optionalSecrets.push({
      key: 'FRESHBOOKS_CLIENT_SECRET',
      required: false,
      securityLevel: SecurityLevel.CRITICAL,
      description: 'FreshBooks OAuth client secret',
      validator: this.validateFreshBooksCredential
    });

    this.optionalSecrets.push({
      key: 'FRESHBOOKS_ACCESS_TOKEN',
      required: false,
      securityLevel: SecurityLevel.HIGH,
      description: 'FreshBooks access token',
      validator: this.validateFreshBooksCredential
    });

    this.optionalSecrets.push({
      key: 'FRESHBOOKS_REFRESH_TOKEN',
      required: false,
      securityLevel: SecurityLevel.HIGH,
      description: 'FreshBooks refresh token',
      validator: this.validateFreshBooksCredential
    });

    this.optionalSecrets.push({
      key: 'TIMEERO_API_KEY',
      required: false,
      securityLevel: SecurityLevel.HIGH,
      description: 'Timeero API key for time tracking',
      validator: this.validateTimeeroApiKey
    });

    this.optionalSecrets.push({
      key: 'OPENAI_API_KEY',
      required: false,
      securityLevel: SecurityLevel.HIGH,
      description: 'OpenAI API key for GPT services',
      validator: this.validateOpenAIApiKey
    });

    // Application configuration
    this.requiredSecrets.push({
      key: 'NEXT_PUBLIC_APP_URL',
      required: true,
      securityLevel: SecurityLevel.LOW,
      description: 'Application base URL',
      validator: this.validateAppUrl,
      fallback: 'http://localhost:3000'
    });
  }

  // Validation methods
  private validateDatabaseUrl = (value: string): SecretValidationResult => {
    if (!value.startsWith('postgresql://')) {
      return { isValid: false, error: 'Database URL must start with postgresql://' };
    }
    
    try {
      const url = new URL(value);
      if (!url.hostname || !url.pathname) {
        return { isValid: false, error: 'Invalid database URL format' };
      }
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid URL format' };
    }
  };

  private validateGoogleMapsApiKey = (value: string): SecretValidationResult => {
    if (!value || value === 'demo-key' || value === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      return { 
        isValid: false, 
        error: 'Google Maps API key required for location services',
        warnings: ['Using demo mode - maps functionality will be limited']
      };
    }
    
    if (!value.startsWith('AIza')) {
      return { isValid: false, error: 'Google Maps API key should start with "AIza"' };
    }
    
    return { isValid: true };
  };

  private validateGoogleApiKey = (value: string): SecretValidationResult => {
    if (!value || value.length < 20) {
      return { isValid: false, error: 'Google API key appears to be invalid' };
    }
    return { isValid: true };
  };

  private validateGoogleSpreadsheetId = (value: string): SecretValidationResult => {
    if (!value || !/^[a-zA-Z0-9-_]{44}$/.test(value)) {
      return { isValid: false, error: 'Google Spreadsheet ID format is invalid' };
    }
    return { isValid: true };
  };

  private validateGoogleServiceAccount = (value: string): SecretValidationResult => {
    try {
      const serviceAccount = JSON.parse(value);
      const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
      
      for (const field of requiredFields) {
        if (!serviceAccount[field]) {
          return { isValid: false, error: `Missing required field: ${field}` };
        }
      }
      
      if (serviceAccount.type !== 'service_account') {
        return { isValid: false, error: 'Invalid service account type' };
      }
      
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid JSON format for service account key' };
    }
  };

  private validateWebhookUrl = (value: string): SecretValidationResult => {
    try {
      const url = new URL(value);
      if (!url.hostname.includes('googleapis.com')) {
        return { isValid: false, error: 'Webhook URL must be from googleapis.com' };
      }
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid webhook URL format' };
    }
  };

  private validateFreshBooksCredential = (value: string): SecretValidationResult => {
    if (!value || value.length < 10) {
      return { isValid: false, error: 'FreshBooks credential appears to be invalid' };
    }
    return { isValid: true };
  };

  private validateTimeeroApiKey = (value: string): SecretValidationResult => {
    if (!value || value.length < 20) {
      return { isValid: false, error: 'Timeero API key appears to be invalid' };
    }
    return { isValid: true };
  };

  private validateOpenAIApiKey = (value: string): SecretValidationResult => {
    if (!value || !value.startsWith('sk-')) {
      return { isValid: false, error: 'OpenAI API key must start with "sk-"' };
    }
    return { isValid: true };
  };

  private validateAppUrl = (value: string): SecretValidationResult => {
    try {
      new URL(value);
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid application URL format' };
    }
  };

  // Main validation and audit methods
  public validateAllSecrets(): SecretAuditResult {
    const requiredSecrets = this.requiredSecrets.map(s => s.key);
    const optionalSecrets = this.optionalSecrets.map(s => s.key);
    const missingRequired: string[] = [];
    const missingOptional: string[] = [];
    const invalidSecrets: string[] = [];
    const validSecrets: string[] = [];
    const recommendations: string[] = [];

    // Validate required secrets
    for (const secret of this.requiredSecrets) {
      const value = process.env[secret.key];
      
      if (!value) {
        missingRequired.push(secret.key);
        if (secret.fallback) {
          recommendations.push(`${secret.key}: Using fallback value "${secret.fallback}"`);
        }
      } else {
        const validation = secret.validator ? secret.validator(value) : { isValid: true };
        
        if (validation.isValid) {
          validSecrets.push(secret.key);
          this.validatedSecrets.set(secret.key, value);
        } else {
          invalidSecrets.push(secret.key);
          recommendations.push(`${secret.key}: ${validation.error}`);
        }
        
        if (validation.warnings) {
          recommendations.push(...validation.warnings.map(w => `${secret.key}: ${w}`));
        }
      }
    }

    // Validate optional secrets
    for (const secret of this.optionalSecrets) {
      const value = process.env[secret.key];
      
      if (!value) {
        missingOptional.push(secret.key);
      } else {
        const validation = secret.validator ? secret.validator(value) : { isValid: true };
        
        if (validation.isValid) {
          validSecrets.push(secret.key);
          this.validatedSecrets.set(secret.key, value);
        } else {
          invalidSecrets.push(secret.key);
          recommendations.push(`${secret.key}: ${validation.error}`);
        }
      }
    }

    // Calculate security score
    const totalSecrets = requiredSecrets.length + optionalSecrets.length;
    const validCount = validSecrets.length;
    const requiredValidCount = requiredSecrets.filter(key => 
      validSecrets.includes(key) || (this.requiredSecrets.find(s => s.key === key)?.fallback)
    ).length;
    
    const securityScore = Math.round(
      (validCount / totalSecrets) * 100 * 0.7 + 
      (requiredValidCount / requiredSecrets.length) * 100 * 0.3
    );

    // Add general recommendations
    if (missingRequired.length > 0) {
      recommendations.push('⚠️ Missing required credentials will cause application errors');
    }
    
    if (securityScore < 70) {
      recommendations.push('🔒 Security score below 70% - consider adding more credentials');
    }
    
    if (missingOptional.length > 0) {
      recommendations.push('📈 Optional credentials can enable additional features');
    }

    this.auditResults = {
      requiredSecrets,
      optionalSecrets,
      missingRequired,
      missingOptional,
      invalidSecrets,
      validSecrets,
      securityScore,
      recommendations
    };

    return this.auditResults;
  }

  // Secure credential access methods
  public getSecret(key: string): string | null {
    const value = this.validatedSecrets.get(key) || process.env[key];
    
    if (!value) {
      const secret = [...this.requiredSecrets, ...this.optionalSecrets].find(s => s.key === key);
      if (secret?.fallback) {
        console.warn(`⚠️ Using fallback value for ${key}: ${secret.fallback}`);
        return secret.fallback;
      }
      return null;
    }
    
    return value;
  }

  public getRequiredSecret(key: string): string {
    const value = this.getSecret(key);
    if (!value) {
      throw new Error(`Required secret ${key} is not configured`);
    }
    return value;
  }

  public getDatabaseCredentials(): DatabaseCredentials {
    const url = this.getRequiredSecret('DATABASE_URL');
    
    try {
      const parsedUrl = new URL(url);
      return {
        url,
        host: parsedUrl.hostname,
        port: parsedUrl.port ? parseInt(parsedUrl.port) : 5432,
        username: parsedUrl.username,
        password: parsedUrl.password,
        database: parsedUrl.pathname.slice(1)
      };
    } catch (error) {
      throw new Error('Invalid database URL format');
    }
  }

  public getGoogleCredentials(): GoogleCredentials {
    const serviceAccountKey = this.getSecret('GOOGLE_SERVICE_ACCOUNT_KEY');
    let parsedServiceAccount = null;
    
    if (serviceAccountKey) {
      try {
        parsedServiceAccount = JSON.parse(serviceAccountKey);
      } catch (error) {
        console.error('Invalid Google Service Account JSON format');
      }
    }

    return {
      mapsApiKey: this.getSecret('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY') || 'demo-key',
      sheetsApiKey: this.getSecret('GOOGLE_SHEETS_API_KEY') || '',
      spreadsheetId: this.getSecret('GOOGLE_SPREADSHEET_ID') || '',
      serviceAccountKey: parsedServiceAccount,
      chatWebhookUrl: this.getSecret('GOOGLE_CHAT_WEBHOOK_URL') || ''
    };
  }

  public getExternalAPICredentials(): ExternalAPICredentials {
    return {
      freshbooks: {
        clientId: this.getSecret('FRESHBOOKS_CLIENT_ID') || '',
        clientSecret: this.getSecret('FRESHBOOKS_CLIENT_SECRET') || '',
        accessToken: this.getSecret('FRESHBOOKS_ACCESS_TOKEN') || '',
        refreshToken: this.getSecret('FRESHBOOKS_REFRESH_TOKEN') || '',
        accountId: this.getSecret('FRESHBOOKS_ACCOUNT_ID') || ''
      },
      timeero: {
        apiKey: this.getSecret('TIMEERO_API_KEY') || this.getSecret('NEXT_PUBLIC_TIMEERO_API_KEY') || '',
        companyId: this.getSecret('TIMEERO_COMPANY_ID') || ''
      },
      openai: {
        apiKey: this.getSecret('OPENAI_API_KEY') || ''
      }
    };
  }

  public getAppCredentials(): AppCredentials {
    return {
      appUrl: this.getSecret('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000',
      environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
      nodeEnv: process.env.NODE_ENV || 'development'
    };
  }

  // Utility methods
  public isSecretConfigured(key: string): boolean {
    return !!this.getSecret(key);
  }

  public getSecurityLevel(key: string): SecurityLevel {
    const secret = [...this.requiredSecrets, ...this.optionalSecrets].find(s => s.key === key);
    return secret?.securityLevel || SecurityLevel.LOW;
  }

  public getAuditResults(): SecretAuditResult | null {
    return this.auditResults;
  }

  public generateSecurityReport(): string {
    const audit = this.validateAllSecrets();
    
    let report = '🔐 SECURITY AUDIT REPORT\n';
    report += '=' .repeat(50) + '\n\n';
    
    report += `📊 Overall Security Score: ${audit.securityScore}%\n`;
    report += `✅ Valid Secrets: ${audit.validSecrets.length}\n`;
    report += `❌ Invalid Secrets: ${audit.invalidSecrets.length}\n`;
    report += `⚠️ Missing Required: ${audit.missingRequired.length}\n`;
    report += `📋 Missing Optional: ${audit.missingOptional.length}\n\n`;
    
    if (audit.missingRequired.length > 0) {
      report += '🚨 MISSING REQUIRED CREDENTIALS:\n';
      audit.missingRequired.forEach(key => {
        report += `  • ${key}\n`;
      });
      report += '\n';
    }
    
    if (audit.invalidSecrets.length > 0) {
      report += '⚠️ INVALID CREDENTIALS:\n';
      audit.invalidSecrets.forEach(key => {
        report += `  • ${key}\n`;
      });
      report += '\n';
    }
    
    if (audit.recommendations.length > 0) {
      report += '💡 RECOMMENDATIONS:\n';
      audit.recommendations.forEach(rec => {
        report += `  • ${rec}\n`;
      });
      report += '\n';
    }
    
    report += '📋 CREDENTIAL STATUS:\n';
    report += `Required: ${audit.requiredSecrets.length} total\n`;
    audit.requiredSecrets.forEach(key => {
      const status = audit.validSecrets.includes(key) ? '✅' : 
                    audit.missingRequired.includes(key) ? '❌' : '⚠️';
      report += `  ${status} ${key}\n`;
    });
    
    report += `\nOptional: ${audit.optionalSecrets.length} total\n`;
    audit.optionalSecrets.forEach(key => {
      const status = audit.validSecrets.includes(key) ? '✅' : '⚪';
      report += `  ${status} ${key}\n`;
    });
    
    return report;
  }
}

// Export singleton instance
export const secretsManager = SecretsManager.getInstance();

// Export types for external use
export type {
  DatabaseCredentials,
  GoogleCredentials,
  ExternalAPICredentials,
  AppCredentials,
  SecretValidationResult,
  SecretAuditResult
};

export { SecurityLevel };