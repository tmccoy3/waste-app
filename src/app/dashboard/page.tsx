import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import prisma from '../../lib/prisma';
import ExecutiveCustomerDashboard from '@/components/ExecutiveCustomerDashboard';

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
      {/* Executive Customer Dashboard with Google Chat and Profitability Indicators */}
      <ExecutiveCustomerDashboard 
        customers={customersForDashboard}
        lastUpdated={new Date().toISOString()}
      />
    </div>
  );
} 