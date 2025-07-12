'use client'

import { DollarSign } from 'lucide-react'
import { CustomerData } from '../../app/api/customers/route'
import { useKPIMetrics, formatCurrency } from '../../hooks/useMetrics'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

export interface TotalRevenueCardProps {
  customers: CustomerData[]
}

export default function TotalRevenueCard({ customers }: TotalRevenueCardProps) {
  const { data: metrics } = useKPIMetrics(customers)

  return (
    <Card className="dashboard-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatCurrency(metrics?.totalRevenue || 0)}</div>
        <p className="text-xs text-muted-foreground">
          Monthly recurring revenue
        </p>
      </CardContent>
    </Card>
  )
} 