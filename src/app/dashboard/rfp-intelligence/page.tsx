'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Badge } from '../../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { 
  FileText, 
  Upload, 
  Bot, 
  Search, 
  FileBarChart,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Truck,
  MapPin,
  BarChart3
} from 'lucide-react'

interface RFPAnalysisResult {
  success: boolean;
  data: {
    proximityScore: 'close' | 'moderate' | 'far';
    suggestedPricePerHome: number;
    estimatedCostPerMonth: number;
    projectedGrossMargin: number;
    efficiencyPerMinute: number;
    strategicFitScore: 'low' | 'medium' | 'high';
    riskFlags: string[];
    recommendation: 'bid' | 'bid-with-conditions' | 'do-not-bid';
    calculations: {
      distanceFromDepot: number;
      distanceFromLandfill: number;
      estimatedTimePerVisit: number;
      fuelCostPerMonth: number;
      laborCostPerMonth: number;
      equipmentCostPerMonth: number;
      dumpingFees: number;
    };
    competitiveAnalysis: {
      marketRate: number;
      ourAdvantage: string[];
      risks: string[];
    };
  };
}

export default function RFPIntelligencePage() {
  const [rfpText, setRfpText] = useState('')
  const [analysisResult, setAnalysisResult] = useState<RFPAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setRfpText(content)
      }
      reader.readAsText(file)
    }
  }

  const analyzeRFP = async () => {
    if (!rfpText.trim()) {
      setError('Please enter RFP text or upload a file')
      return
    }

    setIsAnalyzing(true)
    setError('')

    try {
      const response = await fetch('/api/rfp-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rfpText }),
      })

      const result = await response.json()
      
      if (result.success) {
        setAnalysisResult(result)
      } else {
        setError(result.error || 'Analysis failed')
      }
    } catch (err) {
      setError('Network error during analysis')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'bid':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'bid-with-conditions':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'do-not-bid':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'bid':
        return <CheckCircle className="h-5 w-5" />
      case 'bid-with-conditions':
        return <AlertCircle className="h-5 w-5" />
      case 'do-not-bid':
        return <XCircle className="h-5 w-5" />
      default:
        return <Clock className="h-5 w-5" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercent = (percent: number) => {
    return `${(percent * 100).toFixed(1)}%`
  }

  return (
    <div className="space-y-6">
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            RFP Intelligence & Analysis Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* RFP Input Section */}
          <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload RFP Document
                </Button>
                <span className="text-sm text-gray-500">or paste RFP text below</span>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <textarea
                value={rfpText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRfpText(e.target.value)}
                placeholder="Paste RFP text here... Include details about community name, number of homes, service requirements, pickup frequency, location, special requirements, etc."
                className="min-h-[200px] w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <div className="flex items-center gap-4">
                <Button 
                  onClick={analyzeRFP}
                  disabled={isAnalyzing || !rfpText.trim()}
                  className="flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Bot className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4" />
                      Analyze RFP
                    </>
                  )}
                </Button>
                
                {rfpText && (
                  <Button 
                    onClick={() => setRfpText('')}
                    variant="outline"
                    size="sm"
                  >
                    Clear
                  </Button>
                )}
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>

            {/* Analysis Results */}
            {analysisResult && (
              <div className="space-y-6">
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>
                  
                  {/* Primary Recommendation */}
                  <Card className="mb-6">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Badge 
                          className={`text-lg px-4 py-2 ${getRecommendationColor(analysisResult.data.recommendation)}`}
                        >
                          {getRecommendationIcon(analysisResult.data.recommendation)}
                          {analysisResult.data.recommendation.replace('-', ' ').toUpperCase()}
                        </Badge>
                        <div className="text-2xl font-bold">
                          {formatCurrency(analysisResult.data.suggestedPricePerHome)} per home
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Gross Margin</div>
                          <div className={`text-xl font-semibold ${
                            analysisResult.data.projectedGrossMargin > 0.2 ? 'text-green-600' : 
                            analysisResult.data.projectedGrossMargin > 0.1 ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {formatPercent(analysisResult.data.projectedGrossMargin)}
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Strategic Fit</div>
                          <div className={`text-xl font-semibold ${
                            analysisResult.data.strategicFitScore === 'high' ? 'text-green-600' : 
                            analysisResult.data.strategicFitScore === 'medium' ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {analysisResult.data.strategicFitScore.toUpperCase()}
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Proximity</div>
                          <div className={`text-xl font-semibold ${
                            analysisResult.data.proximityScore === 'close' ? 'text-green-600' : 
                            analysisResult.data.proximityScore === 'moderate' ? 'text-yellow-600' : 
                            'text-red-600'
                          }`}>
                            {analysisResult.data.proximityScore.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Detailed Analysis Tabs */}
                  <Tabs defaultValue="financial" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="financial">Financial</TabsTrigger>
                      <TabsTrigger value="operational">Operational</TabsTrigger>
                      <TabsTrigger value="competitive">Competitive</TabsTrigger>
                      <TabsTrigger value="risks">Risks</TabsTrigger>
                    </TabsList>

                    <TabsContent value="financial" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Financial Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <h4 className="font-semibold">Revenue Projections</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span>Suggested Price per Home:</span>
                                  <span className="font-medium">{formatCurrency(analysisResult.data.suggestedPricePerHome)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Market Rate:</span>
                                  <span className="font-medium">{formatCurrency(analysisResult.data.competitiveAnalysis.marketRate)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Efficiency per Minute:</span>
                                  <span className="font-medium">{formatCurrency(analysisResult.data.efficiencyPerMinute)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <h4 className="font-semibold">Cost Breakdown</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span>Labor Cost:</span>
                                  <span className="font-medium">{formatCurrency(analysisResult.data.calculations.laborCostPerMonth)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Fuel Cost:</span>
                                  <span className="font-medium">{formatCurrency(analysisResult.data.calculations.fuelCostPerMonth)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Equipment Cost:</span>
                                  <span className="font-medium">{formatCurrency(analysisResult.data.calculations.equipmentCostPerMonth)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Dumping Fees:</span>
                                  <span className="font-medium">{formatCurrency(analysisResult.data.calculations.dumpingFees)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2">
                                  <span className="font-semibold">Total Monthly Cost:</span>
                                  <span className="font-semibold">{formatCurrency(analysisResult.data.estimatedCostPerMonth)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="operational" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5" />
                            Operational Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <h4 className="font-semibold">Distance & Time</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span>Distance from Depot:</span>
                                  <span className="font-medium">{analysisResult.data.calculations.distanceFromDepot.toFixed(1)} miles</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Distance from Landfill:</span>
                                  <span className="font-medium">{analysisResult.data.calculations.distanceFromLandfill.toFixed(1)} miles</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Time per Visit:</span>
                                  <span className="font-medium">{analysisResult.data.calculations.estimatedTimePerVisit.toFixed(1)} minutes</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <h4 className="font-semibold">Route Impact</h4>
                              <div className="space-y-2">
                                <Badge className={
                                  analysisResult.data.proximityScore === 'close' ? 'bg-green-100 text-green-800' :
                                  analysisResult.data.proximityScore === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }>
                                  {analysisResult.data.proximityScore.toUpperCase()} Proximity
                                </Badge>
                                <p className="text-sm text-gray-600">
                                  {analysisResult.data.proximityScore === 'close' ? 
                                    'Excellent location - minimal impact on existing routes' :
                                    analysisResult.data.proximityScore === 'moderate' ?
                                    'Good location - manageable route extension' :
                                    'Distant location - significant route impact'
                                  }
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="competitive" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Competitive Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Our Competitive Advantages</h4>
                              <ul className="space-y-1">
                                {analysisResult.data.competitiveAnalysis.ourAdvantage.map((advantage, index) => (
                                  <li key={index} className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-sm">{advantage}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold mb-2">Market Position</h4>
                              <div className="flex items-center gap-4">
                                <div className="text-center">
                                  <div className="text-sm text-gray-600">Our Price</div>
                                  <div className="text-lg font-semibold">{formatCurrency(analysisResult.data.suggestedPricePerHome)}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm text-gray-600">Market Rate</div>
                                  <div className="text-lg font-semibold">{formatCurrency(analysisResult.data.competitiveAnalysis.marketRate)}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm text-gray-600">Premium</div>
                                  <div className={`text-lg font-semibold ${
                                    analysisResult.data.suggestedPricePerHome > analysisResult.data.competitiveAnalysis.marketRate ? 
                                    'text-green-600' : 'text-red-600'
                                  }`}>
                                    {formatCurrency(analysisResult.data.suggestedPricePerHome - analysisResult.data.competitiveAnalysis.marketRate)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="risks" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Risk Assessment
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Risk Factors</h4>
                              {analysisResult.data.riskFlags.length > 0 ? (
                                <ul className="space-y-1">
                                  {analysisResult.data.riskFlags.map((risk, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                      <XCircle className="h-4 w-4 text-red-500" />
                                      <span className="text-sm">{risk}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-green-600">No major risk factors identified</p>
                              )}
                            </div>
                            
                            <div>
                              <h4 className="font-semibold mb-2">Strategic Fit Score</h4>
                              <div className="flex items-center gap-4">
                                <Badge className={
                                  analysisResult.data.strategicFitScore === 'high' ? 'bg-green-100 text-green-800' :
                                  analysisResult.data.strategicFitScore === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }>
                                  {analysisResult.data.strategicFitScore.toUpperCase()} FIT
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {analysisResult.data.strategicFitScore === 'high' ? 
                                    'Excellent strategic alignment with business goals' :
                                    analysisResult.data.strategicFitScore === 'medium' ?
                                    'Good fit with some considerations' :
                                    'Poor strategic alignment - proceed with caution'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
              </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
