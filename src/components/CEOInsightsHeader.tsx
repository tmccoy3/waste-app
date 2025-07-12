'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { ArrowLeft, RotateCcw, BarChart3, Map, Search, FileText } from 'lucide-react'

interface CEOInsightsHeaderProps {
  onBack?: () => void
  onRefresh?: () => void
  breadcrumbs?: Array<{
    label: string
    href?: string
  }>
}

export default function CEOInsightsHeader({ 
  onBack, 
  onRefresh, 
  breadcrumbs = []
}: CEOInsightsHeaderProps) {
  return (
    <Card className="dashboard-card mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <CardTitle className="text-xl">CEO Insights Dashboard</CardTitle>
              {breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-2 mt-2">
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <span className="text-muted-foreground">/</span>}
                      <span className="text-sm text-muted-foreground">{crumb.label}</span>
                    </React.Fragment>
                  ))}
                </nav>
              )}
            </div>
          </div>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <span className="text-sm">Analytics</span>
          </div>
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5 text-green-600" />
            <span className="text-sm">Territory Map</span>
          </div>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-purple-600" />
            <span className="text-sm">Intelligence</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-600" />
            <span className="text-sm">Reports</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 