import axios from 'axios';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { google } from 'googleapis';
import prisma from '../prisma';

/**
 * Central service for syncing SaaS data like FreshBooks, Stripe.
 */
export class DataSyncService {
  constructor() {}

  /**
   * Syncs AR/AP from FreshBooks.
   */
  async syncFreshBooks(): Promise<void> {
    try {
      // Validate required environment variables
      const token = process.env.FRESHBOOKS_API_TOKEN;
      if (!token) throw new Error('Missing token');
      
      const accountId = process.env.FRESHBOOKS_ACCOUNT_ID;
      if (!accountId) throw new Error('Missing FRESHBOOKS_ACCOUNT_ID');

      // Make API request to FreshBooks to fetch invoices
      const response = await axios.get(`https://api.freshbooks.com/accounting/account/${accountId}/invoices`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Define schema for validating FreshBooks API response
      const schema = z.object({
        response: z.object({
          result: z.object({
            invoices: z.array(z.object({
              id: z.number(),
              amount: z.number(),
              status: z.number()
            }))
          })
        })
      });

      // Parse and validate the API response data
      const data = schema.parse(response.data);
      const invoices = data.response.result.invoices;

      // Update database with invoice data in a transaction
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        for (const inv of invoices) {
          // Upsert each invoice - create if new, update if exists
          await tx.invoice.upsert({
            where: { freshbooksInvoiceId: inv.id.toString() },
            update: {
              amount: inv.amount,
              status: inv.status.toString()
            },
            create: {
              freshbooksInvoiceId: inv.id.toString(),
              amount: inv.amount,
              status: inv.status.toString(),
              customerId: 1 // placeholder
            }
          });
        }
      });
    } catch (error) {
      // Handle any errors that occur during the sync process
      await this.#handleError(error, 'syncFreshBooks');
    }
  }

  /**
   * Syncs payment data from Stripe.
   */
  async syncStripe(): Promise<void> {
    try {
      // Validate required environment variables
      const secretKey = process.env.STRIPE_SECRET_KEY;
      if (!secretKey) throw new Error('Missing Stripe key');
      
      // Initialize Stripe client with secret key and API version
      const stripe = new Stripe(secretKey, {
        apiVersion: '2025-06-30.basil'
      });
      
      // Fetch recent charges from Stripe API (limit to 10 for efficiency)
      const charges = await stripe.charges.list({ limit: 10 });
      
      // Process each charge and sync to database
      for (const charge of charges.data) {
        // Upsert invoice record - create if new, update if exists
        await prisma.invoice.upsert({
          where: { stripePaymentId: charge.id },
          update: {
            // Convert amount from cents to dollars
            amount: charge.amount / 100,
            status: charge.status
          },
          create: {
            stripePaymentId: charge.id,
            // Convert amount from cents to dollars
            amount: charge.amount / 100,
            status: charge.status,
            customerId: 1 // placeholder
          }
        });
      }
    } catch (error) {
      // Handle any errors that occur during the sync process
      await this.#handleError(error, 'syncStripe');
    }
  }

  /**
   * Syncs clock-in/out data from Timeero for time management.
   */
  async syncTimeero(): Promise<void> {
    try {
      // Validate required environment variables
      const apiKey = process.env.TIMEERO_API_KEY;
      if (!apiKey) throw new Error('Missing Timeero key');
      
      // Make API request to Timeero to fetch timesheet data
      const response = await axios.get('https://api.timeero.app/api/public/timesheets', {
        headers: {
          Authorization: `${apiKey}`
        },
        params: {
          date_range: '2025-01-01,2025-07-16'
        }
      });

      // Define schema for validating Timeero API response
      const schema = z.array(z.object({
        id: z.string(),
        start_time: z.string(),
        end_time: z.string().nullable(),
        total_time: z.number()
      }));

      // Parse and validate the API response data
      const entries = schema.parse(response.data);

      // Update database with time entry data in a transaction
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        for (const entry of entries) {
          // Upsert each time entry - create if new, update if exists
          await tx.timeEntry.upsert({
            where: { timeeroId: entry.id },
            update: {
              clockIn: new Date(entry.start_time),
              clockOut: entry.end_time ? new Date(entry.end_time) : null,
              duration: entry.total_time
            },
            create: {
              timeeroId: entry.id,
              clockIn: new Date(entry.start_time),
              clockOut: entry.end_time ? new Date(entry.end_time) : null,
              duration: entry.total_time
            }
          });
        }
      });
    } catch (error) {
      // Handle any errors that occur during the sync process
      await this.#handleError(error, 'syncTimeero');
    }
  }

  /**
   * Syncs collaboration data from Google Sheets (G-Suite).
   */
  async syncGoogleSheets(): Promise<void> {
    try {
      // Validate required environment variables
      const credentials = process.env.GOOGLE_SERVICE_KEY_JSON;
      if (!credentials) throw new Error('Missing Google service key');
      
      const spreadsheetId = process.env.GOOGLE_SHEET_ID;
      if (!spreadsheetId) throw new Error('Missing sheet ID');
      
      // Initialize Google Sheets API client with service account authentication
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(credentials),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
      });
      
      const sheets = google.sheets({ version: 'v4', auth });
      
      // Fetch data from Google Sheet (all columns A-Z in Sheet1)
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Sheet1!A1:Z'
      });
      
      // Extract rows data from response (empty array if no data)
      const rows = response.data.values || [];
      
      // Define schema for validating sheet data (array of arrays with any values)
      const schema = z.array(z.array(z.any()));
      const validatedRows = schema.parse(rows);
      
      // Convert validated data to JSON string for storage
      const content = JSON.stringify(validatedRows);
      
      // Update database with sheet data (create if new, update if exists)
      await prisma.report.upsert({
        where: { sheetId: spreadsheetId },
        update: { 
          content,
          updatedAt: new Date()
        },
        create: { 
          sheetId: spreadsheetId,
          content
        }
      });
    } catch (error) {
      // Handle any errors that occur during the sync process
      await this.#handleError(error, 'syncGoogleSheets');
    }
  }

  /**
   * Handles errors during data sync operations with retry logic placeholder.
   * @param error - The error that occurred during the operation
   * @param operation - Name of the operation that failed (for logging context)
   */
  async #handleError(error: unknown, operation: string): Promise<void> {
    console.error(`Error in ${operation}:`, error);
    
    // TODO: Add retry logic later
    const retries = 3; // implement loop
  }
} 