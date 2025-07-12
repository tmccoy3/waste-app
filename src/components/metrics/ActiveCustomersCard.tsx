'use client'

import { Users } from 'lucide-react'
import { CustomerData } from '../../app/api/customers/route'
import { useKPIMetrics } from '../../hooks/useMetrics'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

export interface ActiveCustomersCardProps {
  customers: CustomerData[]
}

export default function ActiveCustomersCard({ customers }: ActiveCustomersCardProps) {
  const { data: metrics } = useKPIMetrics(customers)

  return (
    <Card className="dashboard-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{metrics?.totalCustomers || 0}</div>
        <p className="text-xs text-muted-foreground">
          Total active service locations
        </p>
      </CardContent>
    </Card>
  )
} 