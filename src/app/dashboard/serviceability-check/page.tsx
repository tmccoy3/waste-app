'use client'

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Search, MapPin, BarChart3, TrendingUp, DollarSign } from 'lucide-react'

export default function ServiceabilityCheckPage() {
  return (
    <div className="space-y-6">
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Serviceability Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Serviceability check functionality under development
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span className="text-sm">Location Analysis</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <span className="text-sm">Route Analytics</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <span className="text-sm">Cost Estimation</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 