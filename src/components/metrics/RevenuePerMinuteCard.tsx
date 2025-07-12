'use client'

import { DollarSign, TrendingUp } from 'lucide-react'
import { CustomerData } from '../../app/api/customers/route'
import { useRevenuePerMinute, formatCurrency } from '../../hooks/useMetrics'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

export interface RevenuePerMinuteCardProps {
  customers: CustomerData[]
}

export default function RevenuePerMinuteCard({ customers }: RevenuePerMinuteCardProps) {
  const { data: revenuePerMinute } = useRevenuePerMinute(customers)

  return (
    <Card className="dashboard-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Revenue Per Minute</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatCurrency(revenuePerMinute || 0)}</div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-green-600" />
          Efficiency metric
        </p>
      </CardContent>
    </Card>
  )
} 