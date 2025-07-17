'use client'

import { useState } from 'react'
import AddressAutocomplete from '@/components/AddressAutocomplete'

interface ServiceabilityRequest {
  communityName: string
  address: string
  coordinates: { lat: number; lng: number } | null
  serviceType: string
  estimatedHomes: number
}

interface ServiceabilityResult {
  customerProbability: number
  profitMargin: number
  recommendedAction: 'BID' | 'BID-WITH-CONDITIONS' | 'DO-NOT-BID'
  fleetImpact: {
    utilization: number
    additionalRoute: boolean
    estimatedDistance: number
    estimatedTime: number
  }
  riskFactors: string[]
  recommendations: string[]
  confidenceLevel: number
}

export default function ServiceabilityCheck() {
  const [request, setRequest] = useState<ServiceabilityRequest>({
    communityName: '',
    address: '',
    coordinates: null,
    serviceType: 'residential',
    estimatedHomes: 1
  })

  const [result, setResult] = useState<ServiceabilityResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/comprehensive-rfp-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          analysisType: 'serviceability'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze serviceability')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddressChange = (address: string) => {
    setRequest(prev => ({ ...prev, address }))
  }

  const handleCoordinatesChange = (coordinates: { lat: number; lng: number } | null) => {
    setRequest(prev => ({ ...prev, coordinates }))
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BID': return 'text-green-600'
      case 'BID-WITH-CONDITIONS': return 'text-yellow-600'
      case 'DO-NOT-BID': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getActionBgColor = (action: string) => {
    switch (action) {
      case 'BID': return 'bg-green-100 border-green-200'
      case 'BID-WITH-CONDITIONS': return 'bg-yellow-100 border-yellow-200'
      case 'DO-NOT-BID': return 'bg-red-100 border-red-200'
      default: return 'bg-gray-100 border-gray-200'
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Serviceability Check</h1>
        <p className="text-gray-600">
          Determine if a customer location is serviceable based on our service areas, routes, and fleet capacity.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="communityName" className="block text-sm font-medium text-gray-700 mb-2">
              Community Name (optional)
            </label>
            <input
              type="text"
              id="communityName"
              value={request.communityName}
              onChange={(e) => setRequest(prev => ({ ...prev, communityName: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="Enter community name (if applicable)"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Address <span className="text-red-500">*</span>
            </label>
            <AddressAutocomplete
              value={request.address}
              onChange={handleAddressChange}
              onCoordinatesChange={handleCoordinatesChange}
              placeholder="Start typing an address..."
              required
            />
          </div>

          <div>
            <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-2">
              Service Type <span className="text-red-500">*</span>
            </label>
            <select
              id="serviceType"
              value={request.serviceType}
              onChange={(e) => setRequest(prev => ({ ...prev, serviceType: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              required
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="hoa">HOA/Community</option>
              <option value="industrial">Industrial</option>
            </select>
          </div>

          <div>
            <label htmlFor="estimatedHomes" className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Units/Homes <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="estimatedHomes"
              value={request.estimatedHomes}
              onChange={(e) => setRequest(prev => ({ ...prev, estimatedHomes: parseInt(e.target.value) || 1 }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              min="1"
              required
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !request.address}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? 'Analyzing...' : 'Check Serviceability'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-6 p-4 bg-red-100 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6">
          <div className={`p-6 rounded-lg border ${getActionBgColor(result.recommendedAction)}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Serviceability Analysis</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getActionColor(result.recommendedAction)}`}>
                {result.recommendedAction ? result.recommendedAction.replace('-', ' ') : 'PENDING'}
              </span>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{result.customerProbability || 0}%</div>
                <div className="text-sm text-gray-600">Serviceability Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{result.profitMargin || 0}%</div>
                <div className="text-sm text-gray-600">Profit Margin</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{result.confidenceLevel || 0}%</div>
                <div className="text-sm text-gray-600">Confidence Level</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Fleet Impact Analysis</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Utilization:</span>
                  <span className="font-medium">{result.fleetImpact?.utilization || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Additional Route Required:</span>
                  <span className="font-medium">{result.fleetImpact?.additionalRoute ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Distance:</span>
                  <span className="font-medium">{result.fleetImpact?.estimatedDistance || 0} miles</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Time:</span>
                  <span className="font-medium">{result.fleetImpact?.estimatedTime || 0} minutes</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Risk Factors</h3>
              <div className="space-y-2">
                {(result.riskFactors || []).map((factor, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-700">{factor}</span>
                  </div>
                ))}
                {(!result.riskFactors || result.riskFactors.length === 0) && (
                  <div className="text-gray-500 italic">No risk factors identified</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recommendations</h3>
            <div className="space-y-2">
              {(result.recommendations || []).map((recommendation, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">{recommendation}</span>
                </div>
              ))}
              {(!result.recommendations || result.recommendations.length === 0) && (
                <div className="text-gray-500 italic">No recommendations available</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 