'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, TrendingUp, TrendingDown, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CustomerData {
  monthlyRevenue: number
  [key: string]: any
}

interface BusinessValuationSimulatorProps {
  customerData: CustomerData[]
  parseRevenue?: (revenueStr: string | undefined) => number  // Made optional since we now have numbers
}

export default function BusinessValuationSimulator({ 
  customerData, 
  parseRevenue 
}: BusinessValuationSimulatorProps) {
  const [showDisclaimer, setShowDisclaimer] = useState(true)
  const [valuationMethod, setValuationMethod] = useState<'irr' | 'revenue-multiple' | 'ebitda-multiple'>('revenue-multiple')
  
  // Simulator state
  const [adjustedRevenue, setAdjustedRevenue] = useState(0)
  const [customMargin, setCustomMargin] = useState(20)
  const [customIRR, setCustomIRR] = useState(25)
  const [revenueMultiple, setRevenueMultiple] = useState(4.5)
  const [ebitdaMultiple, setEbitdaMultiple] = useState(8)
  const [ebitdaMargin, setEbitdaMargin] = useState(25) // EBITDA margin typically higher than net margin

  // Calculate base metrics
  const monthlyRevenue = customerData.reduce((sum, c) => sum + (c.monthlyRevenue || 0), 0)
  const annualRevenue = monthlyRevenue * 12
  const estimatedNetIncome = annualRevenue * 0.20 // 20% default margin
  const estimatedEBITDA = annualRevenue * 0.25 // 25% default EBITDA margin
  const defaultIRR = 0.25 // 25% default IRR
  
  // Calculate valuations using different methods
  const irrValuation = estimatedNetIncome / defaultIRR
  const revenueMultipleValuation = annualRevenue * 4.5 // Industry standard 4-5x revenue
  const ebitdaMultipleValuation = estimatedEBITDA * 8 // Industry standard 6-10x EBITDA

  // Get primary valuation based on selected method
  const getPrimaryValuation = () => {
    switch (valuationMethod) {
      case 'irr':
        return irrValuation
      case 'revenue-multiple':
        return revenueMultipleValuation
      case 'ebitda-multiple':
        return ebitdaMultipleValuation
      default:
        return revenueMultipleValuation
    }
  }

  const estimatedValuation = getPrimaryValuation()

  // Initialize adjusted revenue to current revenue
  useEffect(() => {
    setAdjustedRevenue(annualRevenue)
  }, [annualRevenue])

  // Calculate simulator metrics based on method
  const getSimulatorValuation = () => {
    switch (valuationMethod) {
      case 'irr':
        const simulatorNetIncome = adjustedRevenue * (customMargin / 100)
        return simulatorNetIncome / (customIRR / 100)
      case 'revenue-multiple':
        return adjustedRevenue * revenueMultiple
      case 'ebitda-multiple':
        const simulatorEBITDA = adjustedRevenue * (ebitdaMargin / 100)
        return simulatorEBITDA * ebitdaMultiple
      default:
        return adjustedRevenue * revenueMultiple
    }
  }

  const simulatorValuation = getSimulatorValuation()
  const valuationDelta = simulatorValuation - estimatedValuation
  const valuationDeltaPercent = estimatedValuation > 0 ? (valuationDelta / estimatedValuation) * 100 : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercent = (percent: number) => {
    return `${percent.toFixed(1)}%`
  }

  const getMethodDescription = () => {
    switch (valuationMethod) {
      case 'irr':
        return 'Net Income ÷ Target IRR - Traditional DCF approach'
      case 'revenue-multiple':
        return 'Annual Revenue × Multiple - Common for growth companies'
      case 'ebitda-multiple':
        return 'EBITDA × Multiple - Standard for mature waste companies'
      default:
        return ''
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Disclaimer Banner */}
        {showDisclaimer && (
          <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-amber-800">
                    <strong>Industry Valuation Methods:</strong> Waste management companies are typically valued using 4-5x revenue multiples or 6-10x EBITDA multiples. 
                    This simulator uses industry benchmarks from recent M&A transactions in the waste sector.
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowDisclaimer(false)}
                  className="h-6 w-6 p-0 text-amber-600 hover:bg-amber-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="live" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="live" aria-label="Switch to live valuation analysis">Live Valuation</TabsTrigger>
            <TabsTrigger value="simulator" aria-label="Switch to what-if simulation mode">What-If Simulator</TabsTrigger>
          </TabsList>

          {/* Live Valuation Tab */}
          <TabsContent value="live" className="space-y-6">
            {/* Valuation Method Selector */}
            <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-slate-900">Valuation Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={valuationMethod === 'revenue-multiple' ? 'default' : 'outline'}
                        className={`h-auto p-6 flex-col space-y-2 ${
                          valuationMethod === 'revenue-multiple' 
                            ? 'bg-tableau-blue text-white shadow-lg' 
                            : 'hover:bg-slate-50'
                        }`}
                        onClick={() => setValuationMethod('revenue-multiple')}
                      >
                        <div className="text-sm font-semibold">Revenue Multiple</div>
                        <div className="text-xs opacity-75">4.5x Revenue</div>
                        <div className="text-lg font-bold">{formatCurrency(revenueMultipleValuation)}</div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Values the business based on annual revenue. Best for growth-oriented companies or when comparing to similar businesses. Revenue multiples are simple and widely used in M&A.</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={valuationMethod === 'ebitda-multiple' ? 'default' : 'outline'}
                        className={`h-auto p-6 flex-col space-y-2 ${
                          valuationMethod === 'ebitda-multiple' 
                            ? 'bg-tableau-blue text-white shadow-lg' 
                            : 'hover:bg-slate-50'
                        }`}
                        onClick={() => setValuationMethod('ebitda-multiple')}
                      >
                        <div className="text-sm font-semibold">EBITDA Multiple</div>
                        <div className="text-xs opacity-75">8x EBITDA</div>
                        <div className="text-lg font-bold">{formatCurrency(ebitdaMultipleValuation)}</div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Values based on cash flow (EBITDA). Most accurate for mature companies with stable operations. Preferred by financial buyers and lenders as it reflects actual cash generation ability.</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={valuationMethod === 'irr' ? 'default' : 'outline'}
                        className={`h-auto p-6 flex-col space-y-2 ${
                          valuationMethod === 'irr' 
                            ? 'bg-tableau-blue text-white shadow-lg' 
                            : 'hover:bg-slate-50'
                        }`}
                        onClick={() => setValuationMethod('irr')}
                      >
                        <div className="text-sm font-semibold">IRR Method</div>
                        <div className="text-xs opacity-75">25% Target IRR</div>
                        <div className="text-lg font-bold">{formatCurrency(irrValuation)}</div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Discounted Cash Flow approach using target return rate. Most conservative method, preferred by investors for long-term value assessment and financial planning.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-center text-sm text-slate-600 italic">
                  {getMethodDescription()}
                </div>
              </CardContent>
            </Card>

            {/* Primary Valuation Display */}
            <Card className="text-center p-6">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Current Estimated Business Valuation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-5xl font-bold text-green-600 cursor-help">
                      {formatCurrency(estimatedValuation)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">This valuation is calculated using the {valuationMethod.replace('-', ' ')} method. It represents what a buyer might reasonably pay for your waste management business based on current industry standards and financial performance.</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-sm text-slate-600 cursor-help">
                      Range: {formatCurrency(Math.min(irrValuation, revenueMultipleValuation, ebitdaMultipleValuation))} - {formatCurrency(Math.max(irrValuation, revenueMultipleValuation, ebitdaMultipleValuation))}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">The valuation range shows the minimum and maximum estimates across all three valuation methods. This gives you a realistic bracket for potential business value in different scenarios.</p>
                  </TooltipContent>
                </Tooltip>
              </CardContent>
            </Card>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="cursor-help hover:bg-slate-50 transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">Monthly Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-slate-900">{formatCurrency(monthlyRevenue)}</div>
                      <p className="text-xs text-slate-500 mt-1">Current total monthly revenue from all customers</p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Total monthly revenue from all active customers based on current service contracts. This includes both HOA communities and individual subscriptions.</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="cursor-help hover:bg-slate-50 transition-colors">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">Annualized Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-slate-900">{formatCurrency(annualRevenue)}</div>
                      <p className="text-xs text-slate-500 mt-1">Monthly revenue × 12 months</p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Projected annual revenue assuming current monthly revenue stays consistent throughout the year. Calculated as Monthly Revenue × 12 months.</p>
                </TooltipContent>
              </Tooltip>

              {valuationMethod === 'irr' && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card className="cursor-help hover:bg-slate-50 transition-colors">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-slate-600">Estimated Net Income</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-slate-900">{formatCurrency(estimatedNetIncome)}</div>
                          <p className="text-xs text-slate-500 mt-1">Annual revenue × 20% (industry standard margin)</p>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Estimated net profit after all operating expenses, taxes, and costs. Uses industry-standard 20% profit margin for waste management companies. This is conservative - well-run operations can achieve 25-30%.</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card className="cursor-help hover:bg-slate-50 transition-colors">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-slate-600">Target IRR</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-slate-900">{formatPercent(defaultIRR * 100)}</div>
                          <p className="text-xs text-slate-500 mt-1">Internal Rate of Return - industry standard for waste management</p>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Internal Rate of Return - the annual return rate investors typically require for waste management investments. 25% reflects the operational complexity and growth potential of the industry.</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}

              {valuationMethod === 'revenue-multiple' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="cursor-help hover:bg-slate-50 transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Revenue Multiple</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-slate-900">4.5x</div>
                        <p className="text-xs text-slate-500 mt-1">Industry standard: 4-5x revenue for waste companies</p>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Revenue multiples are used to value companies based on their sales. For waste management companies, 4-5x revenue is typical. Higher multiples (5-6x) are for growth companies, lower (3-4x) for mature operations.</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {valuationMethod === 'ebitda-multiple' && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card className="cursor-help hover:bg-slate-50 transition-colors">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-slate-600">Estimated EBITDA</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-slate-900">{formatCurrency(estimatedEBITDA)}</div>
                          <p className="text-xs text-slate-500 mt-1">Annual revenue × 25% (typical EBITDA margin)</p>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">EBITDA (Earnings Before Interest, Taxes, Depreciation, and Amortization) represents cash flow from operations. 25% margin is typical for waste companies - this excludes equipment depreciation and financing costs.</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Card className="cursor-help hover:bg-slate-50 transition-colors">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-slate-600">EBITDA Multiple</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-slate-900">8.0x</div>
                          <p className="text-xs text-slate-500 mt-1">Industry standard: 6-10x EBITDA for waste companies</p>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">EBITDA multiples reflect how many times annual cash flow buyers will pay. 6-8x is typical for stable waste companies, 8-10x for high-growth operations. This accounts for recurring revenue and asset intensity.</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>

            {/* Comparison Table */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="text-lg">Valuation Method Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-4 text-sm font-medium text-slate-600 pb-2 border-b">
                    <div>Method</div>
                    <div>Calculation</div>
                    <div>Valuation</div>
                    <div>Use Case</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm py-2">
                    <div>Revenue Multiple</div>
                    <div className="font-mono">{formatCurrency(annualRevenue)} × 4.5x</div>
                    <div className="font-bold text-green-600">{formatCurrency(revenueMultipleValuation)}</div>
                    <div className="text-slate-600">Growth companies, SaaS-like models</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm py-2">
                    <div>EBITDA Multiple</div>
                    <div className="font-mono">{formatCurrency(estimatedEBITDA)} × 8.0x</div>
                    <div className="font-bold text-green-600">{formatCurrency(ebitdaMultipleValuation)}</div>
                    <div className="text-slate-600">Mature waste companies, stable cash flow</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm py-2">
                    <div>IRR Method</div>
                    <div className="font-mono">{formatCurrency(estimatedNetIncome)} ÷ 25%</div>
                    <div className="font-bold text-green-600">{formatCurrency(irrValuation)}</div>
                    <div className="text-slate-600">Investment analysis, DCF approach</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Simulator Tab */}
          <TabsContent value="simulator" className="space-y-6">
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="text-xl">Scenario Planning Tool</CardTitle>
                <CardDescription>
                  Adjust inputs to see how changes affect business valuation using {valuationMethod.replace('-', ' ')} method
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Simulator Inputs */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Valuation Method</label>
                      <Select value={valuationMethod} onValueChange={(value: any) => setValuationMethod(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="revenue-multiple">Revenue Multiple (4-5x)</SelectItem>
                          <SelectItem value="ebitda-multiple">EBITDA Multiple (6-10x)</SelectItem>
                          <SelectItem value="irr">IRR Method (DCF)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Adjusted Annual Revenue</label>
                      <Input
                        type="number"
                        value={Math.round(adjustedRevenue)}
                        onChange={(e) => setAdjustedRevenue(Number(e.target.value))}
                        className="mb-2"
                      />
                      <Slider
                        value={[adjustedRevenue]}
                        onValueChange={(value) => setAdjustedRevenue(value[0])}
                        max={annualRevenue * 3}
                        min={annualRevenue * 0.5}
                        step={10000}
                        className="w-full"
                      />
                    </div>

                    {valuationMethod === 'revenue-multiple' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Revenue Multiple</label>
                        <Input
                          type="number"
                          value={revenueMultiple}
                          onChange={(e) => setRevenueMultiple(Number(e.target.value))}
                          min="2"
                          max="8"
                          step="0.1"
                          className="mb-2"
                        />
                        <Slider
                          value={[revenueMultiple]}
                          onValueChange={(value) => setRevenueMultiple(value[0])}
                          max={6}
                          min={3}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>3x</span>
                          <span>4.5x (Industry Avg)</span>
                          <span>6x</span>
                        </div>
                      </div>
                    )}

                    {valuationMethod === 'ebitda-multiple' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">EBITDA Margin (%)</label>
                          <Input
                            type="number"
                            value={ebitdaMargin}
                            onChange={(e) => setEbitdaMargin(Number(e.target.value))}
                            min="10"
                            max="40"
                            className="mb-2"
                          />
                          <Slider
                            value={[ebitdaMargin]}
                            onValueChange={(value) => setEbitdaMargin(value[0])}
                            max={35}
                            min={15}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">EBITDA Multiple</label>
                          <Input
                            type="number"
                            value={ebitdaMultiple}
                            onChange={(e) => setEbitdaMultiple(Number(e.target.value))}
                            min="4"
                            max="12"
                            step="0.1"
                            className="mb-2"
                          />
                          <Slider
                            value={[ebitdaMultiple]}
                            onValueChange={(value) => setEbitdaMultiple(value[0])}
                            max={10}
                            min={6}
                            step={0.1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>6x</span>
                            <span>8x (Industry Avg)</span>
                            <span>10x</span>
                          </div>
                        </div>
                      </>
                    )}

                    {valuationMethod === 'irr' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Profit Margin (%)</label>
                          <Input
                            type="number"
                            value={customMargin}
                            onChange={(e) => setCustomMargin(Number(e.target.value))}
                            min="0"
                            max="50"
                            className="mb-2"
                          />
                          <Slider
                            value={[customMargin]}
                            onValueChange={(value) => setCustomMargin(value[0])}
                            max={40}
                            min={5}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Target IRR (%)</label>
                          <Input
                            type="number"
                            value={customIRR}
                            onChange={(e) => setCustomIRR(Number(e.target.value))}
                            min="10"
                            max="50"
                            className="mb-2"
                          />
                          <Slider
                            value={[customIRR]}
                            onValueChange={(value) => setCustomIRR(value[0])}
                            max={35}
                            min={15}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Simulator Results */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Scenario Results</h3>
                      <Badge variant="secondary">{valuationMethod.replace('-', ' ').toUpperCase()}</Badge>
                    </div>
                    
                    <Card className="p-4">
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-sm text-slate-600">Current Valuation</div>
                          <div className="text-2xl font-bold text-slate-900">{formatCurrency(estimatedValuation)}</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm text-slate-600">Scenario Valuation</div>
                          <div className="text-2xl font-bold text-green-600">{formatCurrency(simulatorValuation)}</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm text-slate-600">Change</div>
                          <div className={`text-lg font-semibold flex items-center justify-center gap-1 ${
                            valuationDelta >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {valuationDelta >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            {formatCurrency(Math.abs(valuationDelta))} ({formatPercent(Math.abs(valuationDeltaPercent))})
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Visual Comparison */}
                    <Card className="p-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Visual Comparison</h4>
                        <div className="flex justify-between text-xs text-slate-600">
                          <span>Current</span>
                          <span>Scenario</span>
                        </div>
                        <div className="flex gap-2 h-8">
                          <div className="flex-1 bg-blue-500 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-medium">Current</span>
                          </div>
                          <div 
                            className={`flex-1 rounded flex items-center justify-center ${
                              valuationDelta >= 0 ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            style={{ 
                              flexGrow: Math.max(0.2, simulatorValuation / Math.max(estimatedValuation, simulatorValuation))
                            }}
                          >
                            <span className="text-white text-xs font-medium">Scenario</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  )
} 