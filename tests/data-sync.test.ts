import { DataSyncService } from '../src/lib/services/data-sync';
import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

// Mock axios for API call isolation
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock Prisma client for database isolation
const mockPrisma = mockDeep<PrismaClient>();

describe('DataSyncService', () => {
  let service: DataSyncService;

  beforeEach(() => {
    // Initialize service with mocked dependencies
    service = new DataSyncService();
    (service as any).prisma = mockPrisma;
    
    // Reset all mocks between tests
    jest.clearAllMocks();
  });

  describe('syncFreshBooks', () => {
    beforeEach(() => {
      // Mock environment variables for FreshBooks
      process.env.FRESHBOOKS_API_TOKEN = 'test-token';
      process.env.FRESHBOOKS_ACCOUNT_ID = 'test-account';
    });

    afterEach(() => {
      // Clean up environment variables
      delete process.env.FRESHBOOKS_API_TOKEN;
      delete process.env.FRESHBOOKS_ACCOUNT_ID;
    });

    it('syncFreshBooks succeeds with valid data', async () => {
      // Mock API and Prisma for isolation
      const mockResponse = {
        data: {
          response: {
            result: {
              invoices: [
                { id: 1, amount: 100, status: 1 }
              ]
            }
          }
        }
      };
      
      mockedAxios.get.mockResolvedValue(mockResponse);
      mockPrisma.$transaction.mockImplementation((callback: any) => 
        callback(mockPrisma as any)
      );

      // Test successful sync
      await service.syncFreshBooks();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.freshbooks.com/accounting/account/test-account/invoices',
        {
          headers: {
            Authorization: 'Bearer test-token'
          }
        }
      );
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.invoice.upsert).toHaveBeenCalledWith({
        where: { freshbooksInvoiceId: '1' },
        update: {
          amount: 100,
          status: '1'
        },
        create: {
          freshbooksInvoiceId: '1',
          amount: 100,
          status: '1',
          customerId: 1
        }
      });
    });

    it('syncFreshBooks handles errors', async () => {
      // Mock API failure
      mockedAxios.get.mockRejectedValue(new Error('API fail'));

      // Test error path
      await expect(service.syncFreshBooks()).resolves.not.toThrow();
      
      expect(mockedAxios.get).toHaveBeenCalled();
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('syncFreshBooks handles missing token', async () => {
      // Remove token to test validation
      delete process.env.FRESHBOOKS_API_TOKEN;

      await expect(service.syncFreshBooks()).resolves.not.toThrow();
      
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('syncFreshBooks handles missing account ID', async () => {
      // Remove account ID to test validation
      delete process.env.FRESHBOOKS_ACCOUNT_ID;

      await expect(service.syncFreshBooks()).resolves.not.toThrow();
      
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });
  });

  describe('syncStripe', () => {
    beforeEach(() => {
      // Mock environment variables for Stripe
      process.env.STRIPE_SECRET_KEY = 'test-stripe-key';
    });

    afterEach(() => {
      // Clean up environment variables
      delete process.env.STRIPE_SECRET_KEY;
    });

    it('syncStripe succeeds with valid data', async () => {
      // Mock Stripe charges response
      const mockStripeCharges = {
        data: [
          { id: 'ch_123', amount: 5000, status: 'succeeded' }
        ]
      };

      // Mock Stripe instance
      const mockStripe = {
        charges: {
          list: jest.fn().mockResolvedValue(mockStripeCharges)
        }
      };

      // Mock Stripe constructor
      jest.doMock('stripe', () => {
        return jest.fn().mockImplementation(() => mockStripe);
      });

      // Test successful sync
      await service.syncStripe();

      expect(mockPrisma.invoice.upsert).toHaveBeenCalledWith({
        where: { stripePaymentId: 'ch_123' },
        update: {
          amount: 50,
          status: 'succeeded'
        },
        create: {
          stripePaymentId: 'ch_123',
          amount: 50,
          status: 'succeeded',
          customerId: 1
        }
      });
    });

    it('syncStripe handles missing secret key', async () => {
      // Remove secret key to test validation
      delete process.env.STRIPE_SECRET_KEY;

      await expect(service.syncStripe()).resolves.not.toThrow();
    });
  });

  describe('syncTimeero', () => {
    beforeEach(() => {
      // Mock environment variables for Timeero
      process.env.TIMEERO_API_KEY = 'test-timeero-key';
    });

    afterEach(() => {
      // Clean up environment variables
      delete process.env.TIMEERO_API_KEY;
    });

    it('syncTimeero succeeds with valid data', async () => {
      // Mock API response
      const mockResponse = {
        data: [
          {
            id: 'time_123',
            start_time: '2025-01-01T10:00:00Z',
            end_time: '2025-01-01T18:00:00Z',
            total_time: 480
          }
        ]
      };

      mockedAxios.get.mockResolvedValue(mockResponse);
      mockPrisma.$transaction.mockImplementation((callback: any) => 
        callback(mockPrisma as any)
      );

      // Test successful sync
      await service.syncTimeero();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.timeero.app/api/public/timesheets',
        {
          headers: {
            Authorization: 'test-timeero-key'
          },
          params: {
            date_range: '2025-01-01,2025-07-16'
          }
        }
      );
      expect(mockPrisma.timeEntry.upsert).toHaveBeenCalledWith({
        where: { timeeroId: 'time_123' },
        update: {
          clockIn: new Date('2025-01-01T10:00:00Z'),
          clockOut: new Date('2025-01-01T18:00:00Z'),
          duration: 480
        },
        create: {
          timeeroId: 'time_123',
          clockIn: new Date('2025-01-01T10:00:00Z'),
          clockOut: new Date('2025-01-01T18:00:00Z'),
          duration: 480
        }
      });
    });

    it('syncTimeero handles missing API key', async () => {
      // Remove API key to test validation
      delete process.env.TIMEERO_API_KEY;

      await expect(service.syncTimeero()).resolves.not.toThrow();
      
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });
  });

  describe('syncGoogleSheets', () => {
    beforeEach(() => {
      // Mock environment variables for Google Sheets
      process.env.GOOGLE_SERVICE_KEY_JSON = JSON.stringify({ type: 'service_account' });
      process.env.GOOGLE_SHEET_ID = 'test-sheet-id';
    });

    afterEach(() => {
      // Clean up environment variables
      delete process.env.GOOGLE_SERVICE_KEY_JSON;
      delete process.env.GOOGLE_SHEET_ID;
    });

    it('syncGoogleSheets handles missing credentials', async () => {
      // Remove credentials to test validation
      delete process.env.GOOGLE_SERVICE_KEY_JSON;

      await expect(service.syncGoogleSheets()).resolves.not.toThrow();
    });

    it('syncGoogleSheets handles missing sheet ID', async () => {
      // Remove sheet ID to test validation
      delete process.env.GOOGLE_SHEET_ID;

      await expect(service.syncGoogleSheets()).resolves.not.toThrow();
    });
  });
}); 