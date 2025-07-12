'use client'

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import CEOInsightsHeader from '../../../components/CEOInsightsHeader'

export default function CEOInsightsPage() {
  return (
    <div className="space-y-6">
      <CEOInsightsHeader 
        breadcrumbs={[
          { label: 'Dashboard' },
          { label: 'CEO Insights' }
        ]}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                CEO insights dashboard under development
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Key Performance Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                KPI metrics will be displayed here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 