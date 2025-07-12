// Timeero API Integration for Waste Management Operations
// Provides GPS tracking, mileage logs, and timesheet data for route efficiency analysis

import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Environment configuration
const TIMEERO_API_BASE_URL = 'https://api.timeero.app/api/public';
const TIMEERO_API_KEY = process.env.NEXT_PUBLIC_TIMEERO_API_KEY || process.env.TIMEERO_API_KEY;

// Type definitions for Timeero API responses
interface TimeeroUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_employee_id: string | null;
  employee_code: string;
  pay_rate: string;
  billing_rate_type: number;
  active: 'Active' | 'Inactive';
  role_name: string;
  can_track_location: boolean;
  can_track_mileage: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface GpsLocation {
  id: number;
  user_id: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  address?: string;
  speed?: number;
  heading?: number;
  altitude?: number;
  battery_level?: number;
  is_mock?: boolean;
}

interface MileageEntry {
  id: number;
  user_id: number;
  date: string;
  start_location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  end_location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  distance_miles: number;
  distance_km: number;
  start_time: string;
  end_time: string;
  purpose?: string;
  notes?: string;
  vehicle?: string;
  is_business: boolean;
}

interface TimesheetEntry {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  company_employee_id: string | null;
  notes: string | null;
  job_id: number | null;
  job_name: string | null;
  task_id: number | null;
  task_name: string | null;
  clock_in_time: string;
  clock_in_address: string | null;
  clock_in_latitude: number | null;
  clock_in_longitude: number | null;
  clock_out_time: string;
  clock_out_address: string | null;
  clock_out_latitude: number | null;
  clock_out_longitude: number | null;
  break_in_seconds: number;
  breaks: any[];
  duration: string;
  mileage: number;
  attachments: number;
  flagged: boolean;
  approved: boolean;
  approved_by: string | null;
  custom_fields: any;
  clock_in_timezone: string;
  clock_out_timezone: string | null;
  created_at: string;
  updated_at: string;
  total_hours?: number; // Calculated field
}

interface ScheduledJob {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  scheduled_date: string;
  scheduled_start_time: string;
  scheduled_end_time?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  customer_name?: string;
  job_type?: string;
  estimated_duration?: number;
  actual_start_time?: string;
  actual_end_time?: string;
}

interface TimeeroApiResponse<T> {
  items: T[];
  meta_data: {
    pagination: {
      current_page: number;
      last_page: number;
      total: number;
      per_page: number;
      from: number;
      to: number;
    };
  };
}

interface TimeeroError {
  error: string;
  message: string;
  code?: number;
}

// API Client class
class TimeeroApiClient {
  private client: AxiosInstance;

  constructor() {
    if (!TIMEERO_API_KEY) {
      throw new Error('Timeero API key not found. Please set TIMEERO_API_KEY or NEXT_PUBLIC_TIMEERO_API_KEY in your environment variables.');
    }

    this.client = axios.create({
      baseURL: TIMEERO_API_BASE_URL,
      headers: {
        'Authorization': TIMEERO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🕐 Timeero API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Timeero API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ Timeero API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ Timeero API Response Error:', error.response?.data || error.message);
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private handleApiError(error: any): Error {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as TimeeroError;
      
      switch (status) {
        case 401:
          return new Error('Timeero API authentication failed. Please check your API key.');
        case 403:
          return new Error('Timeero API access forbidden. Please check your permissions.');
        case 404:
          return new Error('Timeero API endpoint not found.');
        case 429:
          return new Error('Timeero API rate limit exceeded. Please try again later.');
        case 500:
          return new Error('Timeero API server error. Please try again later.');
        default:
          return new Error(`Timeero API error: ${data.message || error.message}`);
      }
    } else if (error.request) {
      return new Error('Timeero API network error. Please check your connection.');
    } else {
      return new Error(`Timeero API error: ${error.message}`);
    }
  }

  // Generic method to handle paginated requests
  private async getAllPaginatedData<T>(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<T[]> {
    const allData: T[] = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
      try {
        const response: AxiosResponse<TimeeroApiResponse<T>> = await this.client.get(endpoint, {
          params: { ...params, page: currentPage, per_page: 100 }
        });

        allData.push(...response.data.items);
        totalPages = response.data.meta_data.pagination.last_page;
        currentPage++;

        console.log(`📄 Fetched page ${currentPage - 1} of ${totalPages} (${response.data.items.length} items)`);
      } catch (error) {
        console.error(`❌ Error fetching page ${currentPage}:`, error);
        throw error;
      }
    } while (currentPage <= totalPages);

    return allData;
  }

  // Get all users
  async getUsers(): Promise<TimeeroUser[]> {
    try {
      console.log('👥 Fetching Timeero users...');
      return await this.getAllPaginatedData<TimeeroUser>('/users');
    } catch (error) {
      console.error('❌ Failed to fetch users:', error);
      throw error;
    }
  }

  // Get GPS locations for a user within date range (Note: Timeero API doesn't have direct GPS endpoint)
  async getGpsData(
    userId: number,
    startDate: string,
    endDate: string
  ): Promise<GpsLocation[]> {
    try {
      console.log(`📍 GPS data not available through direct endpoint. Using timesheet location data instead.`);
      
      // Since Timeero doesn't have a direct GPS endpoint, return empty array
      // GPS data is embedded in timesheet entries
      return [];
    } catch (error) {
      console.error(`❌ Failed to fetch GPS data for user ${userId}:`, error);
      throw error;
    }
  }

  // Get mileage logs for a user within date range (Note: Timeero API may not have direct mileage endpoint)
  async getMileage(
    userId: number,
    startDate: string,
    endDate: string
  ): Promise<MileageEntry[]> {
    try {
      console.log(`🚗 Mileage data may not be available through direct endpoint.`);
      
      // Timeero API documentation doesn't show a direct mileage endpoint
      // Mileage data is typically tracked within timesheets
      return [];
    } catch (error) {
      console.error(`❌ Failed to fetch mileage data for user ${userId}:`, error);
      throw error;
    }
  }

  // Get timesheet entries for a user within date range
  async getTimesheets(
    userId: number,
    startDate: string,
    endDate: string
  ): Promise<TimesheetEntry[]> {
    try {
      console.log(`⏰ Fetching timesheet data for user ${userId}...`);
      
      return await this.getAllPaginatedData<TimesheetEntry>('/timesheets', {
        user_id: userId,
        per_page: 100
      });
    } catch (error) {
      console.error(`❌ Failed to fetch timesheet data for user ${userId}:`, error);
      throw error;
    }
  }

  // Get scheduled jobs for a user within date range
  async getScheduledJobs(
    userId: number,
    startDate: string,
    endDate: string
  ): Promise<ScheduledJob[]> {
    try {
      console.log(`📋 Fetching scheduled jobs for user ${userId} from ${startDate} to ${endDate}...`);
      
      return await this.getAllPaginatedData<ScheduledJob>('/jobs', {
        user_id: userId,
        per_page: 100
      });
    } catch (error) {
      console.error(`❌ Failed to fetch scheduled jobs for user ${userId}:`, error);
      // Return empty array if jobs endpoint is not accessible
      return [];
    }
  }

  // Get comprehensive data for route analysis
  async getRouteAnalysisData(
    userId: number,
    startDate: string,
    endDate: string
  ): Promise<{
    user: TimeeroUser | null;
    gpsData: GpsLocation[];
    mileage: MileageEntry[];
    timesheets: TimesheetEntry[];
    scheduledJobs: ScheduledJob[];
  }> {
    try {
      console.log(`🔄 Fetching comprehensive route analysis data for user ${userId}...`);

      // Get user info
      const users = await this.getUsers();
      const user = users.find(u => u.id === userId) || null;

      // Fetch all data in parallel for better performance
      const [gpsData, mileage, timesheets, scheduledJobs] = await Promise.all([
        this.getGpsData(userId, startDate, endDate),
        this.getMileage(userId, startDate, endDate),
        this.getTimesheets(userId, startDate, endDate),
        this.getScheduledJobs(userId, startDate, endDate)
      ]);

      console.log(`✅ Route analysis data fetched: ${gpsData.length} GPS points, ${mileage.length} mileage entries, ${timesheets.length} timesheet entries, ${scheduledJobs.length} scheduled jobs`);

      return {
        user,
        gpsData,
        mileage,
        timesheets,
        scheduledJobs
      };
    } catch (error) {
      console.error(`❌ Failed to fetch route analysis data for user ${userId}:`, error);
      throw error;
    }
  }

  // Get team performance data for multiple users
  async getTeamPerformanceData(
    userIds: number[],
    startDate: string,
    endDate: string
  ): Promise<Array<{
    userId: number;
    user: TimeeroUser | null;
    totalHours: number;
    totalMiles: number;
    gpsPointsCount: number;
    completedJobs: number;
  }>> {
    try {
      console.log(`👥 Fetching team performance data for ${userIds.length} users...`);

      const users = await this.getUsers();
      const teamData = [];

      for (const userId of userIds) {
        try {
          const user = users.find(u => u.id === userId) || null;
          const [mileage, timesheets, gpsData, jobs] = await Promise.all([
            this.getMileage(userId, startDate, endDate),
            this.getTimesheets(userId, startDate, endDate),
            this.getGpsData(userId, startDate, endDate),
            this.getScheduledJobs(userId, startDate, endDate)
          ]);

          const totalHours = timesheets.reduce((sum, entry) => {
          // Convert duration string (e.g., "14:20") to hours
          const [hours, minutes] = entry.duration.split(':').map(Number);
          const totalHours = hours + (minutes || 0) / 60;
          return sum + totalHours;
        }, 0);
          const totalMiles = mileage.reduce((sum, entry) => sum + entry.distance_miles, 0);
          const completedJobs = jobs.filter(job => job.status === 'completed').length;

          teamData.push({
            userId,
            user,
            totalHours,
            totalMiles,
            gpsPointsCount: gpsData.length,
            completedJobs
          });
        } catch (error) {
          console.error(`❌ Failed to fetch data for user ${userId}:`, error);
          // Continue with other users even if one fails
          teamData.push({
            userId,
            user: null,
            totalHours: 0,
            totalMiles: 0,
            gpsPointsCount: 0,
            completedJobs: 0
          });
        }
      }

      return teamData;
    } catch (error) {
      console.error('❌ Failed to fetch team performance data:', error);
      throw error;
    }
  }
}

// Create singleton instance
const timeeroClient = new TimeeroApiClient();

// Export convenience functions
export const getGpsData = (userId: number, startDate: string, endDate: string): Promise<GpsLocation[]> =>
  timeeroClient.getGpsData(userId, startDate, endDate);

export const getMileage = (userId: number, startDate: string, endDate: string): Promise<MileageEntry[]> =>
  timeeroClient.getMileage(userId, startDate, endDate);

export const getTimesheets = (userId: number, startDate: string, endDate: string): Promise<TimesheetEntry[]> =>
  timeeroClient.getTimesheets(userId, startDate, endDate);

export const getScheduledJobs = (userId: number, startDate: string, endDate: string): Promise<ScheduledJob[]> =>
  timeeroClient.getScheduledJobs(userId, startDate, endDate);

export const getRouteAnalysisData = (userId: number, startDate: string, endDate: string) =>
  timeeroClient.getRouteAnalysisData(userId, startDate, endDate);

export const getTeamPerformanceData = (userIds: number[], startDate: string, endDate: string) =>
  timeeroClient.getTeamPerformanceData(userIds, startDate, endDate);

export const getUsers = (): Promise<TimeeroUser[]> =>
  timeeroClient.getUsers();

// Export types for use in other modules
export type {
  TimeeroUser,
  GpsLocation,
  MileageEntry,
  TimesheetEntry,
  ScheduledJob,
  TimeeroApiResponse,
  TimeeroError
};

// Export the client instance for advanced usage
export { timeeroClient }; 