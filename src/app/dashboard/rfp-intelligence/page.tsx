'use client'

import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { FileText, Upload, Copy, Bot, Search, BarChart3, Map, FileBarChart } from 'lucide-react'

export default function RFPIntelligencePage() {
  return (
    <div className="space-y-6">
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            RFP Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                RFP intelligence functionality under development
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Upload className="h-5 w-5 text-blue-600" />
                <span className="text-sm">Document Upload</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <Bot className="h-5 w-5 text-green-600" />
                <span className="text-sm">AI Analysis</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                <Search className="h-5 w-5 text-purple-600" />
                <span className="text-sm">Intelligence</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                <FileBarChart className="h-5 w-5 text-orange-600" />
                <span className="text-sm">Reports</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
