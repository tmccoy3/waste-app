'use client'

import { Clock } from 'lucide-react'
import { CustomerData } from '../../app/api/customers/route'
import { useKPIMetrics, formatNumber } from '../../hooks/useMetrics'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

export interface CompletionTimeCardProps {
  customers: CustomerData[]
}

export default function CompletionTimeCard({ customers }: CompletionTimeCardProps) {
  const { data: metrics } = useKPIMetrics(customers)

  return (
    <Card className="dashboard-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Average Completion Time</CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatNumber(metrics?.avgCompletionTime || 0)} min</div>
        <p className="text-xs text-muted-foreground">
          Average service completion time
        </p>
      </CardContent>
    </Card>
  )
} 