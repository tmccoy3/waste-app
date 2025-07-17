import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import prisma from '../../lib/prisma';
import ExecutiveCustomerDashboard from '@/components/ExecutiveCustomerDashboard';
import RefreshIntegrationsButton from '@/components/RefreshIntegrationsButton';

export default async function DashboardPage() {
  // Preserve all existing database queries
  const customerMetrics = await prisma.customer.aggregate({
    _avg: { 
      avgCompletionTime: true,
      monthlyRevenue: true 
    },
    _count: { id: true }
  });

  const allCustomers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      hoaName: true,
      fullAddress: true,
      monthlyRevenue: true,
      avgCompletionTime: true,
      serviceStatus: true,
      createdAt: true,
      latitude: true,
      longitude: true,
      city: true,
      state: true,
      zipCode: true,
      customerType: true
    }
  });

  // Transform data for ExecutiveCustomerDashboard
  const customersForDashboard = allCustomers.map(customer => ({
    id: customer.id,
    name: customer.hoaName || 'Unknown',
    communityName: customer.hoaName || 'Unknown',
    address: customer.fullAddress || '',
    latitude: customer.latitude || 38.9,
    longitude: customer.longitude || -77.3,
    type: customer.customerType === 'SUBSCRIPTION' ? 'Subscription' as const : 'HOA' as const,
    timeOnSite: customer.avgCompletionTime || 0,
    units: 100,
    monthlyRevenue: Number(customer.monthlyRevenue) || 0,
    completionTime: customer.avgCompletionTime || 0,
  }));

  return (
    <div className="space-y-6">
      {/* SaaS Integrations Refresh Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Data Synchronization</h2>
            <p className="text-sm text-gray-600">Refresh all SaaS integrations for high-level data updates</p>
          </div>
          <RefreshIntegrationsButton />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-900">Timeero</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">Employee time tracking</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-900">FreshBooks</span>
            </div>
            <p className="text-xs text-green-600 mt-1">AR/AP and invoicing</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm font-medium text-purple-900">Stripe</span>
            </div>
            <p className="text-xs text-purple-600 mt-1">Payment processing</p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm font-medium text-orange-900">Google Sheets</span>
            </div>
            <p className="text-xs text-orange-600 mt-1">Collaboration data</p>
          </div>
        </div>
      </div>

      {/* Executive Customer Dashboard with Google Chat and Profitability Indicators */}
      <ExecutiveCustomerDashboard 
        customers={customersForDashboard}
        lastUpdated={new Date().toISOString()}
      />
    </div>
  );
} 