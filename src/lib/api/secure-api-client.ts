/**
 * Secure API Client
 * Centralized API client with secure credential management
 */

import { secretsManager } from '../secrets-manager';
import type { GoogleCredentials, ExternalAPICredentials } from '../secrets-manager';

interface APIClientOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  validateCredentials?: boolean;
}

interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
  metadata?: {
    credentialsValid: boolean;
    fallbackUsed: boolean;
    source: 'live' | 'demo' | 'cached';
  };
}

class SecureAPIClient {
  private static instance: SecureAPIClient;
  private credentials: {
    google: GoogleCredentials;
    external: ExternalAPICredentials;
  };
  private initialized = false;

  private constructor() {
    this.credentials = {
      google: secretsManager.getGoogleCredentials(),
      external: secretsManager.getExternalAPICredentials()
    };
  }

  public static getInstance(): SecureAPIClient {
    if (!SecureAPIClient.instance) {
      SecureAPIClient.instance = new SecureAPIClient();
    }
    return SecureAPIClient.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Validate credentials on startup
      await this.validateCredentials();
      this.initialized = true;
      console.log('🔐 Secure API Client initialized');
    } catch (error) {
      console.error('❌ Secure API Client initialization failed:', error);
      throw error;
    }
  }

  private async validateCredentials(): Promise<void> {
    const audit = secretsManager.validateAllSecrets();
    
    if (audit.missingRequired.length > 0) {
      console.warn('⚠️  Missing required credentials:', audit.missingRequired);
    }

    // Refresh credentials in case they were updated
    this.credentials = {
      google: secretsManager.getGoogleCredentials(),
      external: secretsManager.getExternalAPICredentials()
    };
  }

  // Google Maps API
  public async calculateRoute(
    origin: { lat: number; lng: number; address?: string },
    destination: { lat: number; lng: number; address?: string },
    options: APIClientOptions = {}
  ): Promise<APIResponse<{
    distanceMiles: number;
    durationMinutes: number;
    route?: any;
  }>> {
    if (!this.credentials.google.mapsApiKey || this.credentials.google.mapsApiKey === 'demo-key') {
      console.warn('⚠️  Google Maps API key not configured, using demo data');
      
      return {
        success: true,
        data: {
          distanceMiles: 5.2,
          durationMinutes: 12.5
        },
        metadata: {
          credentialsValid: false,
          fallbackUsed: true,
          source: 'demo'
        }
      };
    }

    try {
      const originStr = origin.address || `${origin.lat},${origin.lng}`;
      const destinationStr = destination.address || `${destination.lat},${destination.lng}`;

      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?` +
        `origins=${encodeURIComponent(originStr)}&` +
        `destinations=${encodeURIComponent(destinationStr)}&` +
        `units=imperial&` +
        `key=${this.credentials.google.mapsApiKey}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Google Maps API error: ${data.status}`);
      }

      const element = data.rows[0]?.elements[0];
      if (!element || element.status !== 'OK') {
        throw new Error(`Route calculation failed: ${element?.status || 'Unknown error'}`);
      }

      const distanceMiles = element.distance.value * 0.000621371;
      const durationMinutes = element.duration.value / 60;

      return {
        success: true,
        data: {
          distanceMiles,
          durationMinutes,
          route: element
        },
        metadata: {
          credentialsValid: true,
          fallbackUsed: false,
          source: 'live'
        }
      };

    } catch (error) {
      console.error('❌ Google Maps API error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          credentialsValid: false,
          fallbackUsed: false,
          source: 'live'
        }
      };
    }
  }

  // FreshBooks API
  public async getFreshBooksData(
    endpoint: string,
    options: APIClientOptions = {}
  ): Promise<APIResponse<any>> {
    const fbCredentials = this.credentials.external.freshbooks;
    
    if (!fbCredentials.clientId || !fbCredentials.clientSecret) {
      console.warn('⚠️  FreshBooks credentials not configured, using demo data');
      
      return {
        success: true,
        data: this.generateFreshBooksDemoData(),
        metadata: {
          credentialsValid: false,
          fallbackUsed: true,
          source: 'demo'
        }
      };
    }

    try {
      // Attempt to refresh token if needed
      let accessToken = fbCredentials.accessToken;
      
      if (!accessToken && fbCredentials.refreshToken) {
        const tokenResponse = await this.refreshFreshBooksToken();
        if (tokenResponse.success) {
          accessToken = tokenResponse.data.access_token;
        }
      }

      if (!accessToken) {
        throw new Error('No valid access token available');
      }

      const response = await fetch(`https://api.freshbooks.com${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`FreshBooks API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
        metadata: {
          credentialsValid: true,
          fallbackUsed: false,
          source: 'live'
        }
      };

    } catch (error) {
      console.error('❌ FreshBooks API error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: this.generateFreshBooksDemoData(),
        metadata: {
          credentialsValid: false,
          fallbackUsed: true,
          source: 'demo'
        }
      };
    }
  }

  private async refreshFreshBooksToken(): Promise<APIResponse<any>> {
    const fbCredentials = this.credentials.external.freshbooks;
    
    try {
      const response = await fetch('https://api.freshbooks.com/auth/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          client_id: fbCredentials.clientId,
          client_secret: fbCredentials.clientSecret,
          refresh_token: fbCredentials.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data,
        metadata: {
          credentialsValid: true,
          fallbackUsed: false,
          source: 'live'
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          credentialsValid: false,
          fallbackUsed: false,
          source: 'live'
        }
      };
    }
  }

  // Timeero API
  public async getTimeeroData(
    endpoint: string,
    options: APIClientOptions = {}
  ): Promise<APIResponse<any>> {
    const timeeroKey = this.credentials.external.timeero.apiKey;
    
    if (!timeeroKey) {
      console.warn('⚠️  Timeero API key not configured, using demo data');
      
      return {
        success: true,
        data: this.generateTimeeroDemoData(),
        metadata: {
          credentialsValid: false,
          fallbackUsed: true,
          source: 'demo'
        }
      };
    }

    try {
      const response = await fetch(`https://api.timeero.app/api/public${endpoint}`, {
        headers: {
          'Authorization': timeeroKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Timeero API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
        metadata: {
          credentialsValid: true,
          fallbackUsed: false,
          source: 'live'
        }
      };

    } catch (error) {
      console.error('❌ Timeero API error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: this.generateTimeeroDemoData(),
        metadata: {
          credentialsValid: false,
          fallbackUsed: true,
          source: 'demo'
        }
      };
    }
  }

  // OpenAI API
  public async callOpenAI(
    prompt: string,
    options: APIClientOptions & {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<APIResponse<any>> {
    const openaiKey = this.credentials.external.openai.apiKey;
    
    if (!openaiKey) {
      console.warn('⚠️  OpenAI API key not configured');
      
      return {
        success: false,
        error: 'OpenAI API key not configured',
        metadata: {
          credentialsValid: false,
          fallbackUsed: false,
          source: 'live'
        }
      };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: options.model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options.maxTokens || 1000,
          temperature: options.temperature || 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data,
        metadata: {
          credentialsValid: true,
          fallbackUsed: false,
          source: 'live'
        }
      };

    } catch (error) {
      console.error('❌ OpenAI API error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          credentialsValid: false,
          fallbackUsed: false,
          source: 'live'
        }
      };
    }
  }

  // Demo data generators
  private generateFreshBooksDemoData(): any {
    return {
      totalRevenue: 45670,
      invoiceCount: 23,
      paidInvoices: 18,
      overdueInvoices: 5,
      monthlyRevenue: [
        { month: 'Jan', revenue: 7500 },
        { month: 'Feb', revenue: 8200 },
        { month: 'Mar', revenue: 9100 },
        { month: 'Apr', revenue: 8800 },
        { month: 'May', revenue: 9500 },
        { month: 'Jun', revenue: 10200 }
      ],
      _demoData: true
    };
  }

  private generateTimeeroDemoData(): any {
    return {
      totalHours: 2340,
      activeEmployees: 12,
      totalMileage: 15420,
      averageSpeed: 35.2,
      weeklyHours: [
        { week: 'W1', hours: 120 },
        { week: 'W2', hours: 135 },
        { week: 'W3', hours: 128 },
        { week: 'W4', hours: 142 }
      ],
      _demoData: true
    };
  }

  // Utility methods
  public getCredentialStatus(): {
    google: boolean;
    freshbooks: boolean;
    timeero: boolean;
    openai: boolean;
  } {
    return {
      google: !!(this.credentials.google.mapsApiKey && this.credentials.google.mapsApiKey !== 'demo-key'),
      freshbooks: !!(this.credentials.external.freshbooks.clientId && this.credentials.external.freshbooks.clientSecret),
      timeero: !!this.credentials.external.timeero.apiKey,
      openai: !!this.credentials.external.openai.apiKey
    };
  }

  public async refreshCredentials(): Promise<void> {
    await this.validateCredentials();
  }
}

// Export singleton instance
export const secureAPIClient = SecureAPIClient.getInstance();

// Export types
export type { APIResponse, APIClientOptions }; 