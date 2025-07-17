import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import ProfitTiersPieChart from '../../../components/charts/ProfitTiersPieChart'
import BusinessValuationSimulator from '../../../components/BusinessValuationSimulator'
import CEOInsightsHeader from '../../../components/CEOInsightsHeader'
import prisma from '../../../lib/prisma'

export default async function CEOInsightsPage() {
  // Fetch all customers
  const customers = await prisma.customer.findMany()
  
  // Calculate profits and tiers
  const profits = customers.map(c => ({
    name: c.hoaName,
    revenue: Number(c.monthlyRevenue),
    tier: Number(c.monthlyRevenue) > 3000 ? 'High' : Number(c.monthlyRevenue) > 2000 ? 'Medium' : 'Low'
  }))
  
  // Calculate tier data for pie chart
  const tierData = [
    { 
      name: 'High', 
      value: profits.filter(p => p.tier === 'High').length, 
      fill: '#22c55e' 
    },
    { 
      name: 'Medium', 
      value: profits.filter(p => p.tier === 'Medium').length, 
      fill: '#eab308' 
    },
    { 
      name: 'Low', 
      value: profits.filter(p => p.tier === 'Low').length, 
      fill: '#ef4444' 
    }
  ].filter(tier => tier.value > 0)

  // Transform customers for BusinessValuationSimulator
  const customerData = customers.map(c => ({
    monthlyRevenue: Number(c.monthlyRevenue),
    hoaName: c.hoaName,
    id: c.id,
    fullAddress: c.fullAddress,
    avgCompletionTime: Number(c.avgCompletionTime),
    serviceStatus: c.serviceStatus,
    latitude: Number(c.latitude),
    longitude: Number(c.longitude),
    city: c.city,
    state: c.state,
    zipCode: c.zipCode
  }))

  return (
    <div className="space-y-6">
      <CEOInsightsHeader 
        breadcrumbs={[
          { label: 'Dashboard' },
          { label: 'CEO Insights' }
        ]}
      />
      
      {/* Business Valuation Simulator - Primary Feature */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="text-2xl">Business Valuation Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <BusinessValuationSimulator 
            customerData={customerData}
          />
        </CardContent>
      </Card>
      
      {/* Profit Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Profit Tiers Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfitTiersPieChart data={tierData} />
          </CardContent>
        </Card>
        
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Customer Profitability Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Monthly Revenue</TableHead>
                  <TableHead>Profit Tier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profits.map(p => (
                  <TableRow key={p.name}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>${p.revenue.toLocaleString()}</TableCell>
                    <TableCell className={
                      p.tier === 'High' ? 'text-green-600 font-semibold' : 
                      p.tier === 'Medium' ? 'text-yellow-600 font-semibold' : 
                      'text-red-600 font-semibold'
                    }>
                      {p.tier}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 