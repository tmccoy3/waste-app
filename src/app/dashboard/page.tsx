'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">WasteOps Intelligence</h1>
          <p className="text-slate-600">Modern Dashboard with Shadcn/UI</p>
        </div>
        <Button>
          Test Button
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Revenue</CardTitle>
            <CardDescription>Total revenue this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$35,747</div>
            <Badge variant="default" className="mt-2">Revenue</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Route Efficiency</CardTitle>
            <CardDescription>Efficiency percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <Badge variant="secondary" className="mt-2">Efficiency</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Drivers</CardTitle>
            <CardDescription>Currently on routes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <Badge variant="outline" className="mt-2">Active</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avg Stop Time</CardTitle>
            <CardDescription>Average time per customer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.5m</div>
            <Badge variant="destructive" className="mt-2">Performance</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Integration health across all platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-medium text-sm">FB</span>
                </div>
                <div>
                  <p className="text-sm font-medium">FreshBooks</p>
                  <p className="text-xs text-muted-foreground">Financial data sync</p>
                </div>
              </div>
              <Badge variant="default">Connected</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">GS</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Google Sheets</p>
                  <p className="text-xs text-muted-foreground">Customer data import</p>
                </div>
              </div>
              <Badge variant="secondary">Pending</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center py-12 bg-slate-50 rounded-lg">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          🎉 Shadcn/UI Integration Complete!
        </h2>
        <p className="text-slate-600">
          Dashboard successfully refactored from Carbon Design System to Shadcn/UI
        </p>
      </div>
    </div>
  )
} 